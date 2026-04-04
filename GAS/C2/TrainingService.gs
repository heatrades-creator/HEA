// ============================================================
// TrainingService.gs + CapabilityService.gs — HEA C2
// ============================================================

// ── Training ─────────────────────────────────────────────────

function trainingListAll_(personId) {
  var sheet = getSheet_('TRAINING_RECORD');
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  var headers = data[0];
  var rows = data.slice(1).filter(function(r) { return r[0]; }).map(function(r) { return rowToObj_(headers, r); });
  if (personId) rows = rows.filter(function(r) { return String(r.person_id) === String(personId); });
  return rows;
}

function trainingCreate_(data, actor) {
  var id = uuid_();
  var status = 'COMPLETED';
  if (data.expiry_date && daysUntil_(data.expiry_date) < 0) status = 'EXPIRED';
  var sheet = getSheet_('TRAINING_RECORD');
  sheet.appendRow([
    id, data.person_id || '', data.course_name || '', data.provider || '',
    data.completed_date || today_(), data.expiry_date || '',
    data.certificate_url || '', status, data.notes || '', now_()
  ]);
  auditLog_({ entity_type: 'TRAINING_RECORD', entity_id: id, action: 'CREATED', new_value: data.course_name, actor: actor });
  return { training_id: id };
}

function trainingUpdate_(id, data, actor) {
  var sheet = getSheet_('TRAINING_RECORD');
  var rowNum = findRow_(sheet, 1, id);
  if (!rowNum) throw new Error('Training record not found: ' + id);
  var allData = sheet.getDataRange().getValues();
  var headers = allData[0];
  ['course_name','provider','completed_date','expiry_date','certificate_url','notes'].forEach(function(f) {
    if (data[f] !== undefined) sheet.getRange(rowNum, headers.indexOf(f) + 1).setValue(data[f]);
  });
  // Recompute status
  var newExpiry = data.expiry_date || allData[rowNum - 1][headers.indexOf('expiry_date')];
  var status = 'COMPLETED';
  if (newExpiry && daysUntil_(newExpiry) < 0) status = 'EXPIRED';
  sheet.getRange(rowNum, headers.indexOf('status') + 1).setValue(status);
  auditLog_({ entity_type: 'TRAINING_RECORD', entity_id: id, action: 'FIELD_UPDATED', actor: actor });
  return { training_id: id };
}

// ── Capability ───────────────────────────────────────────────

function capabilityListAll_(personId) {
  var sheet = getSheet_('CAPABILITY');
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  var headers = data[0];
  var rows = data.slice(1).filter(function(r) { return r[0]; }).map(function(r) { return rowToObj_(headers, r); });
  if (personId) rows = rows.filter(function(r) { return String(r.person_id) === String(personId); });
  return rows;
}

function capabilityCreate_(data, actor) {
  var id = uuid_();
  var sheet = getSheet_('CAPABILITY');
  sheet.appendRow([
    id, data.person_id || '', data.name || '', data.level || 'BASIC',
    data.verified_by || '', data.verified_date || '', data.notes || '', now_()
  ]);
  auditLog_({ entity_type: 'CAPABILITY', entity_id: id, action: 'CREATED', new_value: data.name, actor: actor });
  return { capability_id: id };
}
