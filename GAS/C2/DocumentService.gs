// ============================================================
// DocumentService.gs — HEA C2 compliance document management
// runExpiryCheck_() designed to run on a daily GAS time trigger
// ============================================================

function documentListAll_(personId) {
  var sheet = getSheet_('DOCUMENT');
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  var headers = data[0];
  var rows = data.slice(1).filter(function(r) { return r[0]; }).map(function(r) { return rowToObj_(headers, r); });
  if (personId) rows = rows.filter(function(r) { return String(r.person_id) === String(personId); });
  return rows;
}

function documentGetById_(id) {
  var sheet = getSheet_('DOCUMENT');
  var rowNum = findRow_(sheet, 1, id);
  if (!rowNum) return null;
  var data = sheet.getDataRange().getValues();
  return rowToObj_(data[0], data[rowNum - 1]);
}

function documentCreate_(data, actor) {
  var id = uuid_();
  var ts = now_();
  var expiryStatus = computeDocStatus_(data.expiry_date);
  var sheet = getSheet_('DOCUMENT');
  sheet.appendRow([
    id,
    data.person_id || '',
    data.doc_type || '',
    data.doc_number || '',
    data.issuer || '',
    data.issued_date || '',
    data.expiry_date || '',
    data.drive_url || '',
    expiryStatus,
    data.notes || '',
    ts,
    ts
  ]);
  auditLog_({ entity_type: 'DOCUMENT', entity_id: id, action: 'CREATED', new_value: data.doc_type, actor: actor });
  return documentGetById_(id);
}

function documentUpdate_(id, data, actor) {
  var sheet = getSheet_('DOCUMENT');
  var rowNum = findRow_(sheet, 1, id);
  if (!rowNum) throw new Error('Document not found: ' + id);
  var allData = sheet.getDataRange().getValues();
  var headers = allData[0];
  var current = rowToObj_(headers, allData[rowNum - 1]);

  var fields = ['doc_type','doc_number','issuer','issued_date','expiry_date','drive_url','notes'];
  fields.forEach(function(f) {
    if (data[f] !== undefined) {
      sheet.getRange(rowNum, headers.indexOf(f) + 1).setValue(data[f]);
    }
  });

  // Recompute status if expiry changed
  var newExpiry = data.expiry_date !== undefined ? data.expiry_date : current.expiry_date;
  var newStatus = computeDocStatus_(newExpiry);
  sheet.getRange(rowNum, headers.indexOf('status') + 1).setValue(newStatus);
  sheet.getRange(rowNum, headers.indexOf('updated_at') + 1).setValue(now_());

  auditLog_({ entity_type: 'DOCUMENT', entity_id: id, action: 'FIELD_UPDATED', field_name: 'expiry_date', old_value: current.expiry_date, new_value: newExpiry, actor: actor });
  return documentGetById_(id);
}

/**
 * Compute document status based on expiry date.
 * @param {string} expiryDate  YYYY-MM-DD or empty
 * @returns {string} VALID | EXPIRING_SOON | EXPIRED | NO_EXPIRY
 */
function computeDocStatus_(expiryDate) {
  if (!expiryDate) return 'NO_EXPIRY';
  var days = daysUntil_(String(expiryDate).substring(0, 10));
  if (days < 0) return 'EXPIRED';
  if (days <= 30) return 'EXPIRING_SOON';
  return 'VALID';
}

/**
 * Daily expiry check — call from a GAS time-based trigger or ?action=runDocumentExpiryCheck
 * Creates tasks for expiring docs, sends Telegram alerts.
 */
function runDocumentExpiryCheck_() {
  var sheet = getSheet_('DOCUMENT');
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return { checked: 0, alerts: 0 };
  var headers = data[0];
  var alerts = 0;
  var adminEmail = PropertiesService.getScriptProperties().getProperty('ADMIN_EMAIL') || '';

  for (var i = 1; i < data.length; i++) {
    var doc = rowToObj_(headers, data[i]);
    if (!doc.doc_id || !doc.expiry_date) continue;

    var days = daysUntil_(String(doc.expiry_date).substring(0, 10));
    var newStatus = computeDocStatus_(doc.expiry_date);

    // Update status in sheet
    sheet.getRange(i + 1, headers.indexOf('status') + 1).setValue(newStatus);

    // Get person name
    var personName = doc.person_id;
    var supervisorId = '';
    try {
      var p = personGetById_(doc.person_id);
      if (p) { personName = p.full_name; supervisorId = p.supervisor_id || ''; }
    } catch (e) {}

    // Alert and task at 30 days before expiry
    if (days >= 0 && days <= 30) {
      createTasksForTrigger_(TASK_TRIGGERS_.DOCUMENT_EXPIRY, 'DOCUMENT', doc.doc_id, {
        name: personName,
        docType: doc.doc_type,
        expiryDate: doc.expiry_date,
        supervisorId: supervisorId,
        adminEmail: adminEmail
      });
      alertDocExpiry_(personName, doc.doc_type, doc.expiry_date);
      alerts++;
    }
  }

  // Probation warning check
  checkProbationWarnings_(adminEmail);

  return { checked: data.length - 1, alerts: alerts };
}

/**
 * Check for probations ending in 14 days — create review tasks.
 * @param {string} adminEmail
 */
function checkProbationWarnings_(adminEmail) {
  try {
    var sheet = getSheet_('PERSON');
    var data = sheet.getDataRange().getValues();
    if (data.length < 2) return;
    var headers = data[0];
    for (var i = 1; i < data.length; i++) {
      var p = rowToObj_(headers, data[i]);
      if (!p.probation_end_date) continue;
      if (String(p.status || '').toUpperCase() !== 'PROBATION') continue;
      var days = daysUntil_(String(p.probation_end_date).substring(0, 10));
      if (days >= 0 && days <= 14) {
        createTasksForTrigger_(TASK_TRIGGERS_.PROBATION_WARNING, 'PERSON', p.person_id, {
          name: p.full_name,
          probationEndDate: p.probation_end_date,
          supervisorId: p.supervisor_id || '',
          adminEmail: adminEmail
        });
      }
    }
  } catch (e) {
    console.error('Probation warning check failed:', e.message);
  }
}
