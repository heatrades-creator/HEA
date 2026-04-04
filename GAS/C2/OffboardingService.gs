// ============================================================
// OffboardingService.gs — HEA C2 offboarding flow
// Creates 5 automated tasks on case creation.
// ============================================================

function offboardingListAll_() {
  var sheet = getSheet_('OFFBOARDING_CASE');
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  var headers = data[0];
  return data.slice(1).filter(function(r) { return r[0]; }).map(function(r) { return rowToObj_(headers, r); });
}

function offboardingGetById_(id) {
  var sheet = getSheet_('OFFBOARDING_CASE');
  var rowNum = findRow_(sheet, 1, id);
  if (!rowNum) return null;
  var data = sheet.getDataRange().getValues();
  return rowToObj_(data[0], data[rowNum - 1]);
}

function offboardingCreate_(data, actor) {
  var id = uuid_();
  var ts = now_();
  var sheet = getSheet_('OFFBOARDING_CASE');
  sheet.appendRow([
    id,
    data.person_id || '',
    data.reason || 'RESIGNATION',
    data.status || 'CREATED',
    data.last_day || '',
    ts,               // notice_received_at
    '',               // exit_interview_date
    false,            // assets_returned
    false,            // access_revoked
    false,            // final_pay_processed
    data.notes || '',
    ts,
    ts
  ]);

  auditLog_({
    entity_type: 'OFFBOARDING_CASE', entity_id: id, action: 'CREATED',
    new_value: data.reason, actor: actor
  });

  // Get person name
  var personName = data.person_id;
  try {
    var p = personGetById_(data.person_id);
    if (p) personName = p.full_name;
  } catch (e) {}

  var adminEmail = PropertiesService.getScriptProperties().getProperty('ADMIN_EMAIL') || actor;
  createTasksForTrigger_(TASK_TRIGGERS_.OFFBOARDING_CREATED, 'OFFBOARDING_CASE', id, {
    name: personName,
    lastDay: data.last_day || addDays_(today_(), 14),
    reason: data.reason,
    adminEmail: adminEmail
  });

  alertOffboarding_(personName, data.reason || 'RESIGNATION', data.last_day || 'TBC');

  // Transition person to TERMINATING
  if (data.person_id) {
    try {
      // Try RESIGNED first as a soft path, fall back to TERMINATING
      personTransitionStatus_(data.person_id, 'RESIGNED', 'SYSTEM');
    } catch (e) {
      try { personTransitionStatus_(data.person_id, 'TERMINATING', 'SYSTEM'); } catch (e2) {}
    }
  }

  return offboardingGetById_(id);
}

function offboardingUpdate_(id, data, actor) {
  var sheet = getSheet_('OFFBOARDING_CASE');
  var rowNum = findRow_(sheet, 1, id);
  if (!rowNum) throw new Error('Offboarding case not found: ' + id);
  var allData = sheet.getDataRange().getValues();
  var headers = allData[0];
  var current = rowToObj_(headers, allData[rowNum - 1]);

  var fields = ['status','last_day','exit_interview_date','assets_returned','access_revoked','final_pay_processed','notes'];
  fields.forEach(function(f) {
    if (data[f] !== undefined) {
      sheet.getRange(rowNum, headers.indexOf(f) + 1).setValue(data[f]);
      if (String(current[f]) !== String(data[f])) {
        auditLog_({ entity_type: 'OFFBOARDING_CASE', entity_id: id, action: 'FIELD_UPDATED', field_name: f, old_value: current[f], new_value: data[f], actor: actor });
      }
    }
  });
  sheet.getRange(rowNum, headers.indexOf('updated_at') + 1).setValue(now_());

  // On COMPLETE → transition person to TERMINATED
  if (String(data.status || '').toUpperCase() === 'COMPLETE' && current.person_id) {
    try { personTransitionStatus_(current.person_id, 'TERMINATED', 'SYSTEM'); } catch (e) {}
  }

  return offboardingGetById_(id);
}
