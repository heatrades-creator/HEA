// HEA Solar Analyser — https://hea-group.com.au
// REC 37307 — Jesse Heffernan, Bendigo VIC

// JobCard.gs — Installer Job Card generator
// Triggered by sendSignedQuote() in QuoteManager.gs after customer signs.
// Produces a PDF job card saved to the client's Drive folder.
// Naming: TS0001_ClientName_Postcode(task-solar job 1).pdf

// ═══════════════════════════════════════════════════════════════════
// JOB NUMBER COUNTER
// Stored in the 'JobCards' sheet tab — auto-created on first use.
// Format: TS0001, TS0002, ... (Task Solar)
// ═══════════════════════════════════════════════════════════════════
function getNextJobNumber() {
  const ss    = SpreadsheetApp.openById(CFG.SHEET_ID);
  let   sheet = ss.getSheetByName('JobCards');
  if (!sheet) {
    sheet = ss.insertSheet('JobCards');
    sheet.appendRow(['JobNo', 'QuoteNo', 'ClientName', 'Address', 'Postcode',
                     'SystemKw', 'BatteryKwh', 'QualityTier', 'CreatedAt', 'DriveUrl']);
    sheet.getRange('A1:J1').setFontWeight('bold');
  }
  // Count existing job rows (excluding header)
  const lastRow = sheet.getLastRow();
  const nextNum = lastRow;          // header = row 1, so row 2 = job 1
  return 'TS' + String(nextNum).padStart(5, '0');
}

function logJobCard(jobNo, payload, driveUrl) {
  try {
    const ss    = SpreadsheetApp.openById(CFG.SHEET_ID);
    const sheet = ss.getSheetByName('JobCards');
    if (!sheet) return;
    sheet.appendRow([
      jobNo,
      payload.quoteNo     || '',
      payload.clientName  || '',
      payload.address     || payload.postcode || '',
      payload.postcode    || '',
      payload.systemKw    || '',
      payload.batteryKwh  || 0,
      payload.qualityTier || 'standard',
      new Date().toISOString(),
      driveUrl            || '',
    ]);
  } catch(e) { /* non-fatal — job card already generated */ }
}

// ═══════════════════════════════════════════════════════════════════
// TIME BUDGET LOGIC
// Budget = 4h solar / 8h solar+battery
// Standard = 6h solar / 12h solar+battery
// Premium = 8h solar / 16h solar+battery (full day / two days)
// ═══════════════════════════════════════════════════════════════════
function getTimeBudget(qualityTier, batteryKwh) {
  const hasBattery = parseFloat(batteryKwh) > 0;
  const base = {
    budget:   { solar: 4,  label: 'Budget',   crew: '2 installers', inverterLabel: 'String inverter (entry)' },
    standard: { solar: 6,  label: 'Standard', crew: '2 installers', inverterLabel: 'String / hybrid inverter' },
    premium:  { solar: 8,  label: 'Premium',  crew: '2 installers', inverterLabel: 'Premium hybrid inverter' },
  };
  const tier      = base[qualityTier] || base.standard;
  const solarHrs  = tier.solar;
  const totalHrs  = hasBattery ? solarHrs * 2 : solarHrs;
  const days      = totalHrs <= 8 ? 1 : 2;
  return {
    label:       tier.label,
    solarHrs,
    batteryHrs:  hasBattery ? solarHrs : 0,
    totalHrs,
    days,
    crew:        tier.crew,
    inverterLabel: tier.inverterLabel,
    dayLabel:    days === 1
                   ? `${totalHrs}-hour job (single day)`
                   : `${totalHrs}-hour job (two days)`,
  };
}

// ═══════════════════════════════════════════════════════════════════
// EQUIPMENT BRAND LOOKUP
// Matches PRICE_TIERS in Index.html
// ═══════════════════════════════════════════════════════════════════
function getEquipmentSpec(qualityTier, systemKw, batteryKwh) {
  const kw  = parseFloat(systemKw)  || 6.6;
  const bat = parseFloat(batteryKwh) || 0;
  const specs = {
    budget:   {
      panels:   'Jinko / Longi 440W (or approved equiv.) — Tier 1',
      inverter: bat > 0 ? 'Alpha ESS SMILE hybrid inverter' : 'Solis / Growatt ' + kw + 'kW string inverter',
      battery:  bat > 0 ? 'Alpha ESS SMILE B ' + bat + ' kWh — LiFePO₄' : null,
      mounting: 'IronRidge XR100 or equiv.',
    },
    standard: {
      panels:   'Trina Vertex / Longi Hi-MO6 440W — Tier 1',
      inverter: bat > 0 ? 'Sungrow SH' + Math.ceil(kw) + 'RT hybrid inverter' : 'Fronius Primo / Sungrow ' + kw + 'kW',
      battery:  bat > 0 ? 'BYD HVM ' + bat + ' kWh — LiFePO₄' : null,
      mounting: 'Clenergy PVEZrack or equiv.',
    },
    premium:  {
      panels:   'REC Alpha Pure-R / Sunpower Maxeon 440W — Tier 1',
      inverter: bat > 0 ? 'Fronius GEN24 ' + kw + 'kW hybrid inverter' : 'Fronius Primo ' + kw + 'kW',
      battery:  bat > 0 ? 'Tesla Powerwall 3 / BYD HVM ' + bat + ' kWh — LiFePO₄' : null,
      mounting: 'K2 Systems or equiv. (premium clip)',
    },
  };
  return specs[qualityTier] || specs.standard;
}

// ═══════════════════════════════════════════════════════════════════
// MAIN ENTRY — called from sendSignedQuote() in QuoteManager.gs
//
// Add to sendSignedQuote() just before the final return { ok:true }:
//   try { generateJobCard({ ...payload, quoteNo, jobFolder: folder }); } catch(e) { /* non-fatal */ }
//
// Payload fields used:
//   clientName, clientEmail, address, phone, postcode
//   systemKw, batteryKwh, panels, panelW, eff, qualityTier
//   quoteNo, signedAt, sysNet, fitC
//   result (NEM12 analysis — zoneName, fin, dataRange)
//   arcFlashResult (from ArcFlash.gs if run — optional)
//   jobFolder (DriveFolder object — passed from sendSignedQuote)
// ═══════════════════════════════════════════════════════════════════
function generateJobCard(payload) {
  try {
    const today   = new Date();
    const dateS   = Utilities.formatDate(today, 'Australia/Melbourne', 'dd MMMM yyyy');
    const jobNo   = getNextJobNumber();

    const clientName   = escHtml(payload.clientName  || 'Unknown Client');
    const address      = escHtml(payload.address      || '');
    const postcode     = escHtml(payload.postcode     || '');
    const phone        = escHtml(payload.phone        || '—');
    const email        = escHtml(payload.clientEmail  || '—');
    const qualityTier  = payload.qualityTier || 'standard';
    const systemKw     = parseFloat(payload.systemKw)   || 6.6;
    const batteryKwh   = parseFloat(payload.batteryKwh) || 0;
    const panels       = parseInt(payload.panels)        || Math.ceil(systemKw * 1000 / (payload.panelW || 440));
    const panelW       = parseInt(payload.panelW)        || 440;
    const hasBattery   = batteryKwh > 0;
    const quoteNo      = payload.quoteNo || '—';
    const signedAt     = payload.signedAt || dateS;
    const fin          = (payload.sliderFin && payload.sliderFin.savings) ? payload.sliderFin : (payload.result && payload.result.fin ? payload.result.fin : {});
    const zoneName     = payload.result && payload.result.zoneName ? payload.result.zoneName : 'Victoria';

    const timeBudget   = getTimeBudget(qualityTier, batteryKwh);
    const equipSpec    = getEquipmentSpec(qualityTier, systemKw, batteryKwh);
    const arcResult    = payload.arcFlashResult || null;

    // Naming: TS00001-job-card-John-Smith-2026-05-03
    const clientSlug  = (payload.clientName || 'Unknown').trim()
                          .replace(/[^a-zA-Z0-9 ]/g, '')
                          .split(/\s+/).filter(Boolean)
                          .map(function(w) { return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(); })
                          .join('-') || 'Unknown';
    const dateFileStr = Utilities.formatDate(today, 'Australia/Melbourne', 'yyyy-MM-dd');
    const fileName    = jobNo + '-job-card-' + clientSlug + '-' + dateFileStr;

    const html = buildJobCardHTML({
      jobNo, dateS, clientName, address, postcode, phone, email,
      qualityTier, systemKw, batteryKwh, panels, panelW, hasBattery,
      quoteNo, signedAt, fin, zoneName, timeBudget, equipSpec, arcResult,
    });

    // Convert HTML → Drive file → PDF (same pattern as PDFBuilder.gs)
    const token    = ScriptApp.getOAuthToken();
    const boundary = '----HEAJobCard7002';
    const docTitle = fileName;
    const meta     = JSON.stringify({ name: docTitle, mimeType: 'application/vnd.google-apps.document' });
    const multipartBody =
      '--' + boundary + '\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n' + meta + '\r\n' +
      '--' + boundary + '\r\nContent-Type: text/html\r\n\r\n' + html + '\r\n' +
      '--' + boundary + '--';

    const resp = UrlFetchApp.fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
      { method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token,
                   'Content-Type': 'multipart/related; boundary=' + boundary },
        payload: multipartBody, muteHttpExceptions: true }
    );
    const rj = JSON.parse(resp.getContentText());
    if (!rj.id) throw new Error('Job card doc creation failed: ' + resp.getContentText());

    const pdfBlob = DriveApp.getFileById(rj.id).getAs('application/pdf');
    pdfBlob.setName(fileName + '.pdf');
    DriveApp.getFileById(rj.id).setTrashed(true);

    // Save to client's job folder
    let driveUrl = '';
    try {
      const folder = payload.jobFolder ||
                     getOrCreateJobFolder(payload.clientName,
                       Utilities.formatDate(today, 'Australia/Melbourne', 'yyyyMMdd'));
      const pdfFile = folder.createFile(pdfBlob.copyBlob());
      pdfFile.setName(fileName + '.pdf');
      driveUrl = pdfFile.getUrl();
    } catch(e2) { /* folder write non-fatal */ }

    // Log to JobCards sheet
    logJobCard(jobNo, { ...payload, quoteNo, qualityTier }, driveUrl);

    return { ok: true, jobNo, fileName: fileName + '.pdf', driveUrl };

  } catch(e) {
    return { error: 'JobCard error: ' + e.message };
  }
}

// ═══════════════════════════════════════════════════════════════════
// HTML BUILDER — produces the job card page
// ═══════════════════════════════════════════════════════════════════
function buildJobCardHTML(p) {
  const {
    jobNo, dateS, clientName, address, postcode, phone, email,
    qualityTier, systemKw, batteryKwh, panels, panelW, hasBattery,
    quoteNo, signedAt, fin, zoneName, timeBudget, equipSpec, arcResult,
  } = p;

  const tierColour  = { budget: '#0284c7', standard: '#16a34a', premium: '#7c3aed' };
  const tierCol     = tierColour[qualityTier] || '#16a34a';
  const annSav      = parseInt(fin.savings || fin.savingsFromTariff || 0);
  const selfPct     = parseFloat(fin.selfPct || 0).toFixed(0);
  const hasBat      = hasBattery;

  // Time budget bar widths
  const solarPct    = Math.round((timeBudget.solarHrs  / timeBudget.totalHrs) * 100);
  const batteryPct  = 100 - solarPct;

  // Arc flash summary (if available)
  const arcBlock = arcResult && arcResult.ok
    ? `<tr><td class="ck-label">Arc flash (IEm)</td><td class="ck-val"><strong style="color:${arcResult.consequence.colour}">${arcResult.IEm} cal/cm² — ${arcResult.consequence.label}</strong></td></tr>
       <tr><td class="ck-label">Protection boundary</td><td class="ck-val">${arcResult.AFB} cm — PPE ${arcResult.ppe.label}</td></tr>
       <tr><td class="ck-label">DVC classification</td><td class="ck-val">${arcResult.dvc.label}</td></tr>`
    : `<tr><td class="ck-label">Arc flash</td><td class="ck-val" style="color:#92400e">⚠ Calculate before energising (AS/NZS 5139:2019 Cl. 3.2.4)</td></tr>`;

  const checkbox   = (label, subtext) => `
  <div class="ck-item">
    <div class="ck-box"></div>
    <div class="ck-text"><strong>${label}</strong>${subtext ? '<br><span class="ck-sub">' + subtext + '</span>' : ''}</div>
  </div>`;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', Arial, sans-serif; font-size: 10px; color: #111827; background: #fff; width: 210mm; }
  /* ── HEADER ── */
  .hdr { background: #111827; color: #fff; padding: 14px 18px; display: flex; justify-content: space-between; align-items: center; }
  .hdr-logo { font-size: 18px; font-weight: 900; letter-spacing: -0.5px; }
  .hdr-logo span { color: #f5c518; }
  .hdr-right { text-align: right; }
  .job-num { font-size: 22px; font-weight: 900; color: #f5c518; letter-spacing: 1px; }
  .job-sub { font-size: 9px; color: #9ca3af; margin-top: 2px; }
  /* ── TIER BANNER ── */
  .tier-banner { background: ${tierCol}; color: #fff; padding: 7px 18px; display: flex; justify-content: space-between; align-items: center; }
  .tier-label { font-size: 12px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; }
  .tier-right { font-size: 10px; font-weight: 600; }
  /* ── SECTIONS ── */
  .wrap { padding: 12px 18px; }
  .sect-head { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;
               color: #6b7280; border-bottom: 2px solid #111827; padding-bottom: 3px; margin: 12px 0 8px; }
  .two-col { display: flex; gap: 12px; }
  .col { flex: 1; }
  /* ── INFO GRID ── */
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden; }
  .ig-row { display: contents; }
  .ig-label { background: #f9fafb; padding: 6px 10px; font-weight: 700; color: #374151; border-bottom: 1px solid #e5e7eb; font-size: 9px; }
  .ig-val   { background: #fff;    padding: 6px 10px; color: #111827; border-bottom: 1px solid #e5e7eb; font-size: 9px; }
  /* ── TIME BUDGET ── */
  .budget-box { border: 2px solid ${tierCol}; border-radius: 8px; overflow: hidden; }
  .budget-head { background: ${tierCol}; color: #fff; padding: 8px 14px; display: flex; justify-content: space-between; align-items: center; }
  .budget-hrs { font-size: 28px; font-weight: 900; line-height: 1; }
  .budget-hrs-sub { font-size: 9px; opacity: 0.8; margin-top: 2px; }
  .budget-body { padding: 10px 14px; }
  .time-bar { height: 22px; border-radius: 4px; overflow: hidden; display: flex; margin-bottom: 6px; }
  .time-seg { display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 700; color: #fff; }
  .time-seg-solar { background: #f5c518; color: #111; width: ${solarPct}%; }
  .time-seg-bat   { background: #6d28d9; width: ${batteryPct}%; }
  .budget-rows { font-size: 9px; }
  .budget-row { display: flex; justify-content: space-between; padding: 3px 0; border-bottom: 1px solid #f3f4f6; }
  .budget-row:last-child { border-bottom: none; font-weight: 800; color: ${tierCol}; }
  /* ── CHECKLIST ── */
  .ck-item { display: flex; align-items: flex-start; gap: 8px; margin-bottom: 6px; }
  .ck-box  { width: 14px; height: 14px; border: 2px solid #374151; border-radius: 2px; flex-shrink: 0; margin-top: 1px; }
  .ck-text { font-size: 9px; color: #111827; line-height: 1.4; }
  .ck-sub  { color: #6b7280; font-size: 8px; }
  .ck-col  { break-inside: avoid; }
  .ck-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 18px; }
  /* ── SPEC TABLE ── */
  .spec-table { width: 100%; border-collapse: collapse; }
  .spec-table td { padding: 5px 8px; border-bottom: 1px solid #f3f4f6; font-size: 9px; vertical-align: top; }
  .spec-table td:first-child { font-weight: 700; color: #374151; width: 38%; background: #f9fafb; }
  .ck-label { font-weight: 700; color: #374151; font-size: 9px; padding: 4px 8px; background: #f9fafb; border-bottom: 1px solid #f3f4f6; width: 38%; }
  .ck-val   { font-size: 9px; padding: 4px 8px; border-bottom: 1px solid #f3f4f6; }
  /* ── SEQUENCE ── */
  .seq-item { display: flex; gap: 10px; margin-bottom: 8px; break-inside: avoid; }
  .seq-num { width: 22px; height: 22px; background: #111827; color: #f5c518; font-weight: 900;
             border-radius: 50%; display: flex; align-items: center; justify-content: center;
             font-size: 10px; flex-shrink: 0; }
  .seq-content { flex: 1; font-size: 9px; padding-top: 3px; }
  .seq-content strong { display: block; font-size: 9px; }
  /* ── SIGN-OFF ── */
  .signoff-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
  .signoff-box { border: 1px solid #374151; border-radius: 4px; padding: 8px 10px; }
  .signoff-label { font-size: 8px; font-weight: 800; text-transform: uppercase; letter-spacing: .5px; color: #6b7280; margin-bottom: 4px; }
  .signoff-line { border-bottom: 1px solid #374151; margin: 16px 0 4px; }
  .signoff-sub { font-size: 8px; color: #9ca3af; }
  /* ── PASS/FAIL ── */
  .pf-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .pf-box { border: 1.5px solid #e5e7eb; border-radius: 6px; padding: 8px 10px; }
  .pf-label { font-size: 8px; font-weight: 800; color: #6b7280; margin-bottom: 4px; text-transform: uppercase; }
  .pf-result { display: flex; gap: 10px; }
  .pf-opt { display: flex; align-items: center; gap: 4px; font-size: 9px; }
  .pf-circle { width: 14px; height: 14px; border: 2px solid #374151; border-radius: 50%; flex-shrink: 0; }
  /* ── FOOTER ── */
  .footer { background: #f9fafb; border-top: 1px solid #e5e7eb; padding: 8px 18px;
            font-size: 8px; color: #9ca3af; display: flex; justify-content: space-between; }
  .warn-box { background: #fffbeb; border: 1.5px solid #fde68a; border-radius: 6px; padding: 8px 12px; margin-bottom: 8px; font-size: 9px; color: #92400e; }
  .standard-ref { font-size: 8px; color: #6b7280; font-style: italic; }
  .badge { display: inline-block; padding: 2px 7px; border-radius: 10px; font-size: 8px; font-weight: 700; }
  .badge-green  { background: #dcfce7; color: #166534; }
  .badge-amber  { background: #fef9c3; color: #854d0e; }
  .badge-red    { background: #fee2e2; color: #991b1b; }
  .badge-blue   { background: #dbeafe; color: #1e40af; }
  .page-break   { page-break-before: always; }
</style>
</head>
<body>

<!-- ═══ HEADER ═══ -->
<div class="hdr">
  <div>
    <div class="hdr-logo">HEA<span>.</span></div>
    <div style="font-size:9px;color:#9ca3af;margin-top:2px">Heffernan Electrical Automation</div>
    <div style="font-size:9px;color:#9ca3af">REC 37307 · Bendigo VIC · hea-group.com.au</div>
  </div>
  <div class="hdr-right">
    <div class="job-num">${jobNo}</div>
    <div class="job-sub">INSTALLER JOB CARD</div>
    <div class="job-sub">${dateS}</div>
  </div>
</div>

<!-- ═══ TIER BANNER ═══ -->
<div class="tier-banner">
  <div class="tier-label">☀ ${timeBudget.label} Installation${hasBat ? ' + Battery' : ''}</div>
  <div class="tier-right">Quote: ${quoteNo} &nbsp;|&nbsp; Signed: ${signedAt}</div>
</div>

<div class="wrap">

<!-- ═══ CLIENT & SITE ═══ -->
<div class="sect-head">Client &amp; Site</div>
<div class="two-col">
  <div class="col">
    <div class="info-grid">
      <div class="ig-label">Client name</div>      <div class="ig-val"><strong>${clientName}</strong></div>
      <div class="ig-label">Site address</div>     <div class="ig-val">${address || '—'} ${postcode}</div>
      <div class="ig-label">Phone</div>            <div class="ig-val">${phone}</div>
      <div class="ig-label">Email</div>            <div class="ig-val">${email}</div>
      <div class="ig-label">Solar zone</div>       <div class="ig-val">${zoneName}</div>
      <div class="ig-label">Annual load</div>      <div class="ig-val">${(fin.annualKwh||'—').toLocaleString()} kWh/yr</div>
    </div>
  </div>
  <div class="col">
    <div class="info-grid">
      <div class="ig-label">System size</div>      <div class="ig-val"><strong>${systemKw} kWp DC</strong></div>
      <div class="ig-label">Panels</div>           <div class="ig-val">${panels} × ${panelW}W</div>
      <div class="ig-label">Battery</div>          <div class="ig-val">${hasBat ? batteryKwh + ' kWh usable' : 'Not included'}</div>
      <div class="ig-label">Tier</div>             <div class="ig-val"><span class="badge" style="background:${tierCol}20;color:${tierCol}">${timeBudget.label}</span></div>
      <div class="ig-label">Year 1 savings</div>   <div class="ig-val"><strong style="color:#16a34a">$${annSav.toLocaleString()}/yr est.</strong></div>
      <div class="ig-label">Self-consumption</div> <div class="ig-val">${selfPct}%</div>
    </div>
  </div>
</div>

<!-- ═══ INSTALLATION TIME BUDGET ═══ -->
<div class="sect-head">Installation Time Budget</div>
<div class="budget-box">
  <div class="budget-head">
    <div>
      <div style="font-size:10px;font-weight:700;margin-bottom:4px">${timeBudget.label} Tier — ${timeBudget.dayLabel}</div>
      <div style="font-size:9px;opacity:.85">Crew: ${timeBudget.crew} &nbsp;|&nbsp; Do not depart site without commissioning sign-off</div>
    </div>
    <div style="text-align:right">
      <div class="budget-hrs">${timeBudget.totalHrs}h</div>
      <div class="budget-hrs-sub">total budget</div>
    </div>
  </div>
  <div class="budget-body">
    <div class="time-bar">
      <div class="time-seg time-seg-solar">☀ PV Array ${timeBudget.solarHrs}h</div>
      ${hasBat ? '<div class="time-seg time-seg-bat">⚡ Battery ' + timeBudget.batteryHrs + 'h</div>' : ''}
    </div>
    <div class="budget-rows">
      <div class="budget-row"><span>Unload &amp; site setup</span><span>30 min</span></div>
      <div class="budget-row"><span>Roof work — rails, clamps, panels</span><span>${timeBudget.solarHrs > 4 ? '2h 30' : '1h 30'}</span></div>
      <div class="budget-row"><span>DC cabling, MC4, conduit, isolator</span><span>45 min</span></div>
      <div class="budget-row"><span>Inverter mount &amp; AC connection</span><span>45 min</span></div>
      <div class="budget-row"><span>Switchboard works &amp; metering</span><span>1h 00</span></div>
      ${hasBat ? '<div class="budget-row"><span>Battery mount, DC BOS, cabling</span><span>1h 30</span></div>' : ''}
      ${hasBat ? '<div class="budget-row"><span>Battery commissioning &amp; BMS setup</span><span>1h 00</span></div>' : ''}
      <div class="budget-row"><span>System commissioning &amp; test</span><span>45 min</span></div>
      <div class="budget-row"><span>Client handover &amp; documentation</span><span>30 min</span></div>
      <div class="budget-row"><span><strong>TOTAL BUDGETED TIME</strong></span><span><strong>${timeBudget.totalHrs}h 00</strong></span></div>
    </div>
  </div>
</div>

<!-- ═══ EQUIPMENT SPECIFICATION ═══ -->
<div class="sect-head">Equipment Specification</div>
<table class="spec-table" width="100%">
  <tr><td>Solar panels</td><td>${equipSpec.panels} &nbsp;<span class="badge badge-blue">${panels} × ${panelW}W = ${systemKw} kWp</span></td></tr>
  <tr><td>Inverter</td><td>${equipSpec.inverter}</td></tr>
  ${hasBat ? '<tr><td>Battery</td><td>' + equipSpec.battery + ' &nbsp;<span class="badge badge-blue">LFP — UN 3480 — Section 4</span></td></tr>' : ''}
  <tr><td>Mounting system</td><td>${equipSpec.mounting}</td></tr>
  <tr><td>DC isolators</td><td>Clipsal / Hager DC rated, ≥ system voltage + 25% margin</td></tr>
  <tr><td>AC isolator</td><td>Double-pole lockable 20A adjacent to inverter (per AS/NZS 3000)</td></tr>
  <tr><td>Cabling — DC</td><td>6mm² DC solar cable (AS/NZS 5000.2 / IEC 62930) — UV rated, double insulated</td></tr>
  <tr><td>Cabling — AC</td><td>2.5mm² min or as per CCC calc (AS/NZS 3008.1) — per approved wiring diagram</td></tr>
  <tr><td>Conduit</td><td>UV-rated corrugated / rigid as required by AS/NZS 3000</td></tr>
  ${hasBat ? '<tr><td>Battery DC cable</td><td>Flexible cable per AS/NZS 5000.2 / IEC 62930, rated ≥ Ibf rating</td></tr>' : ''}
  ${hasBat ? '<tr><td>Battery isolator</td><td>DC switch-disconnector per AS/NZS 60947.3 — Pollution Degree 3, manual lockable</td></tr>' : ''}
  <tr><td>Earthing</td><td>Earth cable per AS/NZS 3000 Cl. 5.3.3.1 &nbsp;|&nbsp; ${hasBat ? 'Bonding conductor min 6mm² (Cl. 6.3.1.8.2)' : 'Array frame earthing'}</td></tr>
  <tr><td>Signage &amp; labels</td><td>Per AS/NZS 5139:2019 Section 7 &amp; AS/NZS 5033 — all labels matched to connection diagram</td></tr>
</table>

<!-- ═══ PAGE 2 ═══ -->
<div class="page-break"></div>

<!-- ═══ SITE COMPLIANCE CHECKLIST ═══ -->
<div class="sect-head">Site Compliance Assessment <span class="standard-ref">— AS/NZS 5139:2019 Cl. 4.2 (mandatory pre-installation risk assessment)</span></div>

${hasBat ? `<div class="warn-box">⚡ This installation includes a battery system — AS/NZS 5139:2019 applies. Complete ALL battery items below before commencing work. This checklist forms the mandatory risk assessment per Cl. 4.2.1.</div>` : ''}

<div class="ck-grid">
<div class="ck-col">
  <strong style="font-size:9px;color:#374151;display:block;margin-bottom:6px">LOCATION — Clearances (Cl. 4.2.2)</strong>
  ${checkbox('Battery location confirmed', 'Garage / storage room / dedicated room / outdoor — NOT habitable room')}
  ${checkbox('≥600mm from any exit or door', 'Exception: door >900mm wide — then ≥1000mm working clearance from front/side')}
  ${checkbox('≥600mm from habitable room window (side)', 'AND ≥900mm below same window / appliances')}
  ${checkbox('≥600mm working side clearance', 'Or manufacturer spec, whichever is greater')}
  ${checkbox('≥900mm where 230V AC access panel', 'Front of AC side of inverter/switchboard')}
  ${checkbox('Not in ceiling space / wall cavity', 'Check for recesses — must be fully sealed with non-combustible material if recessed')}
  ${checkbox('Not under stairs / walkways', 'Or in evacuation / escape route')}
  ${checkbox('Corridor/lobby: ≥1000mm clearance all sides', 'Required where BESS blocks any egress path')}
</div>
<div class="ck-col">
  <strong style="font-size:9px;color:#374151;display:block;margin-bottom:6px">FIRE PROTECTION (Cl. 4.2.4 / 4.3.4)</strong>
  ${checkbox('Habitable room on other side of battery wall?', 'YES → non-combustible barrier required: brick / concrete / compressed cement ≥6mm')}
  ${checkbox('Smoke alarm in battery room / area', 'Install if not present — per Cl. 4.3.4 (mandatory recommendation)')}
  ${checkbox('Fire indication panel present?', 'YES → link detector to panel. NO → standalone smoke alarm in room')}
  ${checkbox('Battery not within 300mm of corner / wall junction', 'See Appendix E Fig. E.4 — corner clearance')}

  <strong style="font-size:9px;color:#374151;display:block;margin-bottom:6px;margin-top:10px">ENVIRONMENTAL (Cl. 4.2.3)</strong>
  ${checkbox('Temperature within manufacturer min/max range', 'Garage in summer — check thermal exposure')}
  ${checkbox('Protected from water ingress / high humidity', 'IP rating of enclosure confirmed for location')}
  ${checkbox('Not in direct sunlight / near heat source', 'Generators, HWS, dryers, etc.')}
  ${checkbox('Seismic restraint required?', 'AU: check AS 1170.4 zone. NZ: NZS 4219 applies')}
</div>
</div>

<!-- ═══ ARC FLASH (BATTERY ONLY) ═══ -->
${hasBat ? `
<div class="sect-head">Arc Flash Risk Assessment <span class="standard-ref">— AS/NZS 5139:2019 Cl. 3.2.4 &amp; 6.3.2 (Doan Method)</span></div>
<table class="spec-table" width="100%" style="margin-bottom:8px">
  ${arcBlock}
</table>
${arcResult && arcResult.ok && arcResult.installationRequirement
  ? `<div class="warn-box">⚠ <strong>Installation requirement:</strong> ${arcResult.installationRequirement}</div>`
  : arcResult && arcResult.ok
    ? `<div style="background:#f0fdf4;border:1px solid #86efac;border-radius:6px;padding:8px 12px;font-size:9px;color:#166534;margin-bottom:8px">✓ No dedicated battery room required at this arc flash energy level.</div>`
    : `<div class="warn-box">⚠ Arc flash not pre-calculated. Calculate IEm = 0.01 × Vsys × (0.5 × Ibf) × (Tarc/D²) × MF before energising. Confirm PPE level before working on live DC side. See AS/NZS 5139 Appendix F.</div>`}
` : ''}

<!-- ═══ INSTALLATION SEQUENCE ═══ -->
<div class="sect-head">Installation Sequence</div>
<div class="two-col">
<div class="col">
  <div class="seq-item"><div class="seq-num">1</div><div class="seq-content"><strong>Site assessment &amp; OH&amp;S</strong>Confirm all checklist items above. Check roof pitch, condition, rafters. Review NMI / meter details. Confirm switchboard type and spare capacity. Photo evidence before works start.</div></div>
  <div class="seq-item"><div class="seq-num">2</div><div class="seq-content"><strong>Roof layout &amp; rail install</strong>Mark rafter positions. Install flashed roof brackets (no exposed penetrations). Mount rails per mounting system spec. Check rail level and alignment.</div></div>
  <div class="seq-item"><div class="seq-num">3</div><div class="seq-content"><strong>Panel installation</strong>Install panels from bottom row up. Secure mid and end clamps per torque spec. Install DC isolator at array (lockable, DC-rated). Label array circuit per AS/NZS 5033 and Section 7.</div></div>
  <div class="seq-item"><div class="seq-num">4</div><div class="seq-content"><strong>DC cabling &amp; conduit</strong>Run 6mm² DC solar cable in UV-rated conduit. MC4 connections tested for polarity before connection. Confirm Voc &lt; inverter max input. No live DC cabling run through roof cavity without conduit.</div></div>
  <div class="seq-item"><div class="seq-num">5</div><div class="seq-content"><strong>Inverter installation</strong>Mount inverter per clearance spec (ventilation critical). Confirm wall fixing into stud or appropriate anchor. Wire DC inputs — confirm string polarity, Voc and Isc. Label all DC connections.</div></div>
</div>
<div class="col">
  ${hasBat ? `
  <div class="seq-item"><div class="seq-num" style="background:#6d28d9">6</div><div class="seq-content"><strong>Battery installation (AS/NZS 5139)</strong>Confirm location compliance with checklist above. Mount battery per manufacturer instructions and seismic requirements. Install DC switch-disconnector (AS 60947.3, lockable, Pollution Degree 3). Verify IP2X screening on all live battery terminals before energising.</div></div>
  <div class="seq-item"><div class="seq-num" style="background:#6d28d9">7</div><div class="seq-content"><strong>Battery DC BOS</strong>Run flexible DC cable per AS/NZS 5000.2 / IEC 62930. Equal length cables if parallel systems. Earth cable per AS/NZS 3000 Cl. 5.3.3 — minimum 6mm² if bonding. Confirm earthing category (floating / direct earthed) per Cl. 6.3.1.7.</div></div>
  ` : ''}
  <div class="seq-item"><div class="seq-num">${hasBat ? '8' : '6'}</div><div class="seq-content"><strong>AC wiring &amp; switchboard</strong>Install AC isolator adjacent to inverter (double-pole, lockable). Run AC cable per AS/NZS 3000. Switchboard works: dedicated circuit, correct breaker size, metering upgrade if required. Check polarity and neutral integrity.</div></div>
  <div class="seq-item"><div class="seq-num">${hasBat ? '9' : '7'}</div><div class="seq-content"><strong>Labelling (Section 7 / AS/NZS 5033)</strong>All labels per AS/NZS 5139 Section 7 and AS/NZS 5033. DC array label, AC isolator label, inverter labels, switchboard circuit label. ${hasBat ? 'Battery system labels including UN 3480, fire hazard Level 1 warning, DVC classification.' : ''} Confirm all diagram labels match installed labels.</div></div>
  <div class="seq-item"><div class="seq-num">${hasBat ? '10' : '8'}</div><div class="seq-content"><strong>Commissioning</strong>See commissioning checklist below. Do NOT energise until all compliance checks complete. Test earth continuity before first energisation.</div></div>
</div>
</div>

<!-- ═══ PAGE 3 ═══ -->
<div class="page-break"></div>

<!-- ═══ SIGNAGE CHECKLIST (Section 7) ═══ -->
<div class="sect-head">Signage &amp; Labels — ALL MUST BE INSTALLED BEFORE SIGN-OFF <span class="standard-ref">— AS/NZS 5139:2019 Section 7</span></div>
${hasBat ? `<div class="warn-box">All signs: durable, indelible, UV-stable if outdoors, legible from 1 m, not obscured by doors or shelves. Service life ≥ battery system life (Cl. 7.2).</div>` : ''}
<table class="spec-table" width="100%" style="margin-bottom:10px">
  <tr><td style="font-weight:800;background:#111827;color:#f5c518;padding:5px 8px" colspan="3">MANDATORY — EVERY INSTALLATION (Solar + Battery)</td></tr>
  <tr><td>ES sign at meter box</td><td>Green circular reflector ≥100mm — "ES" + UN number below (e.g. UN 3480). At main metering panel AND main switchboard. Cl. 7.3</td><td class="pf-result" style="padding:4px 8px"><div class="pf-opt"><div class="pf-circle"></div> ✓</div></td></tr>
  <tr><td>DC isolator label</td><td>"BATTERY SYSTEM D.C. ISOLATOR" — on or next to isolator. Cl. 7.12.2</td><td style="padding:4px 8px"><div class="pf-opt"><div class="pf-circle"></div> ✓</div></td></tr>
  <tr><td>Overcurrent device labels</td><td>ID number matching wiring diagram — readable from 1 m. Cl. 7.13</td><td style="padding:4px 8px"><div class="pf-opt"><div class="pf-circle"></div> ✓</div></td></tr>
  <tr><td>Battery cable labels</td><td>"BATTERY" label — indelible, UV-stable — every ≤2 m along ALL battery cable runs incl. inside conduit (label on conduit exterior). Cl. 7.14</td><td style="padding:4px 8px"><div class="pf-opt"><div class="pf-circle"></div> ✓</div></td></tr>
  <tr><td>Shutdown procedure sign</td><td>Sequential steps — adjacent to PCE, visible from equipment. Terminology must match ALL device labels exactly. Test shutdown before installing sign. Cl. 7.16</td><td style="padding:4px 8px"><div class="pf-opt"><div class="pf-circle"></div> ✓</div></td></tr>
  <tr><td>SDS document holder (AU)</td><td>Physical SDS in sealed durable clear pouch — at main switchboard / meter box. Must include AU emergency contact number. Also at fire panel if present. Cl. 7.7</td><td style="padding:4px 8px"><div class="pf-opt"><div class="pf-circle"></div> ✓</div></td></tr>
  ${hasBat ? `
  <tr><td style="font-weight:800;background:#1e3a5f;color:#93c5fd;padding:5px 8px" colspan="3">BATTERY SYSTEM ADDITIONAL SIGNS</td></tr>
  <tr><td>Restricted access sign</td><td>"DANGER — Restricted Access — Authorized Persons Only" + PPE requirements + arc flash warning — on or adjacent to battery enclosure/room door. Cl. 7.5</td><td style="padding:4px 8px"><div class="pf-opt"><div class="pf-circle"></div> ✓</div></td></tr>
  <tr><td>Voltage &amp; current sign</td><td>"Battery System" + short-circuit current (A) + max system voltage (V) + DVC class + battery chemistry — on or adjacent to enclosure/room door. Cl. 7.6</td><td style="padding:4px 8px"><div class="pf-opt"><div class="pf-circle"></div> ✓</div></td></tr>
  <tr><td>Arc flash warning sign</td><td>Required if IEm ≥ 1.2 cal/cm² — adjacent to enclosure or room door. Cl. 7.11</td><td style="padding:4px 8px"><div class="pf-opt"><div class="pf-circle"></div> ✓</div></td></tr>
  <tr><td>"DO NOT DISCONNECT UNDER LOAD"</td><td>DVC-B/C systems — adjacent to each disconnector. Cl. 7.12.4</td><td style="padding:4px 8px"><div class="pf-opt"><div class="pf-circle"></div> ✓ / N/A</div></td></tr>
  <tr><td>Multiple systems warning</td><td>"WARNING — MULTIPLE BATTERY SYSTEMS — TURN OFF ALL BATTERY SYSTEM ISOLATORS" — adjacent to PCE. Only if parallel batteries installed. Cl. 7.12.3</td><td style="padding:4px 8px"><div class="pf-opt"><div class="pf-circle"></div> ✓ / N/A</div></td></tr>
  <tr><td>DC/AC segregation labels</td><td>Circuit type labels at ≤2 m intervals where DC and AC circuits run near each other. Cl. 7.15</td><td style="padding:4px 8px"><div class="pf-opt"><div class="pf-circle"></div> ✓</div></td></tr>
  <tr><td>Battery location plan</td><td>Required if battery not visible from main switchboard — diagram at switchboard showing battery location + shutdown procedure location. Cl. 7.4</td><td style="padding:4px 8px"><div class="pf-opt"><div class="pf-circle"></div> ✓ / N/A</div></td></tr>
  <tr><td>Spill containment info sign</td><td>Adjacent to battery — actions to take in event of chemical spillage or leak. Cl. 7.19</td><td style="padding:4px 8px"><div class="pf-opt"><div class="pf-circle"></div> ✓ / N/A</div></td></tr>
  <tr><td>Meters, shunts, alarms</td><td>All labelled — naming must match system documentation and drawings. Cl. 7.18</td><td style="padding:4px 8px"><div class="pf-opt"><div class="pf-circle"></div> ✓</div></td></tr>
  ` : ''}
</table>
<div style="font-size:8px;color:#6b7280;margin-bottom:10px">Sign colour code: Safety info = green/white · Service personnel warnings = yellow/black · Emergency personnel = red/white · PPE = blue/white</div>

<!-- ═══ CABLE IDENTIFICATION ═══ -->
<div class="sect-head">Cable Identification &amp; Segregation <span class="standard-ref">— AS/NZS 5139:2019 Cl. 7.14, 7.15</span></div>
<div class="ck-grid">
<div class="ck-col">
  ${checkbox('"BATTERY" cable labels installed', 'Every ≤2m — indelible, UV-stable, coloured. ALL battery cable runs including inside conduit (label on conduit exterior)')}
  ${checkbox('DC and AC circuits segregated', 'Per AS/NZS 3000:2018 Section 3 — DC battery wiring separated from AC wiring including inside switchboard')}
</div>
<div class="ck-col">
  ${checkbox('Segregation labels on mixed runs', 'Where DC and AC cables run near each other — circuit type labels at ≤2m intervals')}
  ${hasBat ? checkbox('3m cable rule checked', 'If PCE-to-battery cable >3m AND fault current > cable CCC → overcurrent protection required at PCE end also (Cl. 5.3.1.4.7)') : ''}
</div>
</div>

${hasBat ? `
<!-- ═══ BMS VERIFICATION ═══ -->
<div class="sect-head">BMS Verification <span class="standard-ref">— AS/NZS 5139:2019 Cl. 6.3.4</span></div>
<div class="ck-grid">
<div class="ck-col">
  ${checkbox('BMS monitors temperature of every thermally coupled cell block', 'Not just total system — individual block monitoring required (Cl. 6.3.4.5)')}
  ${checkbox('BMS shuts down on high temperature', 'Confirm shutdown triggers at manufacturer max temp — test or verify via BMS config screen')}
  ${checkbox('BMS shuts down on low temperature', 'Confirm shutdown triggers at manufacturer min temp (Cl. 6.3.4.6)')}
  ${checkbox('BMS limits or disconnects on overcurrent', 'Max charge current cannot be exceeded — confirm via BMS config (Cl. 6.3.4.7)')}
</div>
<div class="ck-col">
  ${checkbox('BMS shuts down on over-voltage (per cell/module)', 'Any individual cell or module exceeding max voltage → shutdown (Cl. 6.3.4.8)')}
  ${checkbox('BMS alarm activates on under-voltage / over-discharge', 'Alarm active before or at shutdown — confirm (Cl. 6.3.4.9)')}
  ${checkbox('Mechanical protection confirmed', 'Battery has protection against crushing, impacts, vibration — enclosure/mounting provides this (Cl. 6.3.4.10)')}
  ${checkbox('Earth fault alarm active (floating systems >DVC-A)', 'Earth fault monitoring confirmed operational — not required if directly earthed (Cl. 5.3.1.8)')}
</div>
</div>
` : ''}

<!-- ═══ COMMISSIONING CHECKLIST ═══ -->
<div class="sect-head">Commissioning Checklist <span class="standard-ref">— AS/NZS 5139 Cl. 4.4.3 / 5.4.3 / 6.4.3 &amp; AS/NZS 3000</span></div>
<div class="ck-grid">
<div class="ck-col">
  ${checkbox('Earth continuity test — all connections', 'Per AS/NZS 3000 — record results in documentation')}
  ${checkbox('Insulation resistance test (IR test)', 'DC side: confirm >1MΩ before energising')}
  ${checkbox('Polarity confirmed — DC string and AC', 'Both confirmed before connecting to inverter')}
  ${checkbox('String Voc measured and within spec', 'Must be < inverter max Voc input voltage')}
  ${checkbox('Inverter startup — no fault codes', 'Log firmware version and serial number')}
  ${checkbox('Grid connection confirmed', 'Inverter synced, AS/NZS 4777.1 anti-islanding active')}
  ${checkbox('Export limit configured (if applicable)', 'DNSP limit programmed and tested')}
  ${checkbox('Generation visible on monitoring app', 'Screenshot or confirm with client')}
  ${hasBat ? checkbox('DC connections tested under 50% load', '⚡ MANDATORY — test all DC connections while system operating at ≥50% charge or discharge current. Use voltage measurement across each terminal, temperature measurement, or IR imaging. Identifies high-resistance connections under load — not detectable cold. Cl. 6.4.3.1') : ''}
</div>
<div class="ck-col">
  ${hasBat ? checkbox('Battery BMS comms confirmed', 'Inverter ↔ BMS link active, no alarms') : ''}
  ${hasBat ? checkbox('Battery charge/discharge cycle tested', 'Confirm both modes operational — system operates as a whole (Cl. 4.4.3 / 6.4.3.1)') : ''}
  ${hasBat ? checkbox('Battery alarm system tested', 'Audible/SMS/email alert — enable and confirm active during commissioning. Not just installed — confirmed working (Cl. 5.3.8)') : ''}
  ${hasBat ? checkbox('Smoke alarm in battery room tested', 'Press test button, confirm audible') : ''}
  ${hasBat ? checkbox('Shutdown procedure LIVE TESTED', '⚡ MANDATORY — physically test shutdown procedure results in safe shutdown of whole installation. Not just labelled — tested. Cl. 6.4.3.1') : ''}
  ${hasBat ? checkbox('Remote monitoring configured', 'Set up and confirm owner has login access before leaving site. Cl. 6.4.3.1') : ''}
  ${checkbox('All labels checked against connection diagram', 'Every label matches diagram — per Section 7. Naming consistent with shutdown procedure sign.')}
  ${checkbox('All conduit entries sealed', 'Fire stop / draw cord present')}
  ${checkbox('Operational parameters verified', 'PCE control settings confirmed via PCE / data connection / host computer (Cl. 6.4.3.1)')}
</div>
</div>

<!-- ═══ OWNER INDUCTION ═══ -->
<div class="sect-head">Owner Induction — MANDATORY BEFORE LEAVING SITE <span class="standard-ref">— AS/NZS 5139:2019 Cl. 5.4.3.2 / 6.4.3.2</span></div>
<div class="ck-grid">
<div class="ck-col">
  ${checkbox('Shutdown &amp; startup procedures demonstrated', 'Walk through shutdown sign with owner present — they must be able to do it. Cl. 6.4.3.2(a)')}
  ${checkbox('System manual physically handed over', 'Including UN number, SDS location, manufacturer contacts, commissioning date. Cl. 6.4.3.2(b)')}
  ${checkbox('Alarm features explained', 'What each alarm means + actions to take when triggered. Cl. 6.4.3.2(c)')}
</div>
<div class="ck-col">
  ${checkbox('HEA contact details provided', 'Jesse / HEA phone number and email confirmed with owner. Cl. 6.4.3.2(d)')}
  ${checkbox('Monitoring app set up with owner', 'Login confirmed, live data visible, owner understands dashboard. Cl. 6.4.3.2(e)')}
  ${checkbox('Periodic inspection requirements explained', 'Annual inspection for warranty — owner aware. Appendix H')}
  ${checkbox('Client satisfied — signature obtained', 'Owner sign-off on induction completed below')}
</div>
</div>
<div style="border:1px solid #374151;border-radius:4px;padding:8px 12px;margin-bottom:10px;display:flex;gap:20px;font-size:9px">
  <div style="flex:1">Owner name: _________________________________</div>
  <div style="flex:1">Signature: _________________________________</div>
  <div style="flex:1">Time: ___________</div>
</div>

<!-- ═══ QUALITY GATE ═══ -->
<div class="sect-head">Quality Gate — Pass / Fail</div>
<div class="pf-grid">
  <div class="pf-box"><div class="pf-label">Electrical compliance cert (CoC)</div><div class="pf-result"><div class="pf-opt"><div class="pf-circle"></div> Pass — cert raised</div><div class="pf-opt"><div class="pf-circle"></div> Fail</div></div></div>
  <div class="pf-box"><div class="pf-label">All labels installed &amp; correct</div><div class="pf-result"><div class="pf-opt"><div class="pf-circle"></div> Pass</div><div class="pf-opt"><div class="pf-circle"></div> Fail — note below</div></div></div>
  <div class="pf-box"><div class="pf-label">Earth continuity &amp; IR test passed</div><div class="pf-result"><div class="pf-opt"><div class="pf-circle"></div> Pass</div><div class="pf-opt"><div class="pf-circle"></div> Fail — remediated</div></div></div>
  <div class="pf-box"><div class="pf-label">${hasBat ? 'Battery commissioning complete' : 'Inverter online &amp; exporting'}</div><div class="pf-result"><div class="pf-opt"><div class="pf-circle"></div> Pass</div><div class="pf-opt"><div class="pf-circle"></div> Fail</div></div></div>
  <div class="pf-box"><div class="pf-label">Client demonstrated &amp; satisfied</div><div class="pf-result"><div class="pf-opt"><div class="pf-circle"></div> Yes</div><div class="pf-opt"><div class="pf-circle"></div> Follow-up required</div></div></div>
  <div class="pf-box"><div class="pf-label">Photos taken (before, during, after)</div><div class="pf-result"><div class="pf-opt"><div class="pf-circle"></div> Yes</div><div class="pf-opt"><div class="pf-circle"></div> No — must complete</div></div></div>
</div>

<!-- ═══ NOTES ═══ -->
<div class="sect-head">Site Notes / Variations / Issues</div>
<div style="border:1px solid #374151;border-radius:4px;min-height:50px;padding:8px;font-size:9px;color:#9ca3af">
  _______________________________________________________________________________________________________
  _______________________________________________________________________________________________________
  _______________________________________________________________________________________________________
</div>

<!-- ═══ INSTALLER SIGN-OFF ═══ -->
<div class="sect-head">Installer Sign-Off</div>
<div class="signoff-grid">
  <div class="signoff-box">
    <div class="signoff-label">Lead Installer</div>
    <div class="signoff-line"></div>
    <div class="signoff-sub">Name &amp; REC number</div>
    <div style="margin-top:10px"><div class="signoff-line"></div><div class="signoff-sub">Signature</div></div>
  </div>
  <div class="signoff-box">
    <div class="signoff-label">Time on site</div>
    <div style="margin-top:8px;font-size:9px">
      Start: _____ : _____<br><br>
      Finish: _____ : _____<br><br>
      Total: __________ hrs
    </div>
    <div style="margin-top:6px;font-size:8px;color:${timeBudget.totalHrs <= 8 ? '#16a34a' : '#92400e'}">
      Budget: ${timeBudget.totalHrs}h (${timeBudget.dayLabel})
    </div>
  </div>
  <div class="signoff-box">
    <div class="signoff-label">Installation date</div>
    <div style="margin-top:8px;font-size:9px">
      Date: _____ / _____ / _____<br><br>
      CoC No: ___________________<br><br>
      DNSP notified: ☐ Yes ☐ N/A
    </div>
  </div>
</div>

</div><!-- /wrap -->

<!-- ═══ FOOTER ═══ -->
<div class="footer">
  <span>HEA Solar Analyser ${APP_VERSION} — Job Card ${jobNo} — Quote ${quoteNo}</span>
  <span>AS/NZS 5139:2019 · AS/NZS 5033 · AS/NZS 4777.1 · AS/NZS 3000 · Vic Electricity Safety Act 1998</span>
  <span>INSTALLER COPY — CONFIDENTIAL</span>
</div>

</body>
</html>`;
}
