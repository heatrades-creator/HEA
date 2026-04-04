// ============================================================
// PersonService.gs — HEA C2 person CRUD + status transitions
// NO hard delete. Status transitions only.
// ============================================================

var VALID_PERSON_TRANSITIONS_ = {
  CANDIDATE:       ['ONBOARDING'],
  ONBOARDING:      ['PROBATION', 'INACTIVE'],
  PROBATION:       ['ACTIVE', 'TERMINATED'],
  ACTIVE:          ['SUSPENDED', 'PIP', 'DISCIPLINARY', 'MEDICAL_LEAVE', 'PARENTAL_LEAVE', 'RESIGNED', 'TERMINATED', 'REDUNDANT'],
  ACTIVE_RESTRICTED: ['ACTIVE', 'SUSPENDED', 'TERMINATED'],
  SUSPENDED:       ['ACTIVE', 'TERMINATED'],
  PIP:             ['ACTIVE', 'TERMINATED'],
  DISCIPLINARY:    ['ACTIVE', 'SUSPENDED', 'TERMINATED'],
  MEDICAL_LEAVE:   ['ACTIVE', 'TERMINATED'],
  PARENTAL_LEAVE:  ['ACTIVE'],
  LEAVE:           ['ACTIVE'],
  TERMINATING:     ['TERMINATED'],
  RESIGNED:        ['TERMINATED'],
  REDUNDANT:       ['TERMINATED'],
  TERMINATED:      ['DECEASED'], // final state
  INACTIVE:        ['ACTIVE', 'TERMINATED']
};

// Any status can transition to DECEASED
var UNIVERSAL_TARGETS_ = ['DECEASED'];

/**
 * List all people (deployability computed on each row).
 * @returns {Object[]}
 */
function personListAll_() {
  var sheet = getSheet_('PERSON');
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  var headers = data[0];
  return data.slice(1)
    .filter(function(row) { return row[0]; }) // skip empty rows
    .map(function(row) { return rowToPerson_(headers, row); });
}

/**
 * Get a single person by ID (deployability computed).
 * @param {string} id
 * @returns {Object|null}
 */
function personGetById_(id) {
  var sheet = getSheet_('PERSON');
  var rowNum = findRow_(sheet, 1, id);
  if (!rowNum) return null;
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  return rowToPerson_(headers, data[rowNum - 1]);
}

/**
 * Create a new person.
 * @param {Object} data
 * @param {string} actor  email of operator
 * @returns {Object} created person
 */
function personCreate_(data, actor) {
  permAssert_(actor, 'write_people');

  var id = uuid_();
  var ts = now_();
  var sheet = getSheet_('PERSON');

  sheet.appendRow([
    id,
    data.full_name || '',
    data.preferred_name || '',
    data.email || '',
    data.phone || '',
    data.dob || '',
    data.address || '',
    data.emergency_contact_name || '',
    data.emergency_contact_phone || '',
    data.unit_id || '',
    data.role_id || '',
    data.rank_id || '',
    data.appointment_id || '',
    data.supervisor_id || '',
    data.employment_type || 'FULL_TIME',
    data.status || 'ACTIVE',
    'FULL', // deployability placeholder — always computed on read
    data.start_date || today_(),
    data.probation_end_date || '',
    data.end_date || '',
    data.tfn_on_file || false,
    data.super_fund || '',
    data.bank_bsb || '',
    data.bank_account || '',
    data.notes || '',
    ts,
    ts
  ]);

  auditLog_({
    entity_type: 'PERSON',
    entity_id: id,
    action: 'CREATED',
    new_value: data.full_name,
    actor: actor,
    notes: 'employment_type=' + (data.employment_type || 'FULL_TIME')
  });

  alertNewHire_(data.full_name, data.employment_type || 'FULL_TIME', data.role_title || '');

  return personGetById_(id);
}

/**
 * Update person fields.
 * @param {string} id
 * @param {Object} data  fields to update (partial)
 * @param {string} actor
 * @returns {Object} updated person
 */
function personUpdate_(id, data, actor) {
  permAssert_(actor, 'write_people');

  var sheet = getSheet_('PERSON');
  var rowNum = findRow_(sheet, 1, id);
  if (!rowNum) throw new Error('Person not found: ' + id);

  var allData = sheet.getDataRange().getValues();
  var headers = allData[0];
  var current = rowToObj_(headers, allData[rowNum - 1]);

  var UPDATABLE_FIELDS = [
    'full_name','preferred_name','email','phone','dob','address',
    'emergency_contact_name','emergency_contact_phone',
    'unit_id','role_id','rank_id','appointment_id','supervisor_id',
    'employment_type','start_date','probation_end_date','end_date',
    'tfn_on_file','super_fund','bank_bsb','bank_account','notes'
  ];

  UPDATABLE_FIELDS.forEach(function(field) {
    if (data[field] !== undefined) {
      var colIndex = headers.indexOf(field);
      if (colIndex !== -1) {
        sheet.getRange(rowNum, colIndex + 1).setValue(data[field]);
        if (String(current[field]) !== String(data[field])) {
          auditLog_({
            entity_type: 'PERSON',
            entity_id: id,
            action: 'FIELD_UPDATED',
            field_name: field,
            old_value: current[field],
            new_value: data[field],
            actor: actor
          });
        }
      }
    }
  });

  // Always update updated_at
  var updatedAtCol = headers.indexOf('updated_at');
  if (updatedAtCol !== -1) {
    sheet.getRange(rowNum, updatedAtCol + 1).setValue(now_());
  }

  return personGetById_(id);
}

/**
 * Transition person status. Enforces valid transitions.
 * @param {string} id
 * @param {string} newStatus
 * @param {string} actor
 * @returns {Object} updated person
 */
function personTransitionStatus_(id, newStatus, actor) {
  permAssert_(actor, 'write_people');

  var sheet = getSheet_('PERSON');
  var rowNum = findRow_(sheet, 1, id);
  if (!rowNum) throw new Error('Person not found: ' + id);

  var allData = sheet.getDataRange().getValues();
  var headers = allData[0];
  var current = rowToObj_(headers, allData[rowNum - 1]);
  var oldStatus = String(current.status || '').toUpperCase();
  var targetStatus = String(newStatus).toUpperCase();

  // Check valid transition
  var allowed = (VALID_PERSON_TRANSITIONS_[oldStatus] || []).concat(UNIVERSAL_TARGETS_);
  if (allowed.indexOf(targetStatus) === -1) {
    throw new Error('Invalid status transition: ' + oldStatus + ' → ' + targetStatus);
  }

  var statusCol = headers.indexOf('status') + 1;
  var updatedAtCol = headers.indexOf('updated_at') + 1;
  sheet.getRange(rowNum, statusCol).setValue(targetStatus);
  if (updatedAtCol > 0) sheet.getRange(rowNum, updatedAtCol).setValue(now_());

  auditLog_({
    entity_type: 'PERSON',
    entity_id: id,
    action: 'STATUS_CHANGED',
    field_name: 'status',
    old_value: oldStatus,
    new_value: targetStatus,
    actor: actor
  });

  alertStatusChange_(current.full_name, oldStatus, targetStatus);

  return personGetById_(id);
}

/**
 * Convert a sheet row to a person object.
 * Injects computed deployability — never trusts the stored value.
 */
function rowToPerson_(headers, row) {
  var obj = rowToObj_(headers, row);
  // Computed deployability always overrides stored value
  obj.deployability = computeDeployability_(obj.person_id, obj);
  return obj;
}
