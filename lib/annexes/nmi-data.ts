// lib/annexes/nmi-data.ts
// Annex: NMI & Grid Data
// Slug: nmi-data  |  Drive: 00-nmi-data/
// Status: planned
//
// ══════════════════════════════════════════════════════════════════════════════
// WHAT THIS GENERATES
// ══════════════════════════════════════════════════════════════════════════════
// A structured summary of the National Metering Identifier and grid connection:
//   • NMI number (10–11 digit)
//   • DNSP name (Powercor / CitiPower / AusNet / Jemena / United Energy)
//   • Retail tariff name and import rate ($/kWh)
//   • Feed-in tariff rate ($/kWh)
//   • Historical annual consumption (kWh/yr) from NEM12 data
//   • Average daily consumption (kWh/day)
//   • Peak vs off-peak split (% of load)
//   • NEM12 data quality: days accepted, channel used
//   • Connection type (single / three phase)
//   • Demand charges (if applicable)
//
// ══════════════════════════════════════════════════════════════════════════════
// DATA SOURCES — TWO PATHS
// ══════════════════════════════════════════════════════════════════════════════
//
// PATH A — NEM12 data via HEA Solar Analyser (most complete):
//   The HEA SA fetches NEM12 interval data from the Powercor platform and runs
//   an analysis. The nem12Validation object is part of engineSummary:
//     { chosen_channel, days_accepted, nmi, tariff, dnsp,
//       annualKwh, avgDailyKwh, peakPct, offpeakPct, ... }
//   See HEA SA/AnalysisEngine.gs — runAnalysis() and nem12Validate_() for
//   the full data shape. The SA saves its JSON output to 00-nmi-data/.
//
// PATH B — Prisma Lead.nmiNumber (partial data only):
//   Lead.nmiNumber stores the 10–11 digit NMI collected at intake.
//   Lead.nmiConsentAt stores when the client consented to data access.
//   The NMI alone is insufficient for this annex — you need the consumption
//   data too (from Powercor via the SA).
//
// ══════════════════════════════════════════════════════════════════════════════
// RECOMMENDED IMPLEMENTATION
// ══════════════════════════════════════════════════════════════════════════════
//
// STEP 1 — Add a GAS action to GAS/HEAJobsAPI.gs to read NEM12 JSON from Drive:
//
//   if (action === 'getNMIData' && jobNumber) {
//     return jsonResponse(getNMIData_(jobNumber))
//   }
//
//   function getNMIData_(jobNumber) {
//     const folder = getJobSubfolder_(jobNumber, '00-nmi-data')
//     if (!folder) return { found: false, reason: 'no 00-nmi-data folder' }
//     const files = folder.getFiles()
//     while (files.hasNext()) {
//       const f = files.next()
//       if (f.getMimeType() === 'application/json') {
//         try {
//           const data = JSON.parse(f.getBlob().getDataAsString())
//           return { found: true, data, fileName: f.getName() }
//         } catch(e) {
//           return { found: false, reason: 'JSON parse error: ' + e.message }
//         }
//       }
//     }
//     return { found: false, reason: 'no JSON file in 00-nmi-data/' }
//   }
//
// STEP 2 — In this generator, fetch the NMI data and pass to the PDF builder:
//
//   const res  = await fetch(`${process.env.JOBS_GAS_URL}?action=getNMIData&jobNumber=${job.jobNumber}`)
//   const text = await res.text()
//   const gas  = JSON.parse(text)
//   if (!gas.found) throw new Error(gas.reason)
//
//   const nmiData: NMIData = {
//     nmiNumber:     gas.data.nmi,
//     dnsp:          gas.data.dnsp,
//     tariffName:    gas.data.tariff,
//     annualKwh:     gas.data.annualKwh,
//     avgDailyKwh:   gas.data.avgDailyKwh,
//     peakPct:       gas.data.peakPct,
//     offpeakPct:    gas.data.offpeakPct,
//     daysAccepted:  gas.data.nem12Validation?.days_accepted,
//     chosenChannel: gas.data.nem12Validation?.chosen_channel,
//   }
//
//   // Then build the PDF from nmiData (replacing this throw with a pdf-lib generator
//   // following the same pattern as generateSiteAssessmentAnnex).
//
// STEP 3 — Build the PDF (pdf-lib pattern, same as site-assessment.ts):
//   Use fieldRow() to render each NMI field. Show data quality info
//   (days accepted, channel) in a small grey box at the bottom.
//
// ══════════════════════════════════════════════════════════════════════════════
// DOCUMENT STACK MEMBERSHIP
// ══════════════════════════════════════════════════════════════════════════════
// job-card:                  defaultEnabled true
// electrical-works-proposal: defaultEnabled false
// wholesale-order:           defaultEnabled false
// work-order:                defaultEnabled false
// completion-report:         defaultEnabled false
// finance-pack:              defaultEnabled false
// grid-connection:           defaultEnabled true
//
// ══════════════════════════════════════════════════════════════════════════════

import { GASJob } from './_helpers'

export interface NMIData {
  nmiNumber?:      string
  dnsp?:           string
  tariffName?:     string
  importRateKwh?:  number
  feedInRateKwh?:  number
  annualKwh?:      number
  avgDailyKwh?:    number
  peakPct?:        number
  offpeakPct?:     number
  daysAccepted?:   number
  chosenChannel?:  string
  phases?:         string
}

export interface NMIDataParams {
  job:      GASJob
  nmiData?: NMIData
  date?:    string
}

export async function generateNMIDataAnnex(_params: NMIDataParams): Promise<Uint8Array> {
  throw new Error(
    'nmi-data annex not yet implemented. ' +
    'See the breadcrumb in lib/annexes/nmi-data.ts. ' +
    'Key steps: add ?action=getNMIData to GAS/HEAJobsAPI.gs to read NEM12 JSON ' +
    'from 00-nmi-data/ in the client Drive folder, ' +
    'then build the PDF with pdf-lib using the NMIData object.'
  )
}
