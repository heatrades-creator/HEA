/**
 * HEA Jobs API — Google Apps Script
 * ===================================
 * Deploy this as a Web App:
 *   Execute as: Me (hea.trades@gmail.com)
 *   Who has access: Anyone
 *
 * This script is the backend for the HEA staff job management dashboard.
 * It reads and writes to a Google Sheet called "HEA Jobs".
 *
 * Sheet columns (Row 1 = headers):
 *   A: Job Number  B: Client Name  C: Phone  D: Email
 *   E: Address     F: Status       G: Drive URL  H: Notes  I: Created Date
 */

const SHEET_NAME = 'HEA Jobs';
const COL = {
  JOB_NUMBER:   1,
  CLIENT_NAME:  2,
  PHONE:        3,
  EMAIL:        4,
  ADDRESS:      5,
  STATUS:       6,
  DRIVE_URL:    7,
  NOTES:        8,
  CREATED_DATE: 9,
};

// ---------------------------------------------------------------------------
// GET — return all jobs, or a single job if ?id=TS001
// ---------------------------------------------------------------------------
function doGet(e) {
  const sheet = getSheet();
  const id = e && e.parameter && e.parameter.id;

  if (id) {
    const job = findJobByNumber(sheet, id);
    if (!job) return jsonResponse({ error: 'Not found' }, 404);
    return jsonResponse(job);
  }

  const jobs = getAllJobs(sheet);
  return jsonResponse(jobs);
}

// ---------------------------------------------------------------------------
// POST — action: 'createJob' | 'updateJob'
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
    return jsonResponse(job);
  }

  if (action === 'updateJob') {
    const job = updateJob(sheet, body);
    if (!job) return jsonResponse({ error: 'Job not found' }, 404);
    return jsonResponse(job);
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
    // Create the sheet with headers if it doesn't exist
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow([
      'Job Number', 'Client Name', 'Phone', 'Email',
      'Address', 'Status', 'Drive URL', 'Notes', 'Created Date',
    ]);
    sheet.setFrozenRows(1);
    // Bold headers
    sheet.getRange(1, 1, 1, 9).setFontWeight('bold');
  }

  return sheet;
}

function getNextJobNumber(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return 'TS001'; // only header row

  // Find the highest TS number in column A
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
    data.clientName || '',
    data.phone || '',
    data.email || '',
    data.address || '',
    data.status || 'Lead',
    data.driveUrl || '',
    data.notes || '',
    createdDate,
  ]);

  const job = {
    jobNumber,
    clientName: data.clientName || '',
    phone: data.phone || '',
    email: data.email || '',
    address: data.address || '',
    status: data.status || 'Lead',
    driveUrl: data.driveUrl || '',
    notes: data.notes || '',
    createdDate,
  };

  sendTelegramAlert_(
    `🆕 <b>New Job #${jobNumber}</b>\n` +
    `👤 ${job.clientName || 'Unknown'}\n` +
    `📍 ${job.address || 'No address'}\n` +
    `📊 Stage: ${job.status}`
  );

  return job;
}

function updateJob(sheet, data) {
  const row = findRowByJobNumber(sheet, data.jobNumber);
  if (!row) return null;

  const before = rowToJob(sheet.getRange(row, 1, 1, 9).getValues()[0]);

  if (data.status !== undefined)   sheet.getRange(row, COL.STATUS).setValue(data.status);
  if (data.driveUrl !== undefined) sheet.getRange(row, COL.DRIVE_URL).setValue(data.driveUrl);
  if (data.notes !== undefined)    sheet.getRange(row, COL.NOTES).setValue(data.notes);

  const after = rowToJob(sheet.getRange(row, 1, 1, 9).getValues()[0]);

  if (data.status !== undefined && data.status !== before.status) {
    sendTelegramAlert_(
      `📋 <b>Job #${after.jobNumber} updated</b>\n` +
      `👤 ${after.clientName}\n` +
      `🔄 ${before.status} → <b>${after.status}</b>`
    );
  }

  return after;
}

function findJobByNumber(sheet, jobNumber) {
  const row = findRowByJobNumber(sheet, jobNumber);
  if (!row) return null;
  return rowToJob(sheet.getRange(row, 1, 1, 9).getValues()[0]);
}

function findRowByJobNumber(sheet, jobNumber) {
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return null;
  const values = sheet.getRange(2, COL.JOB_NUMBER, lastRow - 1, 1).getValues();
  for (let i = 0; i < values.length; i++) {
    if (String(values[i][0]) === String(jobNumber)) return i + 2; // +2 for header + 0-index
  }
  return null;
}

function getAllJobs(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];
  const values = sheet.getRange(2, 1, lastRow - 1, 9).getValues();
  return values
    .filter(row => row[0]) // skip empty rows
    .map(rowToJob)
    .reverse(); // newest first
}

function rowToJob(row) {
  return {
    jobNumber:   String(row[0]),
    clientName:  String(row[1]),
    phone:       String(row[2]),
    email:       String(row[3]),
    address:     String(row[4]),
    status:      String(row[5]),
    driveUrl:    String(row[6]),
    notes:       String(row[7]),
    createdDate: String(row[8]),
  };
}

function jsonResponse(data, status) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

// ---------------------------------------------------------------------------
// Telegram notifications
// ---------------------------------------------------------------------------

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
    Logger.log('Telegram alert error: ' + e);
  }
}
