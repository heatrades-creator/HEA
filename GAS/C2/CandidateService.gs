// ============================================================
// CandidateService.gs — HEA C2 recruitment pipeline
// OFFER_ACCEPTED → auto-creates person + onboarding + tasks
// ============================================================

var CANDIDATE_STATUSES_ = [
  'NEW','SCREENING','PHONE_SCREEN','INTERVIEW_SCHEDULED','INTERVIEWED',
  'REFERENCE_CHECK','OFFER_PENDING','OFFER_SENT','OFFER_ACCEPTED',
  'OFFER_DECLINED','REJECTED','WITHDRAWN','TALENT_POOL'
];

function candidateListAll_() {
  var sheet = getSheet_('CANDIDATE');
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  var headers = data[0];
  return data.slice(1).filter(function(r) { return r[0]; }).map(function(r) { return rowToObj_(headers, r); });
}

function candidateGetById_(id) {
  var sheet = getSheet_('CANDIDATE');
  var rowNum = findRow_(sheet, 1, id);
  if (!rowNum) return null;
  var data = sheet.getDataRange().getValues();
  return rowToObj_(data[0], data[rowNum - 1]);
}

function candidateCreate_(data, actor) {
  var id = uuid_();
  var ts = now_();
  var sheet = getSheet_('CANDIDATE');
  sheet.appendRow([
    id,
    data.full_name || '',
    data.email || '',
    data.phone || '',
    data.address || '',
    data.role_applied || '',
    data.employment_type || '',
    data.source || 'DIRECT',
    data.status || 'NEW',
    data.interview_date || '',
    data.offer_date || '',
    data.offer_expiry || '',
    data.salary_offered || '',
    data.notes || '',
    ts,
    ts
  ]);
  auditLog_({ entity_type: 'CANDIDATE', entity_id: id, action: 'CREATED', new_value: data.full_name, actor: actor });
  alertNewCandidate_(data.full_name, data.role_applied || '');
  return candidateGetById_(id);
}

function candidateUpdate_(id, data, actor) {
  var sheet = getSheet_('CANDIDATE');
  var rowNum = findRow_(sheet, 1, id);
  if (!rowNum) throw new Error('Candidate not found: ' + id);
  var allData = sheet.getDataRange().getValues();
  var headers = allData[0];
  var current = rowToObj_(headers, allData[rowNum - 1]);

  var fields = ['full_name','email','phone','address','role_applied','employment_type',
                'source','interview_date','offer_date','offer_expiry','salary_offered','notes'];
  fields.forEach(function(f) {
    if (data[f] !== undefined) {
      sheet.getRange(rowNum, headers.indexOf(f) + 1).setValue(data[f]);
      if (String(current[f]) !== String(data[f])) {
        auditLog_({ entity_type: 'CANDIDATE', entity_id: id, action: 'FIELD_UPDATED', field_name: f, old_value: current[f], new_value: data[f], actor: actor });
      }
    }
  });
  sheet.getRange(rowNum, headers.indexOf('updated_at') + 1).setValue(now_());
  return candidateGetById_(id);
}

/**
 * Transition candidate status.
 * OFFER_ACCEPTED triggers: create person, create onboarding, create tasks.
 */
function candidateTransition_(id, newStatus, actor) {
  var sheet = getSheet_('CANDIDATE');
  var rowNum = findRow_(sheet, 1, id);
  if (!rowNum) throw new Error('Candidate not found: ' + id);

  var allData = sheet.getDataRange().getValues();
  var headers = allData[0];
  var current = rowToObj_(headers, allData[rowNum - 1]);
  var oldStatus = String(current.status || '');

  sheet.getRange(rowNum, headers.indexOf('status') + 1).setValue(newStatus);
  sheet.getRange(rowNum, headers.indexOf('updated_at') + 1).setValue(now_());

  auditLog_({
    entity_type: 'CANDIDATE', entity_id: id, action: 'STATUS_CHANGED',
    field_name: 'status', old_value: oldStatus, new_value: newStatus, actor: actor
  });

  // ── OFFER_ACCEPTED automation ──
  if (String(newStatus).toUpperCase() === 'OFFER_ACCEPTED') {
    try {
      // Create person record
      var person = personCreate_({
        full_name: current.full_name,
        email: current.email,
        phone: current.phone,
        address: current.address,
        employment_type: current.employment_type || 'FULL_TIME',
        status: 'ONBOARDING',
        role_title: current.role_applied
      }, 'SYSTEM');

      // Create onboarding case
      var onboarding = onboardingCreate_({
        person_id: person.person_id,
        status: 'CREATED',
        target_start_date: addDays_(today_(), 14)
      }, 'SYSTEM');

      // Fire task engine
      var adminEmail = PropertiesService.getScriptProperties().getProperty('ADMIN_EMAIL') || actor;
      createTasksForTrigger_(
        TASK_TRIGGERS_.OFFER_ACCEPTED,
        'CANDIDATE', id,
        { name: current.full_name, adminEmail: adminEmail }
      );

      alertOfferAccepted_(current.full_name, current.role_applied);

    } catch (e) {
      // Log but don't fail the status transition
      console.error('OFFER_ACCEPTED automation failed:', e.message);
      auditLog_({
        entity_type: 'CANDIDATE', entity_id: id, action: 'AUTOMATION_ERROR',
        notes: e.message, actor: 'SYSTEM'
      });
    }
  }

  return candidateGetById_(id);
}
