// HEA Solar Analyser — https://hea-group.com.au
// REC 37307 — Jesse Heffernan, Bendigo VIC

// QuoteManager.gs — session resume, signed/unsigned quote flow

function saveSessionForResume(data) {
  try {
    const ss    = SpreadsheetApp.openById(CFG.SHEET_ID);
    let   sheet = ss.getSheetByName('QuoteSessions');
    if (!sheet) {
      sheet = ss.insertSheet('QuoteSessions');
      sheet.appendRow(['SessionID', 'ClientName', 'Data', 'CreatedAt', 'ExpiresAt']);
    }
    const id      = 'HEA-' + Utilities.getUuid();  // cryptographically random UUID
    const now     = new Date();
    const expires = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days
    sheet.appendRow([id, data.clientName || '', JSON.stringify(data), now.toISOString(), expires.toISOString()]);
    const webAppUrl = ScriptApp.getService().getUrl();
    const sig = signToken(id);
    return { ok: true, sessionId: id, resumeUrl: webAppUrl + '?resume=' + id + '&sig=' + encodeURIComponent(sig) };
  } catch(e) {
    return { ok: false, error: e.message };
  }
}

// ── Load session data by ID ────────────────────────────────────────
function loadSession(id, sig) {
  try {
    // Verify HMAC signature before loading any session data
    if (!verifyToken(id, sig)) return null;
    const ss    = SpreadsheetApp.openById(CFG.SHEET_ID);
    const sheet = ss.getSheetByName('QuoteSessions');
    if (!sheet) return null;
    const rows = sheet.getDataRange().getValues();
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === id) {
        const expires = new Date(rows[i][4]);
        if (expires < new Date()) return null; // expired
        logAdminEvent('SESSION_LOAD', 'id=' + id, 'ok');
        return JSON.parse(rows[i][2]);
      }
    }
  } catch(e) {}
  return null;
}

// ── Send signed quote (with signature embedded in PDF) ─────────────
// ── STEP 1: Fast acknowledgement — saves payload, returns immediately so
//            the customer sees the success screen without waiting for PDFs.
//            Called first by qAccept() in Quote.html.
function sendSignedQuote(payload) {
  try {
    // Save payload to PendingPDFs sheet so processSignedPDFs() can pick it up
    const ss    = SpreadsheetApp.openById(CFG.SHEET_ID);
    let   sheet = ss.getSheetByName('PendingPDFs');
    if (!sheet) {
      sheet = ss.insertSheet('PendingPDFs');
      sheet.appendRow(['PendingID', 'CreatedAt', 'Status', 'PayloadJSON']);
      sheet.getRange('A1:D1').setFontWeight('bold');
    }
    const pendingId = 'PDF-' + Utilities.getUuid();
    sheet.appendRow([pendingId, new Date().toISOString(), 'pending', JSON.stringify(payload)]);

    // Return immediately — customer is through to success screen
    return { ok: true, pendingId };
  } catch(e) {
    return { error: 'sendSignedQuote error: ' + e.message };
  }
}

// ── STEP 2: All the heavy work — PDF generation, Drive storage, email, job card.
//            Called fire-and-forget by qAccept() in Quote.html immediately after
//            sendSignedQuote() returns. Customer never waits for this.
function processSignedPDFs(pendingId) {
  try {
    // Load payload from PendingPDFs sheet
    const ss    = SpreadsheetApp.openById(CFG.SHEET_ID);
    const sheet = ss.getSheetByName('PendingPDFs');
    if (!sheet) return { error: 'PendingPDFs sheet not found' };
    const rows = sheet.getDataRange().getValues();
    let payloadRow = -1;
    let payload = null;
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === pendingId) {
        payloadRow = i + 1; // 1-based sheet row
        try { payload = JSON.parse(rows[i][3]); } catch(_) {}
        break;
      }
    }
    if (!payload) return { error: 'Pending payload not found: ' + pendingId };

    // Mark as processing
    if (payloadRow > 0) sheet.getRange(payloadRow, 3).setValue('processing');

    const { clientName, clientEmail, signatureDataUrl, quoteNo, postcode, result,
            systemKw, batteryKwh, sysNet, fitC, sliderFin, signedAt,
            engineSummary: signedEngSummary, engineProjection: signedEngProj,
            connFeeAnnual: signedConnFee } = payload;

    const today  = new Date();
    const dateS  = Utilities.formatDate(today, 'Australia/Melbourne', 'dd MMMM yyyy');
    const validD = Utilities.formatDate(new Date(today.getTime() + 30*24*60*60*1000), 'Australia/Melbourne', 'dd MMMM yyyy');

    let sigImgUrl = '';
    if (signatureDataUrl && signatureDataUrl.startsWith('data:image/png;base64,')) {
      sigImgUrl = signatureDataUrl;
    }

    const fin    = sliderFin || {};
    const panels = Math.ceil(parseFloat(systemKw) * 1000 / CFG.PANEL_W);
    const batNum = parseFloat(batteryKwh) || 0;
    const stcs   = Math.floor(parseFloat(systemKw) * 1.382 * 5);
    const solarRebate = Math.round(stcs * 37);
    const batRebate   = batNum > 0 ? Math.round(batNum * 330) : 0;
    const grossEst    = sysNet + solarRebate + batRebate;
    const annSav      = parseInt(fin.savings || 0);
    let total25s;
    if (signedEngProj && signedEngProj.total25 != null) {
      total25s = signedEngProj.total25;
    } else {
      total25s = Math.round([...Array(25)].reduce((a,_,i) => a + annSav * Math.pow(1.03,i), 0));
    }
    const signedSupply = parseFloat(signedConnFee) || 380;

    const reportHtml = buildReportHTML(
      clientName, postcode, dateS, validD, quoteNo, result || {},
      systemKw, batteryKwh, sysNet, fitC, fin,
      panels, batNum, stcs, solarRebate, batRebate, grossEst, total25s,
      sigImgUrl, signedAt, signedEngSummary, signedSupply, signedEngProj
    );

    // ── Build customer quote PDF ─────────────────────────────────────────────
    const title         = 'SIGNED — HEA Solar Quote — ' + clientName + ' — ' + quoteNo;
    const dateForFolder = Utilities.formatDate(today, 'Australia/Melbourne', 'yyyyMMdd');
    const folder        = getOrCreateJobFolder(clientName, dateForFolder);
    const docFile       = DriveApp.getFolderById(CFG.FOLDER_ID).createFile(title + '.html', reportHtml, 'text/html');
    const fileId        = docFile.getId();
    let pdfBlob, pdfUrl = '';
    try {
      pdfBlob = DriveApp.getFileById(fileId).getAs('application/pdf');
      pdfBlob.setName(title + '.pdf');
      const pdfFile = folder.createFile(pdfBlob.copyBlob());
      pdfFile.setName(title + '.pdf');
      pdfUrl = pdfFile.getUrl();
    } finally {
      try { docFile.setTrashed(true); } catch(_) {}
    }

    // ── Also save PDF to client job folder 01-quotes/ (if driveUrl provided) ─
    if (payload.driveUrl) {
      try {
        const driveMatch = payload.driveUrl.match(/folders\/([a-zA-Z0-9_-]+)/);
        if (driveMatch) {
          const clientFolder = DriveApp.getFolderById(driveMatch[1]);
          const quotesIter = clientFolder.getFoldersByName('01-quotes');
          const quotesFolder = quotesIter.hasNext() ? quotesIter.next() : clientFolder.createFolder('01-quotes');
          const saFile = quotesFolder.createFile(pdfBlob.copyBlob());
          saFile.setName(title + '.pdf');
        }
      } catch(copyErr) {
        Logger.log('Could not copy SA PDF to job 01-quotes folder: ' + copyErr.message);
      }
    }

    // ── Email the customer ───────────────────────────────────────────────────
    const emailHtml = buildSignedEmailHTML(payload, pdfUrl, dateS, panels, batNum, annSav, total25s, solarRebate, batRebate);
    GmailApp.sendEmail(
      clientEmail || CFG.EMAIL,
      '✅ Your Signed HEA Solar Quote — ' + quoteNo,
      'Your signed solar quote from Heffernan Electrical Automation is attached.',
      {
        htmlBody:    emailHtml,
        attachments: [pdfBlob],
        cc:          CFG.EMAIL,
        name:        'Heffernan Electrical Automation'
      }
    );

    // ── Generate installer job card ──────────────────────────────────────────
    try {
      generateJobCard({
        clientName, clientEmail: clientEmail || '',
        address:        payload.address      || '',
        phone:          payload.phone        || '',
        postcode:       payload.postcode     || '',
        systemKw:       payload.systemKw     || '0',
        batteryKwh:     payload.batteryKwh   || 0,
        panels:         payload.panels       || 0,
        panelW:         payload.panelW       || 440,
        eff:            payload.eff          || 85,
        qualityTier:    payload.qualityTier  || 'standard',
        quoteNo, signedAt: payload.signedAt  || dateS,
        sysNet: payload.sysNet || 0, fitC: payload.fitC || 3.3,
        sliderFin: fin, result: payload.result || {},
        connFeeAnnual: signedConnFee || 380,
        arcFlashResult: payload.arcFlashResult || null,
        jobFolder: folder,
      });
    } catch(jcErr) {
      Logger.log('JobCard generation failed (non-fatal): ' + jcErr.message);
    }

    // ── Mark complete and clean up ───────────────────────────────────────────
    if (payloadRow > 0) {
      sheet.getRange(payloadRow, 3).setValue('done');
      // Clear the payload JSON to avoid bloating the sheet over time
      sheet.getRange(payloadRow, 4).setValue('');
    }

    return { ok: true, pdfUrl };
  } catch(e) {
    Logger.log('processSignedPDFs error: ' + e.message);
    return { error: e.message };
  }
}

// ── Send unsigned follow-up (not ready yet path) ──────────────────
function sendUnsignedFollowup(payload) {
  try {
    const { clientName, clientEmail, quoteNo } = payload;

    // Save session + generate resume URL
    const sessionRes = saveSessionForResume(payload);
    const resumeUrl  = sessionRes.resumeUrl || ScriptApp.getService().getUrl();

    const today = new Date();
    const dateS = Utilities.formatDate(today, 'Australia/Melbourne', 'dd MMMM yyyy');

    const fin     = payload.sliderFin || {};
    const annSav  = parseInt(fin.savings || 0);
    const dayRate = (annSav / 365).toFixed(2);

    const emailHtml = buildUnsignedEmailHTML(payload, resumeUrl, dateS, annSav, dayRate);

    // Email client the analysis with resume link
    GmailApp.sendEmail(
      clientEmail || CFG.EMAIL,
      '☀ Your HEA Solar Analysis — ' + quoteNo + ' (Resume Anytime)',
      'Your HEA Solar Analysis is ready. Use the link in this email to resume anytime.',
      {
        htmlBody: emailHtml,
        cc:       CFG.EMAIL,
        name:     'Heffernan Electrical Automation'
      }
    );

    return { ok: true, resumeUrl, msg: 'Follow-up sent to ' + (clientEmail || CFG.EMAIL) };
  } catch(e) {
    return { error: 'sendUnsignedFollowup error: ' + e.message };
  }
}

// ── Email HTML: Signed confirmation ──────────────────────────────
function buildSignedEmailHTML(p, pdfUrl, dateS, panels, batNum, annSav, total25, solarRebate, batRebate) {
  const sysNetNum = parseFloat(p.sysNet) || 0;
  const pb = annSav > 0 ? (sysNetNum / annSav).toFixed(1) : '—';
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,'Helvetica Neue',Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.10)">
  <tr><td style="background:#1a1a1a;padding:28px 36px">
    <img src="${CFG.LOGO_URL}" height="36" alt="HEA" style="margin-bottom:16px;display:block">
    <div style="color:#f5c518;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:6px">Quote Signed & Confirmed</div>
    <div style="color:#fff;font-size:24px;font-weight:800">Thank you, ${p.clientName}!</div>
    <div style="color:#9ca3af;font-size:12px;margin-top:4px">${p.quoteNo} · Signed ${dateS} · REC Licence 37307</div>
  </td></tr>
  <tr><td style="padding:28px 36px">
    <p style="font-size:14px;color:#374151;line-height:1.7;margin:0 0 20px">Your signed solar proposal is attached to this email as a PDF. Here's a summary of what you've committed to:</p>
    <table width="100%" style="background:#f9fafb;border-radius:8px;padding:16px;border:1px solid #e5e7eb;margin-bottom:20px" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding:12px;border-right:1px solid #e5e7eb">
          <div style="font-size:22px;font-weight:800;color:#1a1a1a">${p.systemKw} kWp</div>
          <div style="font-size:10px;color:#9ca3af;text-transform:uppercase;letter-spacing:.8px;margin-top:3px">System Size</div>
        </td>
        <td align="center" style="padding:12px;border-right:1px solid #e5e7eb">
          <div style="font-size:22px;font-weight:800;color:#16a34a">$${annSav.toLocaleString()}</div>
          <div style="font-size:10px;color:#9ca3af;text-transform:uppercase;letter-spacing:.8px;margin-top:3px">Year 1 Savings</div>
        </td>
        <td align="center" style="padding:12px">
          <div style="font-size:22px;font-weight:800;color:#f5c518">${pb} yrs</div>
          <div style="font-size:10px;color:#9ca3af;text-transform:uppercase;letter-spacing:.8px;margin-top:3px">Payback Period</div>
        </td>
      </tr>
    </table>
    <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:14px 16px;margin-bottom:20px;font-size:12px;color:#166534">
      <strong>Rebates locked in at point of sale:</strong> Solar STC Rebate <strong>−$${solarRebate.toLocaleString()}</strong>${batNum > 0 ? ` · Battery CHBP Rebate <strong>−$${batRebate.toLocaleString()}</strong>` : ''}
    </div>
    <div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;padding:14px 16px;margin-bottom:24px;font-size:12px;color:#92400e">
      <strong>Next Steps:</strong><br>
      1. HEA will call you within 24 hours to confirm your installation date.<br>
      2. A 10% deposit ($${Math.round(sysNetNum*0.1).toLocaleString()}) secures your place in the schedule.<br>
      3. Installation typically takes 1–2 days once scheduled.
    </div>
    <p style="font-size:11px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:16px;margin:0">
      Questions? Call <strong>0481 267 812</strong> or email <a href="mailto:hea.trades@gmail.com">hea.trades@gmail.com</a><br>
      Heffernan Electrical Automation · <a href="https://hea-group.com.au">hea-group.com.au</a> · REC 37307
    </p>
  </td></tr>
</table>
</td></tr></table></body></html>`;
}

// ── Email HTML: Unsigned follow-up with resume link ───────────────
function buildUnsignedEmailHTML(p, resumeUrl, dateS, annSav, dayRate) {
  const sysNetNum = parseFloat(p.sysNet) || 0;
  const batNum    = parseFloat(p.batteryKwh) || 0;
  const weekRate  = (annSav / 52).toFixed(0);
  const mthRate   = (annSav / 12).toFixed(0);
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,'Helvetica Neue',Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.10)">
  <tr><td style="background:#1a1a1a;padding:28px 36px">
    <img src="${CFG.LOGO_URL}" height="36" alt="HEA" style="margin-bottom:16px;display:block">
    <div style="color:#f5c518;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:6px">Your Solar Analysis — Ready When You Are</div>
    <div style="color:#fff;font-size:22px;font-weight:800">Hi ${p.clientName} — your analysis is saved.</div>
    <div style="color:#9ca3af;font-size:12px;margin-top:4px">${p.quoteNo} · Prepared ${dateS}</div>
  </td></tr>
  <tr><td style="padding:28px 36px">
    <p style="font-size:14px;color:#374151;line-height:1.7;margin:0 0 20px">
      No pressure — your personalised solar analysis is saved and ready whenever you are. Click the button below to pick up exactly where you left off, with all your data pre-loaded.
    </p>

    <!-- RESUME BUTTON -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px">
      <tr><td align="center">
        <a href="${resumeUrl}" style="display:inline-block;background:#f5c518;color:#1a1a1a;font-size:15px;font-weight:800;padding:14px 36px;border-radius:8px;text-decoration:none;letter-spacing:.3px">
          ☀ Continue My Solar Analysis →
        </a>
        <div style="font-size:11px;color:#9ca3af;margin-top:8px">All your data pre-loaded. No starting from scratch.</div>
      </td></tr>
    </table>

    <!-- COST OF WAITING -->
    <div style="background:#fef2f2;border:1.5px solid #fecaca;border-radius:10px;padding:18px 20px;margin-bottom:20px">
      <div style="font-size:12px;font-weight:800;color:#991b1b;margin-bottom:10px">⏰ Every Day You Wait Has a Cost</div>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center" style="padding:8px;border-right:1px solid #fecaca">
            <div style="font-size:20px;font-weight:800;color:#dc2626">$${dayRate}</div>
            <div style="font-size:10px;color:#9ca3af">per day to the grid</div>
          </td>
          <td align="center" style="padding:8px;border-right:1px solid #fecaca">
            <div style="font-size:20px;font-weight:800;color:#dc2626">$${weekRate}</div>
            <div style="font-size:10px;color:#9ca3af">per week savings missed</div>
          </td>
          <td align="center" style="padding:8px">
            <div style="font-size:20px;font-weight:800;color:#dc2626">$${mthRate}</div>
            <div style="font-size:10px;color:#9ca3af">per month extra bills</div>
          </td>
        </tr>
      </table>
      <div style="font-size:11px;color:#7f1d1d;margin-top:10px;padding-top:10px;border-top:1px solid #fecaca">
        Based on your estimated $${annSav.toLocaleString()} annual savings from this analysis.
      </div>
    </div>

    ${batNum > 0 ? `<!-- REBATE CLIFF WARNING -->
    <div style="background:#fffbeb;border:1.5px solid #f5c518;border-radius:10px;padding:16px 20px;margin-bottom:20px">
      <div style="font-size:12px;font-weight:800;color:#92400e;margin-bottom:6px">⚡ Battery Rebate Cliff — 1 May 2026</div>
      <div style="font-size:12px;color:#78350f;line-height:1.7">
        Your ${batNum} kWh battery qualifies for the full federal CHBP rebate — but <strong>only if you sign before 30 April 2026</strong>. After that date the rebate reduces significantly. 
        Don't let the deadline cost you — your quote is ready and waiting.
      </div>
    </div>` : ''}

    <!-- VARIABLES THAT CHANGE NOTE -->
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px 16px;margin-bottom:20px;font-size:12px;color:#475569">
      <strong style="color:#1e293b">📋 When you return, please note:</strong><br>
      Some variables may have changed since this analysis — your consultant will update the following before signing:<br>
      <span style="color:#64748b">• STC solar rebate rate &nbsp;• Battery rebate tier &nbsp;• Equipment availability &amp; pricing &nbsp;• Current electricity tariff</span>
    </div>

    <div style="text-align:center;margin-bottom:20px">
      <a href="https://hea-group.com.au" style="font-size:12px;color:#f5c518;font-weight:700;text-decoration:none">Book a follow-up meeting at hea-group.com.au →</a>
    </div>

    <p style="font-size:11px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:16px;margin:0">
      Questions? Call <strong>0481 267 812</strong> or email <a href="mailto:hea.trades@gmail.com">hea.trades@gmail.com</a><br>
      Heffernan Electrical Automation · <a href="https://hea-group.com.au">hea-group.com.au</a> · REC 37307
    </p>
  </td></tr>
</table>
</td></tr></table></body></html>`;
}

