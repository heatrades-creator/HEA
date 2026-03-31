/**
 * MockData.gs
 * Shared test fixtures for all test suites.
 * These constants are referenced by TestNormalizer, TestJsonValidator,
 * TestPromptBuilder, and TestJobService.
 */

/** Complete raw submission row matching RAW_SUBMISSIONS schema. */
const MOCK_RAW_ROW = {
  timestamp:                  '2026-03-31T10:00:00.000Z',
  form_submission_id:         'TEST_SUBMISSION_001',
  doc_class_raw:              'Solar + Battery',
  client_first_name:          'Sarah',
  client_last_name:           'Williams',
  client_email:               'SARAH.WILLIAMS@EXAMPLE.COM',
  client_phone:               '0412 345 678',
  site_address_raw:           '42 Oak Ave, Ballarat VIC 3350',
  system_type_raw:            '',
  system_size_kw_raw:         '10kW',
  battery_size_kwh_raw:       '$20kWh',
  estimated_annual_bill_raw:  '$4,200',
  finance_required_raw:       'Yes',
  notes_raw:                  'Pool pump runs 8hrs/day',
  normalised_flag:            'FALSE'
};

/** Expected normalised output from MOCK_RAW_ROW. */
const MOCK_NORMALISED_DATA = {
  job_id:                 'JOB-2026-9999',
  normalised_at:          '2026-03-31T10:00:00.000Z',
  source_submission_id:   'TEST_SUBMISSION_001',
  doc_class:              'solar_battery_proposal',
  client_name:            'Sarah Williams',
  client_email:           'sarah.williams@example.com',
  client_phone:           '0412345678',
  site_address:           '42 Oak Ave, Ballarat VIC 3350',
  client_surname:         'Williams',
  short_address:          '42-Oak-Ave',
  system_size_kw:         10,
  battery_size_kwh:       20,
  estimated_annual_bill:  4200,
  total_price:            null,
  est_annual_saving:      null,
  payback_years:          null,
  finance_required:       true,
  notes:                  'Pool pump runs 8hrs/day',
  null_policy_applied:    '',
  pipeline_stage:         'NORMALISED'
};

/** Valid Claude JSON response string for JOB-2026-9999. */
const MOCK_CLAUDE_JSON_RESPONSE = JSON.stringify({
  document_type: 'solar_battery_proposal',
  job_id:        'JOB-2026-9999',
  template_id:   'HEA_TEMPLATE_SOLAR_BATTERY_PROPOSAL_MASTER_v001',
  file_name:     'HEA_PROPOSAL_2026-03-31_JOB-2026-9999_Williams_42-Oak-Ave_v001',
  placeholders: {
    '{{JOB_ID}}':           'JOB-2026-9999',
    '{{CLIENT_NAME}}':      'Sarah Williams',
    '{{SITE_ADDRESS}}':     '42 Oak Ave, Ballarat VIC 3350',
    '{{PROPOSAL_DATE}}':    '31 March 2026',
    '{{PROJECT_HEADLINE}}': 'Solar + Battery Solution for Ballarat Home',
    '{{RECOMMENDATION}}':   'We recommend a 10 kW solar system with 20 kWh battery storage.',
    '{{SYSTEM_SIZE_KW}}':   '10 kW',
    '{{BATTERY_SIZE_KWH}}': '20 kWh',
    '{{TOTAL_PRICE}}':      'TBC',
    '{{EST_ANNUAL_SAVING}}':'TBC',
    '{{PAYBACK_YEARS}}':    'TBC',
    '{{SCOPE_SUMMARY}}':    'Supply and installation of a 10 kW rooftop solar array and 20 kWh battery system at the nominated site.',
    '{{ASSUMPTIONS}}':      'Site is grid-connected. Roof structure is suitable for panel installation. Customer has reviewed preliminary energy analysis.',
    '{{EXCLUSIONS}}':       'Any structural roof modifications. Network operator fees or approvals. Metering upgrades unless otherwise specified.',
    '{{TIMELINE}}':         '4–6 weeks from signed acceptance',
    '{{NEXT_STEPS}}':       'Review and sign this proposal. Our team will contact you within 2 business days to confirm the installation schedule.',
    '{{PAIN_SUMMARY}}':     'High electricity bills driven by daytime pool pump usage.',
    '{{FINANCE_NOTE}}':     'Finance options are available — ask your consultant for details.'
  },
  meta: {
    tone:               'premium_restrained',
    word_budget_profile:'visual_template_safe',
    source_confidence:  'mixed_input_user_supplied_plus_derived',
    generated_at:       '2026-03-31T10:05:00.000Z'
  }
});

/** A string that is not valid JSON. */
const MOCK_INVALID_JSON = 'This is not JSON { broken: yes';

/** Valid JSON but job_id = JOB-2026-0001 when expecting JOB-2026-9999. */
const MOCK_WRONG_JOB_ID_JSON = JSON.stringify({
  document_type: 'solar_battery_proposal',
  job_id:        'JOB-2026-0001',
  template_id:   'HEA_TEMPLATE_SOLAR_BATTERY_PROPOSAL_MASTER_v001',
  file_name:     'HEA_PROPOSAL_2026-03-31_JOB-2026-0001_Williams_42-Oak-Ave_v001',
  placeholders: {
    '{{JOB_ID}}':           'JOB-2026-0001',
    '{{CLIENT_NAME}}':      'Sarah Williams',
    '{{SITE_ADDRESS}}':     '42 Oak Ave, Ballarat VIC 3350',
    '{{PROPOSAL_DATE}}':    '31 March 2026',
    '{{PROJECT_HEADLINE}}': 'Solar + Battery Solution',
    '{{RECOMMENDATION}}':   'We recommend a solar system.',
    '{{SCOPE_SUMMARY}}':    'Supply and installation of a solar system.',
    '{{ASSUMPTIONS}}':      'Site is grid-connected.',
    '{{EXCLUSIONS}}':       'Structural modifications.',
    '{{NEXT_STEPS}}':       'Review and sign this proposal.'
  },
  meta: {
    tone:               'premium_restrained',
    word_budget_profile:'visual_template_safe',
    source_confidence:  'user_supplied',
    generated_at:       '2026-03-31T10:05:00.000Z'
  }
});

/** Valid JSON but missing the required {{RECOMMENDATION}} placeholder. */
const MOCK_MISSING_REQUIRED_PLACEHOLDER_JSON = JSON.stringify({
  document_type: 'solar_battery_proposal',
  job_id:        'JOB-2026-9999',
  template_id:   'HEA_TEMPLATE_SOLAR_BATTERY_PROPOSAL_MASTER_v001',
  file_name:     'HEA_PROPOSAL_2026-03-31_JOB-2026-9999_Williams_42-Oak-Ave_v001',
  placeholders: {
    '{{JOB_ID}}':           'JOB-2026-9999',
    '{{CLIENT_NAME}}':      'Sarah Williams',
    '{{SITE_ADDRESS}}':     '42 Oak Ave, Ballarat VIC 3350',
    '{{PROPOSAL_DATE}}':    '31 March 2026',
    '{{PROJECT_HEADLINE}}': 'Solar + Battery Solution',
    // {{RECOMMENDATION}} intentionally omitted
    '{{SCOPE_SUMMARY}}':    'Supply and installation of a solar system.',
    '{{ASSUMPTIONS}}':      'Site is grid-connected.',
    '{{EXCLUSIONS}}':       'Structural modifications.',
    '{{NEXT_STEPS}}':       'Review and sign this proposal.'
  },
  meta: {
    tone:               'premium_restrained',
    word_budget_profile:'visual_template_safe',
    source_confidence:  'user_supplied',
    generated_at:       '2026-03-31T10:05:00.000Z'
  }
});
