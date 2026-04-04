// ============================================================
// OnboardingService.gs — HEA C2 onboarding flow
// On COMPLETE → transitions person to PROBATION
// ============================================================

function onboardingListAll_() {
  var sheet = getSheet_('ONBOARDING_CASE');
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  var headers = data[0];
  return data.slice(1).filter(function(r) { return r[0]; }).map(function(r) { return rowToObj_(headers, r); });
}

function onboardingGetById_(id) {
  var sheet = getSheet_('ONBOARDING_CASE');
  var rowNum = findRow_(sheet, 1, id);
  if (!rowNum) return null;
  var data = sheet.getDataRange().getValues();
  return rowToObj_(data[0], data[rowNum - 1]);
}

function onboardingCreate_(data, actor) {
  var id = uuid_();
  var ts = now_();
  var sheet = getSheet_('ONBOARDING_CASE');
  sheet.appendRow([
    id,
    data.person_id || '',
    data.status || 'CREATED',
    data.target_start_date || '',
    '',  // contract_sent_at
    '',  // contract_signed_at
    data.induction_date || '',
    data.supervisor_id || '',
    data.notes || '',
    ts,
    ts
  ]);
  auditLog_({
    entity_type: 'ONBOARDING_CASE', entity_id: id, action: 'CREATED',
    new_value: data.person_id, actor: actor || 'SYSTEM'
  });

  // Get person name for task context
  var personName = data.person_id;
  try {
    var p = personGetById_(data.person_id);
    if (p) personName = p.full_name;
  } catch (e) {}

  var adminEmail = PropertiesService.getScriptProperties().getProperty('ADMIN_EMAIL') || actor;
  createTasksForTrigger_(
    TASK_TRIGGERS_.ONBOARDING_CREATED,
    'ONBOARDING_CASE', id,
    { name: personName, adminEmail: adminEmail }
  );

  return onboardingGetById_(id);
}

function onboardingUpdate_(id, data, actor) {
  var sheet = getSheet_('ONBOARDING_CASE');
  var rowNum = findRow_(sheet, 1, id);
  if (!rowNum) throw new Error('Onboarding case not found: ' + id);
  var allData = sheet.getDataRange().getValues();
  var headers = allData[0];
  var current = rowToObj_(headers, allData[rowNum - 1]);

  var fields = ['status','target_start_date','contract_sent_at','contract_signed_at',
                'induction_date','supervisor_id','notes'];
  fields.forEach(function(f) {
    if (data[f] !== undefined) {
      sheet.getRange(rowNum, headers.indexOf(f) + 1).setValue(data[f]);
      if (String(current[f]) !== String(data[f])) {
        auditLog_({ entity_type: 'ONBOARDING_CASE', entity_id: id, action: 'FIELD_UPDATED', field_name: f, old_value: current[f], new_value: data[f], actor: actor });
      }
    }
  });
  sheet.getRange(rowNum, headers.indexOf('updated_at') + 1).setValue(now_());

  // On COMPLETE → transition person to PROBATION
  if (String(data.status || '').toUpperCase() === 'COMPLETE' && current.person_id) {
    try {
      personTransitionStatus_(current.person_id, 'PROBATION', 'SYSTEM');
    } catch (e) {
      console.error('onboarding→PROBATION transition failed:', e.message);
    }
  }

  return onboardingGetById_(id);
}
