// HEA Solar Analyser — https://hea-group.com.au
// REC 37307 — Jesse Heffernan, Bendigo VIC

// AnalysisEngine.gs — solar zone, generation, load profiles, bill calculations, runAnalysis

function zoneFromPostcode(pc) {
  const p = parseInt(pc) || 3000;
  if (p >= 3550 && p <= 3556) return 'NORTH';
  if (p >= 3630 && p <= 3699) return 'NORTH';
  if (p >= 3700 && p <= 3749) return 'NORTH';
  if (p >= 3500 && p <= 3599) return 'SUNRAYSIA';
  if (p >= 3350 && p <= 3399) return 'BALLARAT';
  if (p >= 3400 && p <= 3499) return 'WIMMERA';
  if (p >= 3800 && p <= 3975) return 'GIPPSLAND';
  return 'METRO';
}

const ZONE_NAMES = {
  SUNRAYSIA: 'Sunraysia / Mildura',
  NORTH:     'Northern VIC (Bendigo / Shepparton / Wangaratta)',
  WIMMERA:   'Wimmera / Western VIC',
  METRO:     'Melbourne Metro / Central VIC',
  BALLARAT:  'Ballarat Region',
  GIPPSLAND: 'Gippsland / Eastern VIC'
};

const ZONE_MULT = {
  SUNRAYSIA: 1.18, NORTH: 1.06, WIMMERA: 1.03,
  METRO: 1.00, BALLARAT: 0.96, GIPPSLAND: 0.93
};

// ───────────────────────────────────────────
// IRRADIANCE — Melbourne BOM BERS Table 4.5
// Verified against BOM Table 4.5 (N-facing, latitude tilt)
// ───────────────────────────────────────────
const IRR_MEL = [
  [0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0],
  [1,2,3,2,0,0,2,0,0,0,0,0],
  [29,9,1,1,12,36,43,11,27,1,0,16],
  [111,70,34,10,1,4,28,103,142,141,54,107],
  [259,236,199,116,41,17,21,60,185,267,291,289],
  [419,418,380,322,226,140,164,261,351,429,441,450],
  [581,592,547,487,382,317,336,419,489,564,578,590],
  [730,736,676,593,492,434,458,521,584,674,702,714],
  [822,834,757,666,535,478,508,562,643,723,774,781],
  [849,860,780,660,527,458,497,559,645,718,775,791],
  [797,806,720,597,463,405,448,503,588,657,702,729],
  [682,691,608,481,347,299,335,406,482,537,578,610],
  [529,529,443,328,204,156,211,264,338,385,426,460],
  [346,336,261,121,33,20,36,78,176,219,253,295],
  [167,149,65,12,1,1,7,22,49,96,133,58],
  [45,28,6,5,17,39,12,37,6,0,11,1],
  [4,4,1,4,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0]
]; // Melbourne BOM Table 4.5 -- north-facing latitude tilt. Cols=[Jan..Dec]

// Monthly irradiance sums (sum of all 24 hourly values per month).
// Used to distribute annual generation estimate across calendar months.
// Derived directly from IRR_MEL above.
const MONTHLY_IRR = [6371,6294,5477,4393,3252,2724,3015,3644,4532,5342,5813,6072];
const MONTHLY_IRR_TOTAL = MONTHLY_IRR.reduce((a,b)=>a+b,0); // 56929

const SMON = {
  Summer:[0,1,11], Autumn:[2,3,4], Winter:[5,6,7], Spring:[8,9,10]
};

function getIrr(zone) {
  const m = ZONE_MULT[zone] || 1;
  return IRR_MEL.map(row => row.map(v => v * m));
}

function calcGenPerKw(zone) {
  const irr = getIrr(zone);
  const out = {};
  for (const [s, months] of Object.entries(SMON)) {
    out[s] = [];
    for (let h = 0; h < 24; h++) {
      let avg = 0;
      for (const m of months) avg += irr[h][m];
      out[s][h] = avg / months.length;
    }
  }
  return out;
}

function calcGen(kw, eff, zone) {
  const perKw = calcGenPerKw(zone);
  const out   = {};
  for (const [s, vals] of Object.entries(perKw)) {
    out[s] = vals.map(v => v * kw * eff);
  }
  return out;
}

// ───────────────────────────────────────────
// SEASONAL PROFILE BUILDER → Wh/hr per hour
// Matches "Season Weekday-end (1hr)" Excel sheet exactly
// ───────────────────────────────────────────
function buildProfiles(days) {
  function season(mo) {
    if (mo===12||mo===1||mo===2) return 'Summer';
    if (mo===3||mo===4||mo===5)  return 'Autumn';
    if (mo===6||mo===7||mo===8)  return 'Winter';
    return 'Spring';
  }
  const SEASONS = ['Summer','Autumn','Winter','Spring'];
  const TYPES   = ['weekday','weekend'];
  const acc = {};
  const cnt = {};
  for (const s of SEASONS) {
    acc[s] = {}; cnt[s] = {};
    for (const t of TYPES) {
      acc[s][t] = new Array(24).fill(0);
      cnt[s][t] = 0;
    }
  }
  for (const d of days) {
    const s   = season(d.month);
    const dow = d.date.getDay();
    const t   = (dow===0||dow===6) ? 'weekend' : 'weekday';
    cnt[s][t]++;
    for (let h = 0; h < 24; h++) {
      // Combine two 30-min NEM12 intervals into one hourly Wh value
      acc[s][t][h] += (d.values[h*2] + d.values[h*2+1]) * 1000;
    }
  }
  const out = {};
  for (const s of SEASONS) {
    out[s] = {};
    for (const t of TYPES) {
      const n = cnt[s][t];
      out[s][t] = n > 0 ? acc[s][t].map(v => v/n) : new Array(24).fill(0);
    }
  }

  // ── Missing season interpolation ──
  // When a season has no data, interpolate from adjacent seasons and flag it.
  const SEASON_CYCLE = ['Summer','Autumn','Winter','Spring'];
  const missing = [];
  for (const s of SEASONS) {
    for (const t of TYPES) {
      if (cnt[s][t] === 0) {
        const idx  = SEASON_CYCLE.indexOf(s);
        const prev = SEASON_CYCLE[(idx+3)%4];
        const next = SEASON_CYCLE[(idx+1)%4];
        const prevHas = cnt[prev][t] > 0;
        const nextHas = cnt[next][t] > 0;
        for (let h=0; h<24; h++) {
          if (prevHas && nextHas)    out[s][t][h] = (out[prev][t][h] + out[next][t][h]) / 2;
          else if (prevHas)          out[s][t][h] = out[prev][t][h];
          else if (nextHas)          out[s][t][h] = out[next][t][h];
        }
        if (!missing.includes(s)) missing.push(s);
      }
    }
  }
  // ── Monthly profiles: per-month weighted average (for design baseline comparison) ──
  const MONTH_NAMES = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const mAcc = {}, mCnt = {};
  for (let m = 1; m <= 12; m++) {
    mAcc[m] = { weekday: new Array(24).fill(0), weekend: new Array(24).fill(0) };
    mCnt[m] = { weekday: 0, weekend: 0 };
  }
  for (const d of days) {
    const mo  = d.month;
    const dow = d.date.getDay();
    const t   = (dow===0||dow===6) ? 'weekend' : 'weekday';
    mCnt[mo][t]++;
    for (let h = 0; h < 24; h++) {
      mAcc[mo][t][h] += (d.values[h*2] + d.values[h*2+1]) * 1000;
    }
  }
  // Derive the date range covered by the dataset
  const sortedDays = days.slice().sort((a, b) => a.date - b.date);
  const firstDay   = sortedDays.length ? sortedDays[0].date : null;
  const lastDay    = sortedDays.length ? sortedDays[sortedDays.length-1].date : null;

  const monthlyProfiles = {};
  for (let m = 1; m <= 12; m++) {
    const wdN = mCnt[m].weekday;
    const weN = mCnt[m].weekend;
    if (wdN + weN === 0) continue;   // no data for this month — skip
    const avgWD = wdN > 0 ? mAcc[m].weekday.map(v => Math.round(v / wdN)) : new Array(24).fill(0);
    const avgWE = weN > 0 ? mAcc[m].weekend.map(v => Math.round(v / weN)) : avgWD;
    const con   = avgWD.map((v, h) => Math.round((5 * v + 2 * avgWE[h]) / 7));
    monthlyProfiles[m] = {
      con,
      days:     wdN + weN,
      wdDays:   wdN,
      weDays:   weN,
      name:     MONTH_NAMES[m],
      season:   season(m),
    };
  }

  return { profiles: out, missing, monthlyProfiles, dataRange: {
    first: firstDay ? firstDay.toISOString().substring(0, 10) : null,
    last:  lastDay  ? lastDay.toISOString().substring(0,  10) : null,
  }};
}

function checkDataQuality(days) {
  function season(mo) {
    if (mo===12||mo===1||mo===2) return 'Summer';
    if (mo===3||mo===4||mo===5)  return 'Autumn';
    if (mo===6||mo===7||mo===8)  return 'Winter';
    return 'Spring';
  }
  const counts = { Summer:{weekday:0,weekend:0}, Autumn:{weekday:0,weekend:0},
                   Winter:{weekday:0,weekend:0}, Spring:{weekday:0,weekend:0} };
  for (const d of days) {
    const s = season(d.month);
    const dow = d.date.getDay();
    if (dow===0||dow===6) counts[s].weekend++; else counts[s].weekday++;
  }
  const warnings = [];
  for (const [s, c] of Object.entries(counts)) {
    if (c.weekday < 20) warnings.push(`${s}: only ${c.weekday} weekday days (results may be unreliable)`);
    if (c.weekend < 8)  warnings.push(`${s}: only ${c.weekend} weekend days`);
  }
  return { counts, warnings };
}

// ───────────────────────────────────────────
// TARIFF HELPERS
// TOU: Peak 3pm-9pm (h15-h20), Off-peak 11pm-7am (h23,h0-h6), Shoulder: rest
// ───────────────────────────────────────────
function tariffForHour(tariff, h) {
  if (tariff.type === 'flat') return parseFloat(tariff.flatRate) || 24.112;
  if (tariff.type === 'cl')   return parseFloat(tariff.flatRate) || 24.112;
  if (h >= 15 && h <= 20) return parseFloat(tariff.peak)    || 40;
  if (h >= 23 || h <= 6)  return parseFloat(tariff.offpeak) || 18;
  return parseFloat(tariff.shoulder) || 25;
}

const CL_HOURS = [23,0,1,2,3,4,5,6];

// ───────────────────────────────────────────
// SEASON DAY COUNTS — calendar verified
// Summer=Dec(31)+Jan(31)+Feb(28)=90
// Autumn=Mar(31)+Apr(30)+May(31)=92
// Winter=Jun(30)+Jul(31)+Aug(31)=92
// Spring=Sep(30)+Oct(31)+Nov(30)=91
// ───────────────────────────────────────────
const SDAYS = { Summer:90, Autumn:92, Winter:92, Spring:91 };

// ───────────────────────────────────────────
// FINANCIAL MODEL (includes battery simulation)
// Per-hour tariff for TOU accuracy
// ───────────────────────────────────────────
function calcFinancials(profiles, gen, tariff, sysNet, fitC, batteryKwh) {
  const batCap = (parseFloat(batteryKwh) || 0) * 1000;
  let totCon=0, totSelf=0, totExp=0, totSavings=0;
  for (const [s, days] of Object.entries(SDAYS)) {
    const wdN = Math.round(days * 5/7);
    const weN = days - wdN;
    for (const [type, cnt] of [['weekday',wdN],['weekend',weN]]) {
      if (batCap === 0) {
        for (let h = 0; h < 24; h++) {
          const con  = profiles[s][type][h] / 1000;
          const gn   = gen[s][h] / 1000;
          const self = Math.min(con, gn);
          const exp  = Math.max(0, gn - con);
          totCon     += con  * cnt;
          totSelf    += self * cnt;
          totExp     += exp  * cnt;
          totSavings += self * (tariffForHour(tariff, h) / 100) * cnt;
        }
      } else {
        const BAT_EFF = 0.92;
        let soc = batCap * 0.2;
        for (let h = 0; h < 24; h++) {
          const con  = profiles[s][type][h];
          const gn   = gen[s][h];
          const rate = tariffForHour(tariff, h) / 100;
          totCon += con / 1000 * cnt;
          if (gn >= con) {
            const chg = Math.min((gn-con)*BAT_EFF, batCap-soc); soc += chg;
            const exp = Math.max(0, gn-con-chg/BAT_EFF);
            totSelf    += con/1000 * cnt;
            totExp     += exp/1000 * cnt;
            totSavings += (con/1000) * rate * cnt;
          } else {
            const need = con-gn;
            const use  = Math.min(need, soc*BAT_EFF); soc -= use/BAT_EFF;
            const selfUsed = (gn+use)/1000;
            totSelf    += selfUsed * cnt;
            totSavings += selfUsed * rate * cnt;
          }
        }
      }
    }
  }
  const fit      = parseFloat(fitC) || 3.3;
  const fitInc   = totExp * fit / 100;
  const totalAnn = totSavings + fitInc;
  const payback  = (sysNet > 0 && totalAnn > 0) ? sysNet / totalAnn : 0;
  const avgTariff = totSelf > 0 ? (totSavings / totSelf * 100).toFixed(1) : '0.0';
  return {
    annualKwh: Math.round(totCon),
    genKwh:    Math.round(totSelf + totExp),
    selfKwh:   Math.round(totSelf),
    exportKwh: Math.round(totExp),
    selfPct:   totCon > 0 ? (totSelf/totCon*100).toFixed(1) : '0.0',
    savings:   totalAnn.toFixed(0),
    savingsFromTariff: totSavings.toFixed(0),
    savingsFromFiT:    fitInc.toFixed(0),
    payback:   payback.toFixed(1),
    avgTariff
  };
}

// ───────────────────────────────────────────
// MAIN ENTRY
// ───────────────────────────────────────────
function runAnalysis(p) {
  try {
    const parsed = parseNEM12(p.csvText);
    if (parsed.days.length < 14)
      return { error: 'Need at least 14 days of data. Parsed ' + parsed.days.length + '. Check NEM12 format.' };

    // Malformed data threshold: if >15% of lines were malformed, stop and warn loudly
    const v = parsed.validationSummary;
    const totalRows = parsed.days.length + (v ? v.malformed_rows : 0);
    if (v && v.malformed_rows > 0 && totalRows > 0) {
      const malformedPct = v.malformed_rows / totalRows;
      if (malformedPct > 0.15 || v.malformed_rows > 50) {
        return { error: 'Data quality too low: ' + v.malformed_rows + ' malformed rows (' +
          Math.round(malformedPct * 100) + '% of file). Check NEM12 format or re-export from retailer portal.' };
      }
    }
    // Warn (not block) if fallback channel selection was used
    if (v && v.fallback_used) {
      // Continue with analysis but flag for UI warning
      Logger.log('NEM12 WARN: fallback channel selection used — no recognised import suffix found');
    }
    const zone     = zoneFromPostcode(p.postcode);
    const kw       = parseFloat(p.systemKw);
    const eff      = parseFloat(p.efficiency)/100;
    const { profiles, missing: missingSeasons, monthlyProfiles, dataRange } = buildProfiles(parsed.days);
    const genPerKw = calcGenPerKw(zone);
    const gen      = calcGen(kw, eff, zone);
    const fin      = calcFinancials(profiles, gen, p.tariff,
                       parseFloat(p.sysNet)||0, parseFloat(p.fitC)||3.3,
                       parseFloat(p.batteryKwh)||0);
    const quality  = checkDataQuality(parsed.days);
    // Chart data: (5×weekday + 2×weekend)/7 weighted
    const chartData = {};
    for (const s of ['Summer','Autumn','Winter','Spring']) {
      chartData[s] = {
        con: profiles[s].weekday.map((v,i) => Math.round((5*v + 2*profiles[s].weekend[i])/7)),
        gn:  gen[s].map(v => Math.round(v))
      };
    }
    const profRnd = {};
    for (const s of Object.keys(profiles)) {
      profRnd[s] = {};
      for (const t of ['weekday','weekend'])
        profRnd[s][t] = profiles[s][t].map(v => Math.round(v));
    }
    return {
      ok: true, nmi:parsed.nmi, meter:parsed.meter, days:parsed.days.length,
      nem12Validation: parsed.validationSummary,
      zone, zoneName:ZONE_NAMES[zone], fin, chartData, profiles:profRnd, missingSeasons:missingSeasons||[],
      gen, genPerKw, originalKw:kw, originalEff:eff, dataQuality:quality,
      estimatedDays:parsed.estimatedDays||0, substitutedDays:parsed.substitutedDays||0,
      monthlyProfiles: (() => {
        // Compact round for transfer — already rounded in buildProfiles
        return monthlyProfiles;
      })(),
      dataRange: profiles.dataRange,
    };
  } catch(e) {
    return { error: 'Analysis error: ' + e.message };
  }
}

// ───────────────────────────────────────────
// DRIVE FILE BROWSER
// ───────────────────────────────────────────