// lib/annexes/hea-sa.ts
// Annex: HEA Solar Analysis
// Slug: hea-sa  |  Drive: 01-quotes/
// Status: planned
//
// ══════════════════════════════════════════════════════════════════════════════
// WHAT THIS GENERATES
// ══════════════════════════════════════════════════════════════════════════════
// A PDF of the HEA Solar Analysis output. This is the most rigorous financial
// model in the document stack — it uses actual NEM12 interval consumption data
// rather than the rule-of-thumb estimates in financial-outcomes.ts.
//
// Contents:
//   • System sizing and yield estimates (zone-adjusted, BOM irradiance)
//   • Year 1 bill model (NEM12-derived load profile × generation profile)
//   • Finance summary: NPV, IRR, MIRR, undiscounted + discounted payback
//   • 25-year cashflow table (tariff escalation, degradation, replacements)
//   • Calculation assumptions table
//   • Important notes and exclusions
//
// ══════════════════════════════════════════════════════════════════════════════
// DATA SOURCE
// ══════════════════════════════════════════════════════════════════════════════
// The HEA Solar Analyser (HEA SA) GAS app at HEA SA/ already generates a
// complete HTML-to-PDF report via PDFBuilder.gs and PDFSections.gs.
// The engineSummary shape is produced by runAnalysis() in AnalysisEngine.gs:
//   { NPV, IRR, MIRR, undis_frac, dis_frac, year1_ncf, cash_deposit,
//     ann_cf_pos_yr, loan_finish_yr, inv_repl_yr, assumptions,
//     nem12Validation: { chosen_channel, days_accepted } }
//
// The SA report PDF is saved to 01-quotes/ in the client's Drive folder
// via sendSignedQuote() → PDFBuilder.buildReportHTML() → Drive.createFile().
// Filename pattern: {QUOTE-NO}_SA-Report_{ClientName}_{Date}.pdf
//   (note: legacy naming — pre-dates TS00001 job ID format)
//
// ══════════════════════════════════════════════════════════════════════════════
// RECOMMENDED IMPLEMENTATION — OPTION A (least work, highest fidelity)
// ══════════════════════════════════════════════════════════════════════════════
// The SA already produces its own PDF. Fetch it directly from Drive rather
// than rebuilding it — zero duplication and the output is already polished.
//
//   STEP 1 — Add to GAS/HEAJobsAPI.gs:
//
//     if (action === 'getSAReportPdf' && jobNumber) {
//       const folder = getJobSubfolder_(jobNumber, '01-quotes')
//       if (!folder) return jsonResponse({ found: false, reason: 'no 01-quotes folder' })
//       const files = folder.getFiles()
//       while (files.hasNext()) {
//         const f = files.next()
//         const n = f.getName()
//         // SA saves as "{QuoteNo}_SA-Report_..." or "annex-hea-sa-..."
//         if (/SA[-_]Report|annex-hea-sa/i.test(n) && n.endsWith('.pdf')) {
//           const b64 = Utilities.base64Encode(f.getBlob().getBytes())
//           return jsonResponse({ found: true, b64, name: n })
//         }
//       }
//       return jsonResponse({ found: false, reason: 'SA report PDF not in 01-quotes/' })
//     }
//
//   STEP 2 — In this generator, fetch and return the raw bytes:
//
//     const res  = await fetch(`${process.env.JOBS_GAS_URL}?action=getSAReportPdf&jobNumber=${job.jobNumber}`)
//     const text = await res.text()
//     const data = JSON.parse(text)
//     if (data.error || !data.found) throw new Error(data.reason ?? 'SA report not found')
//     return Uint8Array.from(atob(data.b64), c => c.charCodeAt(0))
//
//   STEP 3 — Wire into mergePdfs() as normal. No pdf-lib work needed.
//
// ══════════════════════════════════════════════════════════════════════════════
// OPTION B — Rebuild with pdf-lib (more work, visual consistency)
// ══════════════════════════════════════════════════════════════════════════════
// Add ?action=getSAJson&jobNumber=X to the HEA SA GAS script to return
// the engineSummary JSON. Then rebuild the report using pdf-lib, using
// pdfFinanceSummary(), pdfAssumptionBlock(), and pdfRisksBlock() in
// HEA SA/PDFSections.gs as the reference for what to render.
// This requires a complete structural rewrite of the SA GAS into TypeScript
// pdf-lib calls — significant work, but produces a uniform document stack.
//
// ══════════════════════════════════════════════════════════════════════════════
// DOCUMENT STACK MEMBERSHIP
// ══════════════════════════════════════════════════════════════════════════════
// job-card:                  defaultEnabled true
// electrical-works-proposal: defaultEnabled true
// wholesale-order:           defaultEnabled false
// work-order:                defaultEnabled false
// completion-report:         defaultEnabled false
// finance-pack:              defaultEnabled true
// grid-connection:           defaultEnabled false
//
// ══════════════════════════════════════════════════════════════════════════════

import { GASJob } from './_helpers'

export interface HEASAParams {
  job:   GASJob
  date?: string
}

export async function generateHEASAAnnex(_params: HEASAParams): Promise<Uint8Array> {
  throw new Error(
    'hea-sa annex not yet implemented. ' +
    'See the breadcrumb in lib/annexes/hea-sa.ts. ' +
    'Recommended: add ?action=getSAReportPdf to GAS/HEAJobsAPI.gs, ' +
    'fetch the PDF bytes from 01-quotes/ in the client Drive folder, and return them directly.'
  )
}
