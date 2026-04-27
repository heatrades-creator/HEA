/**
 * HEA Jobs API — Google Apps Script
 * ===================================
 * Deploy this as a Web App:
 *   Execute as: Me (hea.trades@gmail.com)
 *   Who has access: Anyone
 *
 * GAS Script ID: 1w0iY9HgLKZBcfQW1tfxpzwutWdikuwvIavk1fvKCwB1AhMmgxW1cTPyM
 * Web App URL: https://script.google.com/macros/s/AKfycbzUnprjWr7RiY08YcUG71ACfER6ghMumA1TOvaMVdBhTkhI6vLEqNSCBmsYlOrVrNc5/exec
 * Set JOBS_GAS_URL in Vercel to the Web App URL above.
 * The deploy-gas.yml workflow auto-updates Vercel if VERCEL_TOKEN + VERCEL_PROJECT_ID secrets are set.
 *
 * Sheet columns (Row 1 = headers):
 *   A: Job Number  B: Client Name  C: Phone     D: Email
 *   E: Address     F: Status       G: Drive URL  H: Notes  I: Created Date
 *   J: System Size (kW)  K: Battery Size (kWh)  L: Quote Value ($)
 *   M: Est. Annual Bill ($)  N: Finance Required
 *   O: Occupants   P: Home Daytime  Q: Hot Water  R: Gas Appliances  S: EV
 */

const SHEET_NAME = 'HEA Jobs';

// Unified client folder — all intake docs, bills, NMI data, and job files live here
const CLIENTS_FOLDER_ID = '12LCs9uDYh4Wynor0LdDelNbcQDe7c-C-';
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
  OCCUPANTS:        15, // O
  HOME_DAYTIME:     16, // P
  HOT_WATER:        17, // Q
  GAS_APPLIANCES:   18, // R
  EV:               19, // S
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

  if (e.parameter.action === 'checkNMI' && e.parameter.jobNumber) {
    return jsonResponse(checkNMI_(e.parameter.jobNumber));
  }

  if (e.parameter.action === 'checkEstimation' && e.parameter.jobNumber) {
    return jsonResponse(checkEstimation_(e.parameter.jobNumber));
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

  if (action === 'saveIntakeDocs') {
    try {
      return jsonResponse(saveIntakeDocs_(body));
    } catch (err) {
      console.error('saveIntakeDocs_ error:', err);
      return jsonResponse({ error: err.message }, 500);
    }
  }

  if (action === 'savePaymentRecord') {
    try {
      const job = findJobByNumber(sheet, body.jobNumber);
      if (!job) return jsonResponse({ error: 'Job not found' }, 404);
      if (!job.driveUrl) return jsonResponse({ error: 'No Drive folder on this job' }, 400);

      const folderId = job.driveUrl.match(/folders\/([a-zA-Z0-9_-]+)/);
      if (!folderId) return jsonResponse({ error: 'Cannot parse folder ID from driveUrl' }, 400);

      const folder = DriveApp.getFolderById(folderId[1]);
      const ts = new Date().toLocaleString('en-AU', { timeZone: 'Australia/Melbourne' });
      const content = [
        'HEA Payment Request Record',
        '==========================',
        'Job:        ' + body.jobNumber,
        'Client:     ' + (job.clientName || ''),
        'Milestone:  ' + body.milestone,
        'Amount:     ' + body.amount,
        'Sent to:    ' + (body.clientEmail || ''),
        'Date sent:  ' + ts,
        '',
        'Payment link (expires after payment):',
        body.checkoutUrl,
      ].join('\n');

      const fileName = 'Payment Request — ' + body.milestone + ' — ' + ts.replace(/[/:,]/g, '-') + '.txt';
      const file = folder.createFile(fileName, content, MimeType.PLAIN_TEXT);
      return jsonResponse({ success: true, fileUrl: file.getUrl() });
    } catch (err) {
      console.error('savePaymentRecord error:', err);
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
      'Occupants', 'Home Daytime', 'Hot Water', 'Gas Appliances', 'EV',
    ]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, 19).setFontWeight('bold');
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

  // Find or create unified client folder inside CLIENTS_FOLDER_ID.
  // If the client already submitted the intake form, their folder exists — reuse it.
  // If not, create one in the same format: "ClientName - DD-MM-YYYY"
  let driveUrl = '';
  let driveError = null;
  try {
    const safeDate = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd-MM-yyyy');
    const clientFolder = findOrCreateClientFolder_(data.clientName || 'Unknown', safeDate);
    ['00_NMI_Data', '01_Quotes', '02_Proposals', '03_Signed', '04_Installed'].forEach(function(sub) {
      getOrCreateDriveFolder_(clientFolder, sub);
    });
    driveUrl = clientFolder.getUrl();
  } catch (e) {
    Logger.log('Drive folder error: ' + e);
    driveError = String(e);
  }

  sheet.appendRow([
    jobNumber,
    data.clientName      || '',
    data.phone           || '',
    data.email           || '',
    data.address         || '',
    data.status          || 'Lead',
    driveUrl,
    data.notes           || '',
    createdDate,
    data.systemSize      || '',
    data.batterySize     || '',
    data.totalPrice      || '',
    data.annualBill      || '',
    data.financeRequired || false,
    data.occupants       || '',
    data.homeDaytime     || '',
    data.hotWater        || '',
    data.gasAppliances   || '',
    data.ev              || '',
  ]);

  return {
    jobNumber,
    clientName:      data.clientName      || '',
    phone:           data.phone           || '',
    email:           data.email           || '',
    address:         data.address         || '',
    status:          data.status          || 'Lead',
    driveUrl,
    driveError,
    notes:           data.notes           || '',
    createdDate,
    systemSize:      data.systemSize      || '',
    batterySize:     data.batterySize     || '',
    totalPrice:      data.totalPrice      || '',
    annualBill:      data.annualBill      || '',
    financeRequired: data.financeRequired || false,
    occupants:       data.occupants       || '',
    homeDaytime:     data.homeDaytime     || '',
    hotWater:        data.hotWater        || '',
    gasAppliances:   data.gasAppliances   || '',
    ev:              data.ev              || '',
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
  if (data.occupants       !== undefined) sheet.getRange(row, COL.OCCUPANTS).setValue(data.occupants);
  if (data.homeDaytime     !== undefined) sheet.getRange(row, COL.HOME_DAYTIME).setValue(data.homeDaytime);
  if (data.hotWater        !== undefined) sheet.getRange(row, COL.HOT_WATER).setValue(data.hotWater);
  if (data.gasAppliances   !== undefined) sheet.getRange(row, COL.GAS_APPLIANCES).setValue(data.gasAppliances);
  if (data.ev              !== undefined) sheet.getRange(row, COL.EV).setValue(data.ev);

  return rowToJob(sheet.getRange(row, 1, 1, 19).getValues()[0]);
}

function findJobByNumber(sheet, jobNumber) {
  const row = findRowByJobNumber(sheet, jobNumber);
  if (!row) return null;
  return rowToJob(sheet.getRange(row, 1, 1, 19).getValues()[0]);
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
  const values = sheet.getRange(2, 1, lastRow - 1, 19).getValues();
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
    occupants:       String(row[14] || ''),
    homeDaytime:     String(row[15] || ''),
    hotWater:        String(row[16] || ''),
    gasAppliances:   String(row[17] || ''),
    ev:              String(row[18] || ''),
  };
}

function jsonResponse(data) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

// ---------------------------------------------------------------------------
// Drive folder helpers
// ---------------------------------------------------------------------------

// Saves intake docs (consent PDF, job card PDF, electricity bill, photos) to the
// client's existing Drive folder, each in its own dedicated subfolder:
//   00_NMI_Data/  ← NMI consent PDF + electricity bill
//   Intake/       ← Job card PDF
//   Photos/       ← All photo uploads
function saveIntakeDocs_(data) {
  if (!data.jobNumber) throw new Error('jobNumber required');

  const job = findJobByNumber(getSheet(), data.jobNumber);
  if (!job || !job.driveUrl) throw new Error('Job not found or has no Drive folder: ' + data.jobNumber);

  const match = job.driveUrl.match(/folders\/([a-zA-Z0-9_-]+)/);
  if (!match) throw new Error('Cannot parse folder ID from driveUrl: ' + job.driveUrl);

  const folder = DriveApp.getFolderById(match[1]);
  const clientName = (job.clientName || data.jobNumber).trim();
  const saved = [];

  // Dedicated subfolders for each document type
  const nmiFolder    = getOrCreateDriveFolder_(folder, '00_NMI_Data');
  const intakeFolder = getOrCreateDriveFolder_(folder, 'Intake');
  const photosFolder = getOrCreateDriveFolder_(folder, 'Photos');

  function saveFile_(targetFolder, fileName, base64, mimeType) {
    const existing = targetFolder.getFilesByName(fileName);
    while (existing.hasNext()) existing.next().setTrashed(true);
    const blob = Utilities.newBlob(Utilities.base64Decode(base64), mimeType, fileName);
    const f = targetFolder.createFile(blob);
    f.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    saved.push(fileName);
  }

  // NMI consent PDF + electricity bill → 00_NMI_Data
  if (data.consentPdfBase64) {
    saveFile_(nmiFolder, clientName + ' - NMI Consent.pdf', data.consentPdfBase64, 'application/pdf');
  }
  if (data.billBase64 && data.billName) {
    const ext = (data.billName.split('.').pop() || 'pdf').toLowerCase();
    saveFile_(nmiFolder, clientName + ' - Electricity Bill.' + ext, data.billBase64, data.billMime || 'application/octet-stream');
  }

  // Job card PDF → Intake subfolder
  if (data.jobCardPdfBase64) {
    saveFile_(intakeFolder, clientName + ' - Job Card.pdf', data.jobCardPdfBase64, 'application/pdf');
  }

  // All photos → Photos subfolder
  if (data.roofPhotoBase64 && data.roofPhotoName) {
    const ext = (data.roofPhotoName.split('.').pop() || 'jpg').toLowerCase();
    saveFile_(photosFolder, clientName + ' - Roof Photo.' + ext, data.roofPhotoBase64, data.roofPhotoMime || 'image/jpeg');
  }
  if (data.roofGroundPhotoBase64 && data.roofGroundPhotoName) {
    const ext = (data.roofGroundPhotoName.split('.').pop() || 'jpg').toLowerCase();
    saveFile_(photosFolder, clientName + ' - Roof Ground Photo.' + ext, data.roofGroundPhotoBase64, data.roofGroundPhotoMime || 'image/jpeg');
  }
  if (data.switchboardPhotoBase64 && data.switchboardPhotoName) {
    const ext = (data.switchboardPhotoName.split('.').pop() || 'jpg').toLowerCase();
    saveFile_(photosFolder, clientName + ' - Switchboard.' + ext, data.switchboardPhotoBase64, data.switchboardPhotoMime || 'image/jpeg');
  }
  if (data.batteryPhoto1Base64 && data.batteryPhoto1Name) {
    const ext = (data.batteryPhoto1Name.split('.').pop() || 'jpg').toLowerCase();
    saveFile_(photosFolder, clientName + ' - Battery Location Angle 1.' + ext, data.batteryPhoto1Base64, data.batteryPhoto1Mime || 'image/jpeg');
  }
  if (data.batteryPhoto2Base64 && data.batteryPhoto2Name) {
    const ext = (data.batteryPhoto2Name.split('.').pop() || 'jpg').toLowerCase();
    saveFile_(photosFolder, clientName + ' - Battery Location Angle 2.' + ext, data.batteryPhoto2Base64, data.batteryPhoto2Mime || 'image/jpeg');
  }
  if (data.batteryPhoto3Base64 && data.batteryPhoto3Name) {
    const ext = (data.batteryPhoto3Name.split('.').pop() || 'jpg').toLowerCase();
    saveFile_(photosFolder, clientName + ' - Battery Location Angle 3.' + ext, data.batteryPhoto3Base64, data.batteryPhoto3Mime || 'image/jpeg');
  }
  if (data.evPhoto1Base64 && data.evPhoto1Name) {
    const ext = (data.evPhoto1Name.split('.').pop() || 'jpg').toLowerCase();
    saveFile_(photosFolder, clientName + ' - EV Charger Location.' + ext, data.evPhoto1Base64, data.evPhoto1Mime || 'image/jpeg');
  }
  if (data.evPhoto2Base64 && data.evPhoto2Name) {
    const ext = (data.evPhoto2Name.split('.').pop() || 'jpg').toLowerCase();
    saveFile_(photosFolder, clientName + ' - EV Charger Angle 2.' + ext, data.evPhoto2Base64, data.evPhoto2Mime || 'image/jpeg');
  }

  return { success: true, saved };
}

function safeString_(input) {
  return String(input || '').trim()
    .replace(/[/\\'"<>|*?:@]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-{2,}/g, '-')
    .substring(0, 50);
}

function getOrCreateDriveFolder_(parent, name) {
  const iter = parent.getFoldersByName(name);
  return iter.hasNext() ? iter.next() : parent.createFolder(name);
}

// Finds an existing client folder (created by the intake form) or creates a new one.
// Looks inside CLIENTS_FOLDER_ID for any folder whose name starts with the client's name.
// This ensures intake docs, bill, NMI data, and all job files share one folder per client.
function findOrCreateClientFolder_(clientName, dateStr) {
  const parent = DriveApp.getFolderById(CLIENTS_FOLDER_ID);
  const searchName = clientName.trim().toLowerCase();

  // Search for an existing folder for this client
  const iter = parent.getFolders();
  while (iter.hasNext()) {
    const folder = iter.next();
    if (folder.getName().toLowerCase().startsWith(searchName)) {
      return folder;
    }
  }

  // No existing folder — create one in standard format: "ClientName - DD-MM-YYYY"
  const safeName = clientName.trim().replace(/[/\\'"<>|*?:@]/g, '').substring(0, 80);
  return parent.createFolder(safeName + ' - ' + dateStr);
}

// ---------------------------------------------------------------------------
// NMI / Estimation file presence checks — used by /dashboard/pipeline
// ---------------------------------------------------------------------------

function checkNMI_(jobNumber) {
  const job = findJobByNumber(getSheet(), jobNumber);
  if (!job || !job.driveUrl) return { hasNMI: false, fileName: null, fileUrl: null, nmiSubfolderUrl: null };

  const folderId = job.driveUrl.match(/folders\/([a-zA-Z0-9_-]+)/);
  if (!folderId) return { hasNMI: false, fileName: null, fileUrl: null, nmiSubfolderUrl: null };

  try {
    const clientFolder = DriveApp.getFolderById(folderId[1]);
    const nmiFolder = getOrCreateDriveFolder_(clientFolder, '00_NMI_Data');
    const files = nmiFolder.getFiles();
    if (files.hasNext()) {
      const file = files.next();
      return { hasNMI: true, fileName: file.getName(), fileUrl: file.getUrl(), nmiSubfolderUrl: nmiFolder.getUrl() };
    }
    return { hasNMI: false, fileName: null, fileUrl: null, nmiSubfolderUrl: nmiFolder.getUrl() };
  } catch (e) {
    return { hasNMI: false, fileName: null, fileUrl: null, nmiSubfolderUrl: null, error: String(e) };
  }
}

function checkEstimation_(jobNumber) {
  const job = findJobByNumber(getSheet(), jobNumber);
  if (!job || !job.driveUrl) return { hasEstimation: false, fileName: null, fileUrl: null };

  const folderId = job.driveUrl.match(/folders\/([a-zA-Z0-9_-]+)/);
  if (!folderId) return { hasEstimation: false, fileName: null, fileUrl: null };

  try {
    const clientFolder = DriveApp.getFolderById(folderId[1]);
    const quotesFolder = getOrCreateDriveFolder_(clientFolder, '01_Quotes');
    const files = quotesFolder.getFiles();
    if (files.hasNext()) {
      const file = files.next();
      return { hasEstimation: true, fileName: file.getName(), fileUrl: file.getUrl() };
    }
    return { hasEstimation: false, fileName: null, fileUrl: null };
  } catch (e) {
    return { hasEstimation: false, fileName: null, fileUrl: null, error: String(e) };
  }
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
