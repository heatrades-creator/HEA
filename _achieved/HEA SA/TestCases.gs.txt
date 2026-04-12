// HEA Solar Analyser — https://hea-group.com.au
// REC 37307 — Jesse Heffernan, Bendigo VIC

// TestCases.gs — regression test pack
// ══════════════════════════════════════════════════════════════════════
// HOW TO RUN:
//   Apps Script editor → Run → runRegressionTests()
//   Results are written to AdminLog sheet and logged in console.
//
// WHAT IS TESTED HERE (server-side):
//   - NEM12 parser: single channel, multi-channel, malformed data, bad dates
//
// WHAT NEEDS MANUAL TESTING (client-side Finance card):
//   See MANUAL_TEST_FIXTURES below — run with these inputs and verify outputs.
// ══════════════════════════════════════════════════════════════════════

// ── Synthetic NEM12 generators for parser tests ──

function makeNem12Day(date, vals, qFlag, suffix) {
  // date: 'YYYYMMDD', vals: array of 48 floats, qFlag: 'A'|'E'|'S', suffix: e.g. 'E1'
  if (vals.length !== 48) throw new Error('vals must have 48 entries');
  const ds = date;
  const parts = ['300', ds].concat(vals.map(v => v.toFixed(3)));
  parts.push(qFlag || 'A');
  return parts.join(',');
}

function makeNem12Header(nmi, suffix, uom, intervalMins) {
  // 200 record
  return ['200', nmi||'NMI123456789', suffix||'E1', '', '', '', 'METER1', uom||'KWH', intervalMins||'30', ''].join(',');
}

function flat48(kwh) {
  // 48 identical intervals (e.g. flat 0.25 kWh/30min = 12 kWh/day)
  return new Array(48).fill(kwh / 48);
}

// ── Test runner ──

function runRegressionTests() {
  const results = [];
  let passed = 0, failed = 0;

  function assert(name, actual, expected, tolerance) {
    const tol = tolerance || 0;
    const ok = typeof expected === 'boolean'
      ? actual === expected
      : Math.abs(actual - expected) <= tol;
    const status = ok ? 'PASS' : 'FAIL';
    if (ok) passed++; else failed++;
    results.push({ name, status, actual, expected });
    Logger.log(status + ': ' + name + ' | got: ' + actual + ' | expected: ' + expected);
  }

  // ── TEST 1: Single E1 channel, 3 days, all actual readings ──
  const t1Header = makeNem12Header('NMI001', 'E1', 'KWH', '30');
  const t1Day1   = makeNem12Day('20240101', flat48(12), 'A');
  const t1Day2   = makeNem12Day('20240102', flat48(12), 'A');
  const t1Day3   = makeNem12Day('20240103', flat48(12), 'A');
  const t1csv    = ['100', t1Header, t1Day1, t1Day2, t1Day3, '900'].join('\n');
  const t1 = parseNEM12(t1csv);
  assert('T1: days accepted', t1.days.length, 3);
  assert('T1: chosen channel', t1.validationSummary.chosen_channel, 'E1');
  assert('T1: no estimated days', t1.validationSummary.days_estimated, 0);
  assert('T1: no malformed rows', t1.validationSummary.malformed_rows, 0);
  assert('T1: first day 48 intervals', t1.days[0].values.length, 48);
  assert('T1: interval sum ~12 kWh', t1.days[0].values.reduce((a,v) => a+v, 0), 12, 0.01);

  // ── TEST 2: Estimated + substituted flags ──
  const t2Header = makeNem12Header('NMI002', 'E1', 'KWH', '30');
  const t2Day1   = makeNem12Day('20240101', flat48(10), 'A');
  const t2Day2   = makeNem12Day('20240102', flat48(10), 'E');  // estimated
  const t2Day3   = makeNem12Day('20240103', flat48(10), 'S');  // substituted
  const t2csv    = ['100', t2Header, t2Day1, t2Day2, t2Day3, '900'].join('\n');
  const t2 = parseNEM12(t2csv);
  assert('T2: estimated days counted', t2.validationSummary.days_estimated, 1);
  assert('T2: substituted days counted', t2.validationSummary.days_substituted, 1);
  assert('T2: all 3 days accepted', t2.days.length, 3);

  // ── TEST 3: Multi-channel (E1 + B2 export) — B2 should be skipped ──
  const t3H_e1 = makeNem12Header('NMI003', 'E1', 'KWH', '30');
  const t3H_b2 = makeNem12Header('NMI003', 'B2', 'KWH', '30');
  const t3D_e1 = makeNem12Day('20240101', flat48(15), 'A');
  const t3D_b2 = makeNem12Day('20240101', flat48(5),  'A');
  const t3csv  = ['100', t3H_e1, t3D_e1, t3H_b2, t3D_b2, '900'].join('\n');
  const t3 = parseNEM12(t3csv);
  assert('T3: only 1 day accepted (E1 only)', t3.days.length, 1);
  assert('T3: chosen channel is E1', t3.validationSummary.chosen_channel, 'E1');
  assert('T3: B2 in skipped channels', t3.validationSummary.skipped_channels.includes('B2'), true);
  // E1 day should be ~15 kWh, not 5 (B2 not double-counted)
  assert('T3: day sum is E1 value not B2', t3.days[0].values.reduce((a,v)=>a+v,0), 15, 0.01);

  // ── TEST 4: Malformed 300 record — too few fields (parts.length < 51) ──
  // The fix validates parts.length BEFORE building the vals array.
  // Previously, short rows were silently zero-filled — this test now correctly catches them.
  const t4Header = makeNem12Header('NMI004', 'E1', 'KWH', '30');
  const t4Good   = makeNem12Day('20240101', flat48(10), 'A');
  const t4Bad    = '300,20240102,' + flat48(5).slice(0,20).join(',') + ',A'; // only 20 intervals
  const t4csv    = ['100', t4Header, t4Good, t4Bad, '900'].join('\n');
  const t4 = parseNEM12(t4csv);
  assert('T4: malformed row counted', t4.validationSummary.malformed_rows, 1);
  assert('T4: good day still accepted', t4.days.length, 1);

  // ── TEST 5: Invalid date in 300 record ──
  const t5Header = makeNem12Header('NMI005', 'E1', 'KWH', '30');
  const t5Good   = makeNem12Day('20240101', flat48(8), 'A');
  const t5Bad    = '300,BADDATE,' + flat48(8).join(',') + ',A';
  const t5csv    = ['100', t5Header, t5Good, t5Bad, '900'].join('\n');
  const t5 = parseNEM12(t5csv);
  assert('T5: bad date counted as malformed', t5.validationSummary.malformed_rows, 1);
  assert('T5: good day still accepted', t5.days.length, 1);

  // ── TEST 6A: NaN / non-numeric interval values ──
  const t6aHeader = makeNem12Header('NMI006A', 'E1', 'KWH', '30');
  const t6aVals   = flat48(8.0);
  t6aVals[10]     = 'N/A';  // inject non-numeric — will produce NaN in parseFloat
  // Build row manually (bypassing makeNem12Day which only accepts floats)
  const t6aBad  = ['300', '20240101'].concat(t6aVals).concat(['A']).join(',');
  const t6aGood = makeNem12Day('20240102', flat48(8.0), 'A');
  const t6acsv  = ['100', t6aHeader, t6aBad, t6aGood, '900'].join('\n');
  const t6a = parseNEM12(t6acsv);
  assert('T6A: NaN interval counted as malformed', t6a.validationSummary.malformed_rows, 1);
  assert('T6A: good day still accepted', t6a.days.length, 1);

  // ── TEST 6: Two-pass fallback (unknown suffix) ──
  const t6Header = makeNem12Header('NMI006', 'ZZ', 'KWH', '30'); // unknown suffix
  const t6Day1   = makeNem12Day('20240101', flat48(9), 'A');
  const t6csv    = ['100', t6Header, t6Day1, '900'].join('\n');
  const t6 = parseNEM12(t6csv);
  assert('T6: fallback_used true for unknown suffix', t6.validationSummary.fallback_used, true);
  assert('T6: day still accepted via fallback', t6.days.length, 1);

  // Write results to AdminLog
  const summary = 'NEM12 parser tests: ' + passed + ' passed, ' + failed + ' failed';
  logAdminEvent('REGRESSION_TEST', summary, failed === 0 ? 'all_pass' : 'FAILURES_DETECTED');

  return { passed, failed, total: passed + failed, results, summary };
}

// ══════════════════════════════════════════════════════════════════════
// MANUAL TEST FIXTURES — Finance Card (client-side)
// Run the app with these inputs and compare against expected outputs.
// These are the ground-truth numbers for regression monitoring.
// ══════════════════════════════════════════════════════════════════════

const MANUAL_TEST_FIXTURES = {

  TC01_cash_purchase: {
    description: 'Simple cash purchase, no battery, flat tariff',
    inputs: {
      systemKw: 6.6,
      totalCost: 8900,          // net after rebates
      cashDeposit: 8900,
      loanAmount: 0,
      annualLoad: 5500,          // kWh/yr
      importTariff: 0.30,        // $/kWh
      fitRate: 0.06,             // $/kWh
      directSCR: 0.35,
      discountRate: 0.07,
      tariffEsc: 0.03,
      pvDegradation: 0.005,
      maintYr1: 150,
      analysisYears: 25,
      connFeeDay: 1.034,
      batKwh: 0,
    },
    expected: {
      year1_savings_approx_min: 1600,   // $ — depends on gen model
      year1_savings_approx_max: 2200,
      simple_pb_approx_min: 4.5,
      simple_pb_approx_max: 6.5,
      NPV_sign: 'positive',           // NPV must be positive
      IRR_min: 10,                      // % — must exceed typical mortgage rate
      BEP_max_years: 12,
    }
  },

  TC02_financed_system: {
    description: 'Financed system, weekly repayments, no battery',
    inputs: {
      systemKw: 6.6,
      totalCost: 8900,
      cashDeposit: 1000,
      loanAmount: 7900,
      repaymentPerPeriod: 75,
      ppy: 52,
      annualRate: 0.059,
      annualLoad: 5500,
      importTariff: 0.30,
      fitRate: 0.06,
      directSCR: 0.35,
      discountRate: 0.07,
      tariffEsc: 0.03,
      pvDegradation: 0.005,
      maintYr1: 150,
      analysisYears: 25,
      connFeeDay: 1.034,
      batKwh: 0,
    },
    expected: {
      loan_finish_yr_max: 4,            // loan should be paid off within ~3 years at $75/wk
      NPV_sign: 'positive',
      IRR_min: 8,
      ann_cf_pos_yr_max: 5,            // cashflow positive before year 5
    }
  },

  TC03_with_battery: {
    description: 'Solar + battery, cash purchase',
    inputs: {
      systemKw: 10,
      totalCost: 22000,
      cashDeposit: 22000,
      loanAmount: 0,
      annualLoad: 8000,
      importTariff: 0.28,
      fitRate: 0.06,
      directSCR: 0.55,              // higher SCR with battery
      batKwh: 10,
      discountRate: 0.07,
      tariffEsc: 0.03,
      pvDegradation: 0.005,
      batDeg: 0.025,
      maintYr1: 200,
      batReplYr: 12,
      batReplFrac: 0.60,
      analysisYears: 25,
      connFeeDay: 1.034,
    },
    expected: {
      year1_savings_min: 2000,
      NPV_sign: 'positive',
      BEP_max_years: 14,
    }
  },

  TC04_edge_high_discount: {
    description: 'High discount rate — DPB should be null or very long',
    inputs: {
      systemKw: 6.6,
      totalCost: 8900,
      cashDeposit: 8900,
      loanAmount: 0,
      annualLoad: 5500,
      importTariff: 0.30,
      fitRate: 0.06,
      directSCR: 0.35,
      discountRate: 0.20,           // very high — 20%
      tariffEsc: 0.03,
      pvDegradation: 0.005,
      maintYr1: 150,
      analysisYears: 25,
      connFeeDay: 1.034,
      batKwh: 0,
    },
    expected: {
      NPV_sign: 'negative',         // 20% hurdle rate — solar should fail
      IRR_less_than: 20,            // if IRR < 20%, NPV at 20% is negative ✓
    }
  },

  TC05_negative_amortisation_guard: {
    description: 'Repayment too low to cover interest — must error, not model',
    inputs: {
      totalCost: 50000,
      cashDeposit: 5000,
      loanAmount: 45000,
      repaymentPerPeriod: 20,       // $20/week
      ppy: 52,
      annualRate: 0.10,             // 10% p.a. → $86/wk interest on $45k → exceeds $20/wk
    },
    expected: {
      engine_error: true,           // checkLoanServicability must return error
    }
  }

};
// Access MANUAL_TEST_FIXTURES from SecretBackend or console for reference.
// To view in SecretBackend: open Section 19 (Quality Gate) for the test matrix.
