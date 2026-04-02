/**
 * setup.gs
 * One-time setup script for the HEA Document Stack.
 * Run setupSheetHeaders() once after deploying to a new spreadsheet.
 * This file is excluded from clasp push via .claspignore.
 */

/**
 * Creates all 10 required sheet tabs (if absent) and writes header rows.
 * Seeds SETTINGS and BRAND_CONFIG with default values.
 * Safe to run multiple times — existing tabs and data are not overwritten.
 */
function setupSheetHeaders() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // ── Tab schemas ─────────────────────────────────────────────────────────────

  const SCHEMA = {
    RAW_SUBMISSIONS: [
      'timestamp','form_submission_id','doc_class_raw','client_first_name',
      'client_last_name','client_email','client_phone','site_address_raw',
      'system_type_raw','system_size_kw_raw','battery_size_kwh_raw',
      'estimated_annual_bill_raw','finance_required_raw','notes_raw','normalised_flag'
    ],
    NORMALISED_DATA: [
      'job_id','normalised_at','source_submission_id','doc_class','client_name',
      'client_email','client_phone','site_address','client_surname','short_address',
      'system_size_kw','battery_size_kwh','estimated_annual_bill','total_price',
      'est_annual_saving','payback_years','finance_required','notes',
      'null_policy_applied','pipeline_stage'
    ],
    JOBS_REGISTER: [
      'job_id','created_at','client_name','site_address','doc_class',
      'pipeline_stage','doc_status','template_id','output_file_id',
      'output_file_link','pdf_file_id','pdf_link','job_folder_id',
      'last_run_at','output_version','owner','notes'
    ],
    TEMPLATE_CONFIG: [
      'template_id','doc_class','runtime_type','master_file_id',
      'output_folder_rule','placeholder_manifest_json','export_pdf',
      'require_signing','active','template_version','notes'
    ],
    BRAND_CONFIG: [
      'key','value','description'
    ],
    PROMPT_CONFIG: [
      'config_id','doc_class','system_prompt','user_prompt_template',
      'json_schema_hint','active','version','notes'
    ],
    EXPORT_LOG: [
      'timestamp','job_id','doc_class','template_id','output_file_id',
      'output_file_link','pdf_file_id','pdf_link','status',
      'run_duration_ms','triggered_by'
    ],
    ERROR_LOG: [
      'timestamp','job_id','module','error_class','error_message',
      'context_summary','severity','rerunnable','stacktrace_snippet','resolved'
    ],
    SIGNING_QUEUE: [
      'job_id','doc_class','pdf_file_id','pdf_link','recipient_name',
      'recipient_email','provider','send_status','sign_status',
      'signed_file_link','sign_request_id','last_sync'
    ],
    SETTINGS: [
      'key','value','description'
    ],
    DOCUMENT_JOBS: [
      'job_number','doc_job_id','doc_class','template_display_name',
      'status','output_link','pdf_link','generated_at','token_count','triggered_by'
    ]
  };

  // ── Create tabs and write headers ──────────────────────────────────────────

  Object.keys(SCHEMA).forEach(tabName => {
    let sheet = ss.getSheetByName(tabName);
    if (!sheet) {
      sheet = ss.insertSheet(tabName);
      console.log(`Created tab: ${tabName}`);
    }
    // Only write headers if row 1 is empty
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, SCHEMA[tabName].length).setValues([SCHEMA[tabName]]);
      console.log(`Wrote headers for: ${tabName}`);
    }
  });

  // ── Seed SETTINGS tab ──────────────────────────────────────────────────────

  _seedSettingsRows(ss);

  // ── Seed BRAND_CONFIG tab ─────────────────────────────────────────────────

  _seedBrandConfigRows(ss);

  console.log('setupSheetHeaders() complete.');
}

/**
 * Seeds the SETTINGS tab with default rows if not already present.
 * @param {Spreadsheet} ss
 */
function _seedSettingsRows(ss) {
  const sheet = ss.getSheetByName('SETTINGS');
  if (!sheet) return;

  const defaults = [
    ['CLAUDE_API_KEY_REF',  'SCRIPT_PROPERTY:CLAUDE_API_KEY', 'Store actual key in Script Properties'],
    ['JOB_COUNTER',         '0',                              'Auto-incremented by pipeline'],
    ['DEFAULT_DOC_CLASS',   'solar_battery_proposal',         'Used when doc_class not detected'],
    ['ENVIRONMENT',         'PRODUCTION',                     'PRODUCTION or TEST'],
    ['TEST_MODE',           'FALSE',                          ''],
    ['SIGNING_PROVIDER',    'DOCUSEAL',                       'DOCUSEAL or OPENSIGN']
  ];

  const existing = _getExistingKeys(sheet, 'key');
  defaults.forEach(row => {
    if (!existing.includes(row[0])) {
      sheet.appendRow(row);
      console.log(`Seeded SETTINGS: ${row[0]}`);
    }
  });
}

/**
 * Seeds the BRAND_CONFIG tab with HEA brand defaults if not already present.
 * @param {Spreadsheet} ss
 */
function _seedBrandConfigRows(ss) {
  const sheet = ss.getSheetByName('BRAND_CONFIG');
  if (!sheet) return;

  const defaults = [
    ['brand_name',           'Home Energy Australia',          'Company display name'],
    ['primary_colour',       '#1A2E44',                        'Deep navy — primary brand colour'],
    ['secondary_colour',     '#2ECC71',                        'Green — energy/sustainability accent'],
    ['accent_colour',        '#F39C12',                        'Amber — call-to-action highlight'],
    ['heading_font',         'Montserrat',                     'Primary heading typeface'],
    ['body_font',            'Open Sans',                      'Body copy typeface'],
    ['logo_file_id',         'REPLACE_WITH_DRIVE_FILE_ID',     'Full colour logo Drive file ID'],
    ['mono_logo_file_id',    'REPLACE_WITH_DRIVE_FILE_ID',     'Monochrome logo Drive file ID'],
    ['icon_folder_id',       'REPLACE_WITH_DRIVE_FOLDER_ID',   'Icon set folder Drive ID'],
    ['hero_image_folder_id', 'REPLACE_WITH_DRIVE_FOLDER_ID',   'Hero image library Drive folder ID'],
    ['tone_profile',         'premium_restrained',             'AI tone instruction key'],
    ['card_style',           'flat_with_border',               'Slide card component style'],
    ['divider_style',        'thin_accent_line',               'Section divider style'],
    ['preferred_cover_style','full_bleed_dark',                'Cover slide layout preference']
  ];

  const existing = _getExistingKeys(sheet, 'key');
  defaults.forEach(row => {
    if (!existing.includes(row[0])) {
      sheet.appendRow(row);
      console.log(`Seeded BRAND_CONFIG: ${row[0]}`);
    }
  });
}

/**
 * Returns all values in a named column from row 2 onwards as an array of strings.
 * @param {Sheet} sheet
 * @param {string} colName
 * @returns {string[]}
 */
function _getExistingKeys(sheet, colName) {
  if (sheet.getLastRow() <= 1) return [];
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const colIdx  = headers.indexOf(colName);
  if (colIdx === -1) return [];
  const data = sheet.getRange(2, colIdx + 1, sheet.getLastRow() - 1, 1).getValues();
  return data.map(r => String(r[0]));
}
