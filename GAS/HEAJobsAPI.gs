/**
 * HEA Jobs API — Google Apps Script
 * ===================================
 * Deploy this as a Web App:
 *   Execute as: Me (hea.trades@gmail.com)
 *   Who has access: Anyone
 *
 * Web App URL: https://script.google.com/macros/s/AKfycbwb4kPUkEaa3tYdA9YYDQDt6EDJQaC2EEcc07wlZ-cvDH1XSRUI30mKDWfw59_Ynk8/exec
 * GAS Script ID: 1ZZ7_IxoKYPYHPzH4G8j34OsQzumHJxRE7mXgJqPbA8iLes6tTa-3SvmL
 *
 * Sheet columns (Row 1 = headers):
 *   A: Job Number  B: Client Name  C: Phone     D: Email
 *   E: Address     F: Status       G: Drive URL  H: Notes  I: Created Date
 *   J: System Size (kW)  K: Battery Size (kWh)  L: Quote Value ($)
 *   M: Est. Annual Bill ($)  N: Finance Required
 */

const SHEET_NAME = 'HEA Jobs';
const COL = {
  JOB_NUMBER:       1,
  CLIENT_NAME:      2,
  PHONE:            3,
  EMAIL:            4,
  ADDRESS:          5,
  STATUS:           6,
  DRIVE_URL:        7,
  NOTES:            8,
  CREATED_DATE:     9,
  SYSTEM_SIZE:      10, // J
  BATTERY_SIZE:     11, // K
  TOTAL_PRICE:      12, // L
  ANNUAL_BILL:      13, // M
  FINANCE_REQUIRED: 14, // N
};

// ---------------------------------------------------------------------------
// GET — return all jobs, single job (?id=TS001), or action endpoints
// ---------------------------------------------------------------------------
function doGet(e) {
  const sheet = getSheet();
  const id = e && e.parameter && e.parameter.id;

  if (e.parameter.action === 'proposalStats') {
    return jsonResponse(getProposalStats_());
  }

  if (e.parameter.action === 'getAllDocuments') {
    return jsonResponse(getAllDocuments_());
  }

  if (e.parameter.action === 'getAvailableTemplates') {
    return jsonResponse(getAvailableTemplates_());
  }

  if (e.parameter.action === 'getDocuments' && e.parameter.jobNumber) {
    return jsonResponse(getDocumentsForJob_(e.parameter.jobNumber));
  }

  if (id) {
    const job = findJobByNumber(sheet, id);
    if (!job) return jsonResponse({ error: 'Not found' }, 404);
    return jsonResponse(job);
  }

  return jsonResponse(getAllJobs(sheet));
}

// ---------------------------------------------------------------------------
// POST — action: 'createJob' | 'updateJob' | 'generateDocument'
// ---------------------------------------------------------------------------
function doPost(e) {
  const sheet = getSheet();
  let body;

  try {
    body = JSON.parse(e.postData.contents);
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400);
  }

  const action = body.action;

  if (action === 'createJob') {
    const job = createJob(sheet, body);
    sendTelegramAlert_(
      '🆕 <b>New Job #' + job.jobNumber + '</b>\n' +
      '👤 ' + (job.clientName || 'Unknown') + '\n' +
      '📍 ' + (job.address || 'No address')
    );
    return jsonResponse(job);
  }

  if (action === 'updateJob') {
    const prevJob = findJobByNumber(sheet, body.jobNumber);
    const job = updateJob(sheet, body);
    if (!job) return jsonResponse({ error: 'Job not found' }, 404);
    if (body.status && prevJob && body.status !== prevJob.status) {
      sendTelegramAlert_(
        '📋 <b>Job #' + job.jobNumber + ' updated</b>\n' +
        '👤 ' + job.clientName + '\n' +
        '🔄 ' + prevJob.status + ' → <b>' + job.status + '</b>'
      );
    }
    return jsonResponse(job);
  }

  if (action === 'generateDocument') {
    try {
      return jsonResponse(generateDocumentForJob_(body.jobNumber, body.docClass));
    } catch (err) {
      return jsonResponse({ error: err.message }, 500);
    }
  }

  return jsonResponse({ error: 'Unknown action' }, 400);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow([
      'Job Number', 'Client Name', 'Phone', 'Email',
      'Address', 'Status', 'Drive URL', 'Notes', 'Created Date',
      'System Size (kW)', 'Battery Size (kWh)', 'Quote Value ($)',
      'Est. Annual Bill ($)', 'Finance Required',
    ]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, 14).setFontWeight('bold');
  }

  return sheet;
}

function getNextJobNumber(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return 'TS001';
  const values = sheet.getRange(2, COL.JOB_NUMBER, lastRow - 1, 1).getValues();
  let max = 0;
  values.forEach(([val]) => {
    const match = String(val).match(/^TS(\d+)$/);
    if (match) max = Math.max(max, parseInt(match[1]));
  });
  return 'TS' + String(max + 1).padStart(3, '0');
}

function createJob(sheet, data) {
  const jobNumber = getNextJobNumber(sheet);
  const createdDate = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy');

  sheet.appendRow([
    jobNumber,
    data.clientName      || '',
    data.phone           || '',
    data.email           || '',
    data.address         || '',
    data.status          || 'Lead',
    data.driveUrl        || '',
    data.notes           || '',
    createdDate,
    data.systemSize      || '',
    data.batterySize     || '',
    data.totalPrice      || '',
    data.annualBill      || '',
    data.financeRequired || false,
  ]);

  return {
    jobNumber,
    clientName:      data.clientName      || '',
    phone:           data.phone           || '',
    email:           data.email           || '',
    address:         data.address         || '',
    status:          data.status          || 'Lead',
    driveUrl:        data.driveUrl        || '',
    notes:           data.notes           || '',
    createdDate,
    systemSize:      data.systemSize      || '',
    batterySize:     data.batterySize     || '',
    totalPrice:      data.totalPrice      || '',
    annualBill:      data.annualBill      || '',
    financeRequired: data.financeRequired || false,
  };
}

function updateJob(sheet, data) {
  const row = findRowByJobNumber(sheet, data.jobNumber);
  if (!row) return null;

  if (data.status          !== undefined) sheet.getRange(row, COL.STATUS).setValue(data.status);
  if (data.driveUrl        !== undefined) sheet.getRange(row, COL.DRIVE_URL).setValue(data.driveUrl);
  if (data.notes           !== undefined) sheet.getRange(row, COL.NOTES).setValue(data.notes);
  if (data.systemSize      !== undefined) sheet.getRange(row, COL.SYSTEM_SIZE).setValue(data.systemSize);
  if (data.batterySize     !== undefined) sheet.getRange(row, COL.BATTERY_SIZE).setValue(data.batterySize);
  if (data.totalPrice      !== undefined) sheet.getRange(row, COL.TOTAL_PRICE).setValue(data.totalPrice);
  if (data.annualBill      !== undefined) sheet.getRange(row, COL.ANNUAL_BILL).setValue(data.annualBill);
  if (data.financeRequired !== undefined) sheet.getRange(row, COL.FINANCE_REQUIRED).setValue(data.financeRequired);

  return rowToJob(sheet.getRange(row, 1, 1, 14).getValues()[0]);
}

function findJobByNumber(sheet, jobNumber) {
  const row = findRowByJobNumber(sheet, jobNumber);
  if (!row) return null;
  return rowToJob(sheet.getRange(row, 1, 1, 14).getValues()[0]);
}

function findRowByJobNumber(sheet, jobNumber) {
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return null;
  const values = sheet.getRange(2, COL.JOB_NUMBER, lastRow - 1, 1).getValues();
  for (let i = 0; i < values.length; i++) {
    if (String(values[i][0]) === String(jobNumber)) return i + 2;
  }
  return null;
}

function getAllJobs(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];
  const values = sheet.getRange(2, 1, lastRow - 1, 14).getValues();
  return values
    .filter(row => row[0])
    .map(rowToJob)
    .reverse();
}

function rowToJob(row) {
  return {
    jobNumber:       String(row[0]),
    clientName:      String(row[1]),
    phone:           String(row[2]),
    email:           String(row[3]),
    address:         String(row[4]),
    status:          String(row[5]),
    driveUrl:        String(row[6]),
    notes:           String(row[7]),
    createdDate:     String(row[8]),
    systemSize:      String(row[9]  || ''),
    batterySize:     String(row[10] || ''),
    totalPrice:      String(row[11] || ''),
    annualBill:      String(row[12] || ''),
    financeRequired: row[13] === true || String(row[13]).toLowerCase() === 'true',
  };
}

function jsonResponse(data) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

// ---------------------------------------------------------------------------
// getAllDocuments — reads EXPORT_LOG sheet, used by /dashboard/documents
// ---------------------------------------------------------------------------
function getAllDocuments_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('EXPORT_LOG');
  if (!sheet || sheet.getLastRow() < 2) return [];
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  return data.slice(1)
    .filter(function(row) { return row[0]; })
    .map(function(row) {
      return Object.fromEntries(headers.map(function(h, i) { return [h, row[i]]; }));
    });
}

// ---------------------------------------------------------------------------
// Proposal stats — used by ProposalUsageBadge on /dashboard
// ---------------------------------------------------------------------------
function getProposalStats_() {
  const ss     = SpreadsheetApp.getActiveSpreadsheet();
  const sheet  = ss.getSheetByName('EXPORT_LOG');
  if (!sheet || sheet.getLastRow() < 2) {
    return { pdfs_today: 0, tokens_today: 0, avg_tokens: 0, remaining: 500, daily_limit: 500 };
  }
  const today   = Utilities.formatDate(new Date(), 'Australia/Melbourne', 'yyyy-MM-dd');
  const data    = sheet.getDataRange().getValues();
  const headers = data[0];
  const tsCol   = headers.indexOf('timestamp');
  const stCol   = headers.indexOf('status');
  const tkCol   = headers.indexOf('total_tokens');
  let pdfsToday = 0, tokensToday = 0;
  for (let i = 1; i < data.length; i++) {
    const ts = String(data[i][tsCol] || '');
    if (String(data[i][stCol]) === 'SUCCESS' && ts) {
      const d = Utilities.formatDate(new Date(ts), 'Australia/Melbourne', 'yyyy-MM-dd');
      if (d === today) { pdfsToday++; tokensToday += Number(data[i][tkCol] || 0); }
    }
  }
  const daily_limit = 500;
  return {
    pdfs_today:   pdfsToday,
    tokens_today: tokensToday,
    avg_tokens:   pdfsToday > 0 ? Math.round(tokensToday / pdfsToday) : 0,
    remaining:    Math.max(0, daily_limit - pdfsToday),
    daily_limit:  daily_limit,
  };
}

// ---------------------------------------------------------------------------
// Template config — used by document generation UI
// ---------------------------------------------------------------------------
function getAvailableTemplates_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('TEMPLATE_CONFIG');
  if (!sheet || sheet.getLastRow() < 2) return [];
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  return data.slice(1)
    .filter(row => String(row[headers.indexOf('active')]) === 'TRUE')
    .map(row => ({
      doc_class:    row[headers.indexOf('doc_class')],
      template_id:  row[headers.indexOf('template_id')],
      display_name: formatDocClassName_(String(row[headers.indexOf('doc_class')])),
    }));
}

function formatDocClassName_(docClass) {
  return docClass.split('_').map(function(w) {
    return w.charAt(0).toUpperCase() + w.slice(1);
  }).join(' ');
}

// ---------------------------------------------------------------------------
// Per-job document history — used by job detail page
// ---------------------------------------------------------------------------
function getDocumentsForJob_(jobNumber) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('DOCUMENT_JOBS');
  if (!sheet || sheet.getLastRow() < 2) return [];
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const jnCol = headers.indexOf('job_number');
  return data.slice(1)
    .filter(row => String(row[jnCol]) === String(jobNumber))
    .map(row => {
      const obj = {};
      headers.forEach(function(h, i) { obj[h] = row[i]; });
      return obj;
    })
    .reverse();
}

// ---------------------------------------------------------------------------
// Document generation — triggered from dashboard job detail
// ---------------------------------------------------------------------------
function generateDocumentForJob_(jobNumber, docClass) {
  const job = findJobByNumber(getSheet(), jobNumber);
  if (!job) throw new Error('Job not found: ' + jobNumber);

  const docJobId = JobService.createJobId();
  const nameParts = (job.clientName || '').trim().split(' ');
  const surname = nameParts.length > 1 ? nameParts[nameParts.length - 1] : nameParts[0];
  const shortAddr = (job.address || '').replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-').substring(0, 20);

  const nd = {
    job_id: docJobId, doc_class: docClass,
    client_name: job.clientName || '', client_email: job.email || '',
    client_phone: job.phone || '', site_address: job.address || '',
    client_surname: surname, short_address: shortAddr,
    system_size_kw:        job.systemSize      || null,
    battery_size_kwh:      job.batterySize     || null,
    estimated_annual_bill: job.annualBill       || null,
    total_price:           job.totalPrice      || null,
    est_annual_saving: null, payback_years: null,
    finance_required: job.financeRequired || false,
    notes: job.notes || '',
  };

  const djSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DOCUMENT_JOBS');
  if (djSheet) {
    djSheet.appendRow([jobNumber, docJobId, docClass, formatDocClassName_(docClass),
      'GENERATING', '', '', new Date().toISOString(), 0, 'DASHBOARD']);
  }

  SheetRepository.appendRow(CONFIG.TABS.NORMALISED_DATA, Object.assign({}, nd, {
    normalised_flag: 'TRUE',
    pipeline_stage: CONFIG.PIPELINE_STAGE.NORMALISED,
    null_policy_applied: 'dashboard_generation',
  }));
  JobService.registerJob({ job_id: docJobId, client_name: nd.client_name,
    site_address: nd.site_address, doc_class: docClass });

  const startTime = Date.now();
  let result;
  try {
    result = _runPipeline(nd, 'DASHBOARD', startTime);
  } catch (err) {
    _updateDocumentJob_(jobNumber, docJobId, 'FAILED', '', '');
    return { success: false, error: err.message };
  }

  _updateDocumentJob_(jobNumber, docJobId, 'SUCCESS', result.outputLink, result.pdfLink);
  return { success: true, jobNumber: jobNumber, docJobId: docJobId, docClass: docClass,
           outputLink: result.outputLink, pdfLink: result.pdfLink };
}

function _updateDocumentJob_(jobNumber, docJobId, status, outputLink, pdfLink) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('DOCUMENT_JOBS');
  if (!sheet || sheet.getLastRow() < 2) return;
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const djCol = headers.indexOf('doc_job_id');
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][djCol]) === String(docJobId)) {
      const row = i + 1;
      sheet.getRange(row, headers.indexOf('status')      + 1).setValue(status);
      sheet.getRange(row, headers.indexOf('output_link') + 1).setValue(outputLink || '');
      sheet.getRange(row, headers.indexOf('pdf_link')    + 1).setValue(pdfLink    || '');
      sheet.getRange(row, headers.indexOf('generated_at')+ 1).setValue(new Date().toISOString());
      break;
    }
  }
}

// ---------------------------------------------------------------------------
// Dev / debug utilities
// ---------------------------------------------------------------------------
function runManualTest() {
  const startTime = Date.now();
  const rawRow = {
    timestamp: new Date().toISOString(),
    form_submission_id: 'MANUAL_TEST_001',
    doc_class_raw: 'Solar + Battery',
    client_first_name: 'Sarah',
    client_last_name: 'Williams',
    client_email: 'sarah@example.com',
    client_phone: '0412345678',
    site_address_raw: '42 Oak Ave, Ballarat VIC 3350',
    system_type_raw: '',
    system_size_kw_raw: '10kW',
    battery_size_kwh_raw: '13.5kWh',
    estimated_annual_bill_raw: '$4200',
    finance_required_raw: 'No',
    notes_raw: 'Pool pump runs 8hrs/day',
    normalised_flag: 'FALSE',
  };

  SheetRepository.appendRow(CONFIG.TABS.RAW_SUBMISSIONS, rawRow);
  const jobId = JobService.createJobId();
  const normalisedData = Normalizer.normaliseAndWrite(rawRow, jobId);
  JobService.registerJob({
    job_id: jobId,
    client_name: normalisedData['client_name'],
    site_address: normalisedData['site_address'],
    doc_class: normalisedData['doc_class'],
  });
  _runPipeline(normalisedData, 'MANUAL_TEST', startTime);
}

function listGeminiModels() {
  const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  console.log('STATUS: ' + response.getResponseCode());
  console.log(response.getContentText().substring(0, 3000));
}

function extractTemplatePlaceholders() {
  const FILE_ID = '1INXF_5V9wrQMfqL51HKRuexJmVLM5Jf9puI6gKkN2W4';
  const presentation = SlidesApp.openById(FILE_ID);
  const found = {};

  presentation.getSlides().forEach((slide, i) => {
    const slideNum = i + 1;
    slide.getShapes().forEach(shape => {
      try {
        const text = shape.getText().asString();
        const matches = text.match(/\{[A-Za-z][A-Za-z0-9_]*\}/g) || [];
        matches.forEach(m => { found[m] = found[m] || []; found[m].push('slide ' + slideNum); });
      } catch(e) {}
    });
    slide.getTables().forEach(table => {
      for (let r = 0; r < table.getNumRows(); r++) {
        for (let c = 0; c < table.getNumColumns(); c++) {
          try {
            const text = table.getCell(r, c).getText().asString();
            const matches = text.match(/\{[A-Za-z][A-Za-z0-9_]*\}/g) || [];
            matches.forEach(m => { found[m] = found[m] || []; found[m].push('slide ' + slideNum); });
          } catch(e) {}
        }
      }
    });
  });

  Logger.log('=== ALL TEMPLATE VARIABLES ===');
  Logger.log('Total unique variables: ' + Object.keys(found).length);
  Object.keys(found).sort().forEach(key => {
    Logger.log(key + '  →  found on: ' + [...new Set(found[key])].join(', '));
  });
  Logger.log('=== END ===');
}

// ---------------------------------------------------------------------------
// Telegram notifications
// ---------------------------------------------------------------------------

function sendTelegram(message) {
  const token = PropertiesService.getScriptProperties().getProperty('TELEGRAM_BOT_TOKEN');
  const chatId = PropertiesService.getScriptProperties().getProperty('TELEGRAM_CHAT_ID');
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML' })
  });
}

function sendTelegramAlert_(message) {
  try {
    const props = PropertiesService.getScriptProperties();
    const token = props.getProperty('TELEGRAM_BOT_TOKEN');
    const chatId = props.getProperty('TELEGRAM_CHAT_ID');
    if (!token || !chatId) return;
    UrlFetchApp.fetch(
      'https://api.telegram.org/bot' + token + '/sendMessage',
      {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML' }),
        muteHttpExceptions: true,
      }
    );
  } catch (e) {
    Logger.log('Telegram error: ' + e);
  }
}
