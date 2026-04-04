// ============================================================
// AssetService.gs + TaskService.gs — HEA C2
// ============================================================

// ── Asset ────────────────────────────────────────────────────

function assetListAll_() {
  var sheet = getSheet_('ASSET');
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  var headers = data[0];
  return data.slice(1).filter(function(r) { return r[0]; }).map(function(r) { return rowToObj_(headers, r); });
}

function assetCreate_(data, actor) {
  var id = uuid_();
  var sheet = getSheet_('ASSET');
  sheet.appendRow([
    id, data.name || '', data.category || 'OTHER',
    data.serial_number || '', data.purchase_date || '',
    data.value || '', 'AVAILABLE', data.notes || '', now_()
  ]);
  auditLog_({ entity_type: 'ASSET', entity_id: id, action: 'CREATED', new_value: data.name, actor: actor });
  return { asset_id: id };
}

function assetAssign_(assetId, personId, actor) {
  // Update asset status
  var assetSheet = getSheet_('ASSET');
  var assetRow = findRow_(assetSheet, 1, assetId);
  if (!assetRow) throw new Error('Asset not found: ' + assetId);
  var headers = assetSheet.getDataRange().getValues()[0];
  assetSheet.getRange(assetRow, headers.indexOf('status') + 1).setValue('ASSIGNED');

  // Create assignment record
  var assignId = uuid_();
  var assignSheet = getSheet_('ASSET_ASSIGNMENT');
  assignSheet.appendRow([
    assignId, assetId, personId, today_(), '', '', '', '', now_()
  ]);
  auditLog_({ entity_type: 'ASSET', entity_id: assetId, action: 'ASSIGNED', new_value: personId, actor: actor });
  return { assignment_id: assignId };
}

function assetReturn_(assignmentId, conditionIn, actor) {
  var sheet = getSheet_('ASSET_ASSIGNMENT');
  var rowNum = findRow_(sheet, 1, assignmentId);
  if (!rowNum) throw new Error('Assignment not found: ' + assignmentId);
  var allData = sheet.getDataRange().getValues();
  var headers = allData[0];
  var assignment = rowToObj_(headers, allData[rowNum - 1]);

  sheet.getRange(rowNum, headers.indexOf('returned_date') + 1).setValue(today_());
  sheet.getRange(rowNum, headers.indexOf('condition_in') + 1).setValue(conditionIn || '');

  // Update asset status to AVAILABLE
  var assetSheet = getSheet_('ASSET');
  var assetRow = findRow_(assetSheet, 1, assignment.asset_id);
  if (assetRow) {
    var assetHeaders = assetSheet.getDataRange().getValues()[0];
    assetSheet.getRange(assetRow, assetHeaders.indexOf('status') + 1).setValue('AVAILABLE');
  }
  auditLog_({ entity_type: 'ASSET', entity_id: assignment.asset_id, action: 'RETURNED', new_value: conditionIn, actor: actor });
  return { assignment_id: assignmentId };
}

// ── Task ─────────────────────────────────────────────────────

function taskListAll_(filters) {
  var sheet = getSheet_('TASK');
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  var headers = data[0];
  var rows = data.slice(1).filter(function(r) { return r[0]; }).map(function(r) { return rowToObj_(headers, r); });
  if (!filters) return rows;
  if (filters.assigned_to) rows = rows.filter(function(r) { return String(r.assigned_to) === String(filters.assigned_to); });
  if (filters.status) rows = rows.filter(function(r) { return String(r.status) === String(filters.status); });
  if (filters.entity_id) rows = rows.filter(function(r) { return String(r.entity_id) === String(filters.entity_id); });
  return rows;
}

function taskCreate_(data, actor) {
  var id = uuid_();
  var ts = now_();
  var sheet = getSheet_('TASK');
  sheet.appendRow([
    id,
    data.title || '',
    data.description || '',
    data.assigned_to || '',
    actor || 'SYSTEM',
    data.entity_type || '',
    data.entity_id || '',
    data.due_date || '',
    data.priority || 'MEDIUM',
    data.status || 'OPEN',
    data.trigger_key || '',
    ts,
    ts
  ]);
  auditLog_({ entity_type: 'TASK', entity_id: id, action: 'CREATED', new_value: data.title, actor: actor || 'SYSTEM' });
  return { task_id: id };
}

function taskUpdate_(id, data, actor) {
  var sheet = getSheet_('TASK');
  var rowNum = findRow_(sheet, 1, id);
  if (!rowNum) throw new Error('Task not found: ' + id);
  var allData = sheet.getDataRange().getValues();
  var headers = allData[0];
  var current = rowToObj_(headers, allData[rowNum - 1]);

  ['title','description','assigned_to','due_date','priority','status'].forEach(function(f) {
    if (data[f] !== undefined) {
      sheet.getRange(rowNum, headers.indexOf(f) + 1).setValue(data[f]);
      if (String(current[f]) !== String(data[f])) {
        auditLog_({ entity_type: 'TASK', entity_id: id, action: 'FIELD_UPDATED', field_name: f, old_value: current[f], new_value: data[f], actor: actor });
      }
    }
  });
  sheet.getRange(rowNum, headers.indexOf('updated_at') + 1).setValue(now_());
  return { task_id: id };
}
