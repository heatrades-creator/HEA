// lib/annexes/open-solar.ts
// Annex: Open Solar Report
// Slug: open-solar  |  Drive: 02-proposals/
// Status: available
//
// Reads a PDF manually placed by an HEA admin in the job's 02-proposals/
// Drive subfolder. The file must contain "open-solar" in its name
// (standard naming: {JOB-ID}-annex-open-solar-{Client-Name}-{YYYY-MM-DD}.pdf).
//
// Workflow:
//   1. Admin designs the system in OpenSolar using Ada + the HEA templates.
//   2. Admin exports the proposal PDF from OpenSolar and places it in
//      the client's 02-proposals/ Drive folder with the correct filename.
//   3. This generator calls GAS getOpenSolarPdfBytes to fetch those bytes
//      directly — no pdf-lib work needed, the PDF is returned as-is.
//   4. Once a paid OpenSolar API plan is in place, replace the GAS fetch
//      with a direct API call and remove the manual upload step.

import { GASJob } from './_helpers'

export interface OpenSolarParams {
  job:                 GASJob
  openSolarProjectId?: number
  openSolarShareLink?: string
  date?:               string
}

export async function generateOpenSolarAnnex(params: OpenSolarParams): Promise<Uint8Array> {
  const gasUrl = process.env.JOBS_GAS_URL
  if (!gasUrl) throw new Error('JOBS_GAS_URL not configured')

  const raw = await fetch(
    `${gasUrl}?action=getOpenSolarPdfBytes&jobNumber=${encodeURIComponent(params.job.jobNumber)}`,
    { cache: 'no-store' }
  ).then((r) => r.text())

  let data: Record<string, unknown>
  try {
    data = JSON.parse(raw)
  } catch {
    throw new Error(`GAS returned invalid JSON for getOpenSolarPdfBytes: ${raw.slice(0, 200)}`)
  }

  if (data.error) {
    throw new Error(
      `OpenSolar PDF not ready for ${params.job.jobNumber}: ${data.error}. ` +
      'Export the PDF from OpenSolar and place it in the client\'s 02-proposals/ Drive folder ' +
      'with "open-solar" in the filename.'
    )
  }

  if (!data.bytes || typeof data.bytes !== 'string') {
    throw new Error('GAS getOpenSolarPdfBytes returned no bytes')
  }

  // Decode base64 → Uint8Array and return directly — no pdf-lib processing needed
  const binary = atob(data.bytes)
  const bytes  = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}
