// ============================================================
//  HEA Solar Intake Form — Google Apps Script Backend v2.1
//  Includes: PDF Consent with logo, Client Folders, PV Estimate
//  Last deployed: via clasp auto-deploy
// ============================================================
//  SETUP: Fill in the 4 constants below, then deploy.
// ============================================================

const SHEET_ID     = "1ZTeR7vUu5gI69yeB-DYAch4wbXuztX-xQzgPmFkQPDI";
const FOLDER_ID    = "12LCs9uDYh4Wynor0LdDelNbcQDe7c-C-";
const NOTIFY_EMAIL = "hea.trades@gmail.com";
const COMPANY_NAME = "Heffernan Electrical Automation";
const LOGO_URL     = "https://hea-group.com.au/_next/static/media/Logo_transparent.02d8e37d.png";

// ── Serve the form ─────────────────────────────────────────────────────────────
function doGet() {
  return HtmlService
    .createHtmlOutputFromFile("Index")
    .setTitle("Solar + Battery Quote — HEA")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// ── Test function — select this in the dropdown and click ▶ Run ───────────────
function testSubmission() {
  const testData = {
    name: "Test Client", email: "hea.trades@gmail.com",
    phone: "0400000000", address: "32 Townsend St, Flora Hill VIC 3550",
    billBase64: "", billName: "", billMime: "",
    checkedRates: true, occupants: "3", homeDaytime: "Yes, most days",
    gasHotWater: "Yes — gas", gasAppliances: "Yes", ev: "No",
    goals: "Lower bills", systemSize: "10.6kW (8kVA inverter)", batterySize: "14.7kWh",
  };
  const result = processSubmission(testData);
  if (result.success) {
    console.log("✅ SUCCESS — check Drive, Sheet, and your email.");
  } else {
    console.error("❌ FAILED: " + result.error);
    console.error(result.detail);
  }
}

// ── Main submission handler ────────────────────────────────────────────────────
function processSubmission(data) {
  try {
    const timestamp = Utilities.formatDate(new Date(), "Australia/Melbourne", "dd/MM/yyyy 'at' hh:mm a");
    const safeDate  = Utilities.formatDate(new Date(), "Australia/Melbourne", "dd-MM-yyyy");

    console.log("Step 1: Creating client folder");
    const clientFolder = createClientFolder(data.name, safeDate);
    console.log("Step 1: Done");

    console.log("Step 2: Saving bill");
    let billUrl = "No bill uploaded";
    if (data.billBase64 && data.billName) {
      const decoded  = Utilities.base64Decode(data.billBase64);
      const ext      = getExtension(data.billName);
      const blob     = Utilities.newBlob(decoded, data.billMime, sanitise(data.name) + " - Electricity Bill." + ext);
      const billFile = clientFolder.createFile(blob);
      billFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      billUrl = billFile.getUrl();
    }
    console.log("Step 2: Done");

    console.log("Step 3: Generating consent PDF");
    const consent = generateConsentPDF(data, timestamp, clientFolder);
    console.log("Step 3: Done");

    console.log("Step 4: Generating job card PDF");
    const jobCard = generateJobCardPDF(data, timestamp, clientFolder);
    console.log("Step 4: Done");

    console.log("Step 5: Logging to Sheet");
    logToSheet(data, timestamp, billUrl, consent.url, jobCard.url);
    console.log("Step 5: Done");

    console.log("Step 6: Emailing client");
    emailClient(data, timestamp, consent.blob);
    console.log("Step 6: Done");

    console.log("Step 7: Emailing HEA");
    emailHEA(data, timestamp, billUrl, consent.url, jobCard.url);
    console.log("Step 7: Done — all steps complete ✅");

    return { success: true };

  } catch (err) {
    console.error("FAILED: " + err.message);
    console.error(err.stack);
    return { success: false, error: err.message, detail: err.stack };
  }
}

// ── Create named client subfolder ─────────────────────────────────────────────
function createClientFolder(clientName, dateStr) {
  const parent = DriveApp.getFolderById(FOLDER_ID);
  return parent.createFolder(sanitise(clientName) + " - " + dateStr);
}

// ── Fetch HEA logo as a blob ───────────────────────────────────────────────────
function fetchLogo() {
  try {
    const response = UrlFetchApp.fetch(LOGO_URL, { muteHttpExceptions: true });
    if (response.getResponseCode() === 200) {
      return response.getBlob().setName("hea-logo.png");
    }
  } catch (e) {
    console.warn("Logo fetch failed: " + e.message);
  }
  return null; // Gracefully continue without logo if fetch fails
}

// ── Generate NMI Consent PDF ───────────────────────────────────────────────────
function generateConsentPDF(data, timestamp, clientFolder) {
  const pdfTitle = sanitise(data.name) + " - NMI Consent - HEA";

  // Create a temporary Google Doc, export to PDF, then trash the Doc
  const doc  = DocumentApp.create(pdfTitle + "_TEMP");
  const body = doc.getBody();
  const A    = DocumentApp.Attribute;

  body.setMarginTop(48).setMarginBottom(56).setMarginLeft(72).setMarginRight(72);

  // ── HEADER: Logo left, company details right ──────────────────────────────
  const hdr      = doc.addHeader();
  const logoBlob = fetchLogo();

  if (logoBlob) {
    // Insert logo on the left — Google Docs API inserts inline, we position left
    const logoImg = hdr.insertImage(0, logoBlob);
    logoImg.setWidth(130);
    logoImg.setHeight(46); // Maintain approx aspect ratio — adjust if needed

    // Add company details as a right-aligned paragraph below logo
    hdr.appendParagraph(COMPANY_NAME + "   ·   REC 37307   ·   hea-group.com.au   ·   0481 267 812")
      .setAttributes({
        [A.FONT_FAMILY]: "Arial",
        [A.FONT_SIZE]: 8,
        [A.FOREGROUND_COLOR]: "#888888",
        [A.HORIZONTAL_ALIGNMENT]: DocumentApp.HorizontalAlignment.RIGHT,
      });
  } else {
    // Fallback if logo can't be fetched — text-only header
    hdr.appendParagraph(COMPANY_NAME.toUpperCase()).setAttributes({
      [A.FONT_FAMILY]: "Arial", [A.FONT_SIZE]: 11, [A.BOLD]: true,
      [A.FOREGROUND_COLOR]: "#1a1a1a",
      [A.HORIZONTAL_ALIGNMENT]: DocumentApp.HorizontalAlignment.LEFT,
    });
    hdr.appendParagraph("REC 37307   ·   hea-group.com.au   ·   0481 267 812").setAttributes({
      [A.FONT_FAMILY]: "Arial", [A.FONT_SIZE]: 8,
      [A.FOREGROUND_COLOR]: "#888888",
      [A.HORIZONTAL_ALIGNMENT]: DocumentApp.HorizontalAlignment.LEFT,
    });
  }

  // ── DOCUMENT TITLE ─────────────────────────────────────────────────────────
  // Spacer after header
  body.appendParagraph("").setAttributes({ [A.SPACING_AFTER]: 8 });

  body.appendParagraph("NMI Data Access Consent").setAttributes({
    [A.FONT_FAMILY]: "Arial", [A.FONT_SIZE]: 22, [A.BOLD]: true,
    [A.FOREGROUND_COLOR]: "#0f0f0f", [A.SPACING_AFTER]: 4,
  });

  body.appendParagraph("Solar & Battery Design Service  ·  " + COMPANY_NAME).setAttributes({
    [A.FONT_FAMILY]: "Arial", [A.FONT_SIZE]: 10,
    [A.FOREGROUND_COLOR]: "#666666", [A.SPACING_AFTER]: 18,
  });

  // Horizontal rule effect
  body.appendParagraph("").setAttributes({
    [A.BORDER_WIDTH]: 1,
    [A.BORDER_COLOR]: "#e0e0de",
    [A.SPACING_AFTER]: 16,
  });

  // ── CLIENT DETAILS TABLE ───────────────────────────────────────────────────
  body.appendParagraph("CLIENT DETAILS").setAttributes({
    [A.FONT_FAMILY]: "Arial", [A.FONT_SIZE]: 8, [A.BOLD]: true,
    [A.FOREGROUND_COLOR]: "#999999", [A.SPACING_AFTER]: 4,
  });

  const details = [
    ["Name",       data.name],
    ["Email",      data.email],
    ["Phone",      data.phone],
    ["Property",   data.address],
    ["Date Signed", timestamp],
    ["Reference",  pdfTitle],
  ];
  details.forEach(([label, value]) => {
    body.appendParagraph(label + ":    " + value).setAttributes({
      [A.FONT_FAMILY]: "Arial", [A.FONT_SIZE]: 10,
      [A.FOREGROUND_COLOR]: "#333333", [A.SPACING_AFTER]: 3,
    });
  });

  body.appendParagraph("").setAttributes({ [A.SPACING_AFTER]: 14 });

  // ── SECTION 1 ──────────────────────────────────────────────────────────────
  body.appendParagraph("1.  Purpose of Consent").setAttributes({
    [A.FONT_FAMILY]: "Arial", [A.FONT_SIZE]: 12, [A.BOLD]: true,
    [A.FOREGROUND_COLOR]: "#1a1a1a", [A.SPACING_BEFORE]: 6, [A.SPACING_AFTER]: 5,
  });
  body.appendParagraph(
    "I, " + data.name + ", of " + data.address + ", authorise " + COMPANY_NAME +
    " (HEA) to access my electricity consumption data held against my National Metering " +
    "Identifier (NMI), as found on my submitted electricity bill. This data will be " +
    "accessed via the Powercore platform solely for the purpose of designing a solar " +
    "photovoltaic (PV) and/or battery storage system for my property."
  ).setAttributes({
    [A.FONT_FAMILY]: "Arial", [A.FONT_SIZE]: 10,
    [A.FOREGROUND_COLOR]: "#333333", [A.LINE_SPACING]: 1.4, [A.SPACING_AFTER]: 10,
  });

  // ── SECTION 2 ──────────────────────────────────────────────────────────────
  body.appendParagraph("2.  Scope of Authorisation").setAttributes({
    [A.FONT_FAMILY]: "Arial", [A.FONT_SIZE]: 12, [A.BOLD]: true,
    [A.FOREGROUND_COLOR]: "#1a1a1a", [A.SPACING_AFTER]: 5,
  });

  [
    "Access historical consumption data linked to my NMI via the Powercore platform",
    "Use that data solely to design and quote a solar PV and/or battery system for the above property",
    "Retain this consent form and associated data for a maximum of 7 years in accordance with the Australian Privacy Principles",
  ].forEach(item => {
    body.appendParagraph("•   " + item).setAttributes({
      [A.FONT_FAMILY]: "Arial", [A.FONT_SIZE]: 10,
      [A.FOREGROUND_COLOR]: "#333333", [A.INDENT_START]: 18, [A.SPACING_AFTER]: 3,
    });
  });

  // ── SECTION 3 ──────────────────────────────────────────────────────────────
  body.appendParagraph("3.  Limitations & Data Protection").setAttributes({
    [A.FONT_FAMILY]: "Arial", [A.FONT_SIZE]: 12, [A.BOLD]: true,
    [A.FOREGROUND_COLOR]: "#1a1a1a", [A.SPACING_BEFORE]: 10, [A.SPACING_AFTER]: 5,
  });
  body.appendParagraph(
    "HEA will not sell, share, or disclose your NMI or consumption data to any third party " +
    "other than Powercore for the purposes stated above. This consent may be withdrawn at any " +
    "time by contacting HEA in writing at " + NOTIFY_EMAIL + ". Withdrawal will not affect " +
    "system design work already completed."
  ).setAttributes({
    [A.FONT_FAMILY]: "Arial", [A.FONT_SIZE]: 10,
    [A.FOREGROUND_COLOR]: "#333333", [A.LINE_SPACING]: 1.4, [A.SPACING_AFTER]: 16,
  });

  // ── SECTION 4: SIGNATURE ───────────────────────────────────────────────────
  body.appendParagraph("4.  Electronic Signature & Declaration").setAttributes({
    [A.FONT_FAMILY]: "Arial", [A.FONT_SIZE]: 12, [A.BOLD]: true,
    [A.FOREGROUND_COLOR]: "#1a1a1a", [A.SPACING_AFTER]: 5,
  });
  body.appendParagraph(
    "The client confirmed consent by clicking 'I Consent & Sign' on the HEA intake form. " +
    "This constitutes a valid electronic signature under the Electronic Transactions Act 1999 (Cth)."
  ).setAttributes({
    [A.FONT_FAMILY]: "Arial", [A.FONT_SIZE]: 10,
    [A.FOREGROUND_COLOR]: "#555555", [A.SPACING_AFTER]: 18,
  });

  // Signature rendered in cursive-style font
  body.appendParagraph(data.name).setAttributes({
    [A.FONT_FAMILY]: "Dancing Script",
    [A.FONT_SIZE]: 30, [A.BOLD]: false,
    [A.FOREGROUND_COLOR]: "#1a3a8a", [A.SPACING_AFTER]: 2,
  });

  body.appendParagraph("____________________________________________").setAttributes({
    [A.FONT_FAMILY]: "Arial", [A.FONT_SIZE]: 9,
    [A.FOREGROUND_COLOR]: "#cccccc", [A.SPACING_AFTER]: 2,
  });

  [
    "Signed:  " + data.name,
    "Address: " + data.address,
    "Date:    " + timestamp,
    "Method:  Electronic consent — HEA intake form (hea-group.com.au)",
  ].forEach(line => {
    body.appendParagraph(line).setAttributes({
      [A.FONT_FAMILY]: "Arial", [A.FONT_SIZE]: 9,
      [A.FOREGROUND_COLOR]: "#555555", [A.SPACING_AFTER]: 2,
    });
  });

  // ── FOOTER ─────────────────────────────────────────────────────────────────
  doc.addFooter()
    .appendParagraph(
      COMPANY_NAME + "  ·  REC 37307  ·  hea-group.com.au  ·  " +
      "This document was automatically generated upon electronic consent."
    )
    .setAttributes({
      [A.FONT_FAMILY]: "Arial", [A.FONT_SIZE]: 8,
      [A.FOREGROUND_COLOR]: "#aaaaaa",
      [A.HORIZONTAL_ALIGNMENT]: DocumentApp.HorizontalAlignment.CENTER,
    });

  doc.saveAndClose();

  // Export to PDF
  const pdfBlob = DriveApp.getFileById(doc.getId())
    .getAs("application/pdf")
    .setName(pdfTitle + ".pdf");

  // Save PDF into the client's folder
  const pdfFile = clientFolder.createFile(pdfBlob);
  pdfFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  // Trash the temporary Google Doc — only the PDF is kept
  DriveApp.getFileById(doc.getId()).setTrashed(true);

  return { url: pdfFile.getUrl(), blob: pdfBlob };
}

// ── Generate Job Card PDF ──────────────────────────────────────────────────────
function generateJobCardPDF(data, timestamp, clientFolder) {
  const jobTitle     = sanitise(data.name) + " - Job Card - HEA";
  const encodedAddr  = encodeURIComponent(data.address);
  const mapsLink     = "https://www.google.com/maps/search/?api=1&query=" + encodedAddr;
  const satelliteLink = "https://www.google.com/maps/search/" + encodedAddr + "/@?data=!3m1!1e3"; // satellite view

  const htmlContent = `
<html><head><style>
  body { font-family: Arial, sans-serif; font-size: 10pt; margin: 56px 72px; color: #333; }
  img.logo { height: 44px; margin-bottom: 4px; }
  .co { font-size: 8pt; color: #888; margin-bottom: 18px; }
  h1 { font-size: 18pt; font-weight: bold; color: #0f0f0f; margin: 0 0 3px; }
  .sub { font-size: 9pt; color: #666; margin-bottom: 16px; }
  hr { border: none; border-top: 1px solid #e0e0de; margin: 14px 0; }
  .sec { font-size: 8pt; font-weight: bold; color: #999; text-transform: uppercase;
         letter-spacing: 1px; margin: 14px 0 6px; }
  .row { display: flex; margin-bottom: 5px; font-size: 10pt; }
  .lbl { font-weight: bold; min-width: 130px; }
  .val { flex: 1; }
  .system-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px;
                padding: 12px 16px; margin: 10px 0; }
  .system-box .title { font-size: 9pt; font-weight: bold; color: #15803d;
                       text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
  .map-box { background: #f5f5f3; border: 1px solid #e0e0de; border-radius: 6px;
             padding: 14px 16px; margin: 10px 0; }
  .map-box a { color: #1a1a1a; font-weight: bold; font-size: 11pt; }
  .map-box .hint { font-size: 9pt; color: #888; margin-top: 4px; }
  .notes { border: 1px solid #e0e0de; border-radius: 6px; min-height: 70px;
           padding: 10px; background: #fafaf8; margin-top: 6px; }
  .line { border-bottom: 1px solid #ddd; margin-bottom: 10px; padding-bottom: 4px; }
  .footer { font-size: 8pt; color: #aaa; text-align: center; margin-top: 32px;
            border-top: 1px solid #eee; padding-top: 8px; }
</style></head><body>

<img class="logo" src="${LOGO_URL}" alt="HEA">
<div class="co">${COMPANY_NAME} &nbsp;·&nbsp; REC 37307 &nbsp;·&nbsp; hea-group.com.au &nbsp;·&nbsp; 0481 267 812</div>
<h1>Job Card</h1>
<div class="sub">Solar + Battery Design &nbsp;·&nbsp; ${COMPANY_NAME}</div>
<hr>

<div class="sec">Client Details</div>
<div class="row"><span class="lbl">Name:</span><span class="val">${data.name}</span></div>
<div class="row"><span class="lbl">Phone:</span><span class="val">${data.phone}</span></div>
<div class="row"><span class="lbl">Email:</span><span class="val">${data.email}</span></div>
<div class="row"><span class="lbl">Address:</span><span class="val">${data.address}</span></div>
<div class="row"><span class="lbl">Date:</span><span class="val">${timestamp}</span></div>

<hr>
<div class="sec">Household Profile</div>
<div class="row"><span class="lbl">Occupants:</span><span class="val">${data.occupants || "—"}</span></div>
<div class="row"><span class="lbl">Home daytime:</span><span class="val">${data.homeDaytime || "—"}</span></div>
<div class="row"><span class="lbl">Gas hot water:</span><span class="val">${data.gasHotWater || "—"}</span></div>
<div class="row"><span class="lbl">Gas appliances:</span><span class="val">${data.gasAppliances || "—"}</span></div>
<div class="row"><span class="lbl">EV / planning:</span><span class="val">${data.ev || "—"}</span></div>
<div class="row"><span class="lbl">Goals:</span><span class="val">${data.goals || "—"}</span></div>

<hr>
<div class="sec">System Preference (client indicated)</div>
<div class="system-box">
  <div class="title">What the client told us</div>
  <div class="row"><span class="lbl">Solar array:</span><span class="val">${data.systemSize || "No preference — to be advised"}</span></div>
  <div class="row"><span class="lbl">Battery:</span><span class="val">${data.batterySize || "No preference — to be advised"}</span></div>
</div>

<hr>
<div class="sec">Property — Roof View</div>
<div class="map-box">
  <a href="${satelliteLink}">📍 Open Satellite View — ${data.address}</a>
  <div class="hint">Opens Google Maps satellite view of the property roof</div>
  <br>
  <a href="${mapsLink}" style="font-size:10pt;font-weight:normal;">Street Map View →</a>
</div>

<hr>
<div class="sec">Roof Assessment (fill in on-site or from satellite)</div>
<div class="row"><span class="lbl">Roof material:</span><span class="val">_______________________________</span></div>
<div class="row"><span class="lbl">Main orientation:</span><span class="val">_______________________________</span></div>
<div class="row"><span class="lbl">Shading issues:</span><span class="val">_______________________________</span></div>
<div class="row"><span class="lbl">Phases:</span><span class="val">Single &nbsp;&nbsp;/&nbsp;&nbsp; Three</span></div>
<div class="row"><span class="lbl">Meter location:</span><span class="val">_______________________________</span></div>
<div class="row"><span class="lbl">Switchboard:</span><span class="val">_______________________________</span></div>

<hr>
<div class="sec">Site Notes</div>
<div class="notes"></div>

<div class="footer">
  ${COMPANY_NAME} &nbsp;·&nbsp; REC 37307 &nbsp;·&nbsp; hea-group.com.au &nbsp;·&nbsp; Generated: ${timestamp}
</div>
</body></html>`;

  const token = ScriptApp.getOAuthToken();
  const createResp = UrlFetchApp.fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&convert=true",
    {
      method: "POST",
      headers: { Authorization: "Bearer " + token, "Content-Type": "multipart/related; boundary=B" },
      payload: "--B\r\nContent-Type: application/json\r\n\r\n" +
               JSON.stringify({ name: jobTitle + "_TEMP", mimeType: "application/vnd.google-apps.document" }) +
               "\r\n--B\r\nContent-Type: text/html\r\n\r\n" + htmlContent + "\r\n--B--",
      muteHttpExceptions: true,
    }
  );
  const docId = JSON.parse(createResp.getContentText()).id;
  if (!docId) throw new Error("Job card creation failed: " + createResp.getContentText());

  const pdfBlob = UrlFetchApp.fetch(
    "https://www.googleapis.com/drive/v3/files/" + docId + "/export?mimeType=application/pdf",
    { headers: { Authorization: "Bearer " + token }, muteHttpExceptions: true }
  ).getBlob().setName(jobTitle + ".pdf");

  const pdfFile = clientFolder.createFile(pdfBlob);
  pdfFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  UrlFetchApp.fetch("https://www.googleapis.com/drive/v3/files/" + docId,
    { method: "DELETE", headers: { Authorization: "Bearer " + token }, muteHttpExceptions: true });

  return { url: pdfFile.getUrl(), blob: pdfBlob };
}



// ── Log to Google Sheet ────────────────────────────────────────────────────────
function logToSheet(data, timestamp, billUrl, consentUrl, jobCardUrl) {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheets()[0];
  if (sheet.getLastRow() === 0) {
    const headers = [
      "Timestamp","Name","Email","Phone","Address",
      "Occupants","Home Daytime","Gas Hot Water","Gas Appliances","EV","Goals",
      "System Size (client)","Battery Size (client)","Checked Rates",
      "Bill File","Consent PDF","Job Card PDF","Status"
    ];
    sheet.appendRow(headers);
    sheet.getRange(1,1,1,headers.length).setFontWeight("bold").setBackground("#1a1a1a").setFontColor("white");
    sheet.setFrozenRows(1);
  }
  sheet.appendRow([
    timestamp, data.name, data.email, data.phone, data.address,
    data.occupants, data.homeDaytime, data.gasHotWater, data.gasAppliances,
    data.ev, data.goals,
    data.systemSize || "No preference", data.batterySize || "No preference",
    data.checkedRates ? "Yes" : "No",
    billUrl, consentUrl, jobCardUrl,
    "New — Book Call"
  ]);
}

// ── Email to client ────────────────────────────────────────────────────────────
function emailClient(data, timestamp, pdfBlob) {
  const first = data.name.split(" ")[0];
  GmailApp.sendEmail(data.email,
    "You're booked in — Heffernan Electrical Automation",
    "Hi " + first + ", thanks for your enquiry. Your consent form is attached.",
    {
      name: COMPANY_NAME,
      attachments: [pdfBlob],
      htmlBody: `
      <div style="font-family:Arial,sans-serif;max-width:580px;margin:0 auto;color:#1a1a1a;">
        <div style="background:#1a1a1a;padding:24px 28px;border-radius:8px 8px 0 0;text-align:center;">
          <img src="${LOGO_URL}" alt="HEA Logo" style="height:44px;width:auto;display:block;margin:0 auto 12px;">
          <p style="color:#f0c040;font-size:10px;letter-spacing:2px;text-transform:uppercase;margin:0 0 6px;">Heffernan Electrical Automation</p>
          <h1 style="color:white;font-size:20px;margin:0;font-weight:700;">You're in the system, ${first} ⚡</h1>
        </div>
        <div style="background:white;padding:28px;border:1px solid #e8e8e6;border-top:none;border-radius:0 0 8px 8px;">

          <p>Thanks for getting in touch about solar + battery for <strong>${data.address}</strong>.</p>

          <div style="background:#f5f5f3;border-left:4px solid #f0c040;padding:16px 20px;margin:20px 0;border-radius:0 6px 6px 0;">
            <p style="font-weight:700;margin:0 0 6px;font-size:14px;">What happens on your call:</p>
            <p style="margin:0 0 4px;font-size:13px;color:#444;">✔ Jesse will review your electricity bill beforehand</p>
            <p style="margin:0 0 4px;font-size:13px;color:#444;">✔ You'll get your exact payback period — real numbers, not estimates</p>
            <p style="margin:0 0 4px;font-size:13px;color:#444;">✔ We'll walk through which government rebates apply to your property</p>
            <p style="margin:0;font-size:13px;color:#444;">✔ No obligation, no pressure — just a clear picture of what solar means for your home</p>
          </div>

          <p>We're a direct installer — no salespeople, no middlemen, no inflated quotes. Just Jesse and Alexis, doing the work themselves.</p>

          <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:6px;padding:14px 18px;margin:20px 0;">
            <p style="margin:0;font-size:13px;color:#92400e;">
              <strong>📎 Your NMI Consent Form is attached.</strong> This confirms we have your permission
              to access your usage data via Powercore — it's how we give you accurate numbers rather than guesswork.
              Keep it for your records.
            </p>
          </div>

          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:14px 18px;margin:20px 0;text-align:center;">
            <p style="margin:0 0 6px;font-size:13px;color:#15803d;font-weight:600;">Haven't booked your call yet?</p>
            <a href="https://calendly.com/hea-trades/free-solar-consultation-hea"
               style="display:inline-block;background:#1a1a1a;color:white;padding:10px 24px;border-radius:6px;font-size:13px;font-weight:700;text-decoration:none;">
               Book a Free 15-Minute Call →
            </a>
          </div>

          <hr style="border:none;border-top:1px solid #efefef;margin:22px 0;">
          <p style="font-size:13px;color:#666;">Questions? Call Jesse directly on <strong style="color:#1a1a1a;">0481 267 812</strong></p>
          <p style="font-size:11px;color:#aaa;">Jesse &amp; Alexis Heffernan &nbsp;·&nbsp; Heffernan Electrical Automation &nbsp;·&nbsp; REC 37307 &nbsp;·&nbsp; hea-group.com.au</p>
        </div>
      </div>`,
    }
  );
}

// ── Email to HEA ───────────────────────────────────────────────────────────────
function emailHEA(data, timestamp, billUrl, consentUrl, jobCardUrl) {
  GmailApp.sendEmail(NOTIFY_EMAIL,
    "⚡ New Solar Enquiry — " + data.name,
    "New submission from " + data.name,
    {
      name: "HEA Intake Form",
      htmlBody: `
      <div style="font-family:Arial,sans-serif;max-width:580px;color:#1a1a1a;">
        <div style="background:#1a1a1a;padding:20px 24px;border-radius:8px 8px 0 0;">
          <img src="${LOGO_URL}" alt="HEA" style="height:36px;width:auto;margin-bottom:10px;display:block;">
          <p style="color:#f0c040;font-size:10px;letter-spacing:2px;text-transform:uppercase;margin:0 0 4px;">New Intake Submission</p>
          <h2 style="color:white;margin:0;font-size:19px;">${data.name}</h2>
          <p style="color:#888;font-size:12px;margin:3px 0 0;">${timestamp}</p>
        </div>
        <div style="background:white;padding:24px;border:1px solid #e8e8e6;border-top:none;border-radius:0 0 8px 8px;">
          <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:16px;">
            ${[
              ["Name",            data.name],
              ["Email",           data.email],
              ["Phone",           data.phone],
              ["Address",         data.address],
              ["Occupants",       data.occupants],
              ["Home daytime?",   data.homeDaytime],
              ["Gas hot water?",  data.gasHotWater],
              ["Gas other?",      data.gasAppliances],
              ["EV?",             data.ev],
              ["Goals",           data.goals],
              ["System size",     data.systemSize  || "No preference"],
              ["Battery size",    data.batterySize || "No preference"],
            ].map(([k,v]) => `<tr>
              <td style="padding:7px 12px;background:#f5f5f3;font-weight:600;width:130px;border-bottom:1px solid #efefef;">${k}</td>
              <td style="padding:7px 12px;border-bottom:1px solid #efefef;">${v||"—"}</td>
            </tr>`).join("")}
          </table>
          <p style="font-size:14px;font-weight:700;margin-bottom:8px;">Drive Files</p>
          <p style="font-size:13px;margin-bottom:5px;"><a href="${billUrl}" style="color:#1a1a1a;font-weight:600;">→ Electricity Bill</a></p>
          <p style="font-size:13px;margin-bottom:5px;"><a href="${consentUrl}" style="color:#1a1a1a;font-weight:600;">→ NMI Consent PDF</a></p>
          <p style="font-size:13px;margin-bottom:16px;"><a href="${jobCardUrl}" style="color:#1a1a1a;font-weight:600;">→ Job Card PDF (roof link inside)</a></p>

          <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:16px 20px;margin-bottom:8px;">
            <p style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#0369a1;margin:0 0 8px;">Next Step — Design in OpenSolar</p>
            <p style="font-size:12px;color:#444;margin:0 0 12px;line-height:1.6;">
              Open OpenSolar, click <strong>+ New Project</strong>, paste this address:<br>
              <strong style="font-family:monospace;background:#e0f2fe;padding:2px 6px;border-radius:3px;">${data.address}</strong>
            </p>
            <a href="https://app.opensolar.com/projects/create" target="_blank"
               style="display:inline-block;background:#0369a1;color:white;padding:9px 20px;border-radius:6px;font-size:13px;font-weight:700;text-decoration:none;margin-right:8px;">
              Open OpenSolar →
            </a>
            <a href="https://www.green-bank.com.au/calculate#solar-power" target="_blank"
               style="display:inline-block;background:#15803d;color:white;padding:9px 20px;border-radius:6px;font-size:13px;font-weight:700;text-decoration:none;">
              STC Calculator →
            </a>
          </div>
          <p style="font-size:11px;color:#aaa;margin:0;">Ada AI designs the roof in ~30 seconds. Get STC values from Green-Bank before quoting.</p>
        </div>
      </div>`,
    }
  );
}

// ── Utilities ──────────────────────────────────────────────────────────────────
function sanitise(str) {
  return (str || "").replace(/[\/\\?%*:|"<>]/g, "").trim();
}
function getExtension(filename) {
  const p = (filename || "").split(".");
  return p.length > 1 ? p.pop().toLowerCase() : "pdf";
}
