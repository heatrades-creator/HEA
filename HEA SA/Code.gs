// HEA Solar Analyser — https://hea-group.com.au
// REC 37307 — Jesse Heffernan, Bendigo VIC

// Code.gs — entry point only

function doGet(e) {
  const params = (e && e.parameter) ? e.parameter : {};
  let resumeData = 'null';
  if (params.resume) {
    const sig = params.sig || '';
    const session = loadSession(params.resume, sig);
    if (session) resumeData = JSON.stringify(session);
  }

  // Pre-fill from HEA dashboard link params
  // (?name=&address=&phone=&annualBill=&occupants=&homeDaytime=&hotWater=&gasAppliances=&ev=&driveUrl=)
  const addr = params.address || '';
  const postcodeMatch = addr.match(/\b(\d{4})\b/);
  const prefillData = JSON.stringify({
    clientName:    params.name         || '',
    clientAddress: addr,
    clientPhone:   params.phone        || '',
    postcode:      postcodeMatch ? postcodeMatch[1] : '',
    annualBill:    params.annualBill   || '',
    occupants:     params.occupants    || '',
    homeDaytime:   params.homeDaytime  || '',
    hotWater:      params.hotWater     || '',
    gasAppliances: params.gasAppliances|| '',
    ev:            params.ev           || '',
    driveUrl:      params.driveUrl     || '',
  });

  const tmpl = HtmlService.createTemplateFromFile('Index');
  tmpl.resumeData  = resumeData;
  tmpl.prefillData = prefillData;
  return tmpl.evaluate()
    .setTitle('HEA — Solar Analyser')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL); // ACCEPTED RISK: kept for legitimate embedding on hea-group.com.au. No privileged endpoints are callable without authentication.
}

// ───────────────────────────────────────────
// NEM12 PARSER
// ───────────────────────────────────────────