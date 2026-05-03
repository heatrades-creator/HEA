// lib/annexes/system-spec.ts
// Annex: System Specification
// Slug: system-spec  |  Drive: 01-quotes/
// Status: available (partial — equipment fields are blank lines until job data is expanded)
//
// Pre-fills: job number, system size, battery capacity, EPS circuits, Wi-Fi credentials.
// Blank lines: panel make/model/count, inverter make/model, battery model, cable run.
//
// EXPANDING THIS ANNEX (breadcrumb for future AI):
//   When the GAS jobs sheet has columns for equipment detail, add them to the GASJob
//   type in lib/annexes/_helpers.ts and expose them via HEAJobsAPI.gs getJobs_.
//   Then pass them in via the SystemSpecDetail object — the PDF will auto-populate.
//   Fields to add to GAS sheet: PanelMake, PanelModel, PanelWatts, InverterMake,
//   InverterModel, BatteryMake, BatteryModel, MountingType, CableRunM.
//
// Usage:
//   const bytes = await generateSystemSpecAnnex({ job, detail?, date? })

import { PDFDocument, StandardFonts } from 'pdf-lib'
import {
  GASJob, PdfFonts, A4,
  BLACK, DARK_GREY, MID_GREY, LIGHT_GREY,
  hr, sectionLabel, fieldRow, pageHeader, pageFooter,
} from './_helpers'

export interface SystemSpecDetail {
  panelMake?:          string
  panelModel?:         string
  panelWatts?:         number
  panelCount?:         number
  inverterType?:       string  // 'string' | 'microinverter' | 'hybrid'
  inverterMake?:       string
  inverterModel?:      string
  inverterKw?:         number
  batteryMake?:        string
  batteryModel?:       string
  batteryUsableKwh?:   number
  evChargerMake?:      string
  evChargerModel?:     string
  evChargerKw?:        number
  roofType?:           string
  mountingType?:       string
  cableRunMetres?:     number
}

export interface SystemSpecParams {
  job:     GASJob
  detail?: SystemSpecDetail
  date?:   string
}

export async function generateSystemSpecAnnex(
  params: SystemSpecParams
): Promise<Uint8Array> {
  const { job, detail = {}, date = new Date().toISOString().split('T')[0] } = params

  const doc   = await PDFDocument.create()
  const page  = doc.addPage([A4.width, A4.height])
  const bold  = await doc.embedFont(StandardFonts.HelveticaBold)
  const font  = await doc.embedFont(StandardFonts.Helvetica)
  const fonts: PdfFonts = { bold, font }

  const sizeKw     = parseFloat(job.systemSize) || 0
  const hasBattery = parseFloat(job.batterySize) > 0
  const hasEv      = job.ev && !job.ev.toLowerCase().startsWith('no')

  // Derive panel count from system size + panel wattage if known
  const panelCount = detail.panelCount
    ?? (detail.panelWatts && sizeKw
      ? Math.ceil((sizeKw * 1000) / detail.panelWatts)
      : undefined)

  let y = pageHeader(
    page,
    'System Specification',
    `${job.jobNumber}  ·  ${job.clientName}  ·  ${job.address}`,
    fonts
  )

  // ── Job ─────────────────────────────────────────────────────────────────────
  sectionLabel(page, 'JOB', y, bold); y -= 14
  const jobRows: [string, string][] = [
    ['Job number', job.jobNumber],
    ['Client',     job.clientName],
    ['Address',    `${job.address}${job.postcode ? ', ' + job.postcode : ''}`],
    ['Date',       date],
    ['Status',     job.status],
  ]
  for (const [lbl, val] of jobRows) {
    fieldRow(page, lbl, val, y, bold, font); y -= 14
  }
  y -= 4; hr(page, y); y -= 14

  // ── Solar array ─────────────────────────────────────────────────────────────
  sectionLabel(page, 'SOLAR ARRAY', y, bold); y -= 14
  const solarRows: [string, string | undefined][] = [
    ['System size',       `${sizeKw} kW DC`],
    ['Panel manufacturer',detail.panelMake],
    ['Panel model',       detail.panelModel],
    ['Panel wattage',     detail.panelWatts ? `${detail.panelWatts} W` : undefined],
    ['Panel count',       panelCount ? `${panelCount} panels` : undefined],
  ]
  for (const [lbl, val] of solarRows) {
    fieldRow(page, lbl, val, y, bold, font); y -= 15
  }
  y -= 4; hr(page, y); y -= 14

  // ── Inverter ─────────────────────────────────────────────────────────────────
  sectionLabel(page, 'INVERTER', y, bold); y -= 14
  const invRows: [string, string | undefined][] = [
    ['Type',         detail.inverterType],
    ['Manufacturer', detail.inverterMake],
    ['Model',        detail.inverterModel],
    ['AC output',    detail.inverterKw ? `${detail.inverterKw} kW AC` : undefined],
  ]
  for (const [lbl, val] of invRows) {
    fieldRow(page, lbl, val, y, bold, font); y -= 15
  }
  y -= 4; hr(page, y); y -= 14

  // ── Battery storage ─────────────────────────────────────────────────────────
  if (hasBattery) {
    sectionLabel(page, 'BATTERY STORAGE', y, bold); y -= 14
    const batRows: [string, string | undefined][] = [
      ['Total capacity',  `${job.batterySize} kWh`],
      ['Manufacturer',    detail.batteryMake],
      ['Model',           detail.batteryModel],
      ['Usable capacity', detail.batteryUsableKwh ? `${detail.batteryUsableKwh} kWh` : undefined],
      ['EPS circuit 1',   job.epsCircuit1 || undefined],
      ['EPS circuit 2',   job.epsCircuit2 || undefined],
      ['EPS circuit 3',   job.epsCircuit3 || undefined],
      ['Wi-Fi SSID',      job.wifiSsid    || undefined],
      ['Wi-Fi password',  job.wifiPassword|| undefined],
    ]
    for (const [lbl, val] of batRows) {
      fieldRow(page, lbl, val, y, bold, font); y -= 14
    }
    y -= 4; hr(page, y); y -= 14
  }

  // ── EV charger ───────────────────────────────────────────────────────────────
  if (hasEv) {
    sectionLabel(page, 'EV CHARGER', y, bold); y -= 14
    const evRows: [string, string | undefined][] = [
      ['Client EV status', job.ev],
      ['Manufacturer',     detail.evChargerMake],
      ['Model',            detail.evChargerModel],
      ['Charge rate',      detail.evChargerKw ? `${detail.evChargerKw} kW` : undefined],
    ]
    for (const [lbl, val] of evRows) {
      fieldRow(page, lbl, val, y, bold, font); y -= 14
    }
    y -= 4; hr(page, y); y -= 14
  }

  // ── Installation ─────────────────────────────────────────────────────────────
  sectionLabel(page, 'INSTALLATION', y, bold); y -= 14
  const instRows: [string, string | undefined][] = [
    ['Roof type',     detail.roofType],
    ['Mounting',      detail.mountingType],
    ['DC cable run',  detail.cableRunMetres ? `${detail.cableRunMetres} m` : undefined],
    ['Notes',         job.notes || undefined],
  ]
  for (const [lbl, val] of instRows) {
    fieldRow(page, lbl, val, y, bold, font); y -= 15
  }

  pageFooter(page, font, date)
  return doc.save()
}
