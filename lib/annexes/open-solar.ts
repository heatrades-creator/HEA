// lib/annexes/open-solar.ts
// Annex: Open Solar Report
// Slug: open-solar  |  Drive: 02-proposals/
// Status: planned
//
// ══════════════════════════════════════════════════════════════════════════════
// WHAT THIS GENERATES
// ══════════════════════════════════════════════════════════════════════════════
// A PDF export of the OpenSolar proposal report for this job:
//   • Shading analysis and satellite irradiance map
//   • Annual AC production estimate (kWh/yr)
//   • Monthly production breakdown chart
//   • System layout diagram
//   • Performance ratio and yield metrics
//   • OpenSolar project reference and share link
//
// ══════════════════════════════════════════════════════════════════════════════
// DATA SOURCE
// ══════════════════════════════════════════════════════════════════════════════
// OpenSolar is a third-party solar design platform. Jobs are linked via:
//   prisma Lead.openSolarProjectId   (Int)   — set when Alexis confirms the lead
//   prisma Lead.openSolarShareLink    (String) — public proposal URL
//   prisma Lead.openSolarOutputKwh    (Float)  — annual AC output
//   prisma Lead.openSolarSystemKw     (Float)  — system size
//
// The openSolarProjectId is set in /admin/leads when an admin clicks Confirm.
// Look at the confirm API route at app/api/admin/ to see how it's stored.
//
// To connect the job sheet to OpenSolar data, look up Lead by gasJobNumber:
//   const lead = await db.lead.findFirst({ where: { gasJobNumber: job.jobNumber } })
//
// ══════════════════════════════════════════════════════════════════════════════
// RECOMMENDED IMPLEMENTATION
// ══════════════════════════════════════════════════════════════════════════════
//
// STEP 1 — Check if OpenSolar has a PDF export endpoint.
//   OpenSolar API docs are at https://app.opensolar.com/api-documentation
//   Look for:
//     GET /api/orgs/{org_id}/proposals/{proposal_id}/download/
//     GET /api/orgs/{org_id}/projects/{project_id}/proposal-pdf/
//   If it exists, authenticate with the OpenSolar API token (check if one is
//   stored in Vercel env vars — look for OPENSOLAR_TOKEN or similar).
//
// STEP 2 — Add a Next.js API route at:
//   app/api/dashboard/jobs/[jobNumber]/opensolar-pdf/route.ts
//
//   This route:
//     a) Queries Prisma: Lead.findFirst({ where: { gasJobNumber: jobNumber } })
//     b) Calls the OpenSolar API with lead.openSolarProjectId
//     c) Streams or returns the PDF bytes
//
// STEP 3 — In this generator, call that route and return the bytes:
//
//   const res = await fetch(`/api/dashboard/jobs/${job.jobNumber}/opensolar-pdf`)
//   if (!res.ok) throw new Error(`OpenSolar PDF not available: ${res.statusText}`)
//   const bytes = new Uint8Array(await res.arrayBuffer())
//   return bytes   // pass directly to mergePdfs() — no pdf-lib work needed
//
// FALLBACK — if OpenSolar has no PDF export endpoint:
//   Option A: Use Playwright/Browserless to screenshot the share URL (openSolarShareLink).
//             This adds a browser-based screenshot service to the stack — not serverless-safe.
//             Consider running it as a separate worker or using a paid service (Browserless.io).
//   Option B: Pull the structured data from OpenSolar's API and rebuild it
//             with pdf-lib. The data you need: system design, shading analysis,
//             monthly production array, performance metrics.
//
// ══════════════════════════════════════════════════════════════════════════════
// DOCUMENT STACK MEMBERSHIP
// ══════════════════════════════════════════════════════════════════════════════
// job-card:                  defaultEnabled false
// electrical-works-proposal: defaultEnabled true
// wholesale-order:           defaultEnabled false
// work-order:                defaultEnabled false
// completion-report:         defaultEnabled false
// finance-pack:              defaultEnabled false
// grid-connection:           defaultEnabled false
//
// ══════════════════════════════════════════════════════════════════════════════

import { GASJob } from './_helpers'

export interface OpenSolarParams {
  job:                   GASJob
  openSolarProjectId?:   number
  openSolarShareLink?:   string
  date?:                 string
}

export async function generateOpenSolarAnnex(_params: OpenSolarParams): Promise<Uint8Array> {
  throw new Error(
    'open-solar annex not yet implemented. ' +
    'See the breadcrumb in lib/annexes/open-solar.ts. ' +
    'Key steps: check OpenSolar API for a PDF export endpoint, ' +
    'look up openSolarProjectId from Prisma Lead by gasJobNumber, ' +
    'then fetch and return the PDF bytes directly.'
  )
}
