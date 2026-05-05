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

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var action = body.action;

    if (action === 'updateExtrasPrice') {
      return jsonOut(updateExtrasPrice_(body.section, body.item, body.newPrice));
    }
    if (action === 'addExtrasRow') {
      return jsonOut(addExtrasRow_(body.section, body.item, body.unit, body.price));
    }
    return jsonOut({ error: 'Unknown POST action.' });
  } catch(err) {
    return jsonOut({ error: 'POST error: ' + err.message });
  }
}

function updateExtrasPrice_(section, item, newPrice) {
  var sheet;
  try { sheet = getSheet_('Extras'); } catch(e) { return { error: e.message }; }
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === String(section).trim() && String(data[i][1]).trim() === String(item).trim()) {
      sheet.getRange(i + 1, 4).setValue('$' + parseFloat(newPrice).toFixed(2));
      return { ok: true };
    }
  }
  return { error: 'Row not found: ' + section + ' / ' + item };
}

function addExtrasRow_(section, item, unit, price) {
  var sheet;
  try { sheet = getSheet_('Extras'); } catch(e) { return { error: e.message }; }
  sheet.appendRow([section, item, unit || 'each', '$' + parseFloat(price).toFixed(2), '']);
  return { ok: true };
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

// ── One-time setup: creates & populates the HEA Master Pricing Google Sheet ──

function setupPricingSheet() {
  var ss = SpreadsheetApp.create('HEA Master Pricing');
  Logger.log('✅ HEA Master Pricing sheet created.');
  Logger.log('Sheet URL: ' + ss.getUrl());

  _setupSolarBase_(ss);
  _setupBatteryBase_(ss);
  _setupBundles1P_(ss);
  _setupBundles3P_(ss);
  _setupExtras_(ss);
  _setupComponentsSJ_(ss);
  _setupSettings_(ss);

  // Remove the default blank Sheet1
  var blank = ss.getSheetByName('Sheet1');
  if (blank) ss.deleteSheet(blank);

  // Store ID in Script Properties so the API can read it
  PropertiesService.getScriptProperties().setProperty('PRICING_SHEET_ID', ss.getId());
  Logger.log('PRICING_SHEET_ID set to: ' + ss.getId());
  Logger.log('Done. Add PRICING_SHEET_URL = ' + ss.getUrl() + ' to Vercel.');
}

function _getOrCreateTab_(ss, name) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  sheet.clearContents();
  return sheet;
}

function _writeRows_(sheet, rows) {
  if (!rows.length) return;
  sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
  sheet.getRange(1, 1, 1, rows[0].length).setFontWeight('bold');
  sheet.setFrozenRows(1);
}

function _setupSolarBase_(ss) {
  var s = _getOrCreateTab_(ss, 'Solar Base');
  _writeRows_(s, [
    ['System Size', 'Panel Brand/Model', 'Inverter', 'HEA Sell Price', 'SJ Wholesale Cost', 'Notes'],
    ['6.6 kW', 'Risen 475W', 'GoodWe', '$4,000', '~$105-128/panel', 'Fixed price'],
    ['Above 6.6kW', 'Risen 475W', 'GoodWe', '$0.59/watt', '', 'Per watt above 6.6kW'],
    ['6.6 kW', 'Jinko 440W', 'GoodWe', '$4,150', '~$113/panel', 'Fixed price'],
    ['Above 6.6kW', 'Jinko', 'GoodWe', '$0.612/watt', '', 'Per watt above 6.6kW'],
    ['8.55 kW', 'Risen 475W', 'GoodWe', '$5,045', '', ''],
    ['10.45 kW', 'Risen 475W', 'GoodWe', '$6,140', '', ''],
    ['13.3 kW', 'Risen 475W', 'GoodWe', '$7,847', '', ''],
  ]);
}

function _setupBatteryBase_(ss) {
  var s = _getOrCreateTab_(ss, 'Battery Base');
  _writeRows_(s, [
    ['Brand', 'Model', 'Battery kWh', 'Phase', 'HEA Price', 'SJ Wholesale', 'Inverter Included', 'Notes'],
    ['Sofar', '', '15 kWh', '1P', '$4,500', '', 'Sofar 5kW Hybrid', 'After rebate'],
    ['Sofar', '', '20 kWh', '1P', '$4,650', '', 'Sofar 5kW Hybrid', 'After rebate'],
    ['Sofar', '', '15 kWh', '3P', '$5,900', '', 'Sofar 5kW Hybrid', 'After rebate'],
    ['Sofar', '', '20 kWh', '3P', '$6,150', '', 'Sofar 5kW Hybrid', 'After rebate'],
    ['AlphaESS', 'SMILE-M-BAT-13.9P', '14 kWh', '1P', '$5,600', '', 'SMILE-M5-S-INV', ''],
    ['AlphaESS', '2x SMILE-M-BAT-13.9P', '28 kWh', '1P', '$7,950', '', 'SMILE-M5-S-INV', ''],
    ['FoxESS', 'CQ6 (3 slave)', '18 kWh', '1P', '$4,000', '$1,950 inv', 'KH10', ''],
    ['FoxESS', 'CQ6 (4 slave)', '24 kWh', '1P', '$4,950', '$1,950 inv', 'KH10', ''],
    ['FoxESS', 'CQ6 (5 slave)', '29.9 kWh', '1P', '$6,230', '$1,950 inv', 'KH10', ''],
    ['FoxESS', 'CQ6 (7 slave)', '42 kWh', '3P', '$5,500', '', 'H3-10.0-Smart', ''],
    ['GoodWe', 'GW8.3-BAT x2', '16.6 kWh', '1P', '$6,000', '$2,400x2 batt', 'GW9.999K-EHA-G20', ''],
    ['GoodWe', 'GW8.3-BAT x3', '24.9 kWh', '1P', '$6,500', '$2,400x3 batt', 'GW9.999K-EHA-G20', ''],
    ['GoodWe', 'GW8.3-BAT x4', '33.2 kWh', '1P', '$7,000', '$2,400x4 batt', 'GW9.999K-EHA-G20', 'Full home backup'],
    ['GoodWe', 'GW8.3-BAT x6', '49.8 kWh', '1P', '$7,500', '', 'GW9.999K-EHA-G20', ''],
    ['SigEnergy', 'EC 10.0SP + 24kWh', '24 kWh', '1P', '$9,700', '', 'EC 10.0SP', 'Gateway 1P +$1,500 req'],
    ['SigEnergy', 'EC 10.0SP + 32kWh', '32 kWh', '1P', '$11,300', '', 'EC 10.0SP', ''],
    ['SigEnergy', 'EC 10.0SP + 40kWh', '40 kWh', '1P', '$13,100', '', 'EC 10.0SP', ''],
    ['SigEnergy', 'EC 10.0SP + 48kWh', '48 kWh', '1P', '$14,200', '', 'EC 10.0SP', ''],
  ]);
}

function _setupBundles1P_(ss) {
  var s = _getOrCreateTab_(ss, 'Bundles 1P');
  _writeRows_(s, [
    ['Solar kW', 'Battery Brand', 'Battery Model', 'Battery kWh', 'Inverter', 'HEA Price', 'Notes'],
    // 6.6kW bundles
    ['6.6', 'Sofar', '', '15 kWh', 'Sofar 5kW Hybrid', '$14,870', ''],
    ['6.6', 'Sofar', '', '20 kWh', 'Sofar 5kW Hybrid', '$15,020', ''],
    ['6.6', 'AlphaESS', 'SMILE-M-BAT-13.9P', '14 kWh', 'SMILE-M5-S-INV', '$16,320', ''],
    ['6.6', 'AlphaESS', '2x SMILE-M-BAT-13.9P', '28 kWh', 'SMILE-M5-S-INV', '$18,670', ''],
    ['6.6', 'FoxESS', 'CQ6-L3', '18 kWh', 'KH10', '$16,790', ''],
    ['6.6', 'FoxESS', 'CQ6-L4', '24 kWh', 'KH10', '$17,740', ''],
    ['6.6', 'FoxESS', 'CQ6-L5', '29.9 kWh', 'KH10', '$19,020', 'Most popular'],
    ['6.6', 'GoodWe', 'GW8.3-BAT x2', '16.6 kWh', 'GW9.999K-EHA-G20', '$18,890', ''],
    ['6.6', 'GoodWe', 'GW8.3-BAT x3', '24.9 kWh', 'GW9.999K-EHA-G20', '$20,250', ''],
    ['6.6', 'GoodWe', 'GW8.3-BAT x4', '33.2 kWh', 'GW9.999K-EHA-G20', '$22,190', 'Full home backup'],
    // 8.55kW bundles
    ['8.55', 'Sofar', '', '15 kWh', 'Sofar 5kW Hybrid', '$15,920', ''],
    ['8.55', 'Sofar', '', '20 kWh', 'Sofar 5kW Hybrid', '$16,070', ''],
    ['8.55', 'AlphaESS', 'SMILE-M-BAT-13.9P', '14 kWh', 'SMILE-M5-S-INV', '$17,370', ''],
    ['8.55', 'AlphaESS', '2x SMILE-M-BAT-13.9P', '28 kWh', 'SMILE-M5-S-INV', '$19,720', ''],
    ['8.55', 'FoxESS', 'CQ6-L3', '18 kWh', 'KH10', '$17,870', ''],
    ['8.55', 'FoxESS', 'CQ6-L4', '24 kWh', 'KH10', '$18,820', ''],
    ['8.55', 'FoxESS', 'CQ6-L5', '29.9 kWh', 'KH10', '$20,100', ''],
    ['8.55', 'GoodWe', 'GW8.3-BAT x2', '16.6 kWh', 'GW9.999K-EHA-G20', '$19,890', ''],
    ['8.55', 'GoodWe', 'GW8.3-BAT x3', '24.9 kWh', 'GW9.999K-EHA-G20', '$21,250', ''],
    ['8.55', 'GoodWe', 'GW8.3-BAT x4', '33.2 kWh', 'GW9.999K-EHA-G20', '$23,190', ''],
    // 10.45kW bundles
    ['10.45', 'FoxESS', 'CQ6-L3', '18 kWh', 'KH10', '$19,000', ''],
    ['10.45', 'FoxESS', 'CQ6-L4', '24 kWh', 'KH10', '$19,960', ''],
    ['10.45', 'FoxESS', 'CQ6-L5', '29.9 kWh', 'KH10', '$21,240', ''],
    ['10.45', 'GoodWe', 'GW8.3-BAT x2', '16.6 kWh', 'GW9.999K-EHA-G20', '$21,090', ''],
    ['10.45', 'GoodWe', 'GW8.3-BAT x3', '24.9 kWh', 'GW9.999K-EHA-G20', '$22,450', ''],
    ['10.45', 'GoodWe', 'GW8.3-BAT x4', '33.2 kWh', 'GW9.999K-EHA-G20', '$24,390', ''],
    // 13.3kW bundles
    ['13.3', 'FoxESS', 'CQ6-L3', '18 kWh', 'KH10', '$20,700', ''],
    ['13.3', 'FoxESS', 'CQ6-L4', '24 kWh', 'KH10', '$21,700', ''],
    ['13.3', 'FoxESS', 'CQ6-L5', '29.9 kWh', 'KH10', '$22,940', ''],
    ['13.3', 'GoodWe', 'GW8.3-BAT x2', '16.6 kWh', 'GW9.999K-EHA-G20', '$22,700', ''],
    ['13.3', 'GoodWe', 'GW8.3-BAT x3', '24.9 kWh', 'GW9.999K-EHA-G20', '$24,000', ''],
    ['13.3', 'GoodWe', 'GW8.3-BAT x4', '33.2 kWh', 'GW9.999K-EHA-G20', '$26,000', ''],
    // Battery only (solarKw=0)
    ['0', 'Sofar', '', '15 kWh', 'Sofar 5kW Hybrid', '$10,370', 'Battery only'],
    ['0', 'Sofar', '', '20 kWh', 'Sofar 5kW Hybrid', '$10,520', 'Battery only'],
    ['0', 'AlphaESS', 'SMILE-M-BAT-13.9P', '14 kWh', 'SMILE-M5-S-INV', '$11,470', 'Battery only'],
    ['0', 'AlphaESS', '2x SMILE-M-BAT-13.9P', '28 kWh', 'SMILE-M5-S-INV', '$13,820', 'Battery only'],
    ['0', 'FoxESS', 'CQ6-L3', '18 kWh', 'KH10', '$12,290', 'Battery only'],
    ['0', 'FoxESS', 'CQ6-L4', '24 kWh', 'KH10', '$13,240', 'Battery only'],
    ['0', 'FoxESS', 'CQ6-L5', '29.9 kWh', 'KH10', '$14,520', 'Battery only'],
    ['0', 'GoodWe', 'GW8.3-BAT x2', '16.6 kWh', 'GW9.999K-EHA-G20', '$14,350', 'Battery only'],
    ['0', 'GoodWe', 'GW8.3-BAT x3', '24.9 kWh', 'GW9.999K-EHA-G20', '$15,800', 'Battery only'],
    ['0', 'GoodWe', 'GW8.3-BAT x4', '33.2 kWh', 'GW9.999K-EHA-G20', '$17,700', 'Battery only'],
    ['0', 'SigEnergy', 'EC 10.0SP + 24kWh', '24 kWh', 'EC 10.0SP', '$20,590', 'Battery only'],
    ['0', 'SigEnergy', 'EC 10.0SP + 32kWh', '32 kWh', 'EC 10.0SP', '$23,900', 'Battery only'],
    ['0', 'SigEnergy', 'EC 10.0SP + 40kWh', '40 kWh', 'EC 10.0SP', '$28,100', 'Battery only'],
    ['0', 'SigEnergy', 'EC 10.0SP + 48kWh', '48 kWh', 'EC 10.0SP', '$31,390', 'Battery only'],
  ]);
}

function _setupBundles3P_(ss) {
  var s = _getOrCreateTab_(ss, 'Bundles 3P');
  _writeRows_(s, [
    ['Solar kW', 'Battery Brand', 'Battery Model', 'Battery kWh', 'Inverter', 'HEA Price', 'Notes'],
    // 6.6kW 3P
    ['6.6', 'FoxESS', 'CQ6-L3', '18 kWh', 'H3-10.0-Smart', '$17,600', ''],
    ['6.6', 'FoxESS', 'CQ6-L4', '24 kWh', 'H3-10.0-Smart', '$18,570', ''],
    ['6.6', 'FoxESS', 'CQ6-L5', '29.9 kWh', 'H3-10.0-Smart', '$19,850', ''],
    ['6.6', 'GoodWe', 'GW8.3-BAT x2', '16.6 kWh', 'GW9.999K-ETA-G20', '$19,840', ''],
    ['6.6', 'GoodWe', 'GW8.3-BAT x3', '24.9 kWh', 'GW9.999K-ETA-G20', '$21,200', ''],
    ['6.6', 'GoodWe', 'GW8.3-BAT x4', '33.2 kWh', 'GW9.999K-ETA-G20', '$23,200', ''],
    ['6.6', 'SigEnergy', 'EC 10.0TP + 24kWh', '24 kWh', 'EC 10.0TP', '$23,350', ''],
    ['6.6', 'SigEnergy', 'EC 10.0TP + 32kWh', '32 kWh', 'EC 10.0TP', '$24,950', ''],
    ['6.6', 'SigEnergy', 'EC 10.0TP + 40kWh', '40 kWh', 'EC 10.0TP', '$26,750', ''],
    ['6.6', 'SigEnergy', 'EC 10.0TP + 48kWh', '48 kWh', 'EC 10.0TP', '$27,850', ''],
    // 8.55kW 3P
    ['8.55', 'FoxESS', 'CQ6-L3', '18 kWh', 'H3-10.0-Smart', '$18,700', ''],
    ['8.55', 'FoxESS', 'CQ6-L4', '24 kWh', 'H3-10.0-Smart', '$19,700', ''],
    ['8.55', 'FoxESS', 'CQ6-L5', '29.9 kWh', 'H3-10.0-Smart', '$20,940', ''],
    ['8.55', 'GoodWe', 'GW8.3-BAT x2', '16.6 kWh', 'GW9.999K-ETA-G20', '$20,890', ''],
    ['8.55', 'GoodWe', 'GW8.3-BAT x3', '24.9 kWh', 'GW9.999K-ETA-G20', '$22,250', ''],
    ['8.55', 'GoodWe', 'GW8.3-BAT x4', '33.2 kWh', 'GW9.999K-ETA-G20', '$24,190', ''],
    // 10.45kW 3P
    ['10.45', 'FoxESS', 'CQ6-L3', '18 kWh', 'H3-10.0-Smart', '$19,870', ''],
    ['10.45', 'FoxESS', 'CQ6-L4', '24 kWh', 'H3-10.0-Smart', '$20,820', ''],
    ['10.45', 'FoxESS', 'CQ6-L5', '29.9 kWh', 'H3-10.0-Smart', '$22,100', ''],
    ['10.45', 'GoodWe', 'GW8.3-BAT x2', '16.6 kWh', 'GW9.999K-ETA-G20', '$22,000', ''],
    ['10.45', 'GoodWe', 'GW8.3-BAT x3', '24.9 kWh', 'GW9.999K-ETA-G20', '$23,360', ''],
    ['10.45', 'GoodWe', 'GW8.3-BAT x4', '33.2 kWh', 'GW9.999K-ETA-G20', '$25,300', ''],
    // 13.3kW 3P
    ['13.3', 'FoxESS', 'CQ6-L3', '18 kWh', 'H3-10.0-Smart', '$21,550', ''],
    ['13.3', 'FoxESS', 'CQ6-L4', '24 kWh', 'H3-10.0-Smart', '$22,520', ''],
    ['13.3', 'FoxESS', 'CQ6-L5', '29.9 kWh', 'H3-10.0-Smart', '$23,800', ''],
    ['13.3', 'GoodWe', 'GW8.3-BAT x2', '16.6 kWh', 'GW9.999K-ETA-G20', '$23,700', ''],
    ['13.3', 'GoodWe', 'GW8.3-BAT x3', '24.9 kWh', 'GW9.999K-ETA-G20', '$25,000', ''],
    ['13.3', 'GoodWe', 'GW8.3-BAT x4', '33.2 kWh', 'GW9.999K-ETA-G20', '$26,990', ''],
    // Battery only 3P
    ['0', 'Sofar', '', '15 kWh', 'Sofar 5kW Hybrid 3P', '$12,100', 'Battery only'],
    ['0', 'Sofar', '', '20 kWh', 'Sofar 5kW Hybrid 3P', '$12,350', 'Battery only'],
    ['0', 'FoxESS', 'CQ6-L3', '18 kWh', 'H3-10.0-Smart', '$13,100', 'Battery only'],
    ['0', 'FoxESS', 'CQ6-L4', '24 kWh', 'H3-10.0-Smart', '$14,100', 'Battery only'],
    ['0', 'FoxESS', 'CQ6-L5', '29.9 kWh', 'H3-10.0-Smart', '$15,350', 'Battery only'],
    ['0', 'GoodWe', 'GW8.3-BAT x2', '16.6 kWh', 'GW9.999K-ETA-G20', '$15,340', 'Battery only'],
    ['0', 'GoodWe', 'GW8.3-BAT x3', '24.9 kWh', 'GW9.999K-ETA-G20', '$16,700', 'Battery only'],
    ['0', 'GoodWe', 'GW8.3-BAT x4', '33.2 kWh', 'GW9.999K-ETA-G20', '$18,700', 'Battery only'],
    ['0', 'SigEnergy', 'EC 10.0TP + 24kWh', '24 kWh', 'EC 10.0TP', '$21,340', 'Battery only'],
    ['0', 'SigEnergy', 'EC 10.0TP + 32kWh', '32 kWh', 'EC 10.0TP', '$24,740', 'Battery only'],
    ['0', 'SigEnergy', 'EC 10.0TP + 40kWh', '40 kWh', 'EC 10.0TP', '$28,840', 'Battery only'],
    ['0', 'SigEnergy', 'EC 10.0TP + 48kWh', '48 kWh', 'EC 10.0TP', '$32,140', 'Battery only'],
  ]);
}

function _setupExtras_(ss) {
  var s = _getOrCreateTab_(ss, 'Extras');
  _writeRows_(s, [
    ['Section', 'Item', 'Unit', 'HEA Price', 'Notes'],
    // Solar extras
    ['Solar', 'Smart meter (1-phase)', 'each', '$275', ''],
    ['Solar', 'Smart meter (3-phase)', 'each', '$385', ''],
    ['Solar', 'Antenna removal/relocation', 'each', '$165', ''],
    ['Solar', 'Double storey', 'each', '$440', ''],
    ['Solar', 'Tilt frames', 'per panel', '$27.50', ''],
    ['Solar', 'Landscape orientation', 'per panel', '$27.50', ''],
    ['Solar', 'Optimiser (Tigo TS4-A-O)', 'per panel', '$110', 'SJ cost $62-65'],
    ['Solar', 'Klip-Lok', 'per panel', '$27.50', ''],
    ['Solar', 'Terracotta roof', 'each', '$440', ''],
    ['Solar', 'Single storey >32° pitch', 'per panel', '$27.50', ''],
    ['Solar', 'Double storey >32° pitch', 'per panel', '$33', ''],
    ['Solar', 'Existing system removal', 'each', '$275', ''],
    ['Solar', 'Old system disposal', 'each', '$220', ''],
    ['Solar', 'Cathedral ceiling', 'each', '$385', ''],
    ['Solar', '6.6kW 3-phase inverter upgrade', 'each', '$700', ''],
    ['Solar', 'Split array (after 2nd)', 'per array', '$170', ''],
    // Battery extras
    ['Battery', 'Smart meter (1-phase)', 'each', '$275', ''],
    ['Battery', 'Smart meter (3-phase)', 'each', '$385', ''],
    ['Battery', 'Battery removal', 'each', '$385', ''],
    ['Battery', 'Old system disposal', 'each', '$220', ''],
    ['Battery', 'Cement sheet behind battery', 'each', '$165', ''],
    ['Battery', 'Bollard', 'each', '$165', ''],
    ['Battery', 'Canopy', 'each', '$165', ''],
    ['Battery', 'Fire alarm', 'each', '$165', ''],
    ['Battery', 'Concrete base/paver', 'each', '$165', ''],
    ['Battery', '1P EPS for battery (Partial)', 'each', '$495', ''],
    ['Battery', '3P EPS for battery (Partial)', 'each', '$715', ''],
    ['Battery', '1P Full home backup', 'each', '$770', ''],
    ['Battery', '3P Full home backup', 'each', '$1,100', ''],
    ['Battery', 'Long AC cable run >10m — 6mm', 'per metre', '$27.50', ''],
    ['Battery', 'Long AC cable run >10m — 10mm', 'per metre', '$33', ''],
    ['Battery', 'Long AC cable run >10m — 16mm', 'per metre', '$38.50', ''],
    ['Battery', 'RCBO', 'each', '$110', ''],
    ['Battery', 'DC cable run after first 10m', 'per metre', '$11', ''],
    ['Battery', 'Existing system DC coupling', 'job', '$440-$1,100', ''],
    ['Battery', 'SigEnergy Gateway for Backup (1P)', 'each', '$1,500', ''],
    ['Battery', 'SigEnergy Gateway for Backup (3P)', 'each', '$2,200', ''],
    // Switchboard extras
    ['Switchboard', 'Internal switchboard', 'each', '$330', ''],
    ['Switchboard', 'Enclosure', 'each', '$165', ''],
    ['Switchboard', 'Enclosure (3-phase)', 'each', '$275', ''],
    ['Switchboard', 'Weatherproof sub board', 'each', '$495', ''],
    ['Switchboard', 'Sub board (new near main SWB)', 'each', '$500', ''],
    ['Switchboard', 'Major SWB upgrade', 'job', 'Case by case', ''],
    // Travel
    ['Travel', 'Travel charge formula', 'per km', '$2.20', '2x one-way km x $2.20'],
  ]);
}

function _setupComponentsSJ_(ss) {
  var s = _getOrCreateTab_(ss, 'Components (Solar Juice)');
  _writeRows_(s, [
    ['Section', 'Brand', 'Model', 'Watts/kW', 'Phase', 'SJ Cost (ex-GST)', 'SJ Part#'],
    // Panels
    ['Panels', 'Trina', 'TSM-475NEG9RH.28', '475W N-Type Dual Glass', '', '$128.25', '20571'],
    ['Panels', 'Trina', 'TSM-515NEG18R.28', '515W N-Type Dual Glass', '', '$136.48', '20572'],
    ['Panels', 'AIKO', 'A470-MAH54Mb', '470W All-Black ABC', '', '$145.70', '20867'],
    ['Panels', 'AIKO', 'A490-MCE54Mb', '490W All-Black ABC', '', '$161.70', '20879'],
    ['Panels', 'Sungrow', 'SG-48TG4D-470', '470W N-Type Bifacial', '', '$126.90', '20971'],
    ['Panels', 'Sungrow', 'SG-54TG1D-440', '440W N-Type Bifacial', '', '$105.60', '20970'],
    ['Panels', 'Tindo', 'Walara-475G4P-BL', '475W All-Black', '', '$185.25', '20720'],
    ['Panels', 'REC', 'REC420AA Pure-R', '420W All-Black', '', '$113.40', '20145'],
    ['Panels', 'REC', 'REC470AA Pure-RX', '470W All-Black', '', '$225.60', '20134'],
    // Hybrid inverters
    ['Hybrid Inverters', 'GoodWe', 'GW5K-EHA-G20', '5kW', '1P', '$1,114', ''],
    ['Hybrid Inverters', 'GoodWe', 'GW8K-EHA-G20', '8kW', '1P', '$1,689', ''],
    ['Hybrid Inverters', 'GoodWe', 'GW9.999K-EHA-G20', '10kW', '1P', '$1,826', ''],
    ['Hybrid Inverters', 'GoodWe', 'GW5K-ETA-G20', '5kW', '3P', '$1,876', ''],
    ['Hybrid Inverters', 'GoodWe', 'GW9.999K-ETA-G20', '10kW', '3P', '$1,876', ''],
    ['Hybrid Inverters', 'GoodWe', 'GW15K-ETA-G20', '15kW', '3P', '$2,000', ''],
    ['Hybrid Inverters', 'FoxESS', 'H1-5.0-E-G2', '5kW', '1P', '$1,280', ''],
    ['Hybrid Inverters', 'FoxESS', 'KH10', '10kW', '1P', '$1,950', ''],
    ['Hybrid Inverters', 'FoxESS', 'H3-8.0-Smart', '8kW', '3P', '$2,150', ''],
    ['Hybrid Inverters', 'FoxESS', 'H3-10.0-Smart', '10kW', '3P', '$2,250', ''],
    ['Hybrid Inverters', 'Sungrow', 'SH5.0RS-ADA', '5kW', '1P', '$1,749', ''],
    ['Hybrid Inverters', 'Sungrow', 'SH10RS', '10kW', '1P', '$2,749', ''],
    ['Hybrid Inverters', 'Sungrow', 'SH10RT-ADA', '10kW', '3P', '$3,060', ''],
    ['Hybrid Inverters', 'Fronius', 'GEN24 PLUS 5kW', '5kW', '1P', '$2,289', ''],
    ['Hybrid Inverters', 'Fronius', 'GEN24 PLUS 10kW', '10kW', '1P', '$3,399', ''],
    // Battery modules
    ['Battery Modules', 'GoodWe', 'GW8.3-BAT-D-G20', '8.32kWh', '', '$2,400', ''],
    ['Battery Modules', 'GoodWe', 'GW5.1-BAT-D-G20', '5.12kWh', '', '$1,505', ''],
    ['Battery Modules', 'FoxESS', 'CQ6-M (Master)', '5.99kWh', '', '$1,899', ''],
    ['Battery Modules', 'FoxESS', 'CQ6-S (Slave)', '5.99kWh', '', '$1,799', ''],
    ['Battery Modules', 'Sungrow', 'SMR050', '5kWh', '', '$2,199', ''],
    ['Battery Modules', 'Sungrow', 'SMR032', '3.2kWh', '', '$1,265', ''],
    ['Battery Modules', 'Tesla', 'Powerwall 3', '13.5kWh', '', '$9,190', ''],
    ['Battery Modules', 'BYD', 'HVM 2.76kWh', '2.76kWh', '', '$1,260', ''],
    ['Battery Modules', 'Fronius', 'Reserva 3.15kWh', '3.15kWh', '', '$1,420', ''],
    // EV chargers
    ['EV Chargers', 'Sungrow', 'AC22E-01', '7/11/22kW', '', '$680', ''],
    ['EV Chargers', 'FoxESS', 'A022KP1-E-B-WO', '7/22kW', '', '$799', ''],
    ['EV Chargers', 'Fronius', 'Wattpilot Home 22 J', '22kW', '', '$1,399', ''],
    ['EV Chargers', 'Zappi', 'ZAPPI-2H22TW-T White Tethered', '7/22kW', '', '$1,305', ''],
    ['EV Chargers', 'Zappi', 'ZAPPI-2H22TB-T Black Tethered', '7/22kW', '', '$1,305', ''],
    ['EV Chargers', 'Zappi', 'Untethered White', '7/22kW', '', '$1,275', ''],
    ['EV Chargers', 'Zappi', 'Untethered Black', '7/22kW', '', '$1,275', ''],
    // String inverters
    ['String Inverters', 'Sungrow', 'SG5.0RS', '5kW', '1P', '$879', ''],
    ['String Inverters', 'Sungrow', 'SG10RT', '10kW', '3P', '$1,649', ''],
    ['String Inverters', 'Fronius', 'GEN24 5kW', '5kW', '1P', '$1,670', ''],
    ['String Inverters', 'Fronius', 'GEN24 10kW', '10kW', '1P', '$2,643', ''],
  ]);
}

function _setupSettings_(ss) {
  var s = _getOrCreateTab_(ss, 'Settings');
  _writeRows_(s, [
    ['Key', 'Value'],
    ['Last Updated', '2026-05-05'],
    ['Sales Commission ($)', '1000'],
    ['Installation Commission ($)', '2000'],
    ['Solar Victoria Rebate ($)', '1400'],
    ['Margin Target %', 'TBD by Jesse'],
    ['GST Note', 'SJ prices are ex-GST; HEA sell prices include GST'],
  ]);
}
