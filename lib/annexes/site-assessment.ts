// lib/annexes/site-assessment.ts
// Annex: Site Assessment
// Slug: site-assessment  |  Drive: 06-jobfiles/
// Status: available
//
// Generates a structured site assessment PDF from GASJob data.
// All available intake fields are pre-filled. Fields not yet known are
// rendered as blank lines to be completed on-site or from satellite view.
//
// Usage:
//   const bytes = await generateSiteAssessmentAnnex({ job, intake?, date? })
//   // Merge into a base document: mergePdfs([baseBytes, ...annexBytes])

import { PDFDocument, StandardFonts } from 'pdf-lib'
import {
  GASJob, PdfFonts, A4,
  BLACK, DARK_GREY, MID_GREY, LIGHT_GREY, YELLOW_BG, rgb,
  hr, sectionLabel, fieldRow, pageHeader, pageFooter, wrapText,
} from './_helpers'

export interface SiteAssessmentParams {
  job: GASJob
  // Optional extra fields sourced from Prisma Lead or the intake form.
  // If absent, those rows render as blank fill-in lines.
  intake?: {
    roofMaterial?:    string
    roofOrientation?: string
    shadingIssues?:   string
    phases?:          string
    service?:         string
    goals?:           string
  }
  date?: string
}

export async function generateSiteAssessmentAnnex(
  params: SiteAssessmentParams
): Promise<Uint8Array> {
  const { job, intake = {}, date = new Date().toISOString().split('T')[0] } = params

  const doc   = await PDFDocument.create()
  const page  = doc.addPage([A4.width, A4.height])
  const bold  = await doc.embedFont(StandardFonts.HelveticaBold)
  const font  = await doc.embedFont(StandardFonts.Helvetica)
  const fonts: PdfFonts = { bold, font }

  const hasBattery  = parseFloat(job.batterySize) > 0
  const serviceDesc = intake.service
    ?? (hasBattery
      ? `Solar ${job.systemSize} kW + Battery ${job.batterySize} kWh`
      : `Solar ${job.systemSize} kW`)

  let y = pageHeader(
    page,
    'Site Assessment',
    `${job.jobNumber}  ·  ${job.clientName}  ·  ${job.address}`,
    fonts
  )

  // ── Client details ──────────────────────────────────────────────────────────
  sectionLabel(page, 'CLIENT DETAILS', y, bold); y -= 14
  const clientRows: [string, string][] = [
    ['Job number',       job.jobNumber],
    ['Client',           job.clientName],
    ['Phone',            job.phone],
    ['Email',            job.email],
    ['Address',          job.address],
    ['Postcode',         job.postcode],
    ['Created',          job.createdDate],
    ['Service interest', serviceDesc],
  ]
  for (const [lbl, val] of clientRows) {
    fieldRow(page, lbl, val, y, bold, font); y -= 14
  }
  y -= 4; hr(page, y); y -= 14

  // ── System preference ───────────────────────────────────────────────────────
  sectionLabel(page, 'SYSTEM PREFERENCE (CLIENT INDICATED)', y, bold); y -= 12
  const boxH = 48
  page.drawRectangle({
    x: 56, y: y - boxH + 12, width: A4.width - 112, height: boxH,
    color: YELLOW_BG, borderColor: LIGHT_GREY, borderWidth: 1,
  })
  page.drawText('Solar array:', { x: 68, y: y - 4, font: bold, size: 10, color: BLACK })
  page.drawText(
    job.systemSize ? `${job.systemSize} kW` : 'No preference — to be advised',
    { x: 165, y: y - 4, font, size: 10, color: DARK_GREY }
  )
  page.drawText('Battery:', { x: 68, y: y - 18, font: bold, size: 10, color: BLACK })
  page.drawText(
    hasBattery ? `${job.batterySize} kWh` : 'No battery selected',
    { x: 165, y: y - 18, font, size: 10, color: DARK_GREY }
  )
  y -= boxH + 8
  hr(page, y); y -= 14

  // ── Roof & property ─────────────────────────────────────────────────────────
  sectionLabel(page, 'ROOF & PROPERTY — COMPLETE FROM SATELLITE OR ON SITE', y, bold); y -= 14

  const satelUrl = `google.com/maps/search/${encodeURIComponent(job.address)}/@?data=!3m1!1e3`
  const roofRows: [string, string | undefined][] = [
    ['Roof material',          intake.roofMaterial],
    ['Main orientation',       intake.roofOrientation],
    ['Shading conditions',     intake.shadingIssues],
    ['Roof pitch (estimate)',   undefined],
    ['Accessible roof areas',  undefined],
    ['Obstructions / trees',   undefined],
    ['Satellite view',         satelUrl],
  ]
  for (const [lbl, val] of roofRows) {
    fieldRow(page, lbl, val, y, bold, font); y -= 15
  }
  y -= 4; hr(page, y); y -= 14

  // ── Grid connection ─────────────────────────────────────────────────────────
  sectionLabel(page, 'GRID CONNECTION', y, bold); y -= 14
  const gridRows: [string, string | undefined][] = [
    ['Phase supply',            intake.phases],
    ['Meter location',          undefined],
    ['Switchboard location',    undefined],
    ['Switchboard capacity',    undefined],
    ['Available spare circuits',undefined],
    ['NMI number',              undefined],
    ['Finance required',        job.financeRequired ? 'Yes' : 'No'],
  ]
  for (const [lbl, val] of gridRows) {
    fieldRow(page, lbl, val, y, bold, font); y -= 15
  }
  y -= 4; hr(page, y); y -= 14

  // ── Household profile ───────────────────────────────────────────────────────
  sectionLabel(page, 'HOUSEHOLD PROFILE', y, bold); y -= 14
  const hhRows: [string, string][] = [
    ['Occupants',    job.occupants    || '—'],
    ['Home daytime', job.homeDaytime  || '—'],
    ['Hot water',    job.hotWater     || '—'],
    ['Gas appliances',job.gasAppliances|| '—'],
    ['EV / planning',job.ev           || '—'],
  ]
  for (const [lbl, val] of hhRows) {
    fieldRow(page, lbl, val, y, bold, font); y -= 14
  }

  // ── Battery / EPS config ────────────────────────────────────────────────────
  if (hasBattery) {
    y -= 4; hr(page, y); y -= 14
    sectionLabel(page, 'BATTERY & EPS CONFIGURATION', y, bold); y -= 14
    const batRows: [string, string | undefined][] = [
      ['Wi-Fi SSID',   job.wifiSsid    || undefined],
      ['Wi-Fi password',job.wifiPassword|| undefined],
      ['EPS circuit 1',job.epsCircuit1 || undefined],
      ['EPS circuit 2',job.epsCircuit2 || undefined],
      ['EPS circuit 3',job.epsCircuit3 || undefined],
    ]
    for (const [lbl, val] of batRows) {
      fieldRow(page, lbl, val, y, bold, font); y -= 14
    }
  }

  // ── Client goals ────────────────────────────────────────────────────────────
  if (intake.goals) {
    y -= 4; hr(page, y); y -= 14
    sectionLabel(page, 'CLIENT GOALS', y, bold); y -= 14
    y = wrapText(page, intake.goals, 56, y, A4.width - 112, 10, font, DARK_GREY)
  }

  // ── Site notes box (blank, fill on site) ────────────────────────────────────
  if (y > 120) {
    y -= 4; hr(page, y); y -= 14
    sectionLabel(page, 'SITE NOTES', y, bold); y -= 12
    const notesH = Math.min(y - 60, 80)
    page.drawRectangle({
      x: 56, y: y - notesH, width: A4.width - 112, height: notesH,
      color: rgb(0.98, 0.98, 0.97), borderColor: LIGHT_GREY, borderWidth: 1,
    })
  }

  pageFooter(page, font, date)
  return doc.save()
}
