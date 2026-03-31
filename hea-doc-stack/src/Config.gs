/**
 * Config.gs
 * Central configuration object for the HEA Document Stack.
 * All constants are defined here — no business logic.
 */

const CONFIG = {

  /** Google Sheet tab names */
  TABS: {
    RAW_SUBMISSIONS: 'RAW_SUBMISSIONS',
    NORMALISED_DATA: 'NORMALISED_DATA',
    JOBS_REGISTER:   'JOBS_REGISTER',
    TEMPLATE_CONFIG: 'TEMPLATE_CONFIG',
    BRAND_CONFIG:    'BRAND_CONFIG',
    PROMPT_CONFIG:   'PROMPT_CONFIG',
    EXPORT_LOG:      'EXPORT_LOG',
    ERROR_LOG:       'ERROR_LOG',
    SIGNING_QUEUE:   'SIGNING_QUEUE',
    SETTINGS:        'SETTINGS'
  },

  /** Google Drive folder names */
  FOLDERS: {
    JOBS_ROOT: 'HEA Jobs'
  },

  /** Subfolders created inside every job folder */
  JOB_SUBFOLDERS: [
    '01_Intake',
    '02_Proposal',
    '03_Design',
    '04_Signing',
    '05_Execution',
    '99_Archive'
  ],

  /** Maps output_folder_rule keys to job subfolder names */
  OUTPUT_FOLDER_RULES: {
    intake:   '01_Intake',
    proposal: '02_Proposal',
    design:   '03_Design',
    signing:  '04_Signing',
    execution:'05_Execution',
    archive:  '99_Archive'
  },

  /** Gemini API configuration (free tier — no billing required) */
  GEMINI: {
    API_URL:    'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
    MODEL:      'gemini-1.5-flash',
    MAX_TOKENS: 2000
  },

  /** Job ID generation settings */
  JOB: {
    ID_PREFIX:    'JOB',
    COUNTER_KEY:  'JOB_COUNTER',
    ID_YEAR_DIGITS: 4,
    ID_SEQ_DIGITS:  4
  },

  /** Template runtime types */
  RUNTIME: {
    SLIDES: 'SLIDES',
    DOCS:   'DOCS'
  },

  /** Canonical document class identifiers */
  DOC_CLASS: {
    SOLAR_BATTERY_PROPOSAL: 'solar_battery_proposal',
    SMARTHOME_PROPOSAL:     'smarthome_proposal',
    ENERGY_AUDIT_REPORT:    'energy_audit_report'
  },

  /** Pipeline stage constants */
  PIPELINE_STAGE: {
    INTAKE:           'INTAKE',
    NORMALISED:       'NORMALISED',
    CLAUDE_PENDING:   'CLAUDE_PENDING',
    CLAUDE_COMPLETE:  'CLAUDE_COMPLETE',
    FILLING:          'FILLING',
    EXPORT_COMPLETE:  'EXPORT_COMPLETE',
    SIGNING_QUEUED:   'SIGNING_QUEUED',
    SIGNING_COMPLETE: 'SIGNING_COMPLETE',
    FAILED:           'FAILED'
  },

  /** Error class constants */
  ERROR_CLASS: {
    CONFIG_ERROR:                 'CONFIG_ERROR',
    INPUT_VALIDATION_ERROR:       'INPUT_VALIDATION_ERROR',
    JOB_REGISTRATION_ERROR:       'JOB_REGISTRATION_ERROR',
    CLAUDE_API_ERROR:             'CLAUDE_API_ERROR',
    JSON_PARSE_ERROR:             'JSON_PARSE_ERROR',
    JSON_SCHEMA_ERROR:            'JSON_SCHEMA_ERROR',
    TEMPLATE_NOT_FOUND:           'TEMPLATE_NOT_FOUND',
    PLACEHOLDER_REPLACEMENT_ERROR:'PLACEHOLDER_REPLACEMENT_ERROR',
    PDF_EXPORT_ERROR:             'PDF_EXPORT_ERROR',
    DRIVE_PERMISSION_ERROR:       'DRIVE_PERMISSION_ERROR',
    SIGNING_PROVIDER_ERROR:       'SIGNING_PROVIDER_ERROR',
    UNKNOWN_RUNTIME_ERROR:        'UNKNOWN_RUNTIME_ERROR'
  },

  /** Keys used in SETTINGS tab */
  SETTINGS_KEYS: {
    CLAUDE_API_KEY_REF: 'CLAUDE_API_KEY_REF',
    JOB_COUNTER:        'JOB_COUNTER',
    DEFAULT_DOC_CLASS:  'DEFAULT_DOC_CLASS',
    ENVIRONMENT:        'ENVIRONMENT',
    TEST_MODE:          'TEST_MODE',
    SIGNING_PROVIDER:   'SIGNING_PROVIDER'
  },

  /** Regex matching {{UPPER_SNAKE_CASE}} placeholders */
  PLACEHOLDER_PATTERN: /\{\{[A-Z0-9_]+\}\}/g,

  /** Retry policy for transient failures */
  RETRY: {
    MAX_ATTEMPTS: 3,
    DELAY_MS:     2000
  }

};
