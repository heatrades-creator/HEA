// ============================================================
// UnitService.gs — HEA C2 organisational unit CRUD
// ============================================================

function unitListAll_() {
  var sheet = getSheet_('UNIT');
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  var headers = data[0];
  return data.slice(1)
    .filter(function(r) { return r[0]; })
    .map(function(r) { return rowToObj_(headers, r); });
}

function unitGetById_(id) {
  var sheet = getSheet_('UNIT');
  var rowNum = findRow_(sheet, 1, id);
  if (!rowNum) return null;
  var data = sheet.getDataRange().getValues();
  return rowToObj_(data[0], data[rowNum - 1]);
}

function unitCreate_(data, actor) {
  var id = uuid_();
  var ts = now_();
  var sheet = getSheet_('UNIT');
  sheet.appendRow([
    id,
    data.name || '',
    data.unit_type || 'TEAM',
    data.parent_unit_id || '',
    data.commander_id || '',
    data.description || '',
    data.status || 'ACTIVE',
    ts
  ]);
  auditLog_({ entity_type: 'UNIT', entity_id: id, action: 'CREATED', new_value: data.name, actor: actor });
  return unitGetById_(id);
}

function unitUpdate_(id, data, actor) {
  var sheet = getSheet_('UNIT');
  var rowNum = findRow_(sheet, 1, id);
  if (!rowNum) throw new Error('Unit not found: ' + id);
  var allData = sheet.getDataRange().getValues();
  var headers = allData[0];
  var current = rowToObj_(headers, allData[rowNum - 1]);
  ['name','unit_type','parent_unit_id','commander_id','description','status'].forEach(function(f) {
    if (data[f] !== undefined) {
      sheet.getRange(rowNum, headers.indexOf(f) + 1).setValue(data[f]);
      if (String(current[f]) !== String(data[f])) {
        auditLog_({ entity_type: 'UNIT', entity_id: id, action: 'FIELD_UPDATED', field_name: f, old_value: current[f], new_value: data[f], actor: actor });
      }
    }
  });
  return unitGetById_(id);
}
