// HEA Solar Analyser — https://hea-group.com.au
// REC 37307 — Jesse Heffernan, Bendigo VIC

// ArcFlash.gs — Arc flash risk assessment engine
// Implements the Doan Maximum Power Method as adopted by AS/NZS 5139:2019
// Primary clauses: 3.2.4, 6.3.2 | Appendix F (informative)
// Formula source: Doan, D.R. "Arc Flash Calculations for Exposures to DC Systems"
//                 IEEE Transactions on Industry Applications.

// ═══════════════════════════════════════════════════════════════════
// MULTIPLYING FACTORS — Appendix F / Clause 3.2.4.3
// Accounts for arc energy concentration in enclosed spaces.
// Open air = 1 (no reflection). Enclosure magnifies incident energy.
// ═══════════════════════════════════════════════════════════════════
const ARC_MULTIPLYING_FACTORS = {
  'open':      { label: 'Open air / outdoor (no enclosure)',       MF: 1.0 },
  'room_bat':  { label: 'Battery system room',                     MF: 1.5 },
  'enclosure': { label: 'Battery enclosure / cabinet (standard)',  MF: 3.0 },
};

// ═══════════════════════════════════════════════════════════════════
// CONSEQUENCE LEVELS — Table 6.1 (Clause 6.3.2.2)
// Arc flash incident energy → consequence → installation requirements
// ═══════════════════════════════════════════════════════════════════
const ARC_CONSEQUENCE_LEVELS = [
  {
    label:         'Insignificant',
    minCal:        0.0,
    maxCal:        1.2,
    ppeLevel:      0,
    colour:        '#16a34a',   // green
    residentialReq: null,
    commercialReq:  null,
    blocked:        false,
  },
  {
    label:         'Minor',
    minCal:        1.2,
    maxCal:        4.0,
    ppeLevel:      1,
    colour:        '#ca8a04',   // amber
    residentialReq: null,
    commercialReq:  null,
    blocked:        false,
  },
  {
    label:         'Moderate',
    minCal:        4.0,
    maxCal:        8.0,
    ppeLevel:      2,
    colour:        '#ea580c',   // orange
    // Clause 6.3.2.3 — residential: dedicated battery system room required
    residentialReq: 'Dedicated battery system room required (Cl. 6.3.2.3)',
    // Clause 6.3.2.4 — non-residential: dedicated room OR outside enclosure
    commercialReq:  'Dedicated battery room OR dedicated enclosure outside building (Cl. 6.3.2.4)',
    blocked:        false,
  },
  {
    label:         'Major',
    minCal:        8.0,
    maxCal:        40.0,
    ppeLevel:      3,
    colour:        '#dc2626',   // red
    residentialReq: 'Dedicated battery system room required (Cl. 6.3.2.3)',
    commercialReq:  'Dedicated battery room OR dedicated enclosure outside building (Cl. 6.3.2.4)',
    blocked:        false,
  },
  {
    label:         'Catastrophic',
    minCal:        40.0,
    maxCal:        Infinity,
    ppeLevel:      5,
    colour:        '#7f1d1d',   // dark red
    // Clause 6.3.2.4: arc flash energy must be <40 cal/cm² — system cannot be installed as designed
    residentialReq: 'SYSTEM CANNOT BE INSTALLED AS DESIGNED — arc flash energy exceeds 40 cal/cm² limit (Cl. 6.3.2)',
    commercialReq:  'SYSTEM CANNOT BE INSTALLED AS DESIGNED — arc flash energy exceeds 40 cal/cm² limit (Cl. 6.3.2)',
    blocked:        true,
  },
];

// ═══════════════════════════════════════════════════════════════════
// PPE DESCRIPTIONS — Table 3.3 (Clause 3.2.4.4)
// ═══════════════════════════════════════════════════════════════════
const ARC_PPE_LEVELS = [
  { level: 0, label: 'No PPE required',     calRange: '< 1.2 cal/cm²', description: 'No arc flash PPE required at this energy level.' },
  { level: 1, label: 'PPE Level 1',         calRange: '≤ 4 cal/cm²',   description: 'Arc-rated long sleeve shirt, arc-rated pants/overalls, arc-rated face shield with hard hat, safety glasses, hearing protection, leather/voltage-rated gloves, leather work shoes.' },
  { level: 2, label: 'PPE Level 2',         calRange: '≤ 8 cal/cm²',   description: 'Arc-rated long sleeve shirt, arc-rated pants/overalls, arc-rated face shield AND balaclava (or arc flash suit) with hard hat, safety glasses, hearing protection, leather/voltage-rated gloves, leather work shoes.' },
  { level: 3, label: 'PPE Level 3',         calRange: '≤ 25 cal/cm²',  description: 'Arc-rated long sleeve jacket, arc-rated pants, arc-rated flash hood with hard hat, safety glasses, hearing protection, leather/voltage-rated gloves, leather work shoes.' },
  { level: 4, label: 'PPE Level 4',         calRange: '≤ 40 cal/cm²',  description: 'Arc-rated long sleeve jacket, arc-rated pants, arc-rated flash hood with hard hat, safety glasses, hearing protection, leather/voltage-rated gloves, leather work shoes. CAUTION: heat stress when wearing Cat 4 clothing.' },
  { level: 5, label: 'PPE Level 5 / Prohibited', calRange: '> 40 cal/cm²', description: 'Incident energy exceeds safe working limits. System installation is not permitted as designed. Redesign required to reduce arc flash energy below 40 cal/cm².' },
];

// ═══════════════════════════════════════════════════════════════════
// DVC CLASSIFICATION — Table 3.2 (Clause 3.2.3)
// Decisive Voltage Classification from system voltage
// ═══════════════════════════════════════════════════════════════════
function getDVC(systemVoltage) {
  const v = parseFloat(systemVoltage) || 0;
  if (v <= 60)  return { dvc: 'A', label: 'DVC-A (≤60V d.c.)', shock: 'Low shock hazard — still an energy hazard', earthingReq: 'Bonding recommended but direct earth not required' };
  if (v <= 120) return { dvc: 'B', label: 'DVC-B (≤120V d.c.)', shock: 'Moderate shock hazard — treated as LV installation', earthingReq: 'Metallic enclosures must be earthed (Cl. 6.3.1.8)' };
  return         { dvc: 'C', label: 'DVC-C (>120V d.c.)', shock: 'Full LV shock hazard — AS/NZS 3000 LV rules apply', earthingReq: 'Full LV earthing required — AS/NZS 3000 Cl. 5.3.3 (Cl. 6.3.1.7)' };
}

// ═══════════════════════════════════════════════════════════════════
// ARCING TIME LOGIC — Clauses 3.2.4.2.3, F.2
// Default: 2 s when no clearing device (conservative / worst-case)
// With inter-string protection: use device clearing time (default 0.1s)
// ═══════════════════════════════════════════════════════════════════
function getArcingTime(hasInterStringProtection, customClearingTime) {
  if (!hasInterStringProtection) return { Tarc: 2.0, basis: 'No clearing device — 2 s default (Cl. 3.2.4.2.3)' };
  const ct = parseFloat(customClearingTime);
  if (ct > 0) return { Tarc: ct, basis: 'Custom clearing time from device time-current curve' };
  return { Tarc: 0.1, basis: 'Inter-string protection present — 0.1 s assumed (Appendix F Example 2)' };
}

// ═══════════════════════════════════════════════════════════════════
// MAIN CALCULATION — Equations F.1, F.2, F.3/F.4 from Appendix F
// IEm  = 0.01 × Vsys × Iarc × (Tarc / D²) × MF         [F.1]
// Iarc = 0.5 × Ibf                                       [F.2]
// AFB  = 0.01 × Vsys × Iarc × Tarc × MF / 1.2           [F.4]
//
// Parameters:
//   Vsys    — system d.c. voltage (V) — nominal bus voltage
//   Ibf     — battery prospective fault (short-circuit) current (A)
//              from manufacturer datasheet, prior to BMS interaction (Cl. 3.2.3.3)
//   locationKey — 'open' | 'room_bat' | 'enclosure'
//   hasInterStringProtection — boolean
//   customClearingTime — seconds (optional, used when hasInterStringProtection is true)
//   workingDistance — cm (default 45 cm per Cl. 3.2.4.2.2)
//   installationType — 'residential' | 'commercial' (drives room requirement threshold)
// ═══════════════════════════════════════════════════════════════════
function calcArcFlash(p) {
  try {
    const Vsys   = parseFloat(p.systemVoltage);
    const Ibf    = parseFloat(p.prospectiveFaultCurrent);
    const D      = parseFloat(p.workingDistance) || 45;   // cm, Cl. 3.2.4.2.2
    const locKey = p.locationKey || 'enclosure';
    const iType  = p.installationType || 'residential';   // 'residential' | 'commercial'

    // Input validation
    if (!Vsys || Vsys <= 0) return { error: 'System voltage (Vsys) must be > 0.' };
    if (!Ibf  || Ibf  <= 0) return { error: 'Prospective fault current (Ibf) must be > 0. Check manufacturer datasheet.' };
    if (Vsys > 1000)         return { error: 'This calculator covers systems ≤1000 V d.c. (AS/NZS 5139 scope). For higher voltages, consult a specialist.' };

    // Multiplying factor
    const locDef = ARC_MULTIPLYING_FACTORS[locKey] || ARC_MULTIPLYING_FACTORS['enclosure'];
    const MF = locDef.MF;

    // Arcing time
    const arcTime = getArcingTime(p.hasInterStringProtection, p.customClearingTime);
    const Tarc = arcTime.Tarc;

    // Core equations (Appendix F)
    const Iarc = 0.5 * Ibf;                               // F.2
    const IEm  = 0.01 * Vsys * Iarc * (Tarc / (D * D)) * MF;  // F.1
    const AFB  = (0.01 * Vsys * Iarc * Tarc * MF) / 1.2; // F.4 — boundary in cm

    // Consequence level
    const consequence = ARC_CONSEQUENCE_LEVELS.find(c => IEm >= c.minCal && IEm < c.maxCal)
                     || ARC_CONSEQUENCE_LEVELS[ARC_CONSEQUENCE_LEVELS.length - 1];

    // PPE level
    const ppe = ARC_PPE_LEVELS.find(p => p.level === consequence.ppeLevel)
             || ARC_PPE_LEVELS[ARC_PPE_LEVELS.length - 1];

    // Installation requirement (residential vs commercial)
    const installReq = iType === 'commercial'
      ? consequence.commercialReq
      : consequence.residentialReq;

    // DVC classification
    const dvc = getDVC(Vsys);

    return {
      ok: true,
      // Inputs (echoed for audit trail)
      inputs: {
        Vsys,
        Ibf,
        D,
        Tarc,
        MF,
        locationLabel: locDef.label,
        arcTimeBasis: arcTime.basis,
        hasInterStringProtection: !!p.hasInterStringProtection,
        installationType: iType,
      },
      // Intermediate values
      Iarc:   Math.round(Iarc),
      // Results
      IEm:    Math.round(IEm * 1000) / 1000,   // cal/cm² — 3dp
      AFB:    Math.round(AFB * 10) / 10,         // cm — 1dp
      AFB_m:  Math.round(AFB / 10) / 10,         // metres — 1dp
      // Classification
      consequence,
      ppe,
      dvc,
      installationRequirement: installReq,
      blocked: consequence.blocked,
      // Compliance note
      standardRef: 'AS/NZS 5139:2019 — Clauses 3.2.4, 6.3.2, Appendix F (Doan method)',
    };

  } catch (e) {
    return { error: 'Arc flash calculation error: ' + e.message };
  }
}

// ═══════════════════════════════════════════════════════════════════
// SERVER ENTRY POINT — called from frontend via google.script.run
// Input object mirrors calcArcFlash() parameters
// ═══════════════════════════════════════════════════════════════════
function runArcFlash(p) {
  return calcArcFlash(p);
}

// ═══════════════════════════════════════════════════════════════════
// COMMON BATTERY SYSTEMS — reference table for the UI
// Ibf (prospective fault current) from manufacturer datasheets.
// These are representative values — always verify against the actual
// product datasheet for the specific model being quoted.
// ═══════════════════════════════════════════════════════════════════
function getCommonBatteryDefaults() {
  return [
    // Pre-assembled integrated BESS (Section 4)
    { id: 'byd_hvm_8',    label: 'BYD HVM 8.28 kWh',      Vsys: 51.2,  Ibf: 2000, chemistry: 'LFP',  section: 4, un: 'UN 3480' },
    { id: 'byd_hvm_11',   label: 'BYD HVM 11.04 kWh',     Vsys: 51.2,  Ibf: 2000, chemistry: 'LFP',  section: 4, un: 'UN 3480' },
    { id: 'byd_hvm_16',   label: 'BYD HVM 16.6 kWh',      Vsys: 51.2,  Ibf: 2000, chemistry: 'LFP',  section: 4, un: 'UN 3480' },
    { id: 'byd_lvs_8',    label: 'BYD LVS 8.0 kWh',       Vsys: 48.0,  Ibf: 1500, chemistry: 'LFP',  section: 4, un: 'UN 3480' },
    { id: 'sungrow_sbr',  label: 'Sungrow SBR 9.6–25.6 kWh', Vsys: 51.2, Ibf: 1000, chemistry: 'LFP', section: 4, un: 'UN 3480' },
    { id: 'tesla_pw3',    label: 'Tesla Powerwall 3 (13.5 kWh)', Vsys: 50.0, Ibf: 2500, chemistry: 'LFP', section: 4, un: 'UN 3480' },
    { id: 'alpha_smile5', label: 'Alpha ESS SMILE5',       Vsys: 51.2,  Ibf: 1500, chemistry: 'LFP',  section: 4, un: 'UN 3480' },
    // Higher voltage systems
    { id: 'fronius_byd',  label: 'Fronius GEN24 + BYD HVM (HV)',  Vsys: 204.8, Ibf: 500,  chemistry: 'LFP',  section: 4, un: 'UN 3480' },
    { id: 'custom',       label: 'Custom / Enter manually',        Vsys: null,  Ibf: null,  chemistry: null,  section: null, un: null },
  ];
}

// ═══════════════════════════════════════════════════════════════════
// PDF SECTION BUILDER — for inclusion in buildReportHTML() / PDFBuilder.gs
// Returns an HTML string fragment for the PDF when batNum > 0.
// Call: pdfArcFlashBlock(arcResult, installationType)
// ═══════════════════════════════════════════════════════════════════
function pdfArcFlashBlock(arcResult, installationType) {
  if (!arcResult || arcResult.error || !arcResult.ok) {
    return `<div style="margin:10px 0;border:1px solid #e5e7eb;border-radius:8px;padding:10px 14px;font-size:9px;color:#6b7280">
      Arc flash assessment: not calculated (manual assessment required prior to installation — AS/NZS 5139:2019 Cl. 3.2.4)
    </div>`;
  }

  const r   = arcResult;
  const con = r.consequence;
  const ppe = r.ppe;
  const req = r.installationRequirement;
  const bkg = con.blocked ? '#fef2f2' : '#f9fafb';
  const bdr = con.blocked ? '#fecaca' : '#e5e7eb';

  const reqRow = req
    ? `<tr><td colspan="4" style="padding:5px 8px;background:#fffbeb;border-top:1px solid #fde68a;color:#92400e;font-weight:700;font-size:9px">⚠ Installation requirement: ${req}</td></tr>`
    : `<tr><td colspan="4" style="padding:5px 8px;color:#166534;font-size:9px">✓ No dedicated battery room requirement at this energy level (${installationType || 'residential'})</td></tr>`;

  return `
<div style="margin:10px 0;border:2px solid ${bdr};border-radius:8px;padding:12px 14px;background:${bkg}">
  <div style="font-weight:800;font-size:11px;color:#111827;margin-bottom:8px">
    Arc Flash Risk Assessment — AS/NZS 5139:2019 Cl. 3.2.4 &amp; 6.3.2 (Doan Method)
  </div>
  <table width="100%" style="border-collapse:collapse;font-size:9px">
    <tr style="background:#f3f4f6">
      <td style="padding:4px 8px;color:#374151">System voltage</td>
      <td style="padding:4px 8px;font-weight:700">${r.inputs.Vsys} V d.c.</td>
      <td style="padding:4px 8px;color:#374151">Fault current (Ibf)</td>
      <td style="padding:4px 8px;font-weight:700">${r.inputs.Ibf.toLocaleString()} A</td>
    </tr>
    <tr>
      <td style="padding:4px 8px;color:#374151">Arcing current (Iarc)</td>
      <td style="padding:4px 8px;font-weight:700">${r.Iarc.toLocaleString()} A</td>
      <td style="padding:4px 8px;color:#374151">Arcing time (Tarc)</td>
      <td style="padding:4px 8px;font-weight:700">${r.inputs.Tarc} s</td>
    </tr>
    <tr style="background:#f3f4f6">
      <td style="padding:4px 8px;color:#374151">Working distance</td>
      <td style="padding:4px 8px;font-weight:700">${r.inputs.D} cm</td>
      <td style="padding:4px 8px;color:#374151">Location / MF</td>
      <td style="padding:4px 8px;font-weight:700">${r.inputs.locationLabel} (×${r.inputs.MF})</td>
    </tr>
    <tr>
      <td style="padding:4px 8px;color:#374151">DVC classification</td>
      <td style="padding:4px 8px;font-weight:700">${r.dvc.label}</td>
      <td style="padding:4px 8px;color:#374151">Inter-string protection</td>
      <td style="padding:4px 8px;font-weight:700">${r.inputs.hasInterStringProtection ? 'Yes' : 'No (worst-case assumed)'}</td>
    </tr>
    <tr style="background:${con.colour}15;border-top:2px solid ${con.colour}">
      <td style="padding:6px 8px;color:#374151;font-weight:700">Incident energy (IEm)</td>
      <td style="padding:6px 8px;font-weight:900;font-size:12px;color:${con.colour}">${r.IEm} cal/cm²</td>
      <td style="padding:6px 8px;color:#374151;font-weight:700">Consequence level</td>
      <td style="padding:6px 8px;font-weight:900;color:${con.colour}">${con.label}</td>
    </tr>
    <tr style="background:${con.colour}10">
      <td style="padding:6px 8px;color:#374151;font-weight:700">Protection boundary (AFB)</td>
      <td style="padding:6px 8px;font-weight:700">${r.AFB} cm (${r.AFB_m} m)</td>
      <td style="padding:6px 8px;color:#374151;font-weight:700">Required PPE</td>
      <td style="padding:6px 8px;font-weight:700">${ppe.label}</td>
    </tr>
    ${reqRow}
  </table>
  <div style="font-size:7.5px;color:#9ca3af;margin-top:6px">
    ${r.standardRef} &nbsp;|&nbsp; Arcing time: ${r.inputs.arcTimeBasis}
    &nbsp;|&nbsp; PPE required within ${r.AFB} cm of live parts during work activities.
    ${r.blocked ? ' ⛔ SYSTEM CANNOT BE INSTALLED AS DESIGNED — review system voltage, fault current, or protection design.' : ''}
  </div>
</div>`;
}

// ═══════════════════════════════════════════════════════════════════
// TEST CASES — mirrors structure of TestCases.gs
// Run from GAS editor: runArcFlashTests()
// ═══════════════════════════════════════════════════════════════════
function runArcFlashTests() {
  const tests = [
    {
      name: 'Appendix F Example 1 — 48V, 6kA, no fusing, enclosure',
      input: { systemVoltage: 48, prospectiveFaultCurrent: 6000, locationKey: 'enclosure',
               hasInterStringProtection: false, workingDistance: 45, installationType: 'residential' },
      expect: { IEm: 2.133, AFB_cm: 60.0, consequence: 'Minor' },
    },
    {
      name: 'Appendix F Example 2 — 48V, 6kA, WITH fusing (0.1s), enclosure',
      input: { systemVoltage: 48, prospectiveFaultCurrent: 6000, locationKey: 'enclosure',
               hasInterStringProtection: true, customClearingTime: 0.1, workingDistance: 45, installationType: 'residential' },
      expect: { IEm: 0.107, AFB_cm: 13.4, consequence: 'Insignificant' },
    },
    {
      name: 'BYD HVM 48V, 2000A, enclosure — typical residential',
      input: { systemVoltage: 51.2, prospectiveFaultCurrent: 2000, locationKey: 'enclosure',
               hasInterStringProtection: false, workingDistance: 45, installationType: 'residential' },
      expect: { consequence: 'Minor' },
    },
    {
      name: '350V system, 12kA, no protection — catastrophic check',
      input: { systemVoltage: 350, prospectiveFaultCurrent: 12000, locationKey: 'enclosure',
               hasInterStringProtection: false, workingDistance: 45, installationType: 'commercial' },
      expect: { consequence: 'Catastrophic', blocked: true },
    },
    {
      name: 'Table F.4 — 350V, 12kA, WITH protection (0.1s)',
      input: { systemVoltage: 350, prospectiveFaultCurrent: 12000, locationKey: 'enclosure',
               hasInterStringProtection: true, customClearingTime: 0.1, workingDistance: 45, installationType: 'commercial' },
      expect: { IEm: 3.111, AFB_cm: 72.5, consequence: 'Minor' },
    },
  ];

  let pass = 0;
  let fail = 0;
  const log = [];

  for (const t of tests) {
    const r = calcArcFlash(t.input);
    if (r.error) {
      log.push(`FAIL [${t.name}] — Error: ${r.error}`);
      fail++;
      continue;
    }
    const failures = [];
    if (t.expect.IEm !== undefined) {
      const diff = Math.abs(r.IEm - t.expect.IEm);
      if (diff > 0.01) failures.push(`IEm: got ${r.IEm}, expected ${t.expect.IEm}`);
    }
    if (t.expect.AFB_cm !== undefined) {
      const diff = Math.abs(r.AFB - t.expect.AFB_cm);
      if (diff > 1.0) failures.push(`AFB: got ${r.AFB} cm, expected ${t.expect.AFB_cm} cm`);
    }
    if (t.expect.consequence !== undefined) {
      if (r.consequence.label !== t.expect.consequence)
        failures.push(`Consequence: got "${r.consequence.label}", expected "${t.expect.consequence}"`);
    }
    if (t.expect.blocked !== undefined) {
      if (r.blocked !== t.expect.blocked)
        failures.push(`Blocked: got ${r.blocked}, expected ${t.expect.blocked}`);
    }
    if (failures.length) {
      log.push(`FAIL [${t.name}]\n  ${failures.join('\n  ')}`);
      fail++;
    } else {
      log.push(`PASS [${t.name}] — IEm=${r.IEm} cal/cm², ${r.consequence.label}, AFB=${r.AFB}cm`);
      pass++;
    }
  }

  const summary = `\nArc Flash Tests: ${pass} passed, ${fail} failed of ${tests.length} total.\n`;
  log.push(summary);
  Logger.log(log.join('\n'));
  return { pass, fail, total: tests.length, log };
}
