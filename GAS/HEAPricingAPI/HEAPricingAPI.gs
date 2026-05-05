/**
 * HEA Pricing API — Google Apps Script
 * ======================================
 * Deploy as Web App: Execute as Me, Anyone (anonymous) access.
 *
 * SETUP (one-time — runs in ~30 seconds):
 *   1. In the GAS editor, run setupPricingSheet() from the Run dropdown.
 *      → Creates "HEA Master Pricing" sheet in Drive, populates all 7 tabs,
 *        sets PRICING_SHEET_ID Script Property automatically.
 *   2. Copy the logged Sheet URL → add PRICING_SHEET_URL to Vercel.
 *   Done. No manual data entry required.
 *
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

// ═══════════════════════════════════════════════════════════════════════════════
// ONE-TIME SETUP — Run setupPricingSheet() from the Run dropdown in the GAS editor.
// Creates "HEA Master Pricing" sheet, populates all 7 tabs, sets Script Property.
// Safe to re-run: if sheet already exists it skips creation and just re-populates.
// ═══════════════════════════════════════════════════════════════════════════════

// Public entry point — select this in the Run dropdown
function setupPricingSheet() {
  Logger.log('=== HEA Master Pricing Sheet Setup ===');

  var props = PropertiesService.getScriptProperties();
  var existingId = props.getProperty('PRICING_SHEET_ID');
  var ss;

  if (existingId) {
    try {
      ss = SpreadsheetApp.openById(existingId);
      Logger.log('Using existing sheet: ' + ss.getUrl());
    } catch(e) {
      Logger.log('Existing ID invalid, creating new sheet...');
      ss = null;
    }
  }

  if (!ss) {
    ss = SpreadsheetApp.create('HEA Master Pricing');
    Logger.log('Created new sheet: ' + ss.getUrl());
  }

  props.setProperty('PRICING_SHEET_ID', ss.getId());
  Logger.log('PRICING_SHEET_ID set: ' + ss.getId());

  _setupSolarBase_(ss);
  _setupBatteryBase_(ss);
  _setupBundles1P_(ss);
  _setupBundles3P_(ss);
  _setupExtras_(ss);
  _setupComponentsSJ_(ss);
  _setupSettings_(ss, ss.getUrl());

  // Remove default blank "Sheet1" if it still exists
  var defaultSheet = ss.getSheetByName('Sheet1');
  if (defaultSheet && ss.getSheets().length > 1) ss.deleteSheet(defaultSheet);

  var url = ss.getUrl();
  Logger.log('');
  Logger.log('=== SETUP COMPLETE ===');
  Logger.log('Sheet URL: ' + url);
  Logger.log('');
  Logger.log('Next step: add PRICING_SHEET_URL to Vercel environment variables:');
  Logger.log(url);
}

// ── Helper: get or create a named tab ────────────────────────────────────────

function _getOrCreateTab_(ss, name) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  } else {
    sheet.clearContents();
  }
  return sheet;
}

function _writeRows_(sheet, rows) {
  if (!rows.length) return;
  sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
  // Bold header row
  sheet.getRange(1, 1, 1, rows[0].length).setFontWeight('bold');
  sheet.setFrozenRows(1);
}

// ── Tab 1: Solar Base ─────────────────────────────────────────────────────────

function _setupSolarBase_(ss) {
  var sheet = _getOrCreateTab_(ss, 'Solar Base');
  var rows = [
    ['System Size', 'Panel Brand/Model', 'Inverter', 'HEA Sell Price', 'SJ Wholesale Cost', 'Notes'],
    ['6.6 kW', 'Risen 475W', 'GoodWe', 4000, '$105.60–$128.25/panel', 'Fixed price'],
    ['Above 6.6kW', 'Risen 475W', 'GoodWe', '$0.59/watt', '—', 'Per watt pricing'],
    ['6.6 kW', 'Jinko 440W', 'GoodWe', 4150, '~$113/panel', 'Fixed price'],
    ['Above 6.6kW', 'Jinko 440W', 'GoodWe', '$0.612/watt', '—', 'Per watt pricing'],
  ];
  _writeRows_(sheet, rows);
  Logger.log('Solar Base tab done');
}

// ── Tab 2: Battery Base ───────────────────────────────────────────────────────

function _setupBatteryBase_(ss) {
  var sheet = _getOrCreateTab_(ss, 'Battery Base');
  var rows = [
    ['Brand', 'Model', 'Battery kWh', 'Phase', 'HEA Price', 'SJ Wholesale', 'Inverter Included', 'Notes'],
    // Sofar
    ['Sofar', 'Sofar 15kWh', 15, '1P', 4500, '—', 'Sofar 5kW Hybrid', 'After rebate'],
    ['Sofar', 'Sofar 20kWh', 20, '1P', 4650, '—', 'Sofar 5kW Hybrid', 'After rebate'],
    ['Sofar', 'Sofar 15kWh', 15, '3P', 5900, '—', 'Sofar 5kW Hybrid 3P', 'After rebate'],
    ['Sofar', 'Sofar 20kWh', 20, '3P', 6150, '—', 'Sofar 5kW Hybrid 3P', 'After rebate'],
    // AlphaESS
    ['AlphaESS', 'SMILE-M-BAT-13.9P', 14, '1P', 5600, '—', 'SMILE-M5-S-INV', ''],
    ['AlphaESS', '2× SMILE-M-BAT-13.9P', 28, '1P', 7950, '—', 'SMILE-M5-S-INV', ''],
    // FoxESS
    ['FoxESS', 'CQ6-L3', 18, '1P', 4000, '$1,950 inv + ~$14k batt', 'KH10', 'Battery base only'],
    ['FoxESS', 'CQ6-L4', 24, '1P', 4000, '', 'KH10', ''],
    // Inverter upgrades (1P)
    ['FoxESS', 'KH10 upgrade +10kW 1P', '', '1P', 900, '', 'KH10', 'Inverter upgrade add-on'],
    ['FoxESS', 'H3-5.0 upgrade 3P', '', '3P', 900, '', 'H3-5.0-Smart', 'Inverter upgrade add-on'],
    ['FoxESS', 'H3-10.0 upgrade 3P', '', '3P', 1400, '', 'H3-10.0-Smart', 'Inverter upgrade add-on'],
    ['FoxESS', 'H3-15.0 upgrade 3P', '', '3P', 1800, '', 'H3-15.0-Smart', 'Inverter upgrade add-on'],
    // GoodWe
    ['GoodWe', 'GW8.3-BAT ×4 (33.2kWh)', 33.2, '1P', 6000, '$2,400×4 batt + $1,826 inv', 'GW9.999K-EHA-G20', 'Full home backup'],
    ['GoodWe', 'GW8.3-BAT ×6 (49.8kWh)', 49.8, '1P', 6500, '', 'GW9.999K-EHA-G20', ''],
    // GoodWe inverter upgrades 1P
    ['GoodWe', '6kW 1P upgrade', '', '1P', 200, '', 'GW6K-EHA-G20', 'Inverter upgrade add-on'],
    ['GoodWe', '8kW 1P upgrade', '', '1P', 700, '', 'GW8K-EHA-G20', 'Inverter upgrade add-on'],
    ['GoodWe', '10kW 1P upgrade', '', '1P', 900, '', 'GW9.999K-EHA-G20', 'Inverter upgrade add-on'],
    // SigEnergy
    ['SigEnergy', 'EC 10.0SP 24kWh', 24, '1P', 9700, '', 'EC 10.0SP', 'Gateway 1P +$1,500 required'],
    ['SigEnergy', 'EC 10.0SP 32kWh', 32, '1P', 11300, '', 'EC 10.0SP', ''],
    ['SigEnergy', 'EC 10.0SP 40kWh', 40, '1P', 13100, '', 'EC 10.0SP', ''],
    ['SigEnergy', 'EC 10.0SP 48kWh', 48, '1P', 14200, '', 'EC 10.0SP', ''],
    // SigEnergy inverter upgrades 1P
    ['SigEnergy', '8kW 1P upgrade', '', '1P', 1250, '', 'EC 8.0SP', 'Inverter upgrade add-on'],
    ['SigEnergy', '10kW 1P upgrade', '', '1P', 1450, '', 'EC 10.0SP', 'Inverter upgrade add-on'],
    ['SigEnergy', '12kW 1P upgrade', '', '1P', 1750, '', 'EC 12.0SP', 'Inverter upgrade add-on'],
  ];
  _writeRows_(sheet, rows);
  Logger.log('Battery Base tab done');
}

// ── Tab 3: Bundles 1P ─────────────────────────────────────────────────────────

function _setupBundles1P_(ss) {
  var sheet = _getOrCreateTab_(ss, 'Bundles 1P');
  var rows = [
    ['Solar kW', 'Battery Brand', 'Battery Model', 'Battery kWh', 'Inverter', 'HEA Price', 'Notes'],
    // 6.6 kW
    [6.6, 'Sofar', '15kWh Hybrid', 15, 'Sofar 5kW Hybrid', 14870, ''],
    [6.6, 'Sofar', '20kWh Hybrid', 20, 'Sofar 5kW Hybrid', 15020, ''],
    [6.6, 'AlphaESS', 'SMILE-M-BAT-13.9P', 14, 'SMILE-M5-S-INV', 16320, ''],
    [6.6, 'AlphaESS', '2× SMILE-M-BAT-13.9P', 28, 'SMILE-M5-S-INV', 18670, ''],
    [6.6, 'FoxESS', 'CQ6-L3 18kWh', 18, 'KH10', 16790, ''],
    [6.6, 'FoxESS', 'CQ6-L4 24kWh', 24, 'KH10', 17740, ''],
    [6.6, 'FoxESS', 'CQ6-L5 29.9kWh', 29.9, 'KH10', 19020, ''],
    [6.6, 'GoodWe', 'GW8.3 ×2 (16.6kWh)', 16.6, 'GW9.999K-EHA-G20', 18890, ''],
    [6.6, 'GoodWe', 'GW8.3 ×3 (24.9kWh)', 24.9, 'GW9.999K-EHA-G20', 20250, ''],
    [6.6, 'GoodWe', 'GW8.3 ×4 (33.2kWh)', 33.2, 'GW9.999K-EHA-G20', 22190, 'Full home backup'],
    [6.6, 'SigEnergy', 'BAT 24.0', 24, 'EC 10.0SP', 22530, ''],
    // 8.55 kW
    [8.55, 'Sofar', '15kWh Hybrid', 15, 'Sofar 5kW Hybrid', 15920, ''],
    [8.55, 'Sofar', '20kWh Hybrid', 20, 'Sofar 5kW Hybrid', 16070, ''],
    [8.55, 'AlphaESS', 'SMILE-M-BAT-13.9P', 14, 'SMILE-M5-S-INV', 17370, ''],
    [8.55, 'AlphaESS', '2× SMILE-M-BAT-13.9P', 28, 'SMILE-M5-S-INV', 19720, ''],
    [8.55, 'FoxESS', 'CQ6-L3 18kWh', 18, 'KH10', 17870, ''],
    [8.55, 'FoxESS', 'CQ6-L4 24kWh', 24, 'KH10', 18820, ''],
    [8.55, 'FoxESS', 'CQ6-L5 29.9kWh', 29.9, 'KH10', 20100, ''],
    [8.55, 'GoodWe', 'GW8.3 ×2 (16.6kWh)', 16.6, 'GW9.999K-EHA-G20', 19890, ''],
    [8.55, 'GoodWe', 'GW8.3 ×3 (24.9kWh)', 24.9, 'GW9.999K-EHA-G20', 21250, ''],
    [8.55, 'GoodWe', 'GW8.3 ×4 (33.2kWh)', 33.2, 'GW9.999K-EHA-G20', 23190, ''],
    // 10.45 kW
    [10.45, 'FoxESS', 'CQ6-L3 18kWh', 18, 'KH10', 19000, ''],
    [10.45, 'FoxESS', 'CQ6-L4 24kWh', 24, 'KH10', 19960, ''],
    [10.45, 'FoxESS', 'CQ6-L5 29.9kWh', 29.9, 'KH10', 21240, ''],
    [10.45, 'GoodWe', 'GW8.3 ×2 (16.6kWh)', 16.6, 'GW9.999K-EHA-G20', 21090, ''],
    [10.45, 'GoodWe', 'GW8.3 ×3 (24.9kWh)', 24.9, 'GW9.999K-EHA-G20', 22450, ''],
    [10.45, 'GoodWe', 'GW8.3 ×4 (33.2kWh)', 33.2, 'GW9.999K-EHA-G20', 24390, ''],
    // 13.3 kW
    [13.3, 'FoxESS', 'CQ6-L3 18kWh', 18, 'KH10', 20700, ''],
    [13.3, 'FoxESS', 'CQ6-L4 24kWh', 24, 'KH10', 21700, ''],
    [13.3, 'FoxESS', 'CQ6-L5 29.9kWh', 29.9, 'KH10', 22940, ''],
    [13.3, 'GoodWe', 'GW8.3 ×2 (16.6kWh)', 16.6, 'GW9.999K-EHA-G20', 22700, ''],
    [13.3, 'GoodWe', 'GW8.3 ×3 (24.9kWh)', 24.9, 'GW9.999K-EHA-G20', 24000, ''],
    [13.3, 'GoodWe', 'GW8.3 ×4 (33.2kWh)', 33.2, 'GW9.999K-EHA-G20', 26000, ''],
    // Battery Only (solarKw = 0)
    [0, 'Sofar', '15kWh Hybrid', 15, 'Sofar 5kW Hybrid', 10370, 'Battery only'],
    [0, 'Sofar', '20kWh Hybrid', 20, 'Sofar 5kW Hybrid', 10520, 'Battery only'],
    [0, 'AlphaESS', 'SMILE-M-BAT-13.9P', 14, 'SMILE-M5-S-INV', 11470, 'Battery only'],
    [0, 'AlphaESS', '2× SMILE-M-BAT-13.9P', 28, 'SMILE-M5-S-INV', 13820, 'Battery only'],
    [0, 'FoxESS', 'CQ6-L3 18kWh', 18, 'KH10', 12290, 'Battery only'],
    [0, 'FoxESS', 'CQ6-L4 24kWh', 24, 'KH10', 13240, 'Battery only'],
    [0, 'FoxESS', 'CQ6-L5 29.9kWh', 29.9, 'KH10', 14520, 'Battery only'],
    [0, 'GoodWe', 'GW8.3 ×2 (16.6kWh)', 16.6, 'GW9.999K-EHA-G20', 14350, 'Battery only'],
    [0, 'GoodWe', 'GW8.3 ×3 (24.9kWh)', 24.9, 'GW9.999K-EHA-G20', 15800, 'Battery only'],
    [0, 'GoodWe', 'GW8.3 ×4 (33.2kWh)', 33.2, 'GW9.999K-EHA-G20', 17700, 'Battery only'],
    [0, 'SigEnergy', 'BAT 24.0', 24, 'EC 10.0SP', 20590, 'Battery only — Gateway 1P +$1,500 req.'],
    [0, 'SigEnergy', 'BAT 32.0', 32, 'EC 10.0SP', 23900, 'Battery only'],
    [0, 'SigEnergy', 'BAT 40.0', 40, 'EC 10.0SP', 28100, 'Battery only'],
    [0, 'SigEnergy', 'BAT 48.0', 48, 'EC 10.0SP', 31390, 'Battery only'],
  ];
  _writeRows_(sheet, rows);
  Logger.log('Bundles 1P tab done');
}

// ── Tab 4: Bundles 3P ─────────────────────────────────────────────────────────

function _setupBundles3P_(ss) {
  var sheet = _getOrCreateTab_(ss, 'Bundles 3P');
  var rows = [
    ['Solar kW', 'Battery Brand', 'Battery Model', 'Battery kWh', 'Inverter', 'HEA Price', 'Notes'],
    // 6.6 kW
    [6.6, 'FoxESS', 'CQ6-L3 18kWh', 18, 'H3-10.0-Smart', 17600, ''],
    [6.6, 'FoxESS', 'CQ6-L4 24kWh', 24, 'H3-10.0-Smart', 18570, ''],
    [6.6, 'FoxESS', 'CQ6-L5 29.9kWh', 29.9, 'H3-10.0-Smart', 19850, ''],
    [6.6, 'GoodWe', 'GW8.3 ×2 (16.6kWh)', 16.6, 'GW9.999K-ETA-G20', 19840, ''],
    [6.6, 'GoodWe', 'GW8.3 ×3 (24.9kWh)', 24.9, 'GW9.999K-ETA-G20', 21200, ''],
    [6.6, 'GoodWe', 'GW8.3 ×4 (33.2kWh)', 33.2, 'GW9.999K-ETA-G20', 23200, ''],
    [6.6, 'SigEnergy', 'BAT 24.0', 24, 'EC 10.0TP', 23350, ''],
    [6.6, 'SigEnergy', 'BAT 32.0', 32, 'EC 10.0TP', 24950, ''],
    [6.6, 'SigEnergy', 'BAT 40.0', 40, 'EC 10.0TP', 26750, ''],
    [6.6, 'SigEnergy', 'BAT 48.0', 48, 'EC 10.0TP', 27850, ''],
    // 8.55 kW
    [8.55, 'FoxESS', 'CQ6-L3 18kWh', 18, 'H3-10.0-Smart', 18700, ''],
    [8.55, 'FoxESS', 'CQ6-L4 24kWh', 24, 'H3-10.0-Smart', 19700, ''],
    [8.55, 'FoxESS', 'CQ6-L5 29.9kWh', 29.9, 'H3-10.0-Smart', 20940, ''],
    [8.55, 'GoodWe', 'GW8.3 ×2 (16.6kWh)', 16.6, 'GW9.999K-ETA-G20', 20890, ''],
    [8.55, 'GoodWe', 'GW8.3 ×3 (24.9kWh)', 24.9, 'GW9.999K-ETA-G20', 22250, ''],
    [8.55, 'GoodWe', 'GW8.3 ×4 (33.2kWh)', 33.2, 'GW9.999K-ETA-G20', 24190, ''],
    // 10.45 kW
    [10.45, 'FoxESS', 'CQ6-L3 18kWh', 18, 'H3-10.0-Smart', 19870, ''],
    [10.45, 'FoxESS', 'CQ6-L4 24kWh', 24, 'H3-10.0-Smart', 20820, ''],
    [10.45, 'FoxESS', 'CQ6-L5 29.9kWh', 29.9, 'H3-10.0-Smart', 22100, ''],
    [10.45, 'GoodWe', 'GW8.3 ×2 (16.6kWh)', 16.6, 'GW9.999K-ETA-G20', 22000, ''],
    [10.45, 'GoodWe', 'GW8.3 ×3 (24.9kWh)', 24.9, 'GW9.999K-ETA-G20', 23360, ''],
    [10.45, 'GoodWe', 'GW8.3 ×4 (33.2kWh)', 33.2, 'GW9.999K-ETA-G20', 25300, ''],
    // 13.3 kW
    [13.3, 'FoxESS', 'CQ6-L3 18kWh', 18, 'H3-10.0-Smart', 21550, ''],
    [13.3, 'FoxESS', 'CQ6-L4 24kWh', 24, 'H3-10.0-Smart', 22520, ''],
    [13.3, 'FoxESS', 'CQ6-L5 29.9kWh', 29.9, 'H3-10.0-Smart', 23800, ''],
    [13.3, 'GoodWe', 'GW8.3 ×2 (16.6kWh)', 16.6, 'GW9.999K-ETA-G20', 23700, ''],
    [13.3, 'GoodWe', 'GW8.3 ×3 (24.9kWh)', 24.9, 'GW9.999K-ETA-G20', 25000, ''],
    [13.3, 'GoodWe', 'GW8.3 ×4 (33.2kWh)', 33.2, 'GW9.999K-ETA-G20', 26990, ''],
    // Battery Only
    [0, 'Sofar', '15kWh Hybrid', 15, 'Sofar 5kW Hybrid 3P', 12100, 'Battery only'],
    [0, 'Sofar', '20kWh Hybrid', 20, 'Sofar 5kW Hybrid 3P', 12350, 'Battery only'],
    [0, 'FoxESS', 'CQ6-L3 18kWh', 18, 'H3-10.0-Smart', 13100, 'Battery only'],
    [0, 'FoxESS', 'CQ6-L4 24kWh', 24, 'H3-10.0-Smart', 14100, 'Battery only'],
    [0, 'FoxESS', 'CQ6-L5 29.9kWh', 29.9, 'H3-10.0-Smart', 15350, 'Battery only'],
    [0, 'GoodWe', 'GW8.3 ×2 (16.6kWh)', 16.6, 'GW9.999K-ETA-G20', 15340, 'Battery only'],
    [0, 'GoodWe', 'GW8.3 ×3 (24.9kWh)', 24.9, 'GW9.999K-ETA-G20', 16700, 'Battery only'],
    [0, 'GoodWe', 'GW8.3 ×4 (33.2kWh)', 33.2, 'GW9.999K-ETA-G20', 18700, 'Battery only'],
    [0, 'SigEnergy', 'BAT 24.0', 24, 'EC 10.0TP', 21340, 'Battery only'],
    [0, 'SigEnergy', 'BAT 32.0', 32, 'EC 10.0TP', 24740, 'Battery only'],
    [0, 'SigEnergy', 'BAT 40.0', 40, 'EC 10.0TP', 28840, 'Battery only'],
    [0, 'SigEnergy', 'BAT 48.0', 48, 'EC 10.0TP', 32140, 'Battery only'],
  ];
  _writeRows_(sheet, rows);
  Logger.log('Bundles 3P tab done');
}

// ── Tab 5: Extras ─────────────────────────────────────────────────────────────

function _setupExtras_(ss) {
  var sheet = _getOrCreateTab_(ss, 'Extras');
  var rows = [
    ['Section', 'Item', 'Unit', 'HEA Price', 'SJ Wholesale', 'Description'],
    // Solar Extras
    ['Solar', 'Smart meter (1-phase)', 'each', 275, '', ''],
    ['Solar', 'Smart meter (3-phase)', 'each', 385, '', ''],
    ['Solar', 'Antenna removal/relocation', 'each', 165, '', ''],
    ['Solar', 'Double storey', 'each', 440, '', ''],
    ['Solar', 'Tilt frames', 'per panel', 27.50, '', ''],
    ['Solar', 'Landscape orientation', 'per panel', 27.50, '', ''],
    ['Solar', 'Optimiser (Tigo TS4-A-O)', 'per panel', 110, '62–65', ''],
    ['Solar', 'Klip-Lok roof', 'per panel', 27.50, '', ''],
    ['Solar', 'Terracotta roof', 'each', 440, '', ''],
    ['Solar', 'Single storey >32° pitch', 'per panel', 27.50, '', ''],
    ['Solar', 'Double storey >32° pitch', 'per panel', 33, '', ''],
    ['Solar', 'Existing system removal', 'each', 275, '', ''],
    ['Solar', 'Old system disposal', 'each', 220, '', ''],
    ['Solar', 'Cathedral ceiling', 'each', 385, '', ''],
    ['Solar', '6.6kW 3-phase inverter upgrade', 'each', 700, '', ''],
    ['Solar', 'Split array (after 2nd)', 'per array', 170, '', ''],
    // Battery Extras
    ['Battery', 'Smart meter (1-phase)', 'each', 275, '', ''],
    ['Battery', 'Smart meter (3-phase)', 'each', 385, '', ''],
    ['Battery', 'Battery removal', 'each', 385, '', ''],
    ['Battery', 'Old system disposal', 'each', 220, '', ''],
    ['Battery', 'Cement sheet behind battery', 'each', 165, '', ''],
    ['Battery', 'Bollard', 'each', 165, '', ''],
    ['Battery', 'Canopy', 'each', 165, '', ''],
    ['Battery', 'Fire alarm', 'each', 165, '', ''],
    ['Battery', 'Concrete base/paver', 'each', 165, '', ''],
    ['Battery', '1P EPS — Partial backup', 'each', 495, '', ''],
    ['Battery', '3P EPS — Partial backup', 'each', 715, '', ''],
    ['Battery', '1P Full home backup', 'each', 770, '', ''],
    ['Battery', '3P Full home backup', 'each', 1100, '', ''],
    ['Battery', 'Long AC cable >10m — 6mm', 'per metre', 27.50, '', ''],
    ['Battery', 'Long AC cable >10m — 10mm', 'per metre', 33, '', ''],
    ['Battery', 'Long AC cable >10m — 16mm', 'per metre', 38.50, '', ''],
    ['Battery', 'RCBO', 'each', 110, '', ''],
    ['Battery', 'DC cable run after 10m', 'per metre', 11, '', ''],
    ['Battery', 'Existing system DC coupling', 'each', 440, '', 'Price varies — use as minimum'],
    ['Battery', 'SigEnergy Gateway — 1P', 'each', 1500, '', 'Required for backup'],
    ['Battery', 'SigEnergy Gateway — 3P', 'each', 2200, '', 'Required for backup'],
    // Switchboard Extras
    ['Switchboard', 'Internal switchboard', 'each', 330, '', ''],
    ['Switchboard', 'Enclosure', 'each', 165, '', ''],
    ['Switchboard', 'Enclosure (3-phase)', 'each', 275, '', ''],
    ['Switchboard', 'Weatherproof sub board', 'each', 495, '', ''],
    ['Switchboard', 'Sub board (near main SWB)', 'each', 500, '', ''],
    // Travel
    ['Travel', 'Travel — per km return', 'per km', 2.20, '', '2× one-way km × $2.20'],
  ];
  _writeRows_(sheet, rows);
  Logger.log('Extras tab done');
}

// ── Tab 6: Components (Solar Juice) ──────────────────────────────────────────

function _setupComponentsSJ_(ss) {
  var sheet = _getOrCreateTab_(ss, 'Components (Solar Juice)');
  var rows = [
    ['Category', 'Brand', 'Model', 'Spec', 'SJ Cost (ex-GST)'],
    // Solar Panels
    ['Panel', 'Trina', 'TSM-475NEG9RH.28', '475W N-Type Dual Glass — Part #20571', 128.25],
    ['Panel', 'Trina', 'TSM-515NEG18R.28', '515W N-Type Dual Glass — Part #20572', 136.48],
    ['Panel', 'AIKO', 'A470-MAH54Mb', '470W All-Black ABC — Part #20867', 145.70],
    ['Panel', 'AIKO', 'A490-MCE54Mb', '490W All-Black ABC — Part #20879', 161.70],
    ['Panel', 'Sungrow', 'SG-48TG4D-470', '470W N-Type Bifacial — Part #20971', 126.90],
    ['Panel', 'Sungrow', 'SG-54TG1D-440', '440W N-Type Bifacial — Part #20970', 105.60],
    ['Panel', 'Tindo', 'Walara-475G4P-BL', '475W All-Black — Part #20720', 185.25],
    ['Panel', 'REC', 'REC420AA Pure-R', '420W All-Black — Part #20145', 113.40],
    ['Panel', 'REC', 'REC470AA Pure-RX', '470W All-Black — Part #20134', 225.60],
    // Hybrid Inverters
    ['Hybrid Inverter', 'GoodWe', 'GW5K-EHA-G20', '5kW 1P', 1114],
    ['Hybrid Inverter', 'GoodWe', 'GW8K-EHA-G20', '8kW 1P', 1689],
    ['Hybrid Inverter', 'GoodWe', 'GW9.999K-EHA-G20', '10kW 1P', 1826],
    ['Hybrid Inverter', 'GoodWe', 'GW5K-ETA-G20', '5kW 3P', 1876],
    ['Hybrid Inverter', 'GoodWe', 'GW9.999K-ETA-G20', '10kW 3P', 1876],
    ['Hybrid Inverter', 'GoodWe', 'GW15K-ETA-G20', '15kW 3P', 2000],
    ['Hybrid Inverter', 'FoxESS', 'H1-5.0-E-G2', '5kW 1P', 1280],
    ['Hybrid Inverter', 'FoxESS', 'KH10', '10kW 1P', 1950],
    ['Hybrid Inverter', 'FoxESS', 'H3-8.0-Smart', '8kW 3P', 2150],
    ['Hybrid Inverter', 'FoxESS', 'H3-10.0-Smart', '10kW 3P', 2250],
    ['Hybrid Inverter', 'Sungrow', 'SH5.0RS-ADA', '5kW 1P', 1749],
    ['Hybrid Inverter', 'Sungrow', 'SH10RS', '10kW 1P', 2749],
    ['Hybrid Inverter', 'Sungrow', 'SH10RT-ADA', '10kW 3P', 3060],
    ['Hybrid Inverter', 'Fronius', 'GEN24 PLUS 5kW', '5kW 1P', 2289],
    ['Hybrid Inverter', 'Fronius', 'GEN24 PLUS 10kW', '10kW 1P', 3399],
    // Battery Modules
    ['Battery Module', 'GoodWe', 'GW8.3-BAT-D-G20', '8.32 kWh', 2400],
    ['Battery Module', 'GoodWe', 'GW5.1-BAT-D-G20', '5.12 kWh', 1505],
    ['Battery Module', 'FoxESS', 'CQ6-M (Master)', '5.99 kWh', 1899],
    ['Battery Module', 'FoxESS', 'CQ6-S (Slave)', '5.99 kWh', 1799],
    ['Battery Module', 'Sungrow', 'SMR050', '5 kWh', 2199],
    ['Battery Module', 'Sungrow', 'SMR032', '3.2 kWh', 1265],
    ['Battery Module', 'Tesla', 'Powerwall 3', '13.5 kWh', 9190],
    ['Battery Module', 'BYD', 'HVM 2.76kWh', '2.76 kWh/module', 1260],
    ['Battery Module', 'Fronius', 'Reserva 3.15kWh', '3.15 kWh', 1420],
    // EV Chargers
    ['EV Charger', 'Sungrow', 'AC22E-01', '7/11/22 kW', 680],
    ['EV Charger', 'FoxESS', 'A022KP1-E-B-WO', '7/22 kW', 799],
    ['EV Charger', 'Fronius', 'Wattpilot Home 22 J', '22 kW', 1399],
    ['EV Charger', 'Zappi', 'ZAPPI-2H22TW-T (White tethered)', '7/22 kW tethered', 1305],
    ['EV Charger', 'Zappi', 'ZAPPI-2H22TB-T (Black tethered)', '7/22 kW tethered', 1305],
    ['EV Charger', 'Zappi', 'Untethered White', '7/22 kW', 1275],
    ['EV Charger', 'Zappi', 'Untethered Black', '7/22 kW', 1275],
    // String Inverters
    ['String Inverter', 'Sungrow', 'SG5.0RS', '5 kW 1P', 879],
    ['String Inverter', 'Sungrow', 'SG10RT', '10 kW 3P', 1649],
    ['String Inverter', 'Fronius', 'GEN24 5kW 1P', '5 kW 1P', 1670],
    ['String Inverter', 'Fronius', 'GEN24 10kW 1P', '10 kW 1P', 2643],
    // Optimisers
    ['Optimiser', 'Tigo', 'TS4-A-O 700W', '700W', 62],
    ['Optimiser', 'Tigo', 'TS4-A-O (max)', '700W', 65],
  ];
  _writeRows_(sheet, rows);
  Logger.log('Components (Solar Juice) tab done');
}

// ── Tab 7: Settings ───────────────────────────────────────────────────────────

function _setupSettings_(ss, sheetUrl) {
  var sheet = _getOrCreateTab_(ss, 'Settings');
  var today = Utilities.formatDate(new Date(), 'Australia/Melbourne', 'yyyy-MM-dd');
  var rows = [
    ['Key', 'Value'],
    ['Sheet URL', sheetUrl],
    ['Last Updated', today],
    ['Sales Commission ($)', 1000],
    ['Installation Commission ($)', 2000],
    ['Solar Victoria Rebate ($)', 1400],
    ['Margin Target %', ''],
    ['GST Note', 'SJ prices are ex-GST; HEA sell prices include GST'],
  ];
  _writeRows_(sheet, rows);
  Logger.log('Settings tab done');
}
