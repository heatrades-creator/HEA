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

// ── First-time setup: creates master Slides templates in Drive ────────────────
//
// Run this ONCE from the GAS editor: setupAnnexMasterTemplates_()
// It creates 4 Slides files in a "HEA Annex Master Templates" folder in Drive.
// Saves their IDs to Script Properties — no code change needed.
// Open each file in Drive and design it using the placeholder tokens as a guide.

function setupAnnexMasterTemplates_() {
  var parent = DriveApp.getFolderById(CLIENTS_FOLDER_ID).getParent();
  var tplFolder = getOrCreateDriveFolder_(parent, 'HEA Annex Master Templates');

  var annexes = [
    {
      slug: 'site-assessment',
      title: 'Site Assessment',
      sections: [
        { heading: 'CLIENT DETAILS', tokens: ['{SA_JobNumber}', '{SA_ClientName}', '{SA_Phone}', '{SA_Email}', '{SA_Address}', '{SA_Postcode}', '{SA_CreatedDate}', '{SA_ServiceDesc}'] },
        { heading: 'SYSTEM PREFERENCE', tokens: ['{SA_SystemSizeKw}', '{SA_BatterySizeKwh}'] },
        { heading: 'ROOF & PROPERTY — complete from satellite or on site', tokens: ['{SA_RoofMaterial}', '{SA_RoofOrientation}', '{SA_ShadingIssues}', '{SA_Phases}', '{SA_SatelliteUrl}'] },
        { heading: 'GRID CONNECTION', tokens: ['{SA_Phases}', '{SA_FinanceRequired}'] },
        { heading: 'HOUSEHOLD PROFILE', tokens: ['{SA_Occupants}', '{SA_HomeDaytime}', '{SA_HotWater}', '{SA_GasAppliances}', '{SA_Ev}'] },
        { heading: 'BATTERY & EPS', tokens: ['{SA_WifiSsid}', '{SA_WifiPassword}', '{SA_EpsCircuit1}', '{SA_EpsCircuit2}', '{SA_EpsCircuit3}'] },
        { heading: 'NOTES', tokens: ['{SA_Notes}'] },
      ],
    },
    {
      slug: 'financial-outcomes',
      title: 'Financial Outcomes',
      sections: [
        { heading: 'SYSTEM OVERVIEW', tokens: ['{FO_JobNumber}', '{FO_ClientName}', '{FO_Address}', '{FO_SystemSizeKw}', '{FO_BatterySizeKwh}', '{FO_AnnualBillAud}', '{FO_SystemCostAud}'] },
        { heading: 'YEAR 1 PROJECTIONS', tokens: ['{FO_AnnualGenKwh}', '{FO_ImportSavingsAud}', '{FO_FitIncomeAud}', '{FO_Year1BenefitAud}', '{FO_BillReductionPct}', '{FO_PaybackYears}'] },
        { heading: '10-YEAR OUTLOOK', tokens: ['{FO_Yr1Savings}', '{FO_Yr2Savings}', '{FO_Yr3Savings}', '{FO_Yr4Savings}', '{FO_Yr5Savings}', '{FO_Yr6Savings}', '{FO_Yr7Savings}', '{FO_Yr8Savings}', '{FO_Yr9Savings}', '{FO_Yr10Savings}', '{FO_Yr1Cumul}', '{FO_Yr2Cumul}', '{FO_Yr3Cumul}', '{FO_Yr4Cumul}', '{FO_Yr5Cumul}', '{FO_Yr6Cumul}', '{FO_Yr7Cumul}', '{FO_Yr8Cumul}', '{FO_Yr9Cumul}', '{FO_Yr10Cumul}'] },
        { heading: '25-YEAR TOTAL', tokens: ['{FO_Total25YrAud}'] },
        { heading: 'ENVIRONMENTAL', tokens: ['{FO_CarbonTonnesPerYr}', '{FO_CarsEquiv}'] },
        { heading: 'ASSUMPTIONS', tokens: ['{FO_RetailTariff}', '{FO_FeedInTariff}', '{FO_SelfConsumptionPct}', '{FO_TariffEscPct}', '{FO_DegradationPct}'] },
      ],
    },
    {
      slug: 'system-spec',
      title: 'System Specification',
      sections: [
        { heading: 'JOB', tokens: ['{SS_JobNumber}', '{SS_ClientName}', '{SS_Address}', '{SS_Postcode}', '{SS_Date}', '{SS_Status}'] },
        { heading: 'SOLAR ARRAY', tokens: ['{SS_SystemSizeKw}', '{SS_PanelMake}', '{SS_PanelModel}', '{SS_PanelWatts}', '{SS_PanelCount}'] },
        { heading: 'INVERTER', tokens: ['{SS_InverterType}', '{SS_InverterMake}', '{SS_InverterModel}', '{SS_InverterKw}'] },
        { heading: 'BATTERY STORAGE', tokens: ['{SS_BatterySizeKwh}', '{SS_BatteryMake}', '{SS_BatteryModel}', '{SS_BatteryUsableKwh}', '{SS_EpsCircuit1}', '{SS_EpsCircuit2}', '{SS_EpsCircuit3}', '{SS_WifiSsid}', '{SS_WifiPassword}'] },
        { heading: 'EV CHARGER', tokens: ['{SS_EvStatus}', '{SS_EvChargerMake}', '{SS_EvChargerModel}', '{SS_EvChargerKw}'] },
        { heading: 'INSTALLATION', tokens: ['{SS_RoofType}', '{SS_MountingType}', '{SS_CableRunMetres}', '{SS_Notes}'] },
      ],
    },
    {
      slug: 'nmi-data',
      title: 'NMI & Grid Data',
      sections: [
        { heading: 'JOB', tokens: ['{NMI_JobNumber}', '{NMI_ClientName}', '{NMI_Address}', '{NMI_GeneratedDate}'] },
        { heading: 'METER IDENTIFIER', tokens: ['{NMI_NmiNumber}', '{NMI_Dnsp}', '{NMI_TariffName}', '{NMI_Phases}'] },
        { heading: 'TARIFF RATES', tokens: ['{NMI_ImportRateKwh}', '{NMI_FeedInRateKwh}'] },
        { heading: 'CONSUMPTION', tokens: ['{NMI_AnnualKwh}', '{NMI_AvgDailyKwh}', '{NMI_PeakPct}', '{NMI_OffpeakPct}'] },
        { heading: 'DATA QUALITY', tokens: ['{NMI_DaysAccepted}', '{NMI_ChosenChannel}'] },
      ],
    },
  ];

  var results = {};

  annexes.forEach(function(annex) {
    var id = _createAnnexSlides_(annex.slug, annex.title, annex.sections, tplFolder);
    PropertiesService.getScriptProperties().setProperty('ANNEX_TPL_' + annex.slug, id);
    results[annex.slug] = {
      id: id,
      editUrl: 'https://docs.google.com/presentation/d/' + id + '/edit',
    };
    Logger.log('[SETUP] ' + annex.slug + ' → ' + id);
  });

  Logger.log('');
  Logger.log('=== SETUP COMPLETE ===');
  Logger.log('Master templates created in "HEA Annex Master Templates" folder.');
  Logger.log('IDs saved to Script Properties — no code change needed.');
  Logger.log('Open each template and design it using the placeholder tokens.');
  Logger.log('');
  Logger.log(JSON.stringify(results, null, 2));
  return results;
}

// Creates a single master Slides template with HEA branding and placeholder tokens.
function _createAnnexSlides_(slug, title, sections, parentFolder) {
  var pres = SlidesApp.create('MASTER — ' + title + ' Annex');

  // Move file to templates folder (Google creates it in root by default)
  var file = DriveApp.getFileById(pres.getId());
  parentFolder.addFile(file);
  DriveApp.getRootFolder().removeFile(file);

  var slide = pres.getSlides()[0];
  var W = 720;  // standard Slides width (px)
  var H = 540;  // standard Slides height (px)

  // Clear default placeholders
  slide.getPageElements().forEach(function(el) {
    try { el.remove(); } catch(e) {}
  });

  // ── Header bar ──────────────────────────────────────────────────────────────
  var headerBar = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, 0, 0, W, 50);
  headerBar.getFill().setSolidFill('#111827');
  headerBar.getBorder().setTransparent();
  var headerText = headerBar.getText();
  headerText.setText('HEFFERNAN ELECTRICAL AUTOMATION  |  REC 37307  |  hea-group.com.au');
  headerText.getTextStyle().setFontSize(8).setForegroundColor('#ffffff').setFontFamily('Arial');
  headerText.getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);

  // ── Yellow accent bar ────────────────────────────────────────────────────────
  var accentBar = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, 0, 50, W, 4);
  accentBar.getFill().setSolidFill('#FFD100');
  accentBar.getBorder().setTransparent();

  // ── Title ────────────────────────────────────────────────────────────────────
  var titleBox = slide.insertTextBox(title, 32, 62, W - 64, 36);
  titleBox.getText().setText(title);
  var ts = titleBox.getText().getTextStyle();
  ts.setFontSize(20).setBold(true).setForegroundColor('#111827').setFontFamily('Arial');

  // ── Token reference box ───────────────────────────────────────────────────────
  // This lists all available tokens so Jesse can position them in the design.
  var tokenLines = ['PLACEHOLDER TOKENS — position and style these in your design:', ''];
  sections.forEach(function(section) {
    tokenLines.push('── ' + section.heading + ' ──');
    section.tokens.forEach(function(t) { tokenLines.push('  ' + t); });
    tokenLines.push('');
  });
  tokenLines.push('── FOOTER ──');
  tokenLines.push('Generated: {' + slug.replace(/-/g, '_').toUpperCase().substring(0, 3) + '_GeneratedDate}');

  var tokenText = tokenLines.join('\n');
  var tokenBox = slide.insertTextBox(tokenText, 32, 104, W - 64, H - 130);
  tokenBox.getText().setText(tokenText);
  tokenBox.getText().getTextStyle()
    .setFontSize(8).setForegroundColor('#374151').setFontFamily('Courier New');

  // ── Footer ───────────────────────────────────────────────────────────────────
  var footerBar = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, 0, H - 24, W, 24);
  footerBar.getFill().setSolidFill('#f9fafb');
  footerBar.getBorder().setTransparent();
  var footerText = footerBar.getText();
  footerText.setText('HEFFERNAN ELECTRICAL AUTOMATION  |  REC 37307  |  hea-group.com.au  |  0481 267 812');
  footerText.getTextStyle().setFontSize(7).setForegroundColor('#9ca3af').setFontFamily('Arial');
  footerText.getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);

  pres.saveAndClose();
  return pres.getId();
}
