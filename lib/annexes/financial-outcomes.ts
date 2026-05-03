// lib/annexes/financial-outcomes.ts
// Annex: Financial Outcomes
// Slug: financial-outcomes  |  Drive: 02-proposals/
// Status: available
//
// Generates a financial analysis PDF from GASJob data.
// Uses published VIC benchmarks — all assumptions documented and shown in the footer.
//
// Default assumptions (all overridable via FinancialAssumptions):
//   Generation:        1,350 kWh/kW/yr  (BOM VIC metro average)
//   Self-consumption:  35%              (residential, daytime occupancy)
//   Retail tariff:     $0.28/kWh        (VIC general usage, 2024)
//   Feed-in tariff:    $0.05/kWh        (VIC minimum guaranteed rate)
//   Tariff escalation: 3%/yr            (AER CPI + network allowance)
//   Panel degradation: 0.5%/yr          (IEC 61215 linear degradation)
//   CO₂ factor:        0.81 kg/kWh      (DCCEE VIC grid 2023)
//   Analysis period:   25 years
//
// Usage:
//   const bytes = await generateFinancialOutcomesAnnex({ job, assumptions?, date? })

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import {
  GASJob, PdfFonts, A4,
  BLACK, DARK_GREY, MID_GREY, LIGHT_GREY, NAVY, GREEN, GREEN_FILL, GREEN_BDR,
  hr, sectionLabel, pageHeader, pageFooter, wrapText,
  parseAmount, parseKw, fmtMoney, fmtKwh,
} from './_helpers'

export interface FinancialAssumptions {
  generationPerKw?:  number   // kWh/kW/yr
  selfConsumption?:  number   // fraction 0–1
  retailTariff?:     number   // $/kWh
  feedInTariff?:     number   // $/kWh
  tariffEscalation?: number   // fraction/yr
  degradation?:      number   // fraction/yr
  co2Factor?:        number   // kg/kWh
  analysisYears?:    number
}

export interface FinancialOutcomesParams {
  job:          GASJob
  assumptions?: FinancialAssumptions
  date?:        string
}

type CalcResult = {
  sizeKw:           number
  costAud:          number
  billAud:          number
  annualGenKwh:     number
  importSavings:    number
  fitIncome:        number
  year1Savings:     number
  billReductPct:    number
  simplePayback:    number
  carbonPerYr:      number
  carsEquiv:        number
  total25yr:        number
  table:            { year: number; genKwh: number; savings: number; cumulative: number }[]
  a:                Required<FinancialAssumptions>
}

function runCalc(job: GASJob, a: Required<FinancialAssumptions>): CalcResult {
  const sizeKw  = parseKw(job.systemSize)
  const costAud = parseAmount(job.totalPrice)
  const billAud = parseAmount(job.annualBill)

  const annualGenKwh  = sizeKw * a.generationPerKw
  const selfConsKwh   = annualGenKwh * a.selfConsumption
  const exportKwh     = annualGenKwh * (1 - a.selfConsumption)
  const importSavings = selfConsKwh  * a.retailTariff
  const fitIncome     = exportKwh    * a.feedInTariff
  const year1Savings  = importSavings + fitIncome
  const billReductPct = billAud > 0 ? (year1Savings / billAud) * 100 : 0
  const simplePayback = year1Savings > 0 ? costAud / year1Savings : 999
  const carbonPerYr   = (annualGenKwh * a.co2Factor) / 1000
  const carsEquiv     = Math.round(carbonPerYr * 1000 / 2300) // avg car 2.3t CO₂/yr

  const table: CalcResult['table'] = []
  let cumulative = 0
  for (let yr = 1; yr <= a.analysisYears; yr++) {
    const gen = annualGenKwh * Math.pow(1 - a.degradation, yr - 1)
    const tar = a.retailTariff * Math.pow(1 + a.tariffEscalation, yr - 1)
    const fit = a.feedInTariff * Math.pow(1 + a.tariffEscalation * 0.5, yr - 1)
    const sav = gen * a.selfConsumption * tar + gen * (1 - a.selfConsumption) * fit
    cumulative += sav
    table.push({ year: yr, genKwh: gen, savings: sav, cumulative })
  }

  return {
    sizeKw, costAud, billAud,
    annualGenKwh, importSavings, fitIncome,
    year1Savings, billReductPct, simplePayback,
    carbonPerYr, carsEquiv,
    total25yr: cumulative,
    table, a,
  }
}

export async function generateFinancialOutcomesAnnex(
  params: FinancialOutcomesParams
): Promise<Uint8Array> {
  const { job, assumptions = {}, date = new Date().toISOString().split('T')[0] } = params

  const a: Required<FinancialAssumptions> = {
    generationPerKw:  assumptions.generationPerKw  ?? 1350,
    selfConsumption:  assumptions.selfConsumption  ?? 0.35,
    retailTariff:     assumptions.retailTariff     ?? 0.28,
    feedInTariff:     assumptions.feedInTariff     ?? 0.05,
    tariffEscalation: assumptions.tariffEscalation ?? 0.03,
    degradation:      assumptions.degradation      ?? 0.005,
    co2Factor:        assumptions.co2Factor        ?? 0.81,
    analysisYears:    assumptions.analysisYears    ?? 25,
  }

  const r = runCalc(job, a)

  const doc   = await PDFDocument.create()
  const page  = doc.addPage([A4.width, A4.height])
  const bold  = await doc.embedFont(StandardFonts.HelveticaBold)
  const font  = await doc.embedFont(StandardFonts.Helvetica)
  const fonts: PdfFonts = { bold, font }

  let y = pageHeader(
    page,
    'Financial Outcomes',
    `${job.jobNumber}  ·  ${job.clientName}  ·  ${job.address}`,
    fonts
  )

  // ── System overview ─────────────────────────────────────────────────────────
  sectionLabel(page, 'SYSTEM OVERVIEW', y, bold); y -= 14
  const hasBattery = parseFloat(job.batterySize) > 0
  const overviewRows: [string, string][] = [
    ['System size',           `${r.sizeKw} kW solar`],
    ['Battery',               hasBattery ? `${job.batterySize} kWh` : 'No battery'],
    ['Annual electricity bill',r.billAud > 0 ? fmtMoney(r.billAud) + '/yr' : '— (not provided)'],
    ['System investment',      r.costAud > 0 ? fmtMoney(r.costAud) : '— (not finalised)'],
  ]
  for (const [lbl, val] of overviewRows) {
    page.drawText(`${lbl}:`, { x: 56, y, font: bold, size: 10, color: BLACK })
    page.drawText(val, { x: 190, y, font, size: 10, color: DARK_GREY })
    y -= 14
  }
  y -= 6; hr(page, y); y -= 14

  // ── Year 1 highlight box ────────────────────────────────────────────────────
  sectionLabel(page, 'YEAR 1 PROJECTIONS', y, bold); y -= 12
  const boxH = 94
  page.drawRectangle({
    x: 56, y: y - boxH + 12, width: A4.width - 112, height: boxH,
    color: GREEN_FILL, borderColor: GREEN_BDR, borderWidth: 1,
  })
  const highlights: [string, string, boolean][] = [
    ['Annual generation',              fmtKwh(r.annualGenKwh),                  false],
    ['Import savings (self-consumed)', fmtMoney(r.importSavings) + '/yr',       false],
    ['Feed-in tariff income',          fmtMoney(r.fitIncome) + '/yr',           false],
    ['Total Year 1 benefit',           fmtMoney(r.year1Savings) + '/yr',        true ],
    ['Bill reduction',                 `${r.billReductPct.toFixed(0)}%`,        true ],
    ['Estimated payback',              r.simplePayback < 50
                                        ? `${r.simplePayback.toFixed(1)} years`
                                        : 'Beyond analysis period',            false],
  ]
  let hy = y - 8
  for (const [lbl, val, isBold] of highlights) {
    page.drawText(`${lbl}:`, { x: 68, y: hy, font: bold, size: 10, color: GREEN })
    page.drawText(val, { x: 310, y: hy, font: isBold ? bold : font, size: 10, color: BLACK })
    hy -= 14
  }
  y -= boxH + 10; hr(page, y); y -= 14

  // ── 10-year savings table ───────────────────────────────────────────────────
  sectionLabel(page, '10-YEAR SAVINGS OUTLOOK', y, bold); y -= 12

  const COL = [56, 112, 220, 330, 430]
  const HDR = ['Yr', 'Generation', 'Annual Savings', 'Cumulative', '']
  HDR.forEach((h, i) => {
    page.drawText(h, { x: COL[i], y, font: bold, size: 8, color: MID_GREY })
  })
  y -= 4; hr(page, y, 56, A4.width - 56); y -= 8

  for (let i = 0; i < 10; i++) {
    const tr = r.table[i]
    if (!tr) break
    const shade = i % 2 === 0 ? rgb(0.97, 0.97, 0.97) : rgb(1, 1, 1)
    page.drawRectangle({ x: 56, y: y - 2, width: A4.width - 112, height: 14, color: shade })
    // Highlight the payback year in green
    const isPaybackYr = r.simplePayback >= tr.year - 1 && r.simplePayback < tr.year
    const rowColor = isPaybackYr ? GREEN : DARK_GREY
    page.drawText(String(tr.year), { x: COL[0], y, font, size: 9, color: rowColor })
    page.drawText(fmtKwh(tr.genKwh), { x: COL[1], y, font, size: 9, color: rowColor })
    page.drawText(fmtMoney(tr.savings), { x: COL[2], y, font, size: 9, color: rowColor })
    page.drawText(fmtMoney(tr.cumulative), {
      x: COL[3], y,
      font: isPaybackYr ? bold : font,
      size: 9, color: rowColor,
    })
    if (isPaybackYr) {
      page.drawText('← payback', { x: COL[4], y, font, size: 7, color: GREEN })
    }
    y -= 14
  }
  y -= 6; hr(page, y); y -= 12

  // ── 25-year summary ─────────────────────────────────────────────────────────
  page.drawText('25-year total benefit:', { x: 56, y, font: bold, size: 11, color: BLACK })
  page.drawText(fmtMoney(r.total25yr), { x: 210, y, font: bold, size: 11, color: NAVY })
  y -= 18; hr(page, y); y -= 14

  // ── Environmental impact ────────────────────────────────────────────────────
  sectionLabel(page, 'ENVIRONMENTAL IMPACT', y, bold); y -= 14
  const envRows: [string, string][] = [
    ['Annual carbon offset',  `${r.carbonPerYr.toFixed(1)} tonnes CO₂-e/yr`],
    ['Equivalent to',         `${r.carsEquiv} petrol cars removed from the road per year`],
    ['25-year carbon offset', `${(r.carbonPerYr * 25).toFixed(0)} tonnes CO₂-e total`],
  ]
  for (const [lbl, val] of envRows) {
    page.drawText(`${lbl}:`, { x: 56, y, font: bold, size: 10, color: BLACK })
    page.drawText(val, { x: 210, y, font, size: 10, color: DARK_GREY })
    y -= 14
  }
  y -= 6; hr(page, y); y -= 10

  // ── Assumptions box ─────────────────────────────────────────────────────────
  if (y > 80) {
    const assumpH = Math.min(y - 55, 68)
    page.drawRectangle({
      x: 56, y: y - assumpH, width: A4.width - 112, height: assumpH,
      color: rgb(0.98, 0.98, 0.97), borderColor: LIGHT_GREY, borderWidth: 1,
    })
    page.drawText('Calculation assumptions', { x: 64, y: y - 8, font: bold, size: 8, color: MID_GREY })
    const lines = [
      `Generation: ${a.generationPerKw.toLocaleString()} kWh/kW/yr (BOM VIC avg)  ·  Self-consumption: ${(a.selfConsumption * 100).toFixed(0)}%  ·  Retail: $${a.retailTariff.toFixed(2)}/kWh  ·  FiT: $${a.feedInTariff.toFixed(2)}/kWh`,
      `Tariff escalation: ${(a.tariffEscalation * 100).toFixed(0)}%/yr  ·  Panel degradation: ${(a.degradation * 100).toFixed(1)}%/yr  ·  CO₂: ${a.co2Factor} kg/kWh (DCCEE VIC 2023)  ·  Period: ${a.analysisYears} yrs`,
      'These projections are estimates based on the assumptions above. Actual results depend on system performance, weather, tariff changes, and occupancy. Not financial advice.',
    ]
    let ay = y - 20
    for (const line of lines) {
      ay = wrapText(page, line, 64, ay, A4.width - 128, 7, font, MID_GREY, 10)
    }
  }

  pageFooter(page, font, date)
  return doc.save()
}
