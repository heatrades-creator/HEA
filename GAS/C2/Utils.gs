// ============================================================
// Utils.gs — HEA C2 shared utilities
// ============================================================

/**
 * Generate a UUID v4 using GAS built-in.
 */
function uuid_() {
  return Utilities.getUuid();
}

/**
 * Current timestamp as ISO 8601 string.
 */
function now_() {
  return new Date().toISOString();
}

/**
 * Today as YYYY-MM-DD string in script timezone.
 */
function today_() {
  return Utilities.formatDate(
    new Date(),
    Session.getScriptTimeZone(),
    'yyyy-MM-dd'
  );
}

/**
 * Get a sheet by name, throwing if it doesn't exist.
 * @param {string} name
 * @returns {GoogleAppsScript.Spreadsheet.Sheet}
 */
function getSheet_(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) throw new Error('Sheet not found: ' + name);
  return sheet;
}

/**
 * Find a row index (1-based, including header) by matching a column value.
 * Returns null if not found.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @param {number} col  1-based column index
 * @param {string} value
 * @returns {number|null}
 */
function findRow_(sheet, col, value) {
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][col - 1]) === String(value)) {
      return i + 1; // 1-based sheet row
    }
  }
  return null;
}

/**
 * Convert a header array + row array into a plain object.
 * @param {string[]} headers
 * @param {any[]} row
 * @returns {Object}
 */
function rowToObj_(headers, row) {
  var obj = {};
  headers.forEach(function(h, i) {
    obj[h] = row[i] !== undefined ? row[i] : '';
  });
  return obj;
}

/**
 * Return a JSON ContentService response.
 * @param {any} data
 */
function jsonResponse_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Return a JSON error response.
 * @param {string} message
 * @param {number} [code]
 */
function jsonError_(message, code) {
  return ContentService
    .createTextOutput(JSON.stringify({ error: message, code: code || 400 }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Add N days to a date and return as YYYY-MM-DD.
 * @param {Date|string} base
 * @param {number} days
 * @returns {string}
 */
function addDays_(base, days) {
  var d = new Date(base);
  d.setDate(d.getDate() + days);
  return Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

/**
 * Days from today until a date (negative = past).
 * @param {string} dateStr  YYYY-MM-DD
 * @returns {number}
 */
function daysUntil_(dateStr) {
  if (!dateStr) return 9999;
  var target = new Date(dateStr);
  var todayMs = new Date(today_()).getTime();
  return Math.round((target.getTime() - todayMs) / 86400000);
}
