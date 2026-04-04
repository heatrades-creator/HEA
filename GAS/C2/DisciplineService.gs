// ============================================================
// DisciplineService.gs — HEA C2 discipline cases + PIPs
// ============================================================

function disciplineListAll_() {
  var sheet = getSheet_('DISCIPLINE_CASE');
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  var headers = data[0];
  return data.slice(1).filter(function(r) { return r[0]; }).map(function(r) { return rowToObj_(headers, r); });
}

function disciplineGetById_(id) {
  var sheet = getSheet_('DISCIPLINE_CASE');
  var rowNum = findRow_(sheet, 1, id);
  if (!rowNum) return null;
  var data = sheet.getDataRange().getValues();
  return rowToObj_(data[0], data[rowNum - 1]);
}

function disciplineCreate_(data, actor) {
  permAssert_(actor, 'write_discipline');
  var id = uuid_();
  var ts = now_();
  var sheet = getSheet_('DISCIPLINE_CASE');
  sheet.appendRow([
    id,
    data.person_id || '',
    actor,
    data.category || 'CONDUCT',
    data.severity || 'MINOR',
    data.status || 'RAISED',
    data.description || '',
    '',  // outcome
    '',  // outcome_date
    data.notes || '',
    ts,
    ts
  ]);

  auditLog_({
    entity_type: 'DISCIPLINE_CASE', entity_id: id, action: 'CREATED',
    new_value: data.category + ' / ' + data.severity, actor: actor
  });

  // Transition person to DISCIPLINARY status
  if (data.person_id) {
    try {
      personTransitionStatus_(data.person_id, 'DISCIPLINARY', 'SYSTEM');
    } catch (e) {
      console.error('Discipline→DISCIPLINARY status failed:', e.message);
    }
  }

  // Get person name for tasks and alerts
  var personName = data.person_id;
  try {
    var p = personGetById_(data.person_id);
    if (p) personName = p.full_name;
  } catch (e) {}

  var adminEmail = PropertiesService.getScriptProperties().getProperty('ADMIN_EMAIL') || actor;
  createTasksForTrigger_(TASK_TRIGGERS_.DISCIPLINE_CREATED, 'DISCIPLINE_CASE', id, {
    name: personName,
    category: data.category,
    severity: data.severity,
    adminEmail: adminEmail
  });

  alertDisciplineRaised_(personName, data.category || 'CONDUCT', data.severity || 'MINOR');
  return disciplineGetById_(id);
}

function disciplineUpdate_(id, data, actor) {
  permAssert_(actor, 'write_discipline');
  var sheet = getSheet_('DISCIPLINE_CASE');
  var rowNum = findRow_(sheet, 1, id);
  if (!rowNum) throw new Error('Discipline case not found: ' + id);
  var allData = sheet.getDataRange().getValues();
  var headers = allData[0];
  var current = rowToObj_(headers, allData[rowNum - 1]);

  ['status','severity','description','outcome','outcome_date','notes'].forEach(function(f) {
    if (data[f] !== undefined) {
      sheet.getRange(rowNum, headers.indexOf(f) + 1).setValue(data[f]);
      if (String(current[f]) !== String(data[f])) {
        auditLog_({ entity_type: 'DISCIPLINE_CASE', entity_id: id, action: 'FIELD_UPDATED', field_name: f, old_value: current[f], new_value: data[f], actor: actor });
      }
    }
  });
  sheet.getRange(rowNum, headers.indexOf('updated_at') + 1).setValue(now_());

  // On CLOSED or DISMISSED → return person to ACTIVE (if not headed to TERMINATED)
  var newStatus = String(data.status || '').toUpperCase();
  if ((newStatus === 'CLOSED' || newStatus === 'DISMISSED') && current.person_id) {
    var targetPersonStatus = (newStatus === 'DISMISSED') ? 'TERMINATED' : 'ACTIVE';
    try { personTransitionStatus_(current.person_id, targetPersonStatus, 'SYSTEM'); } catch (e) {}
  }

  return disciplineGetById_(id);
}

// ── PIP ──────────────────────────────────────────────────────

function pipListAll_() {
  var sheet = getSheet_('PIP');
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  var headers = data[0];
  return data.slice(1).filter(function(r) { return r[0]; }).map(function(r) { return rowToObj_(headers, r); });
}

function pipCreate_(data, actor) {
  var id = uuid_();
  var ts = now_();
  var sheet = getSheet_('PIP');
  sheet.appendRow([
    id, data.person_id || '', actor,
    data.start_date || today_(), data.review_date || addDays_(today_(), 30),
    data.end_date || addDays_(today_(), 90),
    data.objectives || '', 'ACTIVE', '', ts, ts
  ]);
  auditLog_({ entity_type: 'PIP', entity_id: id, action: 'CREATED', new_value: data.person_id, actor: actor });
  if (data.person_id) {
    try { personTransitionStatus_(data.person_id, 'PIP', 'SYSTEM'); } catch (e) {}
  }
  return { pip_id: id };
}

function pipUpdate_(id, data, actor) {
  var sheet = getSheet_('PIP');
  var rowNum = findRow_(sheet, 1, id);
  if (!rowNum) throw new Error('PIP not found: ' + id);
  var allData = sheet.getDataRange().getValues();
  var headers = allData[0];
  var current = rowToObj_(headers, allData[rowNum - 1]);

  ['start_date','review_date','end_date','objectives','status','outcome_notes'].forEach(function(f) {
    if (data[f] !== undefined) sheet.getRange(rowNum, headers.indexOf(f) + 1).setValue(data[f]);
  });
  sheet.getRange(rowNum, headers.indexOf('updated_at') + 1).setValue(now_());

  var newStatus = String(data.status || '').toUpperCase();
  if (newStatus === 'FAILED' && current.person_id) {
    try { personTransitionStatus_(current.person_id, 'TERMINATED', 'SYSTEM'); } catch (e) {}
  } else if (newStatus === 'PASSED' && current.person_id) {
    try { personTransitionStatus_(current.person_id, 'ACTIVE', 'SYSTEM'); } catch (e) {}
  }

  auditLog_({ entity_type: 'PIP', entity_id: id, action: 'FIELD_UPDATED', actor: actor });
  return { pip_id: id };
}
