// ============================================================
// SheetBootstrap.gs — HEA C2 idempotent sheet initialisation
// Call once via GET ?action=bootstrap
// Safe to re-run — will not overwrite existing sheets.
// ============================================================

var C2_SCHEMA_ = {
  PERSON: [
    'person_id','full_name','preferred_name','email','phone','dob','address',
    'emergency_contact_name','emergency_contact_phone',
    'unit_id','role_id','rank_id','appointment_id','supervisor_id',
    'employment_type','status','deployability',
    'start_date','probation_end_date','end_date',
    'tfn_on_file','super_fund','bank_bsb','bank_account',
    'notes','created_at','updated_at'
  ],
  UNIT: [
    'unit_id','name','unit_type','parent_unit_id','commander_id',
    'description','status','created_at'
  ],
  ROLE: [
    'role_id','title','unit_id','description','is_supervisory','created_at'
  ],
  RANK: [
    'rank_id','title','tier','description'
  ],
  APPOINTMENT: [
    'appointment_id','person_id','role_id','unit_id',
    'effective_date','end_date','notes','created_at'
  ],
  CANDIDATE: [
    'candidate_id','full_name','email','phone','address',
    'role_applied','employment_type','source','status',
    'interview_date','offer_date','offer_expiry','salary_offered',
    'notes','created_at','updated_at'
  ],
  ONBOARDING_CASE: [
    'case_id','person_id','status','target_start_date',
    'contract_sent_at','contract_signed_at','induction_date',
    'supervisor_id','notes','created_at','updated_at'
  ],
  DOCUMENT: [
    'doc_id','person_id','doc_type','doc_number','issuer',
    'issued_date','expiry_date','drive_url','status',
    'notes','created_at','updated_at'
  ],
  TRAINING_RECORD: [
    'training_id','person_id','course_name','provider',
    'completed_date','expiry_date','certificate_url',
    'status','notes','created_at'
  ],
  CAPABILITY: [
    'capability_id','person_id','name','level',
    'verified_by','verified_date','notes','created_at'
  ],
  DISCIPLINE_CASE: [
    'case_id','person_id','opened_by','category','severity','status',
    'description','outcome','outcome_date','notes','created_at','updated_at'
  ],
  PIP: [
    'pip_id','person_id','created_by','start_date','review_date','end_date',
    'objectives','status','outcome_notes','created_at','updated_at'
  ],
  OFFBOARDING_CASE: [
    'case_id','person_id','reason','status','last_day',
    'notice_received_at','exit_interview_date',
    'assets_returned','access_revoked','final_pay_processed',
    'notes','created_at','updated_at'
  ],
  ASSET: [
    'asset_id','name','category','serial_number','purchase_date',
    'value','status','notes','created_at'
  ],
  ASSET_ASSIGNMENT: [
    'assignment_id','asset_id','person_id','assigned_date',
    'returned_date','condition_out','condition_in','notes','created_at'
  ],
  TASK: [
    'task_id','title','description','assigned_to','created_by',
    'entity_type','entity_id','due_date','priority','status',
    'trigger_key','created_at','updated_at'
  ],
  AUDIT_LOG: [
    'log_id','timestamp','entity_type','entity_id',
    'action','field_name','old_value','new_value','actor','notes'
  ],
  PERMISSION_PROFILE: [
    'email','role','can_write_people','can_write_discipline',
    'can_write_finance','can_view_audit','created_at'
  ]
};

/**
 * Create all C2 sheet tabs idempotently.
 * Existing sheets are left untouched.
 * @returns {Object} result summary
 */
function createAllSheets_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var created = [];
  var skipped = [];

  Object.keys(C2_SCHEMA_).forEach(function(tabName) {
    var existing = ss.getSheetByName(tabName);
    if (existing) {
      skipped.push(tabName);
      return;
    }
    var sheet = ss.insertSheet(tabName);
    var headers = C2_SCHEMA_[tabName];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.getRange(1, 1, 1, headers.length).setBackground('#1a1a2e');
    sheet.getRange(1, 1, 1, headers.length).setFontColor('#ffd100');
    created.push(tabName);
  });

  return {
    created: created,
    skipped: skipped,
    total: Object.keys(C2_SCHEMA_).length
  };
}
