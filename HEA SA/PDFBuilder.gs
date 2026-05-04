// HEA Solar Analyser — https://hea-group.com.au
// REC 37307 — Jesse Heffernan, Bendigo VIC

// PDFBuilder.gs — PDF generation, email HTML builders

function generateReport(p) {
  try {
    const { clientName, postcode, result, systemKw, batteryKwh, sysNet, fitC, sliderFin,
            engineSummary, connFeeAnnual } = p;
    // connFeeAnnual: actual annual supply charge passed from UI (fallback 380 = $1.04/day × 365)
    const supplyAnnual = parseFloat(connFeeAnnual) || 380;
    const today  = new Date();
    const dateS  = Utilities.formatDate(today, 'Australia/Melbourne', 'dd MMMM yyyy');
    const validD = Utilities.formatDate(new Date(today.getTime() + 30*24*60*60*1000), 'Australia/Melbourne', 'dd MMMM yyyy');
    const quoteNo= 'HEA-' + Utilities.formatDate(today, 'Australia/Melbourne', 'yyyyMMdd') + '-' + Math.floor(Math.random()*900+100);
    const title  = clientName + ' — Solar Assessment — ' +
                   Utilities.formatDate(today, 'Australia/Melbourne', 'dd-MM-yyyy');
    const fin    = sliderFin || result.fin;

    // Calculate rebates properly
    const panels     = Math.ceil(parseFloat(systemKw) * 1000 / CFG.PANEL_W);
    const batNum     = parseFloat(batteryKwh) || 0;
    const annSav     = parseInt(fin.savings || 0);
    const sysNetNum  = parseFloat(sysNet) || 16100;
    const stcs       = Math.floor(parseFloat(systemKw) * 1.382 * 5);
    const solarRebate= Math.round(stcs * 37.20);
    const batSTCs    = batNum > 0 ? Math.floor(batNum * 8.4) : 0;
    const batRebate  = batSTCs * 37;
    const grossEst   = sysNetNum + solarRebate + batRebate;
    // Prefer engine-derived 25yr total (from annual_rows) over geometric shortcut
    // engineProjection: { milestones: [{yr, annNcf, cumNcf, netPosition},...], total25, profit25 }
    let total25, profit25_calc;
    if (p.engineProjection && p.engineProjection.total25 != null) {
      total25        = p.engineProjection.total25;
      profit25_calc  = p.engineProjection.profit25;
    } else {
      // Fallback geometric — only if engine not available
      total25       = Math.round([...Array(25)].reduce((a,_,i) => a+annSav*Math.pow(1.03,i), 0));
      profit25_calc = total25 - sysNetNum;
    }

    const html = buildReportHTML(clientName, postcode, dateS, validD, quoteNo, result,
                                  systemKw, batteryKwh, sysNet, fitC, fin,
                                  panels, batNum, stcs, solarRebate, batRebate, grossEst, total25,
                                  null, null, engineSummary, supplyAnnual, p.engineProjection);

    const token    = ScriptApp.getOAuthToken();
    const boundary = '----HEABound9001';
    const meta     = JSON.stringify({ name: title, mimeType: 'application/vnd.google-apps.document' });
    const payload  = '--' + boundary + '\r\n' +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' + meta + '\r\n' +
      '--' + boundary + '\r\n' + 'Content-Type: text/html\r\n\r\n' + html + '\r\n' +
      '--' + boundary + '--';
    const resp = UrlFetchApp.fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
      { method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token,
                   'Content-Type': 'multipart/related; boundary=' + boundary },
        payload, muteHttpExceptions: true }
    );
    const rj = JSON.parse(resp.getContentText());
    if (!rj.id) throw new Error('Doc creation failed: ' + resp.getContentText());

    const pdfBlob = DriveApp.getFileById(rj.id).getAs('application/pdf');
    pdfBlob.setName(title + '.pdf');

    let driveUrl = '';
    try {
      const dateS2 = Utilities.formatDate(new Date(), 'Australia/Melbourne', 'yyyyMMdd');
      const jobFolder = getOrCreateJobFolder(clientName, dateS2);
      driveUrl = jobFolder.createFile(pdfBlob.copyBlob()).getUrl();
      // Move editable Google Doc to job folder instead of trashing it
      const docFile = DriveApp.getFileById(rj.id);
      jobFolder.addFile(docFile);
      DriveApp.getRootFolder().removeFile(docFile);
    } catch(e2) {
      try { DriveApp.getFileById(rj.id).setTrashed(true); } catch(_) {}
    }

    const profit25   = profit25_calc !== undefined ? profit25_calc : (total25 - sysNetNum);
    const emailHtml  = buildEmailHTML(clientName, postcode, dateS, result, systemKw, batteryKwh,
                                       panels, batNum, fin, stcs, solarRebate, batRebate, grossEst,
                                       total25, profit25, driveUrl, supplyAnnual, p.engineProjection);

    GmailApp.sendEmail(
      CFG.EMAIL,
      '☀ Solar Proposal — ' + clientName + ' — $' + profit25.toLocaleString() + ' projected 25yr return',
      'Solar Proposal for ' + clientName + '. See attached PDF.',
      {
        htmlBody:    emailHtml,
        attachments: [pdfBlob]
      }
    );

    return { ok: true, msg: 'PDF emailed to ' + CFG.EMAIL };
  } catch(e) {
    return { error: 'PDF error: ' + e.message };
  }
}

// =============================================================================
// EMAIL
// =============================================================================
function buildEmailHTML(clientName, postcode, dateS, result, systemKw, batteryKwh,
                         panels, batNum, fin, stcs, solarRebate, batRebate, grossEst,
                         total25, profit25, driveUrl, supplyAnnual, engineProjection) {
  // Escape all user-controlled strings before HTML interpolation
  clientName = escHtml(clientName);
  postcode   = escHtml(postcode);
  if (result) { result = Object.assign({}, result, { nmi: escHtml(result.nmi || ''), zoneName: escHtml(result.zoneName || '') }); }
  const _supply = parseFloat(supplyAnnual) || 380;  // actual annual supply charge, not hardcoded
  const annSav       = parseInt(fin.savings || 0);
  const annLoad      = parseInt(fin.annualKwh || 0);
  const selfKwh      = parseInt(fin.selfKwh || 0);
  const genKwh       = parseInt(fin.genKwh || 0);
  const expKwh       = parseInt(fin.exportKwh || 0);
  const sysNetNum    = parseFloat(fin.sysNet || 16100);
  const fitNum       = parseFloat(fin.fitC || 3.3);
  const pb           = parseFloat(fin.payback || 0).toFixed(1);
  const selfPct      = parseFloat(fin.selfPct || 0).toFixed(1);
  const freeYrs      = Math.max(0, 25 - parseFloat(pb)).toFixed(0);
  const avgTariff    = parseFloat(fin.avgTariff || 24.112);

  // CORRECT bill calculations (no /100 bug)
  const annBefore    = Math.round(annLoad * avgTariff / 100 + _supply);
  const gridKwh      = Math.max(0, annLoad - selfKwh);
  const annAfter     = Math.max(0, Math.round(gridKwh * avgTariff / 100 + _supply));
  const billSavPct   = annBefore > 0 ? Math.round((1-annAfter/annBefore)*100) : 0;
  const mthBefore    = Math.round(annBefore/12);
  const mthAfter     = Math.round(annAfter/12);

  const pbPct   = Math.min(52, Math.round(parseFloat(pb)/25*100));
  const freePct = 100 - pbPct;

  // Milestone rows for email — use engine milestones when available, fall back to geometric
  const engMilestonesEmail = (engineProjection && engineProjection.milestones) ? engineProjection.milestones : null;
  let milestoneRows = '';
  let cum = 0;
  const sysC = sysNetNum;
  for (let yr=1; yr<=25; yr++) {
    const engRow = engMilestonesEmail ? engMilestonesEmail.find(r => r.yr === yr) : null;
    const ys = engRow ? Math.round(engRow.annNcf) : Math.round(annSav * Math.pow(1.03, yr-1));
    if (engRow && engRow.cumNcf != null) { cum = engRow.cumNcf; } else { cum += ys; }
    if (![1,3,5,7,10,15,20,25].includes(yr)) continue;
    const net = cum - sysC;
    const isB = net >= 0;
    const pct = Math.min(100, Math.round(cum/total25*100));
    const col = isB ? '#16a34a' : '#dc2626';
    const bg  = yr===10 ? '#fffbeb' : (yr%2===0?'#f9fafb':'#ffffff');
    milestoneRows += `<tr style="background:${bg}">
      <td style="padding:8px 12px;font-size:12px;font-weight:${yr===10?'700':'400'};color:#374151;border-bottom:1px solid #f3f4f6">
        ${yr===10?'⭐ ':''}Year ${yr}${yr===10?' — Breakeven':''}
      </td>
      <td style="padding:8px 12px;font-size:12px;text-align:right;color:#374151;border-bottom:1px solid #f3f4f6">$${ys.toLocaleString()}</td>
      <td style="padding:8px 12px;font-size:12px;text-align:right;color:#374151;border-bottom:1px solid #f3f4f6">$${cum.toLocaleString()}</td>
      <td style="padding:8px 12px;font-size:12px;text-align:right;font-weight:700;color:${col};border-bottom:1px solid #f3f4f6">${isB?'+':''}$${net.toLocaleString()}</td>
    </tr>`;
  }

  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>Solar Proposal — ${clientName}</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,'Helvetica Neue',Arial,sans-serif">
<div style="max-width:640px;margin:0 auto;background:#ffffff">

  <!-- HEADER BAR -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#111827">
    <tr>
      <td style="padding:20px 32px 18px">
        <div style="color:#f5c518;font-size:13px;font-weight:800;letter-spacing:2px;text-transform:uppercase">HEA — Heffernan Electrical Automation</div>
        <div style="color:#9ca3af;font-size:11px;margin-top:3px">Solar System Proposal &nbsp;&middot;&nbsp; ${dateS} &nbsp;&middot;&nbsp; REC Licence 37307</div>
      </td>
    </tr>
  </table>

  <!-- CLIENT HERO -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(160deg,#1f2937,#374151)">
    <tr>
      <td style="padding:32px 32px 24px">
        <div style="color:#f5c518;font-size:28px;font-weight:900;letter-spacing:-0.5px">${clientName}</div>
        <div style="color:#9ca3af;font-size:12px;margin-top:5px">${postcode} &nbsp;&middot;&nbsp; ${result.zoneName||''} &nbsp;&middot;&nbsp; NMI: ${result.nmi}</div>
        <div style="margin-top:14px;display:inline-block;background:rgba(245,197,24,0.12);border:1px solid rgba(245,197,24,0.3);border-radius:20px;padding:8px 18px">
          <span style="color:#fde68a;font-size:13px;font-weight:700">${panels} &times; ${CFG.PANEL_W}W = ${systemKw} kWp${batNum>0?' + '+batNum+' kWh battery':''}</span>
        </div>
      </td>
    </tr>
  </table>

  <!-- 25yr RETURN HERO -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5c518">
    <tr>
      <td style="padding:24px 32px;text-align:center">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:rgba(0,0,0,0.45)">Projected 25-year return on investment</div>
        <div style="font-size:52px;font-weight:900;color:#111827;line-height:1.1;margin:6px 0;letter-spacing:-2px">$${profit25.toLocaleString()}</div>
        <div style="font-size:12px;color:rgba(0,0,0,0.5)">ahead after your system pays for itself &nbsp;&middot;&nbsp; conservative 3%/yr tariff growth</div>
      </td>
    </tr>
  </table>

  <!-- KPI STRIP -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-bottom:1px solid #e5e7eb">
    <tr>
      <td style="padding:16px 8px;text-align:center;border-right:1px solid #e5e7eb;width:25%">
        <div style="font-size:20px;font-weight:900;color:#111827">$${annSav.toLocaleString()}</div>
        <div style="font-size:9px;text-transform:uppercase;letter-spacing:1px;color:#6b7280;margin-top:3px">Year 1 Savings</div>
      </td>
      <td style="padding:16px 8px;text-align:center;border-right:1px solid #e5e7eb;width:25%">
        <div style="font-size:20px;font-weight:900;color:#111827">${pb} yr</div>
        <div style="font-size:9px;text-transform:uppercase;letter-spacing:1px;color:#6b7280;margin-top:3px">Payback Period</div>
      </td>
      <td style="padding:16px 8px;text-align:center;border-right:1px solid #e5e7eb;width:25%">
        <div style="font-size:20px;font-weight:900;color:#111827">${freeYrs} yr</div>
        <div style="font-size:9px;text-transform:uppercase;letter-spacing:1px;color:#6b7280;margin-top:3px">Free Power</div>
      </td>
      <td style="padding:16px 8px;text-align:center;width:25%">
        <div style="font-size:20px;font-weight:900;color:#111827">${selfPct}%</div>
        <div style="font-size:9px;text-transform:uppercase;letter-spacing:1px;color:#6b7280;margin-top:3px">Self-Consumption</div>
      </td>
    </tr>
  </table>

  <!-- FINANCE SUMMARY TABLE — see pdfFinanceSummary() in PDFSections.gs -->
` + pdfFinanceSummary(engineSummary) + `

<!-- PAYBACK TIMELINE -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff">
    <tr><td style="padding:24px 32px 16px">
      <div style="font-size:13px;font-weight:700;color:#111827;margin-bottom:12px">Your investment timeline</div>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="width:${pbPct}%;background:#ef4444;height:26px;border-radius:6px 0 0 6px;padding:0 8px;vertical-align:middle">
            <span style="color:#fff;font-size:9px;font-weight:700;white-space:nowrap">Recovery: ${pb} years</span>
          </td>
          <td style="background:#16a34a;height:26px;border-radius:0 6px 6px 0;padding:0 8px;vertical-align:middle">
            <span style="color:#fff;font-size:9px;font-weight:700">FREE for ${freeYrs} years &rarr; +$${profit25.toLocaleString()}</span>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>

  <!-- BEFORE / AFTER -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff">
    <tr><td style="padding:0 32px 24px">
      <div style="font-size:13px;font-weight:700;color:#111827;margin-bottom:14px">Your electricity bill — monthly comparison</div>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="width:46%;padding:16px;background:#fef2f2;border:2px solid #fecaca;border-radius:10px;text-align:center">
            <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#dc2626;margin-bottom:8px">Before Solar</div>
            <div style="font-size:32px;font-weight:900;color:#991b1b">$${mthBefore}</div>
            <div style="font-size:11px;color:#9ca3af;margin-top:4px">per month to retailer</div>
            <div style="font-size:10px;color:#dc2626;margin-top:4px">($${annBefore.toLocaleString()}/yr)</div>
          </td>
          <td style="width:8%;text-align:center;font-size:22px;color:#9ca3af">&rarr;</td>
          <td style="width:46%;padding:16px;background:#f0fdf4;border:2px solid #86efac;border-radius:10px;text-align:center">
            <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#16a34a;margin-bottom:8px">After Solar</div>
            <div style="font-size:32px;font-weight:900;color:#166534">$${mthAfter}</div>
            <div style="font-size:11px;color:#9ca3af;margin-top:4px">${billSavPct}% reduction</div>
            <div style="font-size:10px;color:#16a34a;margin-top:4px">($${annAfter.toLocaleString()}/yr)</div>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>

  <!-- INVESTMENT -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffbeb">
    <tr><td style="padding:20px 32px">
      <div style="font-size:13px;font-weight:700;color:#92400e;margin-bottom:12px">💰 Your investment — government rebates applied</div>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr style="border-bottom:1px solid #fde68a">
          <td style="padding:8px 0;font-size:12px;color:#374151">Total system installation (gross)</td>
          <td style="padding:8px 0;font-size:12px;text-align:right;color:#374151">$${grossEst.toLocaleString()}</td>
        </tr>
        <tr style="border-bottom:1px solid #fde68a">
          <td style="padding:8px 0;font-size:12px;color:#16a34a">Less: Solar STC rebate (${stcs} certificates @ $37.20)</td>
          <td style="padding:8px 0;font-size:12px;text-align:right;font-weight:700;color:#16a34a">-$${solarRebate.toLocaleString()}</td>
        </tr>
        ${batNum > 0 ? `<tr style="border-bottom:1px solid #fde68a">
          <td style="padding:8px 0;font-size:12px;color:#16a34a">Less: Battery rebate — CHBP ${batSTCs} STCs @ $37 (pre-May full rate)</td>
          <td style="padding:8px 0;font-size:12px;text-align:right;font-weight:700;color:#16a34a">-$${batRebate.toLocaleString()}</td>
        </tr>` : ''}
        <tr>
          <td style="padding:10px 0 4px;font-size:14px;font-weight:900;color:#111827">YOUR NET INVESTMENT</td>
          <td style="padding:10px 0 4px;font-size:18px;font-weight:900;text-align:right;color:#111827">$${sysNetNum.toLocaleString()}</td>
        </tr>
      </table>
      <div style="font-size:10px;color:#b45309;margin-top:8px">⚡ Rebates applied at point of sale — no paperwork. Battery rebate changes 1 May 2026 — sign before April 30 to lock current rate.</div>
    </td></tr>
  </table>

  <!-- MILESTONES TABLE -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff">
    <tr><td style="padding:24px 32px">
      <div style="font-size:13px;font-weight:700;color:#111827;margin-bottom:14px">When are you out of pocket? — Year by year</div>
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
        <tr style="background:#111827">
          <th style="padding:10px 12px;text-align:left;color:#fff;font-size:11px;font-weight:600">Year</th>
          <th style="padding:10px 12px;text-align:right;color:#fff;font-size:11px;font-weight:600">Annual Savings</th>
          <th style="padding:10px 12px;text-align:right;color:#fff;font-size:11px;font-weight:600">Total Saved</th>
          <th style="padding:10px 12px;text-align:right;color:#fff;font-size:11px;font-weight:600">Net Position</th>
        </tr>
        ${milestoneRows}
      </table>
      <div style="font-size:10px;color:#9ca3af;margin-top:8px">3% annual tariff escalation. Net position = cumulative savings minus $${sysNetNum.toLocaleString()} investment.</div>
    </td></tr>
  </table>

  <!-- CTA -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#111827">
    <tr><td style="padding:28px 32px;text-align:center">
      <div style="color:#ffffff;font-size:18px;font-weight:800;margin-bottom:8px">Ready to move forward?</div>
      <div style="color:#9ca3af;font-size:12px;margin-bottom:22px">Full technical analysis and formal quote attached as PDF — review, sign, and return.</div>
      ${driveUrl ? `<a href="${driveUrl}" style="display:inline-block;background:#f5c518;color:#111827;font-weight:800;font-size:13px;padding:13px 28px;border-radius:8px;text-decoration:none;margin:0 6px 8px">📄 View Proposal Online</a>` : ''}
      <a href="mailto:hea.trades@gmail.com" style="display:inline-block;background:#374151;color:#fff;font-weight:700;font-size:12px;padding:12px 22px;border-radius:8px;text-decoration:none;margin:0 6px 8px">📞 Contact Jesse</a>
      <div style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.25);border-radius:8px;padding:10px 16px;margin-top:16px;color:#fca5a5;font-size:11px">
        ⚡ <strong>Battery rebate drops 1 May 2026.</strong> Current full-rate rebate saves you $${(solarRebate+batRebate).toLocaleString()} off this system. After April 30 the savings reduce significantly.
      </div>
    </td></tr>
  </table>

  <!-- FOOTER -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a">
    <tr><td style="padding:16px 32px;text-align:center">
      <div style="color:#4b5563;font-size:10px;line-height:1.9">
        <strong style="color:#f5c518">Heffernan Electrical Automation</strong> &nbsp;&middot;&nbsp; REC Licence 37307<br>
        hea-group.com.au &nbsp;&middot;&nbsp; 0481 267 812 &nbsp;&middot;&nbsp; hea.trades@gmail.com<br>
        Based on ${result.days} days of NEM12 interval data. Savings vary with weather &amp; tariff changes. Not financial advice.
      </div>
    </td></tr>
  </table>

</div></body></html>`;
}

var batSTCs = 0; // global placeholder, set properly inside buildReportHTML

// =============================================================================
// WORLD CLASS PDF — HEA Template Style + Aurora/Proposify Best Practices
// =============================================================================
function buildReportHTML(clientName, postcode, dateS, validD, quoteNo, result,
                          systemKw, batteryKwh, sysNet, fitC, fin,
                          panels, batNum, stcs, solarRebate, batRebate, grossEst, total25,
                          sigImgUrl, signedAt, engineSummary, supplyAnnual, engineProjection) {
  // Escape all user-controlled strings before HTML interpolation
  clientName = escHtml(clientName);
  postcode   = escHtml(postcode);
  quoteNo    = escHtml(quoteNo);
  if (result) { result = Object.assign({}, result, { nmi: escHtml(result.nmi || ''), zoneName: escHtml(result.zoneName || '') }); }
  const fitNum     = parseFloat(fitC) || 3.3;
  const annSav     = parseInt(fin.savings || 0);
  const sysNetNum  = parseFloat(sysNet) || 16100;
  const genKwh     = parseInt(fin.genKwh || 0);
  const selfKwh    = parseInt(fin.selfKwh || 0);
  const expKwh     = parseInt(fin.exportKwh || 0);
  const annLoad    = parseInt(fin.annualKwh || 0);
  const selfPct    = parseFloat(fin.selfPct || 0).toFixed(1);
  const pb         = parseFloat(fin.payback || 0).toFixed(1);
  const pbYr       = parseFloat(fin.payback || 0);
  const freeYears  = Math.max(0, 25 - pbYr).toFixed(0);
  const avgTariff  = parseFloat(fin.avgTariff || 24.112);
  const offset     = annLoad > 0 ? Math.round(genKwh / annLoad * 100) : 0;
  const zMult      = ZONE_MULT[result.zone] || 1;
  const zPct       = Math.round((zMult - 1) * 100);
  const effPct     = Math.round((parseFloat(fin.eff||85)));
  const batSTCsLoc = batNum > 0 ? Math.floor(batNum * 8.4) : 0;
  const totalRebates = solarRebate + batRebate;
  const profit25   = total25 - sysNetNum;

  // CORRECT bill calculations
  const _supply    = parseFloat(supplyAnnual) || 380;  // actual annual supply charge
  const annBefore  = Math.round(annLoad * avgTariff / 100 + _supply);
  const gridKwh    = Math.max(0, annLoad - selfKwh);
  const annAfter   = Math.max(0, Math.round(gridKwh * avgTariff / 100 + _supply));
  const billSavPct = annBefore > 0 ? Math.round((1-annAfter/annBefore)*100) : 0;
  const mthBefore  = Math.round(annBefore/12);
  const mthAfter   = Math.round(annAfter/12);
  const mthSaving  = mthBefore - mthAfter;

  // Environmental
  const annCO2t    = (genKwh * 0.82 / 1000).toFixed(1);
  const lifeCO2    = genKwh * 0.82 * 25;
  const trees      = Math.round(lifeCO2 / 100).toLocaleString();
  const kmCar      = Math.round(lifeCO2 * 1000 / 185).toLocaleString();

  // 25yr projection table
  // Use engine annual_rows milestones when available (canonical)
  // Fall back to geometric 3% escalation only if engine data not passed
  const engMilestones = (engineProjection && engineProjection.milestones) ? engineProjection.milestones : null;
  let projRows = ''; let cum = 0;
  for (let yr=1; yr<=25; yr++) {
    const engRow = engMilestones ? engMilestones.find(r => r.yr === yr) : null;
    const ys = engRow ? Math.round(engRow.annNcf) : Math.round(annSav * Math.pow(1.03, yr-1));
    const engCum = engRow ? engRow.cumNcf : null;
    if (engCum !== null) { cum = engCum; } else { cum += ys; }
    if (![1,2,3,5,7,10,15,20,25].includes(yr)) continue;
    const net = engRow && engRow.netPosition != null ? Math.round(engRow.netPosition) : (cum - sysNetNum);
    const isB = net >= 0;
    const rowBg = yr===10 ? '#fffbeb' : (yr%2===0 ? '#f9fafb' : '#ffffff');
    projRows += `<tr style="background:${rowBg}${yr===10?';font-weight:700':''}">
      <td style="padding:7px 10px;border:1px solid #e5e7eb;font-size:10px">${yr===10?'⭐ Breakeven':''} Year ${yr}</td>
      <td style="padding:7px 10px;border:1px solid #e5e7eb;text-align:right;font-size:10px">$${ys.toLocaleString()}</td>
      <td style="padding:7px 10px;border:1px solid #e5e7eb;text-align:right;font-size:10px">$${cum.toLocaleString()}</td>
      <td style="padding:7px 10px;border:1px solid #e5e7eb;text-align:right;font-size:10px;font-weight:700;color:${isB?'#166534':'#991b1b'}">${isB?'+':''}$${net.toLocaleString()}</td>
    </tr>`;
  }

  // Monthly
  const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const MONTH_DAYS  = [31,28,31,30,31,30,31,31,30,31,30,31];
  const MONTH_S     = ['Summer','Summer','Autumn','Autumn','Autumn','Winter','Winter','Winter','Spring','Spring','Spring','Summer'];
  const S_BG        = { Summer:'#fffbeb', Autumn:'#fff7ed', Winter:'#eff6ff', Spring:'#f0fdf4' };
  const dailyByS    = {};
  for (const s of ['Summer','Autumn','Winter','Spring']) {
    let d=0; for (let h=0;h<24;h++) d+=(5*result.profiles[s].weekday[h]+2*result.profiles[s].weekend[h])/7;
    dailyByS[s] = d/1000;
  }
  let mRows='', mTG=0,mTC=0,mTS=0,mTE=0,mTI=0,mTSav=0;
  for (let m=0;m<12;m++) {
    const d=MONTH_DAYS[m], s=MONTH_S[m];
    const gM=Math.round(genKwh*MONTHLY_IRR[m]/MONTHLY_IRR_TOTAL), cM=Math.round(dailyByS[s]*d);
    const slM=Math.min(gM,cM), exM=Math.max(0,gM-cM), imM=Math.max(0,cM-gM);
    const savM=Math.round(slM*avgTariff/100+exM*fitNum/100);
    mTG+=gM;mTC+=cM;mTS+=slM;mTE+=exM;mTI+=imM;mTSav+=savM;
    mRows+=`<tr style="background:${S_BG[s]}">
      <td style="padding:5px 8px;border:1px solid #e5e7eb;font-size:10px;font-weight:700">${MONTH_NAMES[m]}</td>
      <td style="padding:5px 8px;border:1px solid #e5e7eb;font-size:10px;text-align:right;color:#92400e">${gM}</td>
      <td style="padding:5px 8px;border:1px solid #e5e7eb;font-size:10px;text-align:right">${cM}</td>
      <td style="padding:5px 8px;border:1px solid #e5e7eb;font-size:10px;text-align:right;color:#166534;font-weight:700">${slM}</td>
      <td style="padding:5px 8px;border:1px solid #e5e7eb;font-size:10px;text-align:right;color:#1d4ed8">${exM>0?exM:'-'}</td>
      <td style="padding:5px 8px;border:1px solid #e5e7eb;font-size:10px;text-align:right;color:#991b1b">${imM>0?imM:'-'}</td>
      <td style="padding:5px 8px;border:1px solid #e5e7eb;font-size:10px;text-align:right;color:#166534;font-weight:700">$${savM}</td>
    </tr>`;
  }

  // Seasonal hourly
  let sTables='';
  for (const s of ['Summer','Autumn','Winter','Spring']) {
    const SCOL={Summer:'#92400e',Autumn:'#6d28d9',Winter:'#1e40af',Spring:'#065f46'};
    const SHBG={Summer:'#fffbeb',Autumn:'#f5f3ff',Winter:'#eff6ff',Spring:'#ecfdf5'};
    const isEst=(result.missingSeasons||[]).includes(s);
    let rows='',dL=0,dG=0,dS=0,dE=0,dI=0;
    for (let h=0;h<24;h++) {
      const con=((5*result.profiles[s].weekday[h]+2*result.profiles[s].weekend[h])/7)/1000;
      const gen=result.gen[s][h]/1000;
      const sl=Math.min(con,gen),ex=Math.max(0,gen-con),gr=Math.max(0,con-gen);
      dL+=con;dG+=gen;dS+=sl;dE+=ex;dI+=gr;
      const rowBg=gen>con*0.8?SHBG[s]:'#ffffff';
      rows+=`<tr style="background:${rowBg}">
        <td style="padding:3px 6px;border:1px solid #e5e7eb;font-size:9px;font-weight:600;color:#6b7280">${String(h).padStart(2,'0')}:00</td>
        <td style="padding:3px 6px;border:1px solid #e5e7eb;font-size:9px;text-align:right">${con.toFixed(2)}</td>
        <td style="padding:3px 6px;border:1px solid #e5e7eb;font-size:9px;text-align:right;color:${SCOL[s]};font-weight:600">${gen.toFixed(2)}</td>
        <td style="padding:3px 6px;border:1px solid #e5e7eb;font-size:9px;text-align:right;color:#166534">${sl>0.005?sl.toFixed(2):''}</td>
        <td style="padding:3px 6px;border:1px solid #e5e7eb;font-size:9px;text-align:right;color:#1d4ed8">${ex>0.005?ex.toFixed(2):''}</td>
        <td style="padding:3px 6px;border:1px solid #e5e7eb;font-size:9px;text-align:right;color:#991b1b">${gr>0.005?gr.toFixed(2):''}</td>
      </tr>`;
    }
    sTables+=`<div style="margin-bottom:18px">
      <div style="background:${SHBG[s]};border-left:4px solid ${SCOL[s]};padding:8px 12px;font-weight:800;font-size:11px;color:${SCOL[s]}">
        ${s}${isEst?' — ⚠ Data estimated':''} — weighted daily average (5×weekday + 2×weekend ÷ 7)
      </div>
      <table width="100%" cellspacing="0" cellpadding="0">
        <tr style="background:#111827;color:#fff">
          <th style="padding:5px 6px;border:1px solid #374151;font-size:9px;text-align:left">Hour</th>
          <th style="padding:5px 6px;border:1px solid #374151;font-size:9px;text-align:right">Load</th>
          <th style="padding:5px 6px;border:1px solid #374151;font-size:9px;text-align:right">Solar</th>
          <th style="padding:5px 6px;border:1px solid #374151;font-size:9px;text-align:right;color:#86efac">Used</th>
          <th style="padding:5px 6px;border:1px solid #374151;font-size:9px;text-align:right;color:#93c5fd">Export</th>
          <th style="padding:5px 6px;border:1px solid #374151;font-size:9px;text-align:right;color:#fca5a5">Grid</th>
        </tr>
        ${rows}
        <tr style="background:#111827;color:#fff;font-weight:700">
          <td style="padding:5px 6px;border:1px solid #374151;font-size:9px">Day total</td>
          <td style="padding:5px 6px;border:1px solid #374151;font-size:9px;text-align:right">${dL.toFixed(1)}</td>
          <td style="padding:5px 6px;border:1px solid #374151;font-size:9px;text-align:right">${dG.toFixed(1)}</td>
          <td style="padding:5px 6px;border:1px solid #374151;font-size:9px;text-align:right;color:#86efac">${dS.toFixed(1)}</td>
          <td style="padding:5px 6px;border:1px solid #374151;font-size:9px;text-align:right;color:#93c5fd">${dE.toFixed(1)}</td>
          <td style="padding:5px 6px;border:1px solid #374151;font-size:9px;text-align:right;color:#fca5a5">${dI.toFixed(1)}</td>
        </tr>
      </table>
    </div>`;
  }

  // BOS cost breakdown for itemised quote
  const panelCost   = Math.round(parseFloat(systemKw)*1000*0.80*0.45);
  const invCost     = batNum>0 ? (parseFloat(systemKw)<=5?2800:parseFloat(systemKw)<=8?3200:3600) : (parseFloat(systemKw)<=5?1500:1900);
  const batGross    = batNum>0 ? Math.round(batNum*950) : 0;
  const mountCost   = Math.round(panels*65);
  const cableCost   = Math.round(panels*68);
  const sbCost      = 450;
  const labourHrs   = (4 + Math.max(0,panels-10)*0.4 + (batNum>0?2:0)).toFixed(1);
  const labourCost  = Math.round(parseFloat(labourHrs)*120);
  const miscCost    = 320;
  const batBOS      = batNum>0 ? 640 : 0;
  const subTotal    = panelCost+invCost+batGross+mountCost+cableCost+sbCost+labourCost+miscCost+batBOS;
  const gstAmt      = Math.round(subTotal*0.1);
  const totalIncGST = subTotal + gstAmt;

  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  @page { size: A4; margin: 14mm 15mm; }
  body  { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #1f2937; margin:0; }
  .hdr  { background: #111827; color: white; padding: 14px 18px; }
  .hdr-brand { color: #f5c518; font-size: 15px; font-weight: 900; letter-spacing: 1px; }
  .hdr-sub   { color: #9ca3af; font-size: 9px; margin-top: 2px; }
  .divider   { border: none; border-top: 3px solid #f5c518; margin: 0 0 14px; }
  .sect-head { background: #111827; color: #fff; padding: 8px 12px; font-weight: 800; font-size: 11px;
               border-left: 4px solid #f5c518; margin: 18px 0 10px; }
  .info-table td { padding: 6px 10px; border: 1px solid #e5e7eb; font-size: 11px; }
  .info-table .lbl { background: #f9fafb; color: #6b7280; font-weight: 600; width: 38%; }
  .eq-box { padding: 12px 14px; border-radius: 6px; margin-bottom: 10px; }
  .eq-title { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
  .eq-formula { font-family: monospace; font-size: 12px; background: #fff; padding: 6px 10px; border-radius: 4px; display: inline-block; margin-bottom: 6px; }
  .eq-note { font-size: 9px; color: #6b7280; }
  .sch-table th { background: #111827; color: #fff; padding: 7px 8px; font-size: 10px; border: 1px solid #374151; }
  .sch-table td { padding: 7px 8px; border: 1px solid #e5e7eb; font-size: 10px; }
  .sch-table .stripe { background: #f9fafb; }
  .sch-table .total-row { background: #111827; color: #fff; font-weight: 900; font-size: 12px; }
  .sign-box { border: 1px solid #d1d5db; border-radius: 6px; padding: 12px 16px; margin: 8px 0; }
  .footer-bar { background: #111827; color: #9ca3af; padding: 10px 14px; font-size: 9px; text-align: center; margin-top: 20px; }
  .kpi-cell { border: 2px solid #e5e7eb; border-radius: 8px; padding: 12px 8px; text-align: center; background: #f9fafb; }
  .kpi-num { font-size: 20px; font-weight: 900; color: #111827; }
  .kpi-lbl { font-size: 8px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; margin-top: 3px; }
  .kpi-sub { font-size: 8px; color: #9ca3af; }
  .grn { color: #166534; } .red { color: #991b1b; } .blu { color: #1d4ed8; } .gld { color: #92400e; }
  table { border-collapse: collapse; }
</style></head><body>

<!-- ═══ PAGE 1: COVER ═══ -->
<!-- HEADER -->
<div class="hdr">
  <table width="100%"><tr>
    <td><div class="hdr-brand">HEA — HEFFERNAN ELECTRICAL AUTOMATION</div>
      <div class="hdr-sub">Professional Electrical, Solar, Battery &amp; Automation Solutions &nbsp;&middot;&nbsp; REC Licence 37307 &nbsp;&middot;&nbsp; hea-group.com.au</div></td>
    <td style="text-align:right;vertical-align:middle">
      <div style="font-size:16px;font-weight:900;color:#f5c518">SOLAR SYSTEM PROPOSAL</div>
      <div style="font-size:9px;color:#9ca3af;margin-top:2px">Quote No. ${quoteNo}</div>
    </td>
  </tr></table>
</div>
<hr class="divider">

<!-- CLIENT INFO + INVESTMENT SUMMARY (mirrors HEA template layout) -->
<table width="100%" style="margin-bottom:14px">
  <tr>
    <td style="width:56%;vertical-align:top;padding-right:14px">
      <table width="100%" class="info-table">
        <tr><td class="lbl">Prepared For</td><td><strong>${clientName}</strong></td></tr>
        <tr><td class="lbl">Postcode / Zone</td><td>${postcode} &nbsp;&middot;&nbsp; ${result.zoneName||''}</td></tr>
        <tr><td class="lbl">NMI</td><td>${result.nmi}</td></tr>
        <tr><td class="lbl">Data Analysed</td><td>${result.days} days of NEM12 interval data</td></tr>
        <tr><td class="lbl">Prepared By</td><td>Jesse Heffernan / HEA</td></tr>
        <tr><td class="lbl">Issue Date</td><td>${dateS}</td></tr>
        <tr><td class="lbl">Valid Until</td><td>${validD}</td></tr>
        <tr><td class="lbl">Quote No.</td><td>${quoteNo}</td></tr>
      </table>
    </td>
    <td style="vertical-align:top">
      <div style="background:#111827;border-radius:8px;padding:16px">
        <div style="color:#9ca3af;font-size:9px;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">Project Investment</div>
        <div style="color:#f5c518;font-size:28px;font-weight:900;letter-spacing:-1px">$${sysNetNum.toLocaleString()}</div>
        <div style="color:#9ca3af;font-size:9px;margin-top:2px">Net after $${totalRebates.toLocaleString()} government rebates</div>
        <div style="border-top:1px solid #374151;margin:10px 0"></div>
        <div style="color:#fff;font-size:12px;font-weight:700">${panels} &times; ${CFG.PANEL_W}W = ${systemKw} kWp${batNum>0?' + '+batNum+' kWh battery':''}</div>
        <div style="color:#9ca3af;font-size:9px;margin-top:3px">Solar zone: ${result.zoneName||''} (+${zPct}%)</div>
        <div style="color:#9ca3af;font-size:9px">System efficiency: ${effPct}% &nbsp;&middot;&nbsp; Feed-in: ${fitNum}c/kWh</div>
      </div>
    </td>
  </tr>
</table>

<!-- PROJECT SUMMARY BOX (mirrors HEA template) -->
<table width="100%" style="margin-bottom:14px">
  <tr>
    <td style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:14px 16px;width:62%;vertical-align:top;padding-right:14px">
      <div style="font-weight:800;font-size:11px;color:#111827;margin-bottom:8px">Project Summary</div>
      <div style="font-size:10px;color:#374151;line-height:1.7">
        Supply and install a complete grid-connected solar energy system at the above premises, comprising ${panels} &times; ${CFG.PANEL_W}W solar panels (${systemKw} kWp DC) with a ${parseFloat(systemKw)<=5?'5':'single-phase'} string inverter${batNum>0?', '+batNum+' kWh battery storage system':''}, full balance-of-system components, switchboard integration, metering upgrades, commissioning and client handover. System designed using actual NEM12 consumption interval data to maximise self-consumption and financial return.
      </div>
    </td>
    <td style="vertical-align:top">
      <div style="border:1px solid #e5e7eb;border-radius:8px;padding:12px 14px">
        <div style="font-weight:800;font-size:11px;color:#111827;margin-bottom:8px">Key Deliverables</div>
        <div style="font-size:9px;color:#374151;line-height:1.9">
          &bull; Supply &amp; installation of all nominated equipment<br>
          &bull; CEC-compliant electrical works and wiring<br>
          &bull; Switchboard integration and metering upgrade<br>
          &bull; STC rebate processing — no paperwork required<br>
          ${batNum>0?'&bull; Battery commissioning and VPP-ready setup<br>':''}
          &bull; Testing, commissioning and system demonstration<br>
          &bull; Certificate of compliance and close-out documentation
        </div>
      </div>
    </td>
  </tr>
</table>

<!-- 5 KPI CARDS -->
<table width="100%" style="margin-bottom:14px">
  <tr>
    <td style="padding-right:8px"><div class="kpi-cell" style="border-color:#16a34a"><div class="kpi-num grn">$${annSav.toLocaleString()}</div><div class="kpi-lbl">Year 1 Savings</div><div class="kpi-sub">grows ~3%/yr</div></div></td>
    <td style="padding-right:8px"><div class="kpi-cell"><div class="kpi-num">${pb} yr</div><div class="kpi-lbl">Approx Simple Payback</div><div class="kpi-sub">shortcut estimate only</div></div></td>` +
    (() => {
      const eng = engineSummary || {};
      const bep  = eng.undis_frac != null ? eng.undis_frac + ' yr'  : (pb + ' yr');
      const dpb  = eng.dis_frac   != null ? eng.dis_frac   + ' yr'  : '—';
      const npv  = eng.NPV        != null ? '$' + Math.abs(Math.round(eng.NPV)).toLocaleString() : ('$' + profit25.toLocaleString());
      const bepLbl = eng.undis_be ? 'Break-Even (BEP)' : 'Approx Breakeven';
      const bepSub = eng.undis_be ? 'cumulative NCF ≥ 0' : 'shortcut only';
      const npvLbl = eng.NPV != null ? 'NPV' : '25yr Net Return';
      const npvSub = eng.NPV != null ? (eng.NPV >= 0 ? 'viable investment' : 'negative — check inputs') : '3% tariff est.';
      const npvCol = eng.NPV != null ? (eng.NPV >= 0 ? '#166534' : '#991b1b') : '#92400e';
      return `
    <td style="padding-right:8px"><div class="kpi-cell" style="border-color:#1d4ed8"><div class="kpi-num" style="color:#1d4ed8">${bep}</div><div class="kpi-lbl">${bepLbl}</div><div class="kpi-sub">${bepSub}</div></div></td>
    <td style="padding-right:8px"><div class="kpi-cell"><div class="kpi-num">${selfPct}%</div><div class="kpi-lbl">Self-Consumption</div><div class="kpi-sub">${genKwh.toLocaleString()} kWh/yr</div></div></td>
    <td><div class="kpi-cell" style="border-color:#f5c518;background:#fffbeb"><div class="kpi-num" style="color:${npvCol}">${npv}</div><div class="kpi-lbl">${npvLbl}</div><div class="kpi-sub">${npvSub}</div></div></td>`;
    })() + `
  </tr>
</table>

<!-- FINANCE SUMMARY TABLE — see pdfFinanceSummary() in PDFSections.gs -->
` + pdfFinanceSummary(engineSummary) + `

<!-- PAYBACK TIMELINE -->
<div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:12px 16px;margin-bottom:14px">
  <div style="font-size:11px;font-weight:700;color:#111827;margin-bottom:8px">Your investment timeline — from today to free power for life</div>
  <table width="100%" cellspacing="0" cellpadding="0">
    <tr>
      <td style="width:${Math.min(50,Math.round(pbYr/25*100))}%;background:#ef4444;height:24px;border-radius:5px 0 0 5px;padding:0 8px;vertical-align:middle">
        <span style="color:#fff;font-size:9px;font-weight:700">Recovery — ${pb} years</span>
      </td>
      <td style="background:#16a34a;height:24px;border-radius:0 5px 5px 0;padding:0 8px;vertical-align:middle">
        <span style="color:#fff;font-size:9px;font-weight:700">FREE POWER for ${freeYears} years &rarr; +$${profit25.toLocaleString()} profit</span>
      </td>
    </tr>
  </table>
  <table width="100%" cellspacing="0" cellpadding="0" style="margin-top:4px">
    <tr>
      <td style="width:${Math.min(50,Math.round(pbYr/25*100))}%;font-size:8px;color:#991b1b;font-weight:700;text-align:center">Recovering $${sysNetNum.toLocaleString()} investment</td>
      <td style="font-size:8px;color:#166534;font-weight:700;text-align:center">Earning $${profit25.toLocaleString()} over ${freeYears} years</td>
    </tr>
  </table>
</div>

<!-- BEFORE / AFTER BILLS -->
<table width="100%" style="margin-bottom:14px">
  <tr>
    <td style="width:46%;padding:14px;background:#fef2f2;border:2px solid #fecaca;border-radius:8px;text-align:center">
      <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#dc2626;margin-bottom:6px">Before Solar — Monthly Bill</div>
      <div style="font-size:30px;font-weight:900;color:#991b1b">$${mthBefore}</div>
      <div style="font-size:9px;color:#6b7280;margin-top:3px">per month &nbsp;&middot;&nbsp; $${annBefore.toLocaleString()}/yr</div>
      <div style="font-size:9px;color:#6b7280">Load: ${annLoad.toLocaleString()} kWh/yr at ${avgTariff.toFixed(1)}c</div>
    </td>
    <td style="width:8%;text-align:center;font-size:16px;color:#9ca3af">&rarr;</td>
    <td style="width:46%;padding:14px;background:#f0fdf4;border:2px solid #86efac;border-radius:8px;text-align:center">
      <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#16a34a;margin-bottom:6px">After Solar — Monthly Bill</div>
      <div style="font-size:30px;font-weight:900;color:#166534">$${mthAfter}</div>
      <div style="font-size:9px;color:#6b7280;margin-top:3px">${billSavPct}% less &nbsp;&middot;&nbsp; $${annAfter.toLocaleString()}/yr</div>
      <div style="font-size:9px;color:#16a34a;font-weight:700">Monthly saving: $${mthSaving}</div>
    </td>
  </tr>
</table>

<!-- ═══ DETAILED QUOTE SCHEDULE ═══ -->
<div class="sect-head">Detailed Quote Schedule</div>
<table width="100%" class="sch-table" style="margin-bottom:6px">
  <tr>
    <th style="text-align:left;width:5%">#</th>
    <th style="text-align:left;width:46%">Description</th>
    <th style="text-align:right;width:8%">Qty</th>
    <th style="text-align:right;width:8%">Unit</th>
    <th style="text-align:right;width:14%">Rate</th>
    <th style="text-align:right;width:15%">Amount</th>
  </tr>
  <tr><td>1</td><td>${CFG.PANEL_W}W Solar Panel (Trina / equiv. Tier 1)</td><td style="text-align:right">${panels}</td><td style="text-align:right">ea</td><td style="text-align:right">$${Math.round(panelCost/panels)}</td><td style="text-align:right">$${panelCost.toLocaleString()}</td></tr>
  <tr class="stripe"><td>2</td><td>${batNum>0?'Hybrid Inverter '+systemKw+'kW (Fronius GEN24 / equiv.)':'String Inverter '+systemKw+'kW (Fronius / equiv.)'}</td><td style="text-align:right">1</td><td style="text-align:right">lot</td><td style="text-align:right">$${invCost.toLocaleString()}</td><td style="text-align:right">$${invCost.toLocaleString()}</td></tr>
  ${batNum>0?`<tr><td>3</td><td>Battery Storage System ${batNum} kWh usable (BYD / Sungrow / equiv.)</td><td style="text-align:right">1</td><td style="text-align:right">lot</td><td style="text-align:right">$${batGross.toLocaleString()}</td><td style="text-align:right">$${batGross.toLocaleString()}</td></tr><tr class="stripe"><td>4</td>`:
  `<tr class="stripe"><td>3</td>`}
  <td>Mounting system — rails, clamps, flashings, hardware</td><td style="text-align:right">1</td><td style="text-align:right">lot</td><td style="text-align:right">$${mountCost.toLocaleString()}</td><td style="text-align:right">$${mountCost.toLocaleString()}</td></tr>
  <tr><td>${batNum>0?5:4}</td><td>DC cabling, MC4 connectors, isolators, conduit</td><td style="text-align:right">1</td><td style="text-align:right">lot</td><td style="text-align:right">$${cableCost.toLocaleString()}</td><td style="text-align:right">$${cableCost.toLocaleString()}</td></tr>
  <tr class="stripe"><td>${batNum>0?6:5}</td><td>AC cabling, isolators, switchboard / metering works</td><td style="text-align:right">1</td><td style="text-align:right">lot</td><td style="text-align:right">$${sbCost.toLocaleString()}</td><td style="text-align:right">$${sbCost.toLocaleString()}</td></tr>
  ${batNum>0?`<tr><td>7</td><td>Battery install BOS — cabling, isolators, commissioning</td><td style="text-align:right">1</td><td style="text-align:right">lot</td><td style="text-align:right">$${batBOS.toLocaleString()}</td><td style="text-align:right">$${batBOS.toLocaleString()}</td></tr><tr class="stripe"><td>8</td>`:`<tr class="stripe"><td>6</td>`}
  <td>Labour — installation &amp; commissioning (${labourHrs} hrs @ $120/hr)</td><td style="text-align:right">${labourHrs}</td><td style="text-align:right">hrs</td><td style="text-align:right">$120</td><td style="text-align:right">$${labourCost.toLocaleString()}</td></tr>
  <tr><td>${batNum>0?9:7}</td><td>Miscellaneous — dektite, stickers, lugs, sundries</td><td style="text-align:right">1</td><td style="text-align:right">lot</td><td style="text-align:right">$${miscCost.toLocaleString()}</td><td style="text-align:right">$${miscCost.toLocaleString()}</td></tr>
  <tr style="background:#f3f4f6"><td colspan="5" style="padding:7px 8px;font-weight:700;text-align:right">Subtotal (ex. GST)</td><td style="padding:7px 8px;text-align:right;font-weight:700">$${subTotal.toLocaleString()}</td></tr>
  <tr style="background:#f3f4f6;color:#6b7280"><td colspan="5" style="padding:6px 8px;text-align:right">GST (10%)</td><td style="padding:6px 8px;text-align:right">$${gstAmt.toLocaleString()}</td></tr>
  <tr style="background:#f3f4f6;color:#6b7280"><td colspan="5" style="padding:6px 8px;text-align:right;font-size:10px">Less: Solar STC rebate (${stcs} STCs @ $37.20)</td><td style="padding:6px 8px;text-align:right;color:#166534;font-weight:700">-$${solarRebate.toLocaleString()}</td></tr>
  ${batNum>0?`<tr style="background:#f3f4f6;color:#6b7280"><td colspan="5" style="padding:6px 8px;text-align:right;font-size:10px">Less: Battery rebate — CHBP (${batSTCsLoc} STCs @ $37 — pre-May full rate)</td><td style="padding:6px 8px;text-align:right;color:#166534;font-weight:700">-$${batRebate.toLocaleString()}</td></tr>`:''}
  <tr class="total-row"><td colspan="5" style="padding:10px 8px;text-align:right;font-size:12px">TOTAL NET INVESTMENT (after all rebates + GST)</td><td style="padding:10px 8px;text-align:right;font-size:14px;color:#f5c518">$${sysNetNum.toLocaleString()}</td></tr>
</table>
<div style="font-size:9px;color:#6b7280;margin-bottom:6px">* Rebates applied at point of sale — no paperwork required. Battery rebate changes 1 May 2026. Sign before April 30 to secure current rate.</div>

<!-- INCLUSIONS / EXCLUSIONS -->
<table width="100%" style="margin-bottom:14px">
  <tr>
    <td style="width:50%;vertical-align:top;padding-right:8px">
      <div style="font-weight:700;font-size:11px;color:#166534;margin-bottom:6px;border-left:3px solid #16a34a;padding-left:8px">Inclusions</div>
      <div style="font-size:9px;color:#374151;line-height:1.8">
        &bull; Supply and installation of all listed equipment<br>
        &bull; CEC-compliant electrical wiring and cabling<br>
        &bull; DC and AC isolators and conduit<br>
        &bull; Switchboard and meter works as described<br>
        &bull; STC rebate claim processing (point of sale discount)<br>
        ${batNum>0?'&bull; Battery commissioning and app setup<br>':''}
        &bull; System testing, commissioning and demonstration<br>
        &bull; Certificate of electrical compliance<br>
        &bull; Manufacturer warranty registration
      </div>
    </td>
    <td style="width:50%;vertical-align:top">
      <div style="font-weight:700;font-size:11px;color:#991b1b;margin-bottom:6px;border-left:3px solid #dc2626;padding-left:8px">Exclusions / Assumptions</div>
      <div style="font-size:9px;color:#374151;line-height:1.8">
        &bull; Roof repairs, structural modifications or re-roofing<br>
        &bull; Builder or owner-supplied works by others<br>
        &bull; Patch and paint unless specifically stated<br>
        &bull; Network/DNSP upgrade fees (if applicable)<br>
        &bull; Hazardous materials (asbestos, lead paint)<br>
        &bull; Double storey surcharge unless confirmed on-site<br>
        &bull; Any works not explicitly listed above
      </div>
    </td>
  </tr>
</table>

<!-- 3 KEY EQUATIONS -->
<div class="sect-head">How the Numbers Work — 3 Key Equations</div>
<table width="100%">
  <tr>
    <td style="width:33%;padding-right:8px;vertical-align:top">
      <div class="eq-box" style="background:#fffbeb;border:2px solid #f5c518">
        <div class="eq-title gld">⚡ Equation 1 — Generation</div>
        <div style="font-size:9px;color:#6b7280;margin-bottom:6px">kWp × Sun hours × Efficiency × Zone = Output</div>
        <div class="eq-formula">${systemKw} × 1,400 × ${(effPct/100).toFixed(2)} × ${(zMult*100).toFixed(0)}% = <strong class="grn">${genKwh.toLocaleString()} kWh/yr</strong></div>
        <div class="eq-note">Each kWp = 1,400 solar work-hours/yr. Zone +${zPct}% above Melbourne base.</div>
      </div>
    </td>
    <td style="width:33%;padding-right:8px;vertical-align:top">
      <div class="eq-box" style="background:#f0fdf4;border:2px solid #86efac">
        <div class="eq-title grn">💰 Equation 2 — Savings</div>
        <div style="font-size:9px;color:#6b7280;margin-bottom:6px">Self-used × Tariff + Exported × FiT = Annual savings</div>
        <div class="eq-formula">${selfKwh.toLocaleString()} × ${avgTariff.toFixed(1)}c + ${expKwh} × ${fitNum}c = <strong class="grn">$${annSav.toLocaleString()}/yr</strong></div>
        <div class="eq-note">Self-use is ${(avgTariff/fitNum).toFixed(1)}&times; more valuable than export. Battery maximises this.</div>
      </div>
    </td>
    <td style="width:33%;vertical-align:top">
      <div class="eq-box" style="background:#eff6ff;border:2px solid #93c5fd">
        <div class="eq-title blu">📅 Equation 3 — Payback</div>
        <div style="font-size:9px;color:#6b7280;margin-bottom:6px">Investment ÷ Annual savings = Years to breakeven</div>
        <div class="eq-formula">$${sysNetNum.toLocaleString()} ÷ $${annSav.toLocaleString()} = <strong class="blu">${pb} years</strong></div>
        <div class="eq-note">After ${pb} years: ${freeYears} years of free power + $${profit25.toLocaleString()} profit.</div>
      </div>
    </td>
  </tr>
</table>

<!-- ENVIRONMENTAL -->
<div class="sect-head">🌱 Environmental Impact</div>
<table width="100%" style="margin-bottom:14px">
  <tr>
    <td style="width:32%;padding:10px;background:#f0fdf4;border:1px solid #86efac;border-radius:6px;text-align:center">
      <div style="font-size:18px;font-weight:900;color:#166534">${annCO2t}t CO₂/yr</div>
      <div style="font-size:9px;color:#374151;margin-top:2px">avoided &middot; ${genKwh.toLocaleString()} kWh &times; 0.82 kg/kWh</div>
    </td>
    <td style="width:2%"></td>
    <td style="width:32%;padding:10px;background:#f0fdf4;border:1px solid #86efac;border-radius:6px;text-align:center">
      <div style="font-size:18px;font-weight:900;color:#166534">${trees} trees</div>
      <div style="font-size:9px;color:#374151;margin-top:2px">equivalent &middot; 25yr lifetime CO₂</div>
    </td>
    <td style="width:2%"></td>
    <td style="width:32%;padding:10px;background:#f0fdf4;border:1px solid #86efac;border-radius:6px;text-align:center">
      <div style="font-size:18px;font-weight:900;color:#166534">${kmCar} km</div>
      <div style="font-size:9px;color:#374151;margin-top:2px">car driving avoided &middot; 25yr</div>
    </td>
  </tr>
</table>

<!-- 25yr PROJECTION -->
<div class="sect-head">📈 25-Year Financial Projection (3% Annual Tariff Growth)</div>
<table width="100%">
  <tr style="background:#111827;color:#fff">
    <th style="padding:8px 10px;text-align:left;font-size:10px;border:1px solid #374151">Milestone</th>
    <th style="padding:8px 10px;text-align:right;font-size:10px;border:1px solid #374151">Annual Savings</th>
    <th style="padding:8px 10px;text-align:right;font-size:10px;border:1px solid #374151">Cumulative Savings</th>
    <th style="padding:8px 10px;text-align:right;font-size:10px;border:1px solid #374151">Net Position</th>
  </tr>
  ${projRows}
</table>
<div style="font-size:8px;color:#9ca3af;margin:4px 0 14px">3% annual tariff escalation. Panel degradation ~0.4%/yr not modelled. Not financial advice.</div>

<!-- MONTHLY DATA -->
<div class="sect-head">📅 Monthly Generation vs Consumption</div>
<table width="100%">
  <tr style="background:#111827;color:#fff">
    <th style="padding:6px 8px;text-align:left;border:1px solid #374151;font-size:9px">Month</th>
    <th style="padding:6px 8px;text-align:right;border:1px solid #374151;font-size:9px">Generated kWh</th>
    <th style="padding:6px 8px;text-align:right;border:1px solid #374151;font-size:9px">Load kWh</th>
    <th style="padding:6px 8px;text-align:right;border:1px solid #374151;font-size:9px;color:#86efac">Used ✓</th>
    <th style="padding:6px 8px;text-align:right;border:1px solid #374151;font-size:9px;color:#93c5fd">Exported</th>
    <th style="padding:6px 8px;text-align:right;border:1px solid #374151;font-size:9px;color:#fca5a5">Grid Import</th>
    <th style="padding:6px 8px;text-align:right;border:1px solid #374151;font-size:9px;color:#86efac">Bill Saving</th>
  </tr>
  ${mRows}
  <tr style="background:#111827;color:#fff;font-weight:700">
    <td style="padding:7px 8px;border:1px solid #374151;font-size:10px">Full Year</td>
    <td style="padding:7px 8px;border:1px solid #374151;text-align:right;font-size:10px">${mTG.toLocaleString()}</td>
    <td style="padding:7px 8px;border:1px solid #374151;text-align:right;font-size:10px">${mTC.toLocaleString()}</td>
    <td style="padding:7px 8px;border:1px solid #374151;text-align:right;font-size:10px;color:#86efac">${mTS.toLocaleString()}</td>
    <td style="padding:7px 8px;border:1px solid #374151;text-align:right;font-size:10px;color:#93c5fd">${mTE.toLocaleString()}</td>
    <td style="padding:7px 8px;border:1px solid #374151;text-align:right;font-size:10px;color:#fca5a5">${mTI.toLocaleString()}</td>
    <td style="padding:7px 8px;border:1px solid #374151;text-align:right;font-size:10px;color:#86efac">$${mTSav.toLocaleString()}</td>
  </tr>
</table>

<!-- HOURLY SEASONAL DATA -->
<div class="sect-head">⏱ Technical — Hour-by-Hour Data (All 4 Seasons)</div>
<div style="font-size:9px;color:#6b7280;margin:-8px 0 10px"><span class="grn"><strong>Green</strong> = solar direct to load</span> &middot; <span class="blu"><strong>Blue</strong> = exported @ ${fitNum}c/kWh</span> &middot; <span class="red"><strong>Red</strong> = from grid @ ${avgTariff.toFixed(1)}c/kWh</span>. Values in kWh/hr.</div>
${sTables}

<!-- ═══ TERMS & ACCEPTANCE ═══ -->
<div class="sect-head">Terms &amp; Client Acceptance</div>
<div style="font-size:9px;color:#374151;line-height:1.9;margin-bottom:14px">
  &bull; This quotation is valid until ${validD} unless withdrawn or superseded in writing.<br>
  &bull; Any variations to scope, access, equipment, switchboard condition or latent site issues may result in a revised price.<br>
  &bull; All works are subject to final site inspection, safe access and distributor/DNSP requirements.<br>
  &bull; Government rebates (STC) are processed by HEA on behalf of the client at point of sale — no separate claim required.<br>
  &bull; Battery rebate (CHBP) applies to eligible systems installed and switched on after 1 July 2025. Rate valid until 30 April 2026 — after which tiered rates apply.<br>
  &bull; Lead times are indicative and subject to supplier availability and site readiness.<br>
  &bull; Ownership of all supplied equipment remains with HEA until full payment has been received.<br>
  &bull; A 10% deposit is required to confirm the order and secure your installation date.<br>
  &bull; All savings and generation figures are estimates based on NEM12 interval data and BOM irradiance models. Actual results will vary.
</div>

<table width="100%" style="margin-bottom:20px">
  <tr>
    <td style="width:50%;padding-right:12px;vertical-align:top">
      <div class="sign-box">
        <div style="font-weight:700;font-size:11px;color:#111827;margin-bottom:10px">Client Acceptance</div>
        <div style="font-size:9px;color:#374151;margin-bottom:16px">By signing below I accept this quotation, confirm the scope, pricing, inclusions, exclusions and payment terms, and authorise HEA to proceed.</div>
        <table width="100%">
          <tr><td style="font-size:9px;color:#6b7280;padding-bottom:4px">Client Name</td></tr>
          <tr><td style="border-bottom:1px solid #d1d5db;padding-bottom:14px;font-size:11px;font-weight:600">${clientName}</td></tr>
          <tr><td style="font-size:9px;color:#6b7280;padding:10px 0 4px">Signature</td></tr>
          <tr><td style="border-bottom:1px solid #d1d5db;padding-bottom:24px"></td></tr>
          <tr><td style="font-size:9px;color:#6b7280;padding:10px 0 4px">Date</td></tr>
          <tr><td style="border-bottom:1px solid #d1d5db;padding-bottom:14px"></td></tr>
        </table>
      </div>
    </td>
    <td style="width:50%;vertical-align:top">
      <div class="sign-box" style="background:#f9fafb">
        <div style="font-weight:700;font-size:11px;color:#111827;margin-bottom:10px">HEA Contact &amp; Details</div>
        <table width="100%">
          <tr><td style="font-size:9px;color:#6b7280;width:40%">Company</td><td style="font-size:9px;font-weight:600">Heffernan Electrical Automation</td></tr>
          <tr><td style="font-size:9px;color:#6b7280;padding-top:4px">REC Licence</td><td style="font-size:9px;padding-top:4px">37307</td></tr>
          <tr><td style="font-size:9px;color:#6b7280;padding-top:4px">Phone</td><td style="font-size:9px;padding-top:4px">0481 267 812</td></tr>
          <tr><td style="font-size:9px;color:#6b7280;padding-top:4px">Email</td><td style="font-size:9px;padding-top:4px">hea.trades@gmail.com</td></tr>
          <tr><td style="font-size:9px;color:#6b7280;padding-top:4px">Website</td><td style="font-size:9px;padding-top:4px">hea-group.com.au</td></tr>
          <tr><td style="font-size:9px;color:#6b7280;padding-top:8px">Quote No.</td><td style="font-size:9px;font-weight:700;padding-top:8px">${quoteNo}</td></tr>
          <tr><td style="font-size:9px;color:#6b7280;padding-top:4px">Valid Until</td><td style="font-size:9px;padding-top:4px">${validD}</td></tr>
        </table>
        <div style="margin-top:14px;font-size:9px;color:#6b7280;border-top:1px solid #e5e7eb;padding-top:8px">
          Based on ${result.days} days of NEM12 interval data and BOM BERS irradiance models. Savings estimates vary with weather, tariff changes and usage. Not financial advice.
        </div>
      </div>
    </td>
  </tr>
</table>

<div class="footer-bar">
  <strong style="color:#f5c518">Heffernan Electrical Automation</strong> &nbsp;&middot;&nbsp; REC 37307 &nbsp;&middot;&nbsp; hea-group.com.au &nbsp;&middot;&nbsp; 0481 267 812 &nbsp;&middot;&nbsp; hea.trades@gmail.com<br>
  ${quoteNo} &nbsp;&middot;&nbsp; Prepared ${dateS} &nbsp;&middot;&nbsp; Valid until ${validD}
</div>
` +
// ASSUMPTIONS + RISKS + AUDIT FOOTER — see PDFSections.gs
pdfAssumptionBlock(engineSummary, supplyAnnual) +
pdfRisksBlock() +
pdfAuditFooter(engineSummary, result, quoteNo, dateS) + `

</body></html>`;
}


// ═══════════════════════════════════════════════════════════════════
// HEA QUOTE SIGNING & FOLLOW-UP SYSTEM  v1
// Handles: signed quote PDF, unsigned follow-up, session resume
// ═══════════════════════════════════════════════════════════════════

// ── Save session data for resume link ─────────────────────────────