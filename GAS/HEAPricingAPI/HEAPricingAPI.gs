/**
 * HEA Pricing API — Google Apps Script
 * ======================================
 * Deploy as Web App: Execute as Me, Anyone (anonymous) access.
 *
 * SETUP (one-time):
 *   1. Create "HEA Master Pricing" Google Sheet with 7 tabs:
 *      Solar Base, Battery Base, Bundles 1P, Bundles 3P, Extras,
 *      Components (Solar Juice), Settings
 *   2. Populate from the plan data.
 *   3. In GAS Script Properties, set: PRICING_SHEET_ID = <sheet ID from URL>
 *   4. Push to main — auto-deploys via deploy-gas.yml.
 *
 * Actions (GET params):
 *   ?action=getBundles&phase=1P   → solar+battery bundle matrix for 1P
 *   ?action=getBundles&phase=3P   → same for 3P
 *   ?action=getSolarBase          → solar-only base prices
 *   ?action=getBatteryBase        → battery-only base prices
 *   ?action=getExtras             → full extras list (all sections)
 *   ?action=getSettings           → commissions, rebate amount
 *   ?action=getSheetUrl           → { url } for "Edit in Sheets" button
 *
 * All actions return HTTP 200. Check data.error on failure.
 */

function doGet(e) {
  var action = e && e.parameter && e.parameter.action;

  if (action === 'getBundles') {
    return jsonOut(getBundles_(e.parameter.phase || '1P'));
  }
  if (action === 'getSolarBase') {
    return jsonOut(getSolarBase_());
  }
  if (action === 'getBatteryBase') {
    return jsonOut(getBatteryBase_());
  }
  if (action === 'getExtras') {
    return jsonOut(getExtras_());
  }
  if (action === 'getSettings') {
    return jsonOut(getSettings_());
  }
  if (action === 'getSheetUrl') {
    var id = PropertiesService.getScriptProperties().getProperty('PRICING_SHEET_ID') || '';
    if (!id) return jsonOut({ error: 'PRICING_SHEET_ID not configured in Script Properties' });
    return jsonOut({ url: 'https://docs.google.com/spreadsheets/d/' + id + '/edit' });
  }

  return jsonOut({ error: 'Unknown action. Use getBundles, getSolarBase, getBatteryBase, getExtras, getSettings, or getSheetUrl.' });
}

// ── Sheet access ─────────────────────────────────────────────────────────────

function getSheet_(tabName) {
  var id = PropertiesService.getScriptProperties().getProperty('PRICING_SHEET_ID');
  if (!id) throw new Error('PRICING_SHEET_ID not set in Script Properties. Set it to the Google Sheet ID.');
  var ss = SpreadsheetApp.openById(id);
  var sheet = ss.getSheetByName(tabName);
  if (!sheet) throw new Error('Tab "' + tabName + '" not found in pricing sheet.');
  return sheet;
}

// ── Bundles (1P or 3P) ───────────────────────────────────────────────────────
// Tab columns: A: Solar kW | B: Battery Brand | C: Battery Model | D: Battery kWh
//              E: Inverter | F: HEA Price | G: Notes
// Battery-only rows have solarKw = 0 in the sheet.

function getBundles_(phase) {
  var tabName = phase === '3P' ? 'Bundles 3P' : 'Bundles 1P';
  var sheet;
  try { sheet = getSheet_(tabName); } catch(e) { return { error: e.message }; }

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  var data = sheet.getRange(2, 1, lastRow - 1, 7).getValues();
  var results = [];

  data.forEach(function(row) {
    var solarKwRaw = row[0];
    var batteryBrand = String(row[1] || '').trim();
    var batteryModel = String(row[2] || '').trim();
    var batteryKwhRaw = row[3];
    var inverter = String(row[4] || '').trim();
    var heaPriceRaw = row[5];
    var notes = String(row[6] || '').trim();

    // Skip header-like or totally blank rows
    if (!batteryBrand || !heaPriceRaw) return;

    var solarKw = parseFloat(String(solarKwRaw)) || 0;
    var batteryKwh = parseFloat(String(batteryKwhRaw)) || 0;
    var heaPrice = parseFloat(String(heaPriceRaw).replace(/[$,]/g, '')) || 0;
    if (!heaPrice) return;

    results.push({
      phase: phase,
      solarKw: solarKw,
      batteryBrand: batteryBrand,
      batteryModel: batteryModel,
      batteryKwh: batteryKwh,
      inverter: inverter,
      heaPrice: heaPrice,
      notes: notes,
    });
  });

  return results;
}

// ── Solar Base ───────────────────────────────────────────────────────────────
// Tab columns: A: System Size | B: Panel Brand/Model | C: Inverter
//              D: HEA Sell Price | E: SJ Wholesale Cost | F: Notes

function getSolarBase_() {
  var sheet;
  try { sheet = getSheet_('Solar Base'); } catch(e) { return { error: e.message }; }

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  var data = sheet.getRange(2, 1, lastRow - 1, 6).getValues();
  var results = [];

  data.forEach(function(row) {
    var systemSize = String(row[0] || '').trim();
    var panelModel = String(row[1] || '').trim();
    var inverter = String(row[2] || '').trim();
    var heaPriceRaw = row[3];
    var sjCost = String(row[4] || '').trim();
    var notes = String(row[5] || '').trim();

    if (!systemSize || !heaPriceRaw) return;

    var heaPrice = parseFloat(String(heaPriceRaw).replace(/[$,]/g, '')) || 0;
    var heaPriceStr = String(heaPriceRaw);

    results.push({
      systemSize: systemSize,
      panelModel: panelModel,
      inverter: inverter,
      heaPrice: heaPrice,
      heaPriceDisplay: heaPriceStr,
      sjCost: sjCost,
      notes: notes,
    });
  });

  return results;
}

// ── Battery Base ─────────────────────────────────────────────────────────────
// Tab columns: A: Brand | B: Model | C: Battery kWh | D: Phase
//              E: HEA Price | F: SJ Wholesale | G: Inverter Included | H: Notes

function getBatteryBase_() {
  var sheet;
  try { sheet = getSheet_('Battery Base'); } catch(e) { return { error: e.message }; }

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  var data = sheet.getRange(2, 1, lastRow - 1, 8).getValues();
  var results = [];

  data.forEach(function(row) {
    var brand = String(row[0] || '').trim();
    var model = String(row[1] || '').trim();
    var batteryKwhRaw = row[2];
    var phase = String(row[3] || '').trim();
    var heaPriceRaw = row[4];
    var sjWholesale = String(row[5] || '').trim();
    var inverterIncluded = String(row[6] || '').trim();
    var notes = String(row[7] || '').trim();

    if (!brand || !heaPriceRaw) return;

    var batteryKwh = parseFloat(String(batteryKwhRaw)) || 0;
    var heaPrice = parseFloat(String(heaPriceRaw).replace(/[$,]/g, '')) || 0;
    if (!heaPrice) return;

    results.push({
      brand: brand,
      model: model,
      batteryKwh: batteryKwh,
      phase: phase,
      heaPrice: heaPrice,
      sjWholesale: sjWholesale,
      inverterIncluded: inverterIncluded,
      notes: notes,
    });
  });

  return results;
}

// ── Extras ───────────────────────────────────────────────────────────────────
// Tab columns: A: Section | B: Item | C: Unit | D: HEA Price
//              E: SJ Wholesale | F: Description/When charged
// Column A carries the section name for each row.

function getExtras_() {
  var sheet;
  try { sheet = getSheet_('Extras'); } catch(e) { return { error: e.message }; }

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  var data = sheet.getRange(2, 1, lastRow - 1, 6).getValues();
  var results = [];
  var currentSection = '';

  data.forEach(function(row) {
    var sectionRaw = String(row[0] || '').trim();
    var item = String(row[1] || '').trim();
    var unit = String(row[2] || '').trim();
    var heaPriceRaw = row[3];
    var sjWholesale = String(row[4] || '').trim();
    var description = String(row[5] || '').trim();

    if (sectionRaw) currentSection = sectionRaw;
    if (!item) return;

    var heaPrice = parseFloat(String(heaPriceRaw).replace(/[$,]/g, '')) || 0;
    var heaPriceDisplay = heaPriceRaw ? String(heaPriceRaw) : '';

    results.push({
      section: currentSection,
      item: item,
      unit: unit,
      heaPrice: heaPrice,
      heaPriceDisplay: heaPriceDisplay,
      sjWholesale: sjWholesale,
      description: description,
    });
  });

  return results;
}

// ── Settings ─────────────────────────────────────────────────────────────────
// Tab columns: A: Key | B: Value

function getSettings_() {
  var sheet;
  try { sheet = getSheet_('Settings'); } catch(e) { return { error: e.message }; }

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return {};

  var data = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
  var map = {};

  data.forEach(function(row) {
    var key = String(row[0] || '').trim();
    var val = row[1];
    if (key) map[key] = val;
  });

  return {
    salesCommission: parseFloat(String(map['Sales Commission ($)'] || '').replace(/[$,]/g, '')) || 1000,
    installCommission: parseFloat(String(map['Installation Commission ($)'] || '').replace(/[$,]/g, '')) || 2000,
    solarVictoriaRebate: parseFloat(String(map['Solar Victoria Rebate ($)'] || '').replace(/[$,]/g, '')) || 1400,
    lastUpdated: String(map['Last Updated'] || ''),
    gstNote: String(map['GST Note'] || 'SJ prices are ex-GST; HEA sell prices include GST'),
  };
}

// ── JSON response helper ─────────────────────────────────────────────────────

function jsonOut(data) {
  try {
    var output = ContentService.createTextOutput(JSON.stringify(data));
    output.setMimeType(ContentService.MimeType.JSON);
    return output;
  } catch(e) {
    var err = ContentService.createTextOutput(JSON.stringify({ error: 'Serialisation error: ' + e.message }));
    err.setMimeType(ContentService.MimeType.JSON);
    return err;
  }
}
