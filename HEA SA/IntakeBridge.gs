// HEA Solar Analyser — https://hea-group.com.au
// REC 37307 — Jesse Heffernan, Bendigo VIC

// IntakeBridge.gs — reads HEA INTAKE submissions so Jesse can pre-populate
// client fields in HEA SA from a "Load from Intake" dropdown.

// Column indices (0-based) — matches HEA INTAKE logToSheet column order exactly
const IB = {
  TIMESTAMP: 0, NAME: 1, EMAIL: 2, PHONE: 3, ADDRESS: 4,
  OCCUPANTS: 5, HOME_DAYTIME: 6, GAS_HOT_WATER: 7,
  GAS_APPLIANCES: 8, EV: 9, GOALS: 10,
  SYSTEM_SIZE: 11, BATTERY_SIZE: 12, CHECKED_RATES: 13,
  BILL_FILE: 14, CONSENT_PDF: 15, JOB_CARD: 16, STATUS: 17,
};

// Returns list of intake clients awaiting consultation.
// Filters rows where Status contains "Book Call" or "Awaiting Review".
// Requires adminPin — same PIN gate as getDriveFiles.
function getIntakeClients(adminPin) {
  if (!adminPin || adminPin !== getAdminPin()) {
    logAdminEvent('BAD_PIN', 'getIntakeClients called with wrong PIN', 'blocked');
    return { error: 'auth' };
  }
  try {
    const sheet = SpreadsheetApp.openById(CFG.SHEET_ID).getSheets()[0];
    const rows = sheet.getDataRange().getValues();
    const clients = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const status = String(row[IB.STATUS] || '');
      if (status.includes('Book Call') || status.includes('Awaiting Review')) {
        clients.push({
          rowIndex:    i + 1,  // 1-based sheet row number
          name:        String(row[IB.NAME]        || ''),
          address:     String(row[IB.ADDRESS]     || ''),
          phone:       String(row[IB.PHONE]       || ''),
          email:       String(row[IB.EMAIL]       || ''),
          timestamp:   String(row[IB.TIMESTAMP]   || ''),
          status,
          goals:       String(row[IB.GOALS]       || ''),
          systemSize:  String(row[IB.SYSTEM_SIZE]  || ''),
          batterySize: String(row[IB.BATTERY_SIZE] || ''),
          occupants:   String(row[IB.OCCUPANTS]   || ''),
        });
      }
    }
    logAdminEvent('INTAKE_BROWSE', clients.length + ' clients found', 'ok');
    return clients;
  } catch(e) {
    logAdminEvent('INTAKE_BROWSE', 'Error: ' + e.message, 'fail');
    return { error: e.message };
  }
}

// Returns full row data for one client, with postcode extracted from address.
function getIntakeClient(rowIndex, adminPin) {
  if (!adminPin || adminPin !== getAdminPin()) {
    logAdminEvent('BAD_PIN', 'getIntakeClient called with wrong PIN', 'blocked');
    return { error: 'auth' };
  }
  try {
    const sheet = SpreadsheetApp.openById(CFG.SHEET_ID).getSheets()[0];
    const row = sheet.getRange(rowIndex, 1, 1, 18).getValues()[0];
    const address = String(row[IB.ADDRESS] || '');
    const postcodeMatch = address.match(/\b(\d{4})\b/);
    const postcode = postcodeMatch ? postcodeMatch[1] : '';
    logAdminEvent('INTAKE_LOAD', 'Row ' + rowIndex + ' loaded', 'ok');
    return {
      name:          String(row[IB.NAME]          || ''),
      email:         String(row[IB.EMAIL]         || ''),
      phone:         String(row[IB.PHONE]         || ''),
      address,
      postcode,
      occupants:     String(row[IB.OCCUPANTS]     || ''),
      homeDaytime:   String(row[IB.HOME_DAYTIME]  || ''),
      gasHotWater:   String(row[IB.GAS_HOT_WATER] || ''),
      gasAppliances: String(row[IB.GAS_APPLIANCES] || ''),
      ev:            String(row[IB.EV]            || ''),
      goals:         String(row[IB.GOALS]         || ''),
      systemSize:    String(row[IB.SYSTEM_SIZE]   || ''),
      batterySize:   String(row[IB.BATTERY_SIZE]  || ''),
      timestamp:     String(row[IB.TIMESTAMP]     || ''),
      status:        String(row[IB.STATUS]        || ''),
    };
  } catch(e) {
    return { error: e.message };
  }
}

// Updates the Status column so the client no longer appears in the "Book Call" list.
function markIntakeClientLoaded(rowIndex, adminPin) {
  if (!adminPin || adminPin !== getAdminPin()) return { error: 'auth' };
  try {
    const sheet = SpreadsheetApp.openById(CFG.SHEET_ID).getSheets()[0];
    sheet.getRange(rowIndex, IB.STATUS + 1).setValue('In Consultation — SA Loaded');
    logAdminEvent('INTAKE_STATUS', 'Row ' + rowIndex + ' marked In Consultation', 'ok');
    return { success: true };
  } catch(e) {
    return { error: e.message };
  }
}
