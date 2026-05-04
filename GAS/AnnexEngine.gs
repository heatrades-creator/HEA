/**
 * AnnexEngine.gs — Google Slides annex generator
 * Part of GAS/HEAJobsAPI project.
 *
 * Generates per-job Google Slides copies from master templates,
 * fills {TOKEN} placeholders with job data, exports to PDF,
 * saves to the correct Drive subfolder, and returns edit + PDF links.
 *
 * FIRST-TIME SETUP
 * ─────────────────
 * 1. Open the GAS editor for this project
 * 2. Run setupAnnexMasterTemplates_() — it creates 4 master Slides files
 *    in a "HEA Annex Master Templates" folder in Drive
 * 3. IDs are saved to Script Properties automatically
 * 4. Open each Slides file and beautify the design (the tokens will be there)
 * 5. That's it. The system reads IDs from Properties at generation time.
 *
 * ADDING A NEW ANNEX TEMPLATE
 * ─────────────────────────────
 * 1. Add the slug to ANNEX_SLIDES_SLUGS
 * 2. Add subfolder to ANNEX_SUBFOLDERS
 * 3. Add payload builder to buildAnnexPayload_()
 * 4. Add setup entry to setupAnnexMasterTemplates_()
 * 5. Run setup, design the template, update status in lib/document-config.ts
 */

// ── Config ───────────────────────────────────────────────────────────────────

// Annexes with Slides-based generation (other slugs use pdf-lib or Drive fetch)
var ANNEX_SLIDES_SLUGS = ['site-assessment', 'financial-outcomes', 'system-spec', 'nmi-data'];

// Drive subfolder for each annex (must match naming-conventions.md)
var ANNEX_SUBFOLDERS = {
  'site-assessment':        '06-jobfiles',
  'financial-outcomes':     '02-proposals',
  'system-spec':            '01-quotes',
  'nmi-data':               '00-nmi-data',
  'client-photos-intake':   '05-photos',
  'client-photos-followup': '05-photos',
  'installer-photos':       '05-photos',
  'hea-sa':                 '01-quotes',
  'open-solar':             '02-proposals',
};

// ── Master template ID access ─────────────────────────────────────────────────

function getAnnexMasterTemplateId_(slug) {
  return PropertiesService.getScriptProperties().getProperty('ANNEX_TPL_' + slug) || '';
}

// Returns master template info for the Templates dashboard page.
// Each entry: { slug, editUrl, configured }
function getAnnexTemplateInfo_() {
  var slugs = ANNEX_SLIDES_SLUGS;
  return slugs.map(function(slug) {
    var id = getAnnexMasterTemplateId_(slug);
    return {
      slug: slug,
      editUrl: id ? 'https://docs.google.com/presentation/d/' + id + '/edit' : null,
      configured: !!id,
    };
  });
}

// ── Main generation entry point ───────────────────────────────────────────────

function generateAnnex_(jobNumber, annexSlug) {
  if (ANNEX_SLIDES_SLUGS.indexOf(annexSlug) === -1) {
    throw new Error(
      'Annex "' + annexSlug + '" is not a Slides-based annex. ' +
      'Photo annexes use pdf-lib. hea-sa and open-solar have separate fetch paths.'
    );
  }

  var masterId = getAnnexMasterTemplateId_(annexSlug);
  if (!masterId) {
    throw new Error(
      'No master template configured for "' + annexSlug + '". ' +
      'Run setupAnnexMasterTemplates_() in the GAS editor first.'
    );
  }

  var job = findJobByNumber(getSheet(), jobNumber);
  if (!job) throw new Error('Job not found: ' + jobNumber);
  if (!job.driveUrl) throw new Error('Job has no Drive folder: ' + jobNumber);

  // Locate job Drive folder
  var folderId = (job.driveUrl.match(/folders\/([a-zA-Z0-9_-]+)/) || [])[1];
  if (!folderId) throw new Error('Cannot parse Drive folder ID from job ' + jobNumber);

  var clientFolder = DriveApp.getFolderById(folderId);
  var subfolderName = ANNEX_SUBFOLDERS[annexSlug] || '06-jobfiles';
  var subfolder = getOrCreateDriveFolder_(clientFolder, subfolderName);

  // Build file name
  var today = Utilities.formatDate(new Date(), 'Australia/Melbourne', 'yyyy-MM-dd');
  var clientSlug = safeString_(job.clientName || 'Client').replace(/\s+/g, '-');
  var baseName = jobNumber + '-annex-' + annexSlug + '-' + clientSlug + '-' + today;
  var pdfFileName = baseName + '.pdf';
  var slidesFileName = baseName + ' (editable)';

  // Copy master template to job subfolder
  var masterFile = DriveApp.getFileById(masterId);
  var copy = masterFile.makeCopy(slidesFileName, subfolder);
  var copyId = copy.getId();
  var editUrl = 'https://docs.google.com/presentation/d/' + copyId + '/edit';

  // Build payload and fill placeholders
  var payload = buildAnnexPayload_(job, annexSlug, today);
  _fillSlidesPlaceholders_(copyId, payload);

  // Export to PDF
  var pdfUrl = _exportSlidesToPdf_(copyId, pdfFileName, subfolder);

  // Log to sheet
  _logAnnexJob_(jobNumber, annexSlug, copyId, editUrl, pdfUrl, pdfFileName);

  return {
    success:      true,
    jobNumber:    jobNumber,
    annexSlug:    annexSlug,
    editUrl:      editUrl,
    pdfUrl:       pdfUrl,
    pdfFileName:  pdfFileName,
    slidesFileId: copyId,
  };
}

// ── Placeholder filling ───────────────────────────────────────────────────────

function _fillSlidesPlaceholders_(fileId, payload) {
  var presentation = SlidesApp.openById(fileId);
  var slides = presentation.getSlides();

  slides.forEach(function(slide) {
    // Text shapes
    slide.getShapes().forEach(function(shape) {
      try {
        var tr = shape.getText();
        if (!tr) return;
        Object.keys(payload).forEach(function(key) {
          try { tr.replaceAllText(key, String(payload[key] !== null && payload[key] !== undefined ? payload[key] : '')); } catch(e) {}
        });
      } catch(e) {}
    });
    // Tables
    slide.getTables().forEach(function(table) {
      for (var r = 0; r < table.getNumRows(); r++) {
        for (var c = 0; c < table.getNumColumns(); c++) {
          try {
            var cellTr = table.getCell(r, c).getText();
            Object.keys(payload).forEach(function(key) {
              try { cellTr.replaceAllText(key, String(payload[key] !== null && payload[key] !== undefined ? payload[key] : '')); } catch(e) {}
            });
          } catch(e) {}
        }
      }
    });
  });

  presentation.saveAndClose();
}

// ── PDF export ────────────────────────────────────────────────────────────────

function _exportSlidesToPdf_(fileId, pdfFileName, destinationFolder) {
  var exportUrl = 'https://docs.google.com/presentation/d/' + fileId + '/export/pdf';
  var token = ScriptApp.getOAuthToken();
  var resp = UrlFetchApp.fetch(exportUrl, {
    headers: { Authorization: 'Bearer ' + token },
    muteHttpExceptions: true,
  });
  if (resp.getResponseCode() !== 200) {
    throw new Error('PDF export failed with HTTP ' + resp.getResponseCode());
  }
  var pdfBlob = resp.getBlob().setName(pdfFileName);
  var pdfFile = destinationFolder.createFile(pdfBlob);
  pdfFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return pdfFile.getUrl();
}

// ── Payload builders ─────────────────────────────────────────────────────────

function buildAnnexPayload_(job, slug, today) {
  if (slug === 'site-assessment')    return _buildSiteAssessmentPayload_(job, today);
  if (slug === 'financial-outcomes') return _buildFinancialOutcomesPayload_(job, today);
  if (slug === 'system-spec')        return _buildSystemSpecPayload_(job, today);
  if (slug === 'nmi-data')           return _buildNMIDataPayload_(job, today);
  return {};
}

// ── Site Assessment payload ───────────────────────────────────────────────────

function _buildSiteAssessmentPayload_(job, today) {
  var hasBattery = parseFloat(job.batterySize) > 0;
  var serviceDesc = hasBattery
    ? 'Solar ' + job.systemSize + ' kW + Battery ' + job.batterySize + ' kWh'
    : 'Solar ' + job.systemSize + ' kW';
  var satelUrl = 'google.com/maps/search/' + encodeURIComponent(job.address) + '/@?data=!3m1!1e3';

  return {
    '{SA_JobNumber}':       job.jobNumber      || '',
    '{SA_ClientName}':      job.clientName     || '',
    '{SA_Phone}':           job.phone          || '',
    '{SA_Email}':           job.email          || '',
    '{SA_Address}':         job.address        || '',
    '{SA_Postcode}':        job.postcode       || '',
    '{SA_CreatedDate}':     job.createdDate    || '',
    '{SA_ServiceDesc}':     serviceDesc,
    '{SA_SystemSizeKw}':    job.systemSize     ? job.systemSize + ' kW'  : 'TBA',
    '{SA_BatterySizeKwh}':  hasBattery         ? job.batterySize + ' kWh': 'No battery',
    '{SA_RoofMaterial}':    '',   // fill on site
    '{SA_RoofOrientation}': '',   // fill on site
    '{SA_ShadingIssues}':   '',   // fill on site
    '{SA_Phases}':          '',   // fill on site
    '{SA_Occupants}':       job.occupants       || '—',
    '{SA_HomeDaytime}':     job.homeDaytime     || '—',
    '{SA_HotWater}':        job.hotWater        || '—',
    '{SA_GasAppliances}':   job.gasAppliances   || '—',
    '{SA_Ev}':              job.ev              || '—',
    '{SA_FinanceRequired}': job.financeRequired ? 'Yes' : 'No',
    '{SA_WifiSsid}':        job.wifiSsid        || '',
    '{SA_WifiPassword}':    job.wifiPassword    || '',
    '{SA_EpsCircuit1}':     job.epsCircuit1     || '',
    '{SA_EpsCircuit2}':     job.epsCircuit2     || '',
    '{SA_EpsCircuit3}':     job.epsCircuit3     || '',
    '{SA_Notes}':           job.notes           || '',
    '{SA_SatelliteUrl}':    satelUrl,
    '{SA_GeneratedDate}':   today,
  };
}

// ── Financial Outcomes payload ────────────────────────────────────────────────

function _buildFinancialOutcomesPayload_(job, today) {
  var calc = _calcSolarFinancials_(job);

  var p = {
    '{FO_JobNumber}':         job.jobNumber   || '',
    '{FO_ClientName}':        job.clientName  || '',
    '{FO_Address}':           job.address     || '',
    '{FO_GeneratedDate}':     today,
    '{FO_SystemSizeKw}':      calc.sizeKw > 0 ? calc.sizeKw + ' kW'   : 'TBA',
    '{FO_BatterySizeKwh}':    parseFloat(job.batterySize) > 0 ? job.batterySize + ' kWh' : 'No battery',
    '{FO_AnnualBillAud}':     calc.billAud   > 0 ? '$' + _r(calc.billAud)    + '/yr' : '—',
    '{FO_SystemCostAud}':     calc.costAud   > 0 ? '$' + _r(calc.costAud)              : '—',
    '{FO_AnnualGenKwh}':      _r(calc.annualGenKwh) + ' kWh',
    '{FO_ImportSavingsAud}':  '$' + _r(calc.importSavings) + '/yr',
    '{FO_FitIncomeAud}':      '$' + _r(calc.fitIncome) + '/yr',
    '{FO_Year1BenefitAud}':   '$' + _r(calc.year1Savings) + '/yr',
    '{FO_BillReductionPct}':  _r(calc.billReductPct) + '%',
    '{FO_PaybackYears}':      calc.simplePayback < 50 ? calc.simplePayback.toFixed(1) + ' years' : '—',
    '{FO_Total25YrAud}':      '$' + _r(calc.total25yr),
    '{FO_CarbonTonnesPerYr}': calc.carbonPerYr.toFixed(1) + ' t CO₂-e/yr',
    '{FO_CarsEquiv}':         String(calc.carsEquiv),
    '{FO_RetailTariff}':      '$0.28/kWh',
    '{FO_FeedInTariff}':      '$0.05/kWh',
    '{FO_SelfConsumptionPct}':'35%',
    '{FO_TariffEscPct}':      '3%/yr',
    '{FO_DegradationPct}':    '0.5%/yr',
  };

  // 10-year table tokens
  for (var yr = 1; yr <= 10; yr++) {
    var tr = calc.table[yr - 1];
    p['{FO_Yr' + yr + 'Savings}'] = tr ? '$' + _r(tr.savings) : '—';
    p['{FO_Yr' + yr + 'Cumul}']   = tr ? '$' + _r(tr.cumulative) : '—';
  }

  return p;
}

// Solar financial calculations — mirrors lib/annexes/financial-outcomes.ts
function _calcSolarFinancials_(job) {
  var GEN_PER_KW  = 1350;
  var SELF_CONS   = 0.35;
  var RETAIL      = 0.28;
  var FIT         = 0.05;
  var TARIFF_ESC  = 0.03;
  var DEGRADATION = 0.005;
  var CO2_FACTOR  = 0.81;   // kg/kWh VIC grid (DCCEE 2023)
  var YEARS       = 25;

  var sizeKw  = parseFloat(job.systemSize)  || 0;
  var costAud = _parseAmt_(job.totalPrice)  || 0;
  var billAud = _parseAmt_(job.annualBill)  || 0;

  var annualGenKwh  = sizeKw * GEN_PER_KW;
  var selfConsKwh   = annualGenKwh * SELF_CONS;
  var exportKwh     = annualGenKwh * (1 - SELF_CONS);
  var importSavings = selfConsKwh  * RETAIL;
  var fitIncome     = exportKwh    * FIT;
  var year1Savings  = importSavings + fitIncome;
  var billReductPct = billAud > 0 ? (year1Savings / billAud) * 100 : 0;
  var simplePayback = year1Savings > 0 ? costAud / year1Savings : 999;
  var carbonPerYr   = annualGenKwh * CO2_FACTOR / 1000;
  var carsEquiv     = Math.round(carbonPerYr * 1000 / 2300);

  var table = [];
  var cumulative = 0;
  for (var yr = 1; yr <= YEARS; yr++) {
    var gen = annualGenKwh * Math.pow(1 - DEGRADATION, yr - 1);
    var tar = RETAIL * Math.pow(1 + TARIFF_ESC, yr - 1);
    var fit = FIT    * Math.pow(1 + TARIFF_ESC * 0.5, yr - 1);
    var sav = gen * SELF_CONS * tar + gen * (1 - SELF_CONS) * fit;
    cumulative += sav;
    table.push({ year: yr, genKwh: gen, savings: sav, cumulative: cumulative });
  }

  return {
    sizeKw: sizeKw, costAud: costAud, billAud: billAud,
    annualGenKwh: annualGenKwh, importSavings: importSavings, fitIncome: fitIncome,
    year1Savings: year1Savings, billReductPct: billReductPct, simplePayback: simplePayback,
    carbonPerYr: carbonPerYr, carsEquiv: carsEquiv,
    total25yr: cumulative, table: table,
  };
}

// ── System Spec payload ───────────────────────────────────────────────────────

function _buildSystemSpecPayload_(job, today) {
  var hasBattery = parseFloat(job.batterySize) > 0;
  var hasEv = job.ev && !job.ev.toLowerCase().startsWith('no');

  return {
    '{SS_JobNumber}':      job.jobNumber   || '',
    '{SS_ClientName}':     job.clientName  || '',
    '{SS_Address}':        job.address     || '',
    '{SS_Postcode}':       job.postcode    || '',
    '{SS_Date}':           today,
    '{SS_Status}':         job.status      || '',
    '{SS_SystemSizeKw}':   job.systemSize  ? job.systemSize + ' kW DC' : 'TBA',
    // Panel fields — filled in template after job is detailed
    '{SS_PanelMake}':      '',
    '{SS_PanelModel}':     '',
    '{SS_PanelWatts}':     '',
    '{SS_PanelCount}':     '',
    // Inverter fields
    '{SS_InverterType}':   '',
    '{SS_InverterMake}':   '',
    '{SS_InverterModel}':  '',
    '{SS_InverterKw}':     '',
    // Battery
    '{SS_BatterySizeKwh}': hasBattery ? job.batterySize + ' kWh' : 'No battery',
    '{SS_BatteryMake}':    '',
    '{SS_BatteryModel}':   '',
    '{SS_BatteryUsableKwh}': '',
    '{SS_EpsCircuit1}':    job.epsCircuit1 || '',
    '{SS_EpsCircuit2}':    job.epsCircuit2 || '',
    '{SS_EpsCircuit3}':    job.epsCircuit3 || '',
    '{SS_WifiSsid}':       job.wifiSsid    || '',
    '{SS_WifiPassword}':   job.wifiPassword|| '',
    // EV
    '{SS_EvStatus}':       hasEv ? job.ev : 'No EV',
    '{SS_EvChargerMake}':  '',
    '{SS_EvChargerModel}': '',
    '{SS_EvChargerKw}':    '',
    // Install
    '{SS_RoofType}':       '',
    '{SS_MountingType}':   '',
    '{SS_CableRunMetres}': '',
    '{SS_Notes}':          job.notes || '',
  };
}

// ── NMI Data payload ──────────────────────────────────────────────────────────
// nmiData is optional; if absent, all NMI fields are blank (fill manually).

function _buildNMIDataPayload_(job, today, nmiData) {
  var d = nmiData || {};
  return {
    '{NMI_JobNumber}':     job.jobNumber  || '',
    '{NMI_ClientName}':    job.clientName || '',
    '{NMI_Address}':       job.address    || '',
    '{NMI_GeneratedDate}': today,
    '{NMI_NmiNumber}':     d.nmiNumber     || '',
    '{NMI_Dnsp}':          d.dnsp          || '',
    '{NMI_TariffName}':    d.tariffName    || '',
    '{NMI_ImportRateKwh}': d.importRateKwh ? '$' + d.importRateKwh.toFixed(4) + '/kWh' : '',
    '{NMI_FeedInRateKwh}': d.feedInRateKwh ? '$' + d.feedInRateKwh.toFixed(4) + '/kWh' : '',
    '{NMI_AnnualKwh}':     d.annualKwh     ? _r(d.annualKwh) + ' kWh' : '',
    '{NMI_AvgDailyKwh}':   d.avgDailyKwh   ? d.avgDailyKwh.toFixed(1)  + ' kWh/day' : '',
    '{NMI_PeakPct}':       d.peakPct       ? d.peakPct.toFixed(0) + '%' : '',
    '{NMI_OffpeakPct}':    d.offpeakPct    ? d.offpeakPct.toFixed(0) + '%' : '',
    '{NMI_DaysAccepted}':  d.daysAccepted  ? String(d.daysAccepted)  : '',
    '{NMI_ChosenChannel}': d.chosenChannel || '',
    '{NMI_Phases}':        d.phases        || '',
  };
}

// ── Annex jobs log ────────────────────────────────────────────────────────────

function _logAnnexJob_(jobNumber, slug, slidesId, editUrl, pdfUrl, pdfFileName) {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('ANNEX_JOBS');
  if (!sheet) {
    sheet = ss.insertSheet('ANNEX_JOBS');
    sheet.appendRow(['job_number', 'annex_slug', 'slides_file_id', 'edit_url', 'pdf_url', 'pdf_file_name', 'generated_at']);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, 7).setFontWeight('bold');
  }
  sheet.appendRow([
    jobNumber, slug, slidesId, editUrl, pdfUrl, pdfFileName,
    new Date().toISOString(),
  ]);
}

function getAnnexJobsForJob_(jobNumber) {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('ANNEX_JOBS');
  if (!sheet || sheet.getLastRow() < 2) return [];
  var data    = sheet.getDataRange().getValues();
  var headers = data[0];
  var jnCol   = headers.indexOf('job_number');
  return data.slice(1)
    .filter(function(row) { return String(row[jnCol]) === String(jobNumber); })
    .map(function(row) {
      var obj = {};
      headers.forEach(function(h, i) { obj[h] = row[i]; });
      return obj;
    })
    .reverse();
}

// ── Number helpers ────────────────────────────────────────────────────────────

function _r(n) { return Math.round(n).toLocaleString('en-AU'); }

function _parseAmt_(val) {
  if (!val) return 0;
  return parseFloat(String(val).replace(/[$,\s]/g, '')) || 0;
}

// ── First-time setup ─────────────────────────────────────────────────────────
//
// Run ONCE from the GAS editor: setupAnnexMasterTemplates_()
// Creates 4 fully designed master Slides in "HEA Annex Master Templates" folder.
// IDs are saved to Script Properties automatically.
// Re-run at any time to regenerate templates from scratch.
//
// TOKEN REFERENCE — all tokens available per annex:
//
// FINANCIAL OUTCOMES (financial-outcomes)
//   {FO_JobNumber}  {FO_ClientName}  {FO_Address}  {FO_GeneratedDate}
//   {FO_SystemSizeKw}  {FO_BatterySizeKwh}  {FO_AnnualBillAud}  {FO_SystemCostAud}
//   {FO_AnnualGenKwh}  {FO_ImportSavingsAud}  {FO_FitIncomeAud}
//   {FO_Year1BenefitAud}  {FO_BillReductionPct}  {FO_PaybackYears}
//   {FO_Total25YrAud}  {FO_CarbonTonnesPerYr}  {FO_CarsEquiv}
//   {FO_Yr1Savings}…{FO_Yr10Savings}  {FO_Yr1Cumul}…{FO_Yr10Cumul}
//   {FO_RetailTariff}  {FO_FeedInTariff}  {FO_SelfConsumptionPct}
//   {FO_TariffEscPct}  {FO_DegradationPct}
//
// SITE ASSESSMENT (site-assessment)
//   {SA_JobNumber}  {SA_ClientName}  {SA_Phone}  {SA_Email}
//   {SA_Address}  {SA_Postcode}  {SA_CreatedDate}  {SA_ServiceDesc}
//   {SA_SystemSizeKw}  {SA_BatterySizeKwh}
//   {SA_RoofMaterial}  {SA_RoofOrientation}  {SA_ShadingIssues}  {SA_Phases}
//   {SA_Occupants}  {SA_HomeDaytime}  {SA_HotWater}  {SA_GasAppliances}  {SA_Ev}
//   {SA_FinanceRequired}  {SA_SatelliteUrl}
//   {SA_WifiSsid}  {SA_WifiPassword}
//   {SA_EpsCircuit1}  {SA_EpsCircuit2}  {SA_EpsCircuit3}
//   {SA_Notes}  {SA_GeneratedDate}
//
// SYSTEM SPECIFICATION (system-spec)
//   {SS_JobNumber}  {SS_ClientName}  {SS_Address}  {SS_Postcode}  {SS_Date}  {SS_Status}
//   {SS_SystemSizeKw}  {SS_PanelMake}  {SS_PanelModel}  {SS_PanelWatts}  {SS_PanelCount}
//   {SS_InverterType}  {SS_InverterMake}  {SS_InverterModel}  {SS_InverterKw}
//   {SS_BatterySizeKwh}  {SS_BatteryMake}  {SS_BatteryModel}  {SS_BatteryUsableKwh}
//   {SS_EpsCircuit1}  {SS_EpsCircuit2}  {SS_EpsCircuit3}
//   {SS_WifiSsid}  {SS_WifiPassword}
//   {SS_EvStatus}  {SS_EvChargerMake}  {SS_EvChargerModel}  {SS_EvChargerKw}
//   {SS_RoofType}  {SS_MountingType}  {SS_CableRunMetres}  {SS_Notes}
//
// NMI & GRID DATA (nmi-data)
//   {NMI_JobNumber}  {NMI_ClientName}  {NMI_Address}  {NMI_GeneratedDate}
//   {NMI_NmiNumber}  {NMI_Dnsp}  {NMI_TariffName}  {NMI_Phases}
//   {NMI_ImportRateKwh}  {NMI_FeedInRateKwh}
//   {NMI_AnnualKwh}  {NMI_AvgDailyKwh}  {NMI_PeakPct}  {NMI_OffpeakPct}
//   {NMI_DaysAccepted}  {NMI_ChosenChannel}

function setupAnnexMasterTemplates_() {
  var parent    = DriveApp.getFolderById(CLIENTS_FOLDER_ID).getParent();
  var tplFolder = getOrCreateDriveFolder_(parent, 'HEA Annex Master Templates');

  var builders = {
    'financial-outcomes': _createFinancialOutcomesTemplate_,
    'site-assessment':    _createSiteAssessmentTemplate_,
    'system-spec':        _createSystemSpecTemplate_,
    'nmi-data':           _createNMIDataTemplate_,
  };

  var results = {};
  Object.keys(builders).forEach(function(slug) {
    var id = builders[slug](tplFolder);
    PropertiesService.getScriptProperties().setProperty('ANNEX_TPL_' + slug, id);
    results[slug] = { id: id, editUrl: 'https://docs.google.com/presentation/d/' + id + '/edit' };
    Logger.log('[SETUP] ' + slug + ' → ' + id);
  });

  Logger.log('=== SETUP COMPLETE — 4 master templates created ===');
  Logger.log(JSON.stringify(results, null, 2));
  return results;
}

// ── Shared slide helpers ───────────────────────────────────────────────────────

var _W = 720, _H = 540;

function _movePresToFolder_(presId, folder) {
  var file = DriveApp.getFileById(presId);
  folder.addFile(file);
  DriveApp.getRootFolder().removeFile(file);
}

function _clearSlide_(slide) {
  slide.getPageElements().forEach(function(el) { try { el.remove(); } catch(e) {} });
}

// Full HEA header: dark logo block left + company info right + yellow rule.
// Returns y position after header (75).
function _annexHeader_(slide) {
  var W = _W;
  // Dark logo panel
  var logoBg = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, 0, 0, 192, 72);
  logoBg.getFill().setSolidFill('#111827');
  logoBg.getBorder().setTransparent();

  var heaLabel = slide.insertTextBox('HEA', 10, 8, 56, 36);
  heaLabel.getText().setText('HEA');
  heaLabel.getText().getTextStyle().setFontSize(30).setBold(true).setForegroundColor('#FFD100').setFontFamily('Arial');

  var companyLabel = slide.insertTextBox('HEFFERNAN\nELECTRICAL\nAUTOMATION', 72, 8, 112, 56);
  companyLabel.getText().setText('HEFFERNAN\nELECTRICAL\nAUTOMATION');
  companyLabel.getText().getTextStyle().setFontSize(7.5).setBold(true).setForegroundColor('#ffffff').setFontFamily('Arial');

  // White fill rest of header row
  var hdrBg = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, 192, 0, W - 192, 72);
  hdrBg.getFill().setSolidFill('#ffffff');
  hdrBg.getBorder().setTransparent();

  // Company info right
  var info = slide.insertTextBox(
    'Heffernan Electrical Automation PTY LTD\nREC 37307\nMobile: 0481 267 812\ninfo@hea-group.com.au  ·  hea-group.com.au',
    W - 228, 8, 220, 56
  );
  info.getText().setText('Heffernan Electrical Automation PTY LTD\nREC 37307\nMobile: 0481 267 812\ninfo@hea-group.com.au  ·  hea-group.com.au');
  info.getText().getTextStyle().setFontSize(7.5).setForegroundColor('#374151').setFontFamily('Arial');
  info.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.END);

  // Yellow rule
  var rule = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, 0, 72, W, 3);
  rule.getFill().setSolidFill('#FFD100');
  rule.getBorder().setTransparent();

  return 75;
}

// Compact header for detail slides (dark bar, single line). Returns y after (48).
function _annexCompactHeader_(slide, docTitle, jobToken, clientToken) {
  var W = _W;
  var bar = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, 0, 0, W, 44);
  bar.getFill().setSolidFill('#111827');
  bar.getBorder().setTransparent();

  // Left: HEA pill
  var pill = slide.insertTextBox('HEA', 10, 12, 36, 20);
  pill.getText().setText('HEA');
  pill.getText().getTextStyle().setFontSize(11).setBold(true).setForegroundColor('#FFD100').setFontFamily('Arial');

  // Right: doc title + tokens
  var label = slide.insertTextBox(
    docTitle + '  ·  ' + clientToken + '  ·  ' + jobToken,
    56, 14, W - 66, 16
  );
  label.getText().setText(docTitle + '  ·  ' + clientToken + '  ·  ' + jobToken);
  label.getText().getTextStyle().setFontSize(8).setForegroundColor('#ffffff').setFontFamily('Arial');

  var rule = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, 0, 44, W, 3);
  rule.getFill().setSolidFill('#FFD100');
  rule.getBorder().setTransparent();

  return 47;
}

// Info strip: array of {label, value} objects, spread across 4 columns.
// Returns y after strip.
function _annexInfoStrip_(slide, y, fields) {
  var W = _W;
  var stripH = 44;
  var bg = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, 0, y, W, stripH);
  bg.getFill().setSolidFill('#f9fafb');
  bg.getBorder().setTransparent();

  var colW = W / fields.length;
  fields.forEach(function(f, i) {
    var x = i * colW + 10;
    var lbl = slide.insertTextBox(f.label, x, y + 4, colW - 14, 14);
    lbl.getText().setText(f.label);
    lbl.getText().getTextStyle().setFontSize(6.5).setBold(true).setForegroundColor('#6b7280').setFontFamily('Arial');
    var val = slide.insertTextBox(f.value, x, y + 18, colW - 14, 22);
    val.getText().setText(f.value);
    val.getText().getTextStyle().setFontSize(9).setForegroundColor('#111827').setFontFamily('Arial');
  });

  return y + stripH;
}

// Dark hero section. Returns y after hero.
function _annexHero_(slide, y, heroH, line1, highlight, line2, subtext) {
  var W = _W;
  var bg = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, 0, y, W, heroH);
  bg.getFill().setSolidFill('#1f2937');
  bg.getBorder().setTransparent();

  var contentW = W * 0.58;

  if (line1) {
    var t1 = slide.insertTextBox(line1, 20, y + 14, contentW, 28);
    t1.getText().setText(line1);
    t1.getText().getTextStyle().setFontSize(18).setBold(true).setForegroundColor('#ffffff').setFontFamily('Arial');
  }
  if (highlight) {
    var hl = slide.insertTextBox(highlight, 20, y + 42, contentW, 46);
    hl.getText().setText(highlight);
    hl.getText().getTextStyle().setFontSize(30).setBold(true).setForegroundColor('#FFD100').setFontFamily('Arial');
  }
  if (line2) {
    var t2 = slide.insertTextBox(line2, 20, y + 88, contentW, 28);
    t2.getText().setText(line2);
    t2.getText().getTextStyle().setFontSize(18).setBold(true).setForegroundColor('#ffffff').setFontFamily('Arial');
  }
  if (subtext) {
    var sub = slide.insertTextBox(subtext, W * 0.62, y + 16, W * 0.36, heroH - 28);
    sub.getText().setText(subtext);
    sub.getText().getTextStyle().setFontSize(9).setForegroundColor('#9ca3af').setFontFamily('Arial');
  }

  return y + heroH;
}

// Bottom stats bar with yellow values. stats = [{value, label}].
function _annexStatsBar_(slide, y, stats) {
  var W = _W;
  var barH = _H - y;
  var bg = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, 0, y, W, barH);
  bg.getFill().setSolidFill('#111827');
  bg.getBorder().setTransparent();

  var colW = W / stats.length;
  stats.forEach(function(stat, i) {
    var x = i * colW + 20;
    var vb = slide.insertTextBox(stat.value, x, y + 10, colW - 24, 42);
    vb.getText().setText(stat.value);
    vb.getText().getTextStyle().setFontSize(24).setBold(true).setForegroundColor('#FFD100').setFontFamily('Arial');
    var lb = slide.insertTextBox(stat.label, x, y + 54, colW - 24, 14);
    lb.getText().setText(stat.label);
    lb.getText().getTextStyle().setFontSize(7).setBold(true).setForegroundColor('#9ca3af').setFontFamily('Arial');
  });
}

// Section heading band on a detail slide.
function _sectionBand_(slide, y, text) {
  var W = _W;
  var bg = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, 16, y, W - 32, 16);
  bg.getFill().setSolidFill('#111827');
  bg.getBorder().setTransparent();
  var lbl = slide.insertTextBox(text, 20, y + 1, W - 40, 14);
  lbl.getText().setText(text);
  lbl.getText().getTextStyle().setFontSize(7).setBold(true).setForegroundColor('#FFD100').setFontFamily('Arial');
  return y + 18;
}

// Two-column label:value rows. rows = [[label, token], ...]. Returns y after.
function _fieldRows_(slide, y, rows, col1X, col2X, rowH) {
  col1X = col1X || 20;
  col2X = col2X || 170;
  rowH  = rowH  || 16;
  rows.forEach(function(row) {
    var lbl = slide.insertTextBox(row[0], col1X, y, col2X - col1X - 6, rowH - 2);
    lbl.getText().setText(row[0]);
    lbl.getText().getTextStyle().setFontSize(8).setBold(true).setForegroundColor('#374151').setFontFamily('Arial');
    var val = slide.insertTextBox(row[1], col2X, y, _W - col2X - 16, rowH - 2);
    val.getText().setText(row[1]);
    val.getText().getTextStyle().setFontSize(8).setForegroundColor('#111827').setFontFamily('Arial');
    y += rowH;
  });
  return y;
}

// ── Financial Outcomes template ───────────────────────────────────────────────
// Slide 1: Hero summary (matching Jesse's existing proposal design)
// Slide 2: 10-year savings table + key metrics
// Slide 3: Assumptions + environmental impact

function _createFinancialOutcomesTemplate_(tplFolder) {
  var pres = SlidesApp.create('MASTER — Financial Outcomes Annex');
  _movePresToFolder_(pres.getId(), tplFolder);

  // ── Slide 1: Hero ───────────────────────────────────────────────────────────
  var s1 = pres.getSlides()[0];
  _clearSlide_(s1);

  var y = _annexHeader_(s1);

  y = _annexInfoStrip_(s1, y, [
    { label: 'JOB NUMBER',  value: '{FO_JobNumber}'     },
    { label: 'DATE',        value: '{FO_GeneratedDate}' },
    { label: 'FOR',         value: '{FO_ClientName}'    },
    { label: 'ADDRESS',     value: '{FO_Address}'       },
  ]);

  y = _annexHero_(s1, y, 290,
    'YOUR PATH TO',
    '{FO_Year1BenefitAud}',
    'A YEAR IN SAVINGS',
    'Thank you for the opportunity to present your renewable energy solution.\n\n{FO_SystemSizeKw} Solar  +  {FO_BatterySizeKwh} Battery\nfor {FO_ClientName}\n\nYour system will offset {FO_CarbonTonnesPerYr} of CO₂ per year — equivalent to {FO_CarsEquiv} cars off the road.'
  );

  _annexStatsBar_(s1, y, [
    { value: '{FO_CarbonTonnesPerYr}', label: 'CO2 NET OFFSET' },
    { value: '{FO_PaybackYears}',      label: 'PAYBACK PERIOD' },
    { value: '{FO_Total25YrAud}',      label: '25 YEAR VALUE'  },
  ]);

  // ── Slide 2: 10-year table ──────────────────────────────────────────────────
  var s2 = pres.appendSlide(SlidesApp.PredefinedLayout.BLANK);
  _clearSlide_(s2);

  var y2 = _annexCompactHeader_(s2, 'Financial Outcomes', '{FO_JobNumber}', '{FO_ClientName}');
  y2 += 6;

  // Section title
  var stitle = s2.insertTextBox('10-YEAR SAVINGS PROJECTION', 16, y2, 400, 22);
  stitle.getText().setText('10-YEAR SAVINGS PROJECTION');
  stitle.getText().getTextStyle().setFontSize(14).setBold(true).setForegroundColor('#111827').setFontFamily('Arial');
  y2 += 26;

  var sub2 = s2.insertTextBox(
    'System: {FO_SystemSizeKw}  ·  Retail tariff: {FO_RetailTariff}  ·  Feed-in: {FO_FeedInTariff}  ·  Self-consumption: {FO_SelfConsumptionPct}  ·  Annual generation: {FO_AnnualGenKwh}',
    16, y2, _W - 32, 14
  );
  sub2.getText().setText('System: {FO_SystemSizeKw}  ·  Retail tariff: {FO_RetailTariff}  ·  Feed-in: {FO_FeedInTariff}  ·  Self-consumption: {FO_SelfConsumptionPct}  ·  Annual generation: {FO_AnnualGenKwh}');
  sub2.getText().getTextStyle().setFontSize(7.5).setForegroundColor('#6b7280').setFontFamily('Arial');
  y2 += 18;

  // Table: Year | Annual Savings | Cumulative
  var tblW = _W * 0.62;
  var tbl  = s2.insertTable(11, 3, 16, y2, tblW, 360);
  var tblHeaders = ['YEAR', 'ANNUAL SAVINGS', 'CUMULATIVE'];
  tblHeaders.forEach(function(h, c) {
    tbl.getCell(0, c).getFill().setSolidFill('#111827');
    tbl.getCell(0, c).getText().setText(h);
    tbl.getCell(0, c).getText().getTextStyle()
      .setFontSize(8).setBold(true).setForegroundColor('#FFD100').setFontFamily('Arial');
  });
  for (var yr = 1; yr <= 10; yr++) {
    var cells = [String(yr), '{FO_Yr' + yr + 'Savings}', '{FO_Yr' + yr + 'Cumul}'];
    cells.forEach(function(val, c) {
      tbl.getCell(yr, c).getFill().setSolidFill(yr % 2 === 0 ? '#f9fafb' : '#ffffff');
      tbl.getCell(yr, c).getText().setText(val);
      var ts = tbl.getCell(yr, c).getText().getTextStyle().setFontFamily('Arial').setFontSize(9);
      if (c === 2) tbl.getCell(yr, c).getText().getTextStyle().setForegroundColor('#059669');
    });
  }

  // Key metrics sidebar
  var metX = 16 + tblW + 12;
  var metW = _W - metX - 16;
  var metrics = [
    { label: 'YEAR 1 BENEFIT',  value: '{FO_Year1BenefitAud}'  },
    { label: 'BILL REDUCTION',  value: '{FO_BillReductionPct}' },
    { label: 'SYSTEM COST',     value: '{FO_SystemCostAud}'    },
    { label: 'IMPORT SAVINGS',  value: '{FO_ImportSavingsAud}' },
    { label: 'FEED-IN INCOME',  value: '{FO_FitIncomeAud}'     },
  ];
  var my = y2;
  metrics.forEach(function(m) {
    var mbg = s2.insertShape(SlidesApp.ShapeType.RECTANGLE, metX, my, metW, 46);
    mbg.getFill().setSolidFill('#111827');
    mbg.getBorder().setTransparent();
    var mlbl = s2.insertTextBox(m.label, metX + 8, my + 4, metW - 12, 12);
    mlbl.getText().setText(m.label);
    mlbl.getText().getTextStyle().setFontSize(6.5).setBold(true).setForegroundColor('#9ca3af').setFontFamily('Arial');
    var mval = s2.insertTextBox(m.value, metX + 8, my + 16, metW - 12, 24);
    mval.getText().setText(m.value);
    mval.getText().getTextStyle().setFontSize(16).setBold(true).setForegroundColor('#FFD100').setFontFamily('Arial');
    my += 50;
  });

  // ── Slide 3: Assumptions + environmental ────────────────────────────────────
  var s3 = pres.appendSlide(SlidesApp.PredefinedLayout.BLANK);
  _clearSlide_(s3);

  var y3 = _annexCompactHeader_(s3, 'Financial Outcomes — Assumptions', '{FO_JobNumber}', '{FO_ClientName}');
  y3 += 8;

  y3 = _sectionBand_(s3, y3, 'CALCULATION ASSUMPTIONS');
  y3 += 4;
  y3 = _fieldRows_(s3, y3, [
    ['Retail tariff',      '{FO_RetailTariff}'      ],
    ['Feed-in tariff',     '{FO_FeedInTariff}'      ],
    ['Self-consumption',   '{FO_SelfConsumptionPct}'],
    ['Tariff escalation',  '{FO_TariffEscPct}'      ],
    ['Panel degradation',  '{FO_DegradationPct}'    ],
    ['Annual generation',  '{FO_AnnualGenKwh}'      ],
    ['System cost',        '{FO_SystemCostAud}'     ],
    ['Current annual bill','{FO_AnnualBillAud}'     ],
  ]);

  y3 += 10;
  y3 = _sectionBand_(s3, y3, 'ENVIRONMENTAL IMPACT');
  y3 += 4;
  y3 = _fieldRows_(s3, y3, [
    ['CO₂ offset per year', '{FO_CarbonTonnesPerYr}'],
    ['Cars equivalent',     '{FO_CarsEquiv} cars off the road per year'],
    ['25-year total value',  '{FO_Total25YrAud}'     ],
  ]);

  y3 += 10;
  y3 = _sectionBand_(s3, y3, 'DISCLAIMER');
  y3 += 4;
  var disc = s3.insertTextBox(
    'Projections are estimates based on the assumptions above. Actual savings will vary depending on energy usage, tariff changes, shading, and system performance. This document does not constitute financial advice.',
    20, y3, _W - 36, 48
  );
  disc.getText().setText('Projections are estimates based on the assumptions above. Actual savings will vary depending on energy usage, tariff changes, shading, and system performance. This document does not constitute financial advice.');
  disc.getText().getTextStyle().setFontSize(7.5).setForegroundColor('#9ca3af').setFontFamily('Arial');

  pres.saveAndClose();
  return pres.getId();
}

// ── Site Assessment template ──────────────────────────────────────────────────
// Slide 1: Hero summary (address, system, key stats)
// Slide 2: Client details + system preference + roof & property
// Slide 3: Grid connection + household profile + battery/EPS + notes

function _createSiteAssessmentTemplate_(tplFolder) {
  var pres = SlidesApp.create('MASTER — Site Assessment Annex');
  _movePresToFolder_(pres.getId(), tplFolder);

  // ── Slide 1: Hero ───────────────────────────────────────────────────────────
  var s1 = pres.getSlides()[0];
  _clearSlide_(s1);

  var y = _annexHeader_(s1);

  y = _annexInfoStrip_(s1, y, [
    { label: 'JOB NUMBER', value: '{SA_JobNumber}'     },
    { label: 'DATE',       value: '{SA_GeneratedDate}' },
    { label: 'CLIENT',     value: '{SA_ClientName}'    },
    { label: 'ADDRESS',    value: '{SA_Address}'       },
  ]);

  y = _annexHero_(s1, y, 290,
    'SITE ASSESSMENT',
    '{SA_Address}',
    '{SA_ServiceDesc}',
    'Prepared for {SA_ClientName}\n\nPhone: {SA_Phone}\nEmail: {SA_Email}\n\nSystem interest:\n{SA_SystemSizeKw} Solar\n{SA_BatterySizeKwh} Battery\n\nCreated: {SA_CreatedDate}'
  );

  _annexStatsBar_(s1, y, [
    { value: '{SA_SystemSizeKw}',   label: 'SYSTEM SIZE'   },
    { value: '{SA_BatterySizeKwh}', label: 'BATTERY'       },
    { value: '{SA_Phases}',         label: 'PHASE SUPPLY'  },
  ]);

  // ── Slide 2: Client + roof details ──────────────────────────────────────────
  var s2 = pres.appendSlide(SlidesApp.PredefinedLayout.BLANK);
  _clearSlide_(s2);

  var y2 = _annexCompactHeader_(s2, 'Site Assessment', '{SA_JobNumber}', '{SA_ClientName}');
  y2 += 6;

  var half = Math.floor(_W / 2);

  // Left column
  y2 = _sectionBand_(s2, y2, 'CLIENT DETAILS');
  var leftY = y2 + 4;
  leftY = _fieldRows_(s2, leftY, [
    ['Job number', '{SA_JobNumber}'  ],
    ['Client',     '{SA_ClientName}' ],
    ['Phone',      '{SA_Phone}'      ],
    ['Email',      '{SA_Email}'      ],
    ['Address',    '{SA_Address}'    ],
    ['Postcode',   '{SA_Postcode}'   ],
    ['Created',    '{SA_CreatedDate}'],
  ], 20, 130, 17);

  leftY += 6;
  var sectionY2 = leftY;
  var bandBg = s2.insertShape(SlidesApp.ShapeType.RECTANGLE, 16, leftY, half - 32, 16);
  bandBg.getFill().setSolidFill('#111827');
  bandBg.getBorder().setTransparent();
  var bandLbl = s2.insertTextBox('SYSTEM PREFERENCE', 20, leftY + 1, half - 40, 14);
  bandLbl.getText().setText('SYSTEM PREFERENCE');
  bandLbl.getText().getTextStyle().setFontSize(7).setBold(true).setForegroundColor('#FFD100').setFontFamily('Arial');
  leftY += 20;

  // Yellow highlight box for system size
  var sysBg = s2.insertShape(SlidesApp.ShapeType.RECTANGLE, 20, leftY, half - 36, 38);
  sysBg.getFill().setSolidFill('#111827');
  sysBg.getBorder().setTransparent();
  var sysTxt = s2.insertTextBox('{SA_SystemSizeKw}  +  {SA_BatterySizeKwh}', 26, leftY + 4, half - 44, 28);
  sysTxt.getText().setText('{SA_SystemSizeKw}  +  {SA_BatterySizeKwh}');
  sysTxt.getText().getTextStyle().setFontSize(14).setBold(true).setForegroundColor('#FFD100').setFontFamily('Arial');
  leftY += 44;

  leftY = _fieldRows_(s2, leftY, [
    ['Finance required', '{SA_FinanceRequired}'],
    ['Service interest', '{SA_ServiceDesc}'    ],
  ], 20, 130, 17);

  // Right column — roof & property
  var rightX = half + 8;
  var rightY = y2 + 4;
  var roofBand = s2.insertShape(SlidesApp.ShapeType.RECTANGLE, rightX, rightY - 2, _W - rightX - 16, 16);
  roofBand.getFill().setSolidFill('#111827');
  roofBand.getBorder().setTransparent();
  var roofLbl = s2.insertTextBox('ROOF & PROPERTY', rightX + 4, rightY - 1, _W - rightX - 24, 14);
  roofLbl.getText().setText('ROOF & PROPERTY');
  roofLbl.getText().getTextStyle().setFontSize(7).setBold(true).setForegroundColor('#FFD100').setFontFamily('Arial');
  rightY += 18;

  rightY = _fieldRows_(s2, rightY, [
    ['Roof material',      '{SA_RoofMaterial}'   ],
    ['Main orientation',   '{SA_RoofOrientation}'],
    ['Shading conditions', '{SA_ShadingIssues}'  ],
    ['Roof pitch',         '—'                   ],
    ['Accessible areas',   '—'                   ],
    ['Obstructions',       '—'                   ],
    ['Satellite view',     '{SA_SatelliteUrl}'   ],
  ], rightX + 4, rightX + 120, 17);

  // ── Slide 3: Grid + household + battery ─────────────────────────────────────
  var s3 = pres.appendSlide(SlidesApp.PredefinedLayout.BLANK);
  _clearSlide_(s3);

  var y3 = _annexCompactHeader_(s3, 'Site Assessment', '{SA_JobNumber}', '{SA_ClientName}');
  y3 += 8;

  // Two columns
  var c1X = 20, c1VX = 130, c2X = half + 8, c2VX = half + 120;

  y3 = _sectionBand_(s3, y3, 'GRID CONNECTION');
  var col1Y = y3 + 4;
  col1Y = _fieldRows_(s3, col1Y, [
    ['Phase supply',       '{SA_Phases}'       ],
    ['Meter location',     '—'                 ],
    ['Switchboard loc.',   '—'                 ],
    ['Switchboard cap.',   '—'                 ],
    ['Spare circuits',     '—'                 ],
    ['NMI number',         '—'                 ],
  ], c1X, c1VX, 17);

  // Right column — household
  var col2Y = y3 + 4;
  var hhBand = s3.insertShape(SlidesApp.ShapeType.RECTANGLE, c2X - 4, y3 - 18, _W - c2X - 8, 16);
  hhBand.getFill().setSolidFill('#111827');
  hhBand.getBorder().setTransparent();
  var hhLbl = s3.insertTextBox('HOUSEHOLD PROFILE', c2X, y3 - 17, _W - c2X - 16, 14);
  hhLbl.getText().setText('HOUSEHOLD PROFILE');
  hhLbl.getText().getTextStyle().setFontSize(7).setBold(true).setForegroundColor('#FFD100').setFontFamily('Arial');

  col2Y = _fieldRows_(s3, col2Y, [
    ['Occupants',     '{SA_Occupants}'   ],
    ['Home daytime',  '{SA_HomeDaytime}' ],
    ['Hot water',     '{SA_HotWater}'    ],
    ['Gas appliances','{SA_GasAppliances}'],
    ['EV / planning', '{SA_Ev}'          ],
  ], c2X, c2VX, 17);

  var bottomY = Math.max(col1Y, col2Y) + 8;
  bottomY = _sectionBand_(s3, bottomY, 'BATTERY & EPS CONFIGURATION');
  bottomY += 4;
  bottomY = _fieldRows_(s3, bottomY, [
    ['Wi-Fi SSID',    '{SA_WifiSsid}'   ],
    ['Wi-Fi password','{SA_WifiPassword}'],
    ['EPS circuit 1', '{SA_EpsCircuit1}'],
    ['EPS circuit 2', '{SA_EpsCircuit2}'],
    ['EPS circuit 3', '{SA_EpsCircuit3}'],
  ], c1X, c1VX, 17);

  bottomY += 8;
  bottomY = _sectionBand_(s3, bottomY, 'SITE NOTES');
  bottomY += 4;
  var notesBox = s3.insertShape(SlidesApp.ShapeType.RECTANGLE, 16, bottomY, _W - 32, Math.min(80, _H - bottomY - 12));
  notesBox.getFill().setSolidFill('#f9fafb');
  notesBox.getBorder().setTransparent();
  var notesVal = s3.insertTextBox('{SA_Notes}', 22, bottomY + 4, _W - 44, Math.min(72, _H - bottomY - 16));
  notesVal.getText().setText('{SA_Notes}');
  notesVal.getText().getTextStyle().setFontSize(8.5).setForegroundColor('#374151').setFontFamily('Arial');

  pres.saveAndClose();
  return pres.getId();
}

// ── System Specification template ─────────────────────────────────────────────
// Slide 1: Hero (system size + status)
// Slide 2: Solar array + inverter + battery spec tables
// Slide 3: EV charger + installation + notes

function _createSystemSpecTemplate_(tplFolder) {
  var pres = SlidesApp.create('MASTER — System Specification Annex');
  _movePresToFolder_(pres.getId(), tplFolder);

  // ── Slide 1: Hero ───────────────────────────────────────────────────────────
  var s1 = pres.getSlides()[0];
  _clearSlide_(s1);

  var y = _annexHeader_(s1);

  y = _annexInfoStrip_(s1, y, [
    { label: 'JOB NUMBER', value: '{SS_JobNumber}' },
    { label: 'DATE',       value: '{SS_Date}'       },
    { label: 'CLIENT',     value: '{SS_ClientName}' },
    { label: 'STATUS',     value: '{SS_Status}'     },
  ]);

  y = _annexHero_(s1, y, 290,
    'SYSTEM SPECIFICATION',
    '{SS_SystemSizeKw}',
    'SOLAR SYSTEM FOR {SS_ClientName}',
    '{SS_Address}\n{SS_Postcode}\n\nSolar Array:\n{SS_PanelCount} × {SS_PanelMake} {SS_PanelModel}\n{SS_PanelWatts}W panels\n\nInverter:\n{SS_InverterMake} {SS_InverterModel}\n{SS_InverterKw}\n\nBattery:\n{SS_BatterySizeKwh}'
  );

  _annexStatsBar_(s1, y, [
    { value: '{SS_SystemSizeKw}',   label: 'SOLAR ARRAY'   },
    { value: '{SS_BatterySizeKwh}', label: 'BATTERY STORAGE'},
    { value: '{SS_InverterKw}',     label: 'INVERTER'       },
  ]);

  // ── Slide 2: Component spec tables ──────────────────────────────────────────
  var s2 = pres.appendSlide(SlidesApp.PredefinedLayout.BLANK);
  _clearSlide_(s2);

  var y2 = _annexCompactHeader_(s2, 'System Specification', '{SS_JobNumber}', '{SS_ClientName}');
  y2 += 6;

  var col2X = Math.floor(_W / 2) + 8;

  // Left: Solar + Inverter
  y2 = _sectionBand_(s2, y2, 'SOLAR ARRAY');
  var leftY2 = y2 + 4;
  leftY2 = _fieldRows_(s2, leftY2, [
    ['System size',  '{SS_SystemSizeKw}'  ],
    ['Panel make',   '{SS_PanelMake}'     ],
    ['Panel model',  '{SS_PanelModel}'    ],
    ['Panel watts',  '{SS_PanelWatts}'    ],
    ['Panel count',  '{SS_PanelCount}'    ],
  ], 20, 120, 17);

  leftY2 += 6;
  var invBandBg = s2.insertShape(SlidesApp.ShapeType.RECTANGLE, 16, leftY2, col2X - 32, 16);
  invBandBg.getFill().setSolidFill('#111827');
  invBandBg.getBorder().setTransparent();
  var invBandLbl = s2.insertTextBox('INVERTER', 20, leftY2 + 1, col2X - 40, 14);
  invBandLbl.getText().setText('INVERTER');
  invBandLbl.getText().getTextStyle().setFontSize(7).setBold(true).setForegroundColor('#FFD100').setFontFamily('Arial');
  leftY2 += 20;
  leftY2 = _fieldRows_(s2, leftY2, [
    ['Type',     '{SS_InverterType}' ],
    ['Make',     '{SS_InverterMake}' ],
    ['Model',    '{SS_InverterModel}'],
    ['Capacity', '{SS_InverterKw}'   ],
  ], 20, 120, 17);

  // Right: Battery + EPS
  var rightY2 = y2 + 4;
  var batBand = s2.insertShape(SlidesApp.ShapeType.RECTANGLE, col2X - 4, y2 - 18, _W - col2X - 8, 16);
  batBand.getFill().setSolidFill('#111827');
  batBand.getBorder().setTransparent();
  var batLbl = s2.insertTextBox('BATTERY STORAGE', col2X, y2 - 17, _W - col2X - 16, 14);
  batLbl.getText().setText('BATTERY STORAGE');
  batLbl.getText().getTextStyle().setFontSize(7).setBold(true).setForegroundColor('#FFD100').setFontFamily('Arial');

  rightY2 = _fieldRows_(s2, rightY2, [
    ['Capacity',       '{SS_BatterySizeKwh}'     ],
    ['Make',           '{SS_BatteryMake}'         ],
    ['Model',          '{SS_BatteryModel}'        ],
    ['Usable capacity','{SS_BatteryUsableKwh}'    ],
    ['Wi-Fi SSID',     '{SS_WifiSsid}'            ],
    ['Wi-Fi password', '{SS_WifiPassword}'        ],
    ['EPS circuit 1',  '{SS_EpsCircuit1}'         ],
    ['EPS circuit 2',  '{SS_EpsCircuit2}'         ],
    ['EPS circuit 3',  '{SS_EpsCircuit3}'         ],
  ], col2X, col2X + 110, 17);

  // ── Slide 3: EV + installation + notes ─────────────────────────────────────
  var s3 = pres.appendSlide(SlidesApp.PredefinedLayout.BLANK);
  _clearSlide_(s3);

  var y3 = _annexCompactHeader_(s3, 'System Specification', '{SS_JobNumber}', '{SS_ClientName}');
  y3 += 8;

  y3 = _sectionBand_(s3, y3, 'EV CHARGER');
  y3 += 4;
  y3 = _fieldRows_(s3, y3, [
    ['EV status',  '{SS_EvStatus}'      ],
    ['Make',       '{SS_EvChargerMake}' ],
    ['Model',      '{SS_EvChargerModel}'],
    ['Capacity',   '{SS_EvChargerKw}'   ],
  ], 20, 130, 17);

  y3 += 8;
  y3 = _sectionBand_(s3, y3, 'INSTALLATION');
  y3 += 4;
  y3 = _fieldRows_(s3, y3, [
    ['Roof type',     '{SS_RoofType}'      ],
    ['Mounting type', '{SS_MountingType}'  ],
    ['Cable run',     '{SS_CableRunMetres}'],
  ], 20, 130, 17);

  y3 += 8;
  y3 = _sectionBand_(s3, y3, 'INSTALLER NOTES');
  y3 += 4;
  var notesBox3 = s3.insertShape(SlidesApp.ShapeType.RECTANGLE, 16, y3, _W - 32, 80);
  notesBox3.getFill().setSolidFill('#f9fafb');
  notesBox3.getBorder().setTransparent();
  var notesVal3 = s3.insertTextBox('{SS_Notes}', 22, y3 + 4, _W - 44, 72);
  notesVal3.getText().setText('{SS_Notes}');
  notesVal3.getText().getTextStyle().setFontSize(8.5).setForegroundColor('#374151').setFontFamily('Arial');

  pres.saveAndClose();
  return pres.getId();
}

// ── NMI & Grid Data template ──────────────────────────────────────────────────
// Slide 1: Hero (NMI number, DNSP, consumption summary)
// Slide 2: Full grid data details

function _createNMIDataTemplate_(tplFolder) {
  var pres = SlidesApp.create('MASTER — NMI & Grid Data Annex');
  _movePresToFolder_(pres.getId(), tplFolder);

  // ── Slide 1: Hero ───────────────────────────────────────────────────────────
  var s1 = pres.getSlides()[0];
  _clearSlide_(s1);

  var y = _annexHeader_(s1);

  y = _annexInfoStrip_(s1, y, [
    { label: 'JOB NUMBER', value: '{NMI_JobNumber}'     },
    { label: 'DATE',       value: '{NMI_GeneratedDate}' },
    { label: 'CLIENT',     value: '{NMI_ClientName}'    },
    { label: 'ADDRESS',    value: '{NMI_Address}'       },
  ]);

  y = _annexHero_(s1, y, 290,
    'NMI & GRID DATA',
    '{NMI_NmiNumber}',
    'METER IDENTIFIER FOR {NMI_ClientName}',
    'DNSP: {NMI_Dnsp}\nTariff: {NMI_TariffName}\nPhase supply: {NMI_Phases}\n\nImport rate: {NMI_ImportRateKwh}\nFeed-in rate: {NMI_FeedInRateKwh}\n\nData accepted: {NMI_DaysAccepted} days\nChannel: {NMI_ChosenChannel}'
  );

  _annexStatsBar_(s1, y, [
    { value: '{NMI_AnnualKwh}',   label: 'ANNUAL CONSUMPTION' },
    { value: '{NMI_AvgDailyKwh}', label: 'AVERAGE DAILY'      },
    { value: '{NMI_PeakPct}',     label: 'PEAK USAGE'         },
  ]);

  // ── Slide 2: Full NMI details ───────────────────────────────────────────────
  var s2 = pres.appendSlide(SlidesApp.PredefinedLayout.BLANK);
  _clearSlide_(s2);

  var y2 = _annexCompactHeader_(s2, 'NMI & Grid Data', '{NMI_JobNumber}', '{NMI_ClientName}');
  y2 += 8;

  y2 = _sectionBand_(s2, y2, 'METER IDENTIFIER');
  y2 += 4;
  y2 = _fieldRows_(s2, y2, [
    ['NMI number',     '{NMI_NmiNumber}'  ],
    ['DNSP',           '{NMI_Dnsp}'       ],
    ['Tariff name',    '{NMI_TariffName}' ],
    ['Phase supply',   '{NMI_Phases}'     ],
  ]);

  y2 += 8;
  y2 = _sectionBand_(s2, y2, 'TARIFF RATES');
  y2 += 4;
  y2 = _fieldRows_(s2, y2, [
    ['Import rate ($/kWh)',   '{NMI_ImportRateKwh}' ],
    ['Feed-in rate ($/kWh)',  '{NMI_FeedInRateKwh}' ],
  ]);

  y2 += 8;
  y2 = _sectionBand_(s2, y2, 'CONSUMPTION DATA');
  y2 += 4;
  y2 = _fieldRows_(s2, y2, [
    ['Annual consumption', '{NMI_AnnualKwh}'   ],
    ['Average daily',      '{NMI_AvgDailyKwh}' ],
    ['Peak usage %',       '{NMI_PeakPct}'      ],
    ['Off-peak usage %',   '{NMI_OffpeakPct}'   ],
  ]);

  y2 += 8;
  y2 = _sectionBand_(s2, y2, 'DATA QUALITY');
  y2 += 4;
  y2 = _fieldRows_(s2, y2, [
    ['Days accepted',   '{NMI_DaysAccepted}'  ],
    ['Channel used',    '{NMI_ChosenChannel}' ],
    ['Generated',       '{NMI_GeneratedDate}' ],
  ]);

  pres.saveAndClose();
  return pres.getId();
}
