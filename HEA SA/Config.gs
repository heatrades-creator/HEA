// HEA Solar Analyser — https://hea-group.com.au
// REC 37307 — Jesse Heffernan, Bendigo VIC

// Config.gs — constants, secrets, shared helpers

// ═══════════════════════════════════════════════════════════════════
// HEA Interval Data Analyser — Code.gs  v7
// Enhanced PDF: environmental impact, monthly breakdown, financial projection
// Chart: distinct colours, corrected smoothness
// ═══════════════════════════════════════════════════════════════════

const CFG = {
  SHEET_ID:  '1ZTeR7vUu5gI69yeB-DYAch4wbXuztX-xQzgPmFkQPDI',
  FOLDER_ID: '12LCs9uDYh4Wynor0LdDelNbcQDe7c-C-',
  EMAIL:     'hea.trades@gmail.com',
  LOGO_URL:  'https://hea-group.com.au/_next/static/media/Logo_transparent.02d8e37d.png',
  PANEL_W:   440
};
const APP_VERSION = 'v27';

// Secrets from PropertiesService — NEVER hardcode in source.
// To set: Apps Script editor → Project Settings → Script Properties → add:
//   HEA_ADMIN_PIN   = your-chosen-pin
//   HEA_SESSION_KEY = your-chosen-secret
// Throws if not set — configure in Script Properties before using admin features or session resume.
function getAdminPin() {
  const pin = PropertiesService.getScriptProperties().getProperty('HEA_ADMIN_PIN');
  if (!pin) throw new Error('HEA_ADMIN_PIN not set in Script Properties. Set it before using admin features. See setup guide.');
  return pin;
}
function getSessionSecret() {
  const key = PropertiesService.getScriptProperties().getProperty('HEA_SESSION_KEY');
  if (!key) throw new Error('HEA_SESSION_KEY not set in Script Properties. Set it before accepting resume sessions. See setup guide.');
  return key;
}

// ── HTML escape helper — prevents injection of client name/data into HTML strings
function escHtml(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}

// ── Admin event log — write to AdminLog sheet (auto-created if missing)
// eventType: 'DRIVE_BROWSE' | 'BAD_PIN' | 'HMAC_FAIL' | 'SESSION_LOAD' | 'SESSION_EXPIRED'
function logAdminEvent(eventType, detail, outcome) {
  try {
    const ss    = SpreadsheetApp.openById(CFG.SHEET_ID);
    let   sheet = ss.getSheetByName('AdminLog');
    if (!sheet) {
      sheet = ss.insertSheet('AdminLog');
      sheet.appendRow(['Timestamp', 'Event', 'Detail', 'Outcome', 'AppVersion']);
    }
    sheet.appendRow([new Date().toISOString(), eventType, String(detail||''), String(outcome||''), APP_VERSION]);
  } catch(e) { /* silent — logging must never break the main flow */ }
}

// ── Purge expired resume sessions — run on a time trigger (see guide.txt)
// Set up: Apps Script editor → Triggers → Add trigger → purgeExpiredSessions → Time-driven → Weekly
function purgeExpiredSessions() {
  try {
    const ss    = SpreadsheetApp.openById(CFG.SHEET_ID);
    const sheet = ss.getSheetByName('QuoteSessions');
    if (!sheet) return;
    const now  = new Date();
    const rows = sheet.getDataRange().getValues();
    // Iterate backwards so row deletion doesn't affect indices
    for (let i = rows.length - 1; i >= 1; i--) {
      try {
        const expires = new Date(rows[i][4]);
        if (expires < now) sheet.deleteRow(i + 1);
      } catch(_) {}
    }
    logAdminEvent('SESSION_PURGE', 'Purge ran', 'ok');
  } catch(e) {
    logAdminEvent('SESSION_PURGE', 'Error: ' + e.message, 'fail');
  }
}

// ── Session token signing (HMAC-SHA256) ──
function signToken(id) {
  try {
    const sig = Utilities.computeHmacSha256Signature(id, getSessionSecret());
    return Utilities.base64EncodeWebSafe(sig);
  } catch(e) { return ''; }
}

function verifyToken(id, sig) {
  try {
    if (!id || !sig) { logAdminEvent('HMAC_FAIL', 'missing id or sig', 'blocked'); return false; }
    const expected = Utilities.base64EncodeWebSafe(
      Utilities.computeHmacSha256Signature(id, getSessionSecret())
    );
    if (sig !== expected) { logAdminEvent('HMAC_FAIL', 'id=' + id, 'blocked'); return false; }
    return true;
  } catch(e) { return false; }
}

// ── Template include helper (required for Quote.html inclusion)
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// Per-job Drive folder: ClientName_YYYYMMDD inside FOLDER_ID
function getOrCreateJobFolder(clientName, dateStr) {
  const parent = DriveApp.getFolderById(CFG.FOLDER_ID);
  const safeName = (clientName || 'Unknown').replace(/[^a-zA-Z0-9 _-]/g, '').trim().replace(/\s+/g, '_');
  const folderName = safeName + '_' + (dateStr || Utilities.formatDate(new Date(), 'Australia/Melbourne', 'yyyyMMdd'));
  const existing = parent.getFoldersByName(folderName);
  if (existing.hasNext()) return existing.next();
  return parent.createFolder(folderName);
}

// ── doGet: handles normal load + ?resume=SESSION_ID for pre-populated follow-up