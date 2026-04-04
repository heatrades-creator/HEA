// ============================================================
// RoleService.gs + RankService.gs — HEA C2
// ============================================================

function roleListAll_() {
  var sheet = getSheet_('ROLE');
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  var headers = data[0];
  return data.slice(1).filter(function(r) { return r[0]; }).map(function(r) { return rowToObj_(headers, r); });
}

function roleCreate_(data, actor) {
  var id = uuid_();
  var sheet = getSheet_('ROLE');
  sheet.appendRow([id, data.title || '', data.unit_id || '', data.description || '', data.is_supervisory || false, now_()]);
  auditLog_({ entity_type: 'ROLE', entity_id: id, action: 'CREATED', new_value: data.title, actor: actor });
  return { role_id: id, title: data.title };
}

function rankListAll_() {
  var sheet = getSheet_('RANK');
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  var headers = data[0];
  return data.slice(1).filter(function(r) { return r[0]; }).map(function(r) { return rowToObj_(headers, r); });
}

function rankCreate_(data, actor) {
  var id = uuid_();
  var sheet = getSheet_('RANK');
  sheet.appendRow([id, data.title || '', data.tier || 1, data.description || '']);
  auditLog_({ entity_type: 'RANK', entity_id: id, action: 'CREATED', new_value: data.title, actor: actor });
  return { rank_id: id, title: data.title };
}
