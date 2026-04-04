// ============================================================
// DeployabilityEngine.gs — HEA C2 computed deployability
// NEVER set deployability manually — always computed on read.
// ============================================================

var BLOCKING_DOC_TYPES_ = ['ELECTRICAL_LICENCE', 'WHITE_CARD', 'ELECTRICAL_LICENSE'];
var BLOCKING_DISCIPLINE_STATUSES_ = [
  'RAISED', 'UNDER_INVESTIGATION', 'SHOW_CAUSE_ISSUED',
  'SHOW_CAUSE_RECEIVED', 'HEARING_SCHEDULED'
];
var BLOCKING_PERSON_STATUSES_ = ['SUSPENDED', 'DISCIPLINARY'];
var LIMITED_PERSON_STATUSES_ = ['PROBATION', 'ONBOARDING'];

/**
 * Compute deployability for a person.
 * Returns 'BLOCKED', 'LIMITED', or 'FULL'.
 * This is the only place deployability is determined.
 *
 * @param {string} personId
 * @param {Object} [personRow]  optional pre-fetched person data to avoid double lookup
 * @returns {string}
 */
function computeDeployability_(personId, personRow) {
  try {
    // ── 1. Check DOCUMENT sheet for expired blocking docs ──
    var docSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DOCUMENT');
    if (docSheet) {
      var docData = docSheet.getDataRange().getValues();
      if (docData.length > 1) {
        var docHeaders = docData[0];
        var todayStr = today_();
        for (var i = 1; i < docData.length; i++) {
          var doc = rowToObj_(docHeaders, docData[i]);
          if (String(doc.person_id) !== String(personId)) continue;
          if (!doc.expiry_date) continue;
          var docType = String(doc.doc_type || '').toUpperCase();
          var isBlockingType = BLOCKING_DOC_TYPES_.some(function(t) {
            return docType.indexOf(t) !== -1 || t.indexOf(docType) !== -1;
          });
          if (!isBlockingType && docType !== 'LICENCE' && docType !== 'LICENSE' &&
              docType !== 'CERTIFICATION' && docType !== 'CERT') {
            // Only block on critical docs
          } else {
            var expiryStr = String(doc.expiry_date).substring(0, 10);
            if (expiryStr && expiryStr < todayStr) {
              return 'BLOCKED';
            }
          }
        }
      }
    }

    // ── 2. Check active DISCIPLINE_CASE ──
    var discSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DISCIPLINE_CASE');
    if (discSheet) {
      var discData = discSheet.getDataRange().getValues();
      if (discData.length > 1) {
        var discHeaders = discData[0];
        for (var j = 1; j < discData.length; j++) {
          var disc = rowToObj_(discHeaders, discData[j]);
          if (String(disc.person_id) !== String(personId)) continue;
          var dStatus = String(disc.status || '').toUpperCase();
          if (BLOCKING_DISCIPLINE_STATUSES_.indexOf(dStatus) !== -1) {
            return 'BLOCKED';
          }
        }
      }
    }

    // ── 3. Check person status from passed row or fetch ──
    var pStatus = '';
    var empType = '';
    var supervisorId = '';

    if (personRow) {
      pStatus = String(personRow.status || '').toUpperCase();
      empType = String(personRow.employment_type || '').toUpperCase();
      supervisorId = String(personRow.supervisor_id || '');
    } else {
      try {
        var personSheet = getSheet_('PERSON');
        var pRowNum = findRow_(personSheet, 1, personId);
        if (pRowNum) {
          var pData = personSheet.getDataRange().getValues();
          var pHeaders = pData[0];
          var pRow = rowToObj_(pHeaders, pData[pRowNum - 1]);
          pStatus = String(pRow.status || '').toUpperCase();
          empType = String(pRow.employment_type || '').toUpperCase();
          supervisorId = String(pRow.supervisor_id || '');
        }
      } catch (e) { /* ignore */ }
    }

    if (BLOCKING_PERSON_STATUSES_.indexOf(pStatus) !== -1) return 'BLOCKED';

    // ── 4. LIMITED conditions ──
    // Expired mandatory training
    var trainSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('TRAINING_RECORD');
    if (trainSheet) {
      var trainData = trainSheet.getDataRange().getValues();
      if (trainData.length > 1) {
        var trainHeaders = trainData[0];
        var todayStr2 = today_();
        for (var k = 1; k < trainData.length; k++) {
          var tr = rowToObj_(trainHeaders, trainData[k]);
          if (String(tr.person_id) !== String(personId)) continue;
          if (String(tr.status || '').toUpperCase() === 'EXPIRED') return 'LIMITED';
          if (tr.expiry_date) {
            var tExpiry = String(tr.expiry_date).substring(0, 10);
            if (tExpiry && tExpiry < todayStr2) return 'LIMITED';
          }
        }
      }
    }

    // Apprentice without supervisor
    if (empType === 'APPRENTICE' && !supervisorId) return 'LIMITED';

    // Probation / onboarding
    if (LIMITED_PERSON_STATUSES_.indexOf(pStatus) !== -1) return 'LIMITED';

    return 'FULL';

  } catch (e) {
    // On any error, default to LIMITED (conservative)
    return 'LIMITED';
  }
}
