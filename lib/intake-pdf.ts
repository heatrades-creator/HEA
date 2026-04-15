import { PDFDocument, rgb, StandardFonts } from "pdf-lib"

const COMPANY  = "Heffernan Electrical Automation"
const REC      = "REC 37307"
const WEBSITE  = "hea-group.com.au"
const PHONE    = "0481 267 812"
const NOTIFY   = "hea.trades@gmail.com"

const BLACK      = rgb(0.06, 0.06, 0.06)
const DARK_GREY  = rgb(0.33, 0.33, 0.33)
const MID_GREY   = rgb(0.55, 0.55, 0.55)
const LIGHT_GREY = rgb(0.82, 0.82, 0.82)
const NAVY       = rgb(0.10, 0.23, 0.54)
const GREEN      = rgb(0.08, 0.50, 0.24)
const GREEN_FILL = rgb(0.94, 0.99, 0.96)
const GREEN_BDR  = rgb(0.73, 0.97, 0.81)

export interface IntakeData {
  name:             string
  email:            string
  phone:            string
  address:          string
  service:          string
  timestamp:        string
  occupants?:       string
  homeDaytime?:     string
  hotWater?:        string
  gasAppliances?:   string
  ev?:              string
  goals?:           string
  systemSize?:      string
  batterySize?:     string
  roofMaterial?:    string
  roofOrientation?: string
  shadingIssues?:   string
  phases?:          string
}

// ── Wrapped text helper ───────────────────────────────────────────────────────
function wrapText(
  page: Awaited<ReturnType<PDFDocument["addPage"]>>,
  text: string,
  x: number,
  startY: number,
  maxWidth: number,
  size: number,
  font: Awaited<ReturnType<PDFDocument["embedFont"]>>,
  color: ReturnType<typeof rgb>,
  lineHeight = size + 3
): number {
  const words = text.split(" ")
  let line = ""
  let y = startY
  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    if (font.widthOfTextAtSize(test, size) > maxWidth && line) {
      page.drawText(line, { x, y, font, size, color })
      y -= lineHeight
      line = word
    } else {
      line = test
    }
  }
  if (line) {
    page.drawText(line, { x, y, font, size, color })
    y -= lineHeight
  }
  return y
}

function hr(page: Awaited<ReturnType<PDFDocument["addPage"]>>, y: number, pageWidth: number) {
  page.drawLine({ start: { x: 56, y }, end: { x: pageWidth - 56, y }, thickness: 0.5, color: LIGHT_GREY })
}

function sectionLabel(
  page: Awaited<ReturnType<PDFDocument["addPage"]>>,
  label: string,
  y: number,
  font: Awaited<ReturnType<PDFDocument["embedFont"]>>
) {
  page.drawText(label, { x: 56, y, font, size: 8, color: MID_GREY })
}

function row(
  page: Awaited<ReturnType<PDFDocument["addPage"]>>,
  label: string,
  value: string,
  y: number,
  boldFont: Awaited<ReturnType<PDFDocument["embedFont"]>>,
  font: Awaited<ReturnType<PDFDocument["embedFont"]>>
) {
  page.drawText(`${label}:`, { x: 56, y, font: boldFont, size: 10, color: BLACK })
  page.drawText(value || "—", { x: 165, y, font, size: 10, color: DARK_GREY })
}

// ── NMI Consent PDF ───────────────────────────────────────────────────────────
export async function generateConsentPdf(data: IntakeData): Promise<Uint8Array> {
  const doc  = await PDFDocument.create()
  const page = doc.addPage([595, 842])
  const { width, height } = page.getSize()
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const font = await doc.embedFont(StandardFonts.Helvetica)

  let y = height - 50

  // ── Header ──────────────────────────────────────────────────────────────────
  page.drawText(COMPANY.toUpperCase(), { x: 56, y, font: bold, size: 10, color: BLACK })
  page.drawText(`${REC}  ·  ${WEBSITE}  ·  ${PHONE}`, { x: 56, y: y - 14, font, size: 8, color: MID_GREY })
  y -= 38
  hr(page, y, width); y -= 20

  // ── Title ────────────────────────────────────────────────────────────────────
  page.drawText("NMI Data Access Consent", { x: 56, y, font: bold, size: 22, color: BLACK })
  y -= 16
  page.drawText(`Solar & Battery Design Service  ·  ${COMPANY}`, { x: 56, y, font, size: 10, color: MID_GREY })
  y -= 16
  hr(page, y, width); y -= 20

  // ── Client details ───────────────────────────────────────────────────────────
  sectionLabel(page, "CLIENT DETAILS", y, bold); y -= 14
  const details: [string, string][] = [
    ["Name",       data.name],
    ["Email",      data.email],
    ["Phone",      data.phone],
    ["Property",   data.address],
    ["Date Signed",data.timestamp],
    ["Reference",  `${data.name} - NMI Consent - HEA`],
  ]
  for (const [lbl, val] of details) {
    row(page, lbl, val, y, bold, font); y -= 14
  }
  y -= 10

  // ── Section 1 ────────────────────────────────────────────────────────────────
  page.drawText("1.  Purpose of Consent", { x: 56, y, font: bold, size: 12, color: BLACK }); y -= 16
  y = wrapText(
    page,
    `I, ${data.name}, of ${data.address}, authorise ${COMPANY} (HEA) to access my electricity ` +
    `consumption data held against my National Metering Identifier (NMI), as found on my submitted ` +
    `electricity bill. This data will be accessed via the Powercore platform solely for the purpose ` +
    `of designing a solar photovoltaic (PV) and/or battery storage system for my property.`,
    56, y, width - 112, 10, font, DARK_GREY
  )
  y -= 12

  // ── Section 2 ────────────────────────────────────────────────────────────────
  page.drawText("2.  Scope of Authorisation", { x: 56, y, font: bold, size: 12, color: BLACK }); y -= 16
  const bullets = [
    "Access historical consumption data linked to my NMI via the Powercore platform",
    "Use that data solely to design and quote a solar PV and/or battery system for the above property",
    "Retain this consent form and associated data for a maximum of 7 years in accordance with the Australian Privacy Principles",
  ]
  for (const b of bullets) {
    page.drawText("•", { x: 56, y, font, size: 10, color: DARK_GREY })
    y = wrapText(page, b, 68, y, width - 124, 10, font, DARK_GREY)
    y -= 4
  }
  y -= 8

  // ── Section 3 ────────────────────────────────────────────────────────────────
  page.drawText("3.  Limitations & Data Protection", { x: 56, y, font: bold, size: 12, color: BLACK }); y -= 16
  y = wrapText(
    page,
    `HEA will not sell, share, or disclose your NMI or consumption data to any third party other ` +
    `than Powercore for the purposes stated above. This consent may be withdrawn at any time by ` +
    `contacting HEA in writing at ${NOTIFY}. Withdrawal will not affect system design work already completed.`,
    56, y, width - 112, 10, font, DARK_GREY
  )
  y -= 14

  // ── Section 4: Signature ─────────────────────────────────────────────────────
  page.drawText("4.  Electronic Signature & Declaration", { x: 56, y, font: bold, size: 12, color: BLACK }); y -= 16
  y = wrapText(
    page,
    "The client confirmed consent by submitting the HEA intake form. " +
    "This constitutes a valid electronic signature under the Electronic Transactions Act 1999 (Cth).",
    56, y, width - 112, 10, font, MID_GREY
  )
  y -= 16

  // Signature block
  page.drawText(data.name, { x: 56, y, font: bold, size: 20, color: NAVY }); y -= 8
  hr(page, y, width - 250); y -= 14
  const sigLines = [
    `Signed:  ${data.name}`,
    `Address: ${data.address}`,
    `Date:    ${data.timestamp}`,
    `Method:  Electronic consent — HEA intake form (hea-group.com.au)`,
  ]
  for (const l of sigLines) {
    page.drawText(l, { x: 56, y, font, size: 9, color: MID_GREY }); y -= 13
  }

  // ── Footer ───────────────────────────────────────────────────────────────────
  hr(page, 44, width)
  page.drawText(
    `${COMPANY}  ·  ${REC}  ·  ${WEBSITE}  ·  This document was automatically generated upon electronic consent.`,
    { x: 56, y: 30, font, size: 8, color: LIGHT_GREY }
  )

  return doc.save()
}

// ── Job Card PDF ──────────────────────────────────────────────────────────────
export async function generateJobCardPdf(data: IntakeData): Promise<Uint8Array> {
  const doc  = await PDFDocument.create()
  const page = doc.addPage([595, 842])
  const { width, height } = page.getSize()
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const font = await doc.embedFont(StandardFonts.Helvetica)

  const encodedAddr   = encodeURIComponent(data.address)
  const satelliteLink = `https://www.google.com/maps/search/${encodedAddr}/@?data=!3m1!1e3`

  let y = height - 50

  // ── Header ───────────────────────────────────────────────────────────────────
  page.drawText(COMPANY.toUpperCase(), { x: 56, y, font: bold, size: 10, color: BLACK })
  page.drawText(`${REC}  ·  ${WEBSITE}  ·  ${PHONE}`, { x: 56, y: y - 14, font, size: 8, color: MID_GREY })
  y -= 38
  hr(page, y, width); y -= 20

  page.drawText("Job Card", { x: 56, y, font: bold, size: 20, color: BLACK }); y -= 15
  page.drawText(`Solar & Battery Design  ·  ${COMPANY}`, { x: 56, y, font, size: 10, color: MID_GREY }); y -= 14
  hr(page, y, width); y -= 16

  // ── Client details ───────────────────────────────────────────────────────────
  sectionLabel(page, "CLIENT DETAILS", y, bold); y -= 14
  const clientRows: [string, string][] = [
    ["Name",             data.name],
    ["Phone",            data.phone],
    ["Email",            data.email],
    ["Address",          data.address],
    ["Date",             data.timestamp],
    ["Service interest", data.service],
  ]
  for (const [lbl, val] of clientRows) {
    row(page, lbl, val, y, bold, font); y -= 14
  }
  y -= 6; hr(page, y, width); y -= 16

  // ── Household profile ────────────────────────────────────────────────────────
  sectionLabel(page, "HOUSEHOLD PROFILE", y, bold); y -= 14
  const householdRows: [string, string][] = [
    ["Occupants",      data.occupants    ?? "—"],
    ["Home daytime",   data.homeDaytime  ?? "—"],
    ["Hot water",      data.hotWater     ?? "—"],
    ["Gas appliances", data.gasAppliances?? "—"],
    ["EV / planning",  data.ev           ?? "—"],
    ["Goals",          data.goals        ?? "—"],
  ]
  for (const [lbl, val] of householdRows) {
    row(page, lbl, val, y, bold, font); y -= 14
  }
  y -= 6; hr(page, y, width); y -= 16

  // ── System preference box ────────────────────────────────────────────────────
  sectionLabel(page, "SYSTEM PREFERENCE (CLIENT INDICATED)", y, bold); y -= 12
  const boxH = 50
  page.drawRectangle({
    x: 56, y: y - boxH + 10, width: width - 112, height: boxH,
    color: GREEN_FILL, borderColor: GREEN_BDR, borderWidth: 1,
  })
  page.drawText("Solar array:", { x: 68, y: y - 4, font: bold, size: 10, color: GREEN })
  page.drawText(data.systemSize ?? "No preference — to be advised", { x: 165, y: y - 4, font, size: 10, color: BLACK })
  page.drawText("Battery:",     { x: 68, y: y - 18, font: bold, size: 10, color: GREEN })
  page.drawText(data.batterySize ?? "No preference — to be advised", { x: 165, y: y - 18, font, size: 10, color: BLACK })
  y -= boxH + 8

  hr(page, y, width); y -= 16

  // ── Property / satellite link ────────────────────────────────────────────────
  sectionLabel(page, "PROPERTY — ROOF VIEW", y, bold); y -= 12
  page.drawRectangle({
    x: 56, y: y - 40, width: width - 112, height: 48,
    color: rgb(0.97, 0.97, 0.97), borderColor: LIGHT_GREY, borderWidth: 1,
  })
  page.drawText(`Satellite view: ${satelliteLink}`, { x: 66, y: y - 8, font, size: 9, color: rgb(0.1, 0.3, 0.7) })
  page.drawText(`Property: ${data.address}`, { x: 66, y: y - 22, font, size: 9, color: DARK_GREY })
  y -= 54

  hr(page, y, width); y -= 16

  // ── Roof assessment ───────────────────────────────────────────────────────────
  sectionLabel(page, "ROOF ASSESSMENT (FILL IN ON-SITE OR FROM SATELLITE)", y, bold); y -= 14
  const roofFieldData: [string, string | undefined][] = [
    ["Roof material",           data.roofMaterial],
    ["Main orientation",        data.roofOrientation],
    ["Shading issues",          data.shadingIssues],
    ["Phases (Single / Three)", data.phases],
    ["Meter location",          undefined],
    ["Switchboard",             undefined],
  ]
  for (const [lbl, val] of roofFieldData) {
    page.drawText(`${lbl}:`, { x: 56, y, font: bold, size: 10, color: BLACK })
    if (val) {
      page.drawText(val, { x: 165, y, font, size: 10, color: DARK_GREY })
    } else {
      page.drawLine({ start: { x: 165, y: y + 1 }, end: { x: 460, y: y + 1 }, thickness: 0.5, color: LIGHT_GREY })
    }
    y -= 16
  }
  y -= 6

  // ── Site notes (blank box) ───────────────────────────────────────────────────
  sectionLabel(page, "SITE NOTES", y, bold); y -= 12
  page.drawRectangle({
    x: 56, y: y - 58, width: width - 112, height: 66,
    color: rgb(0.98, 0.98, 0.97), borderColor: LIGHT_GREY, borderWidth: 1,
  })

  // ── Footer ───────────────────────────────────────────────────────────────────
  hr(page, 44, width)
  page.drawText(
    `${COMPANY}  ·  ${REC}  ·  ${WEBSITE}  ·  Generated: ${data.timestamp}`,
    { x: 56, y: 30, font, size: 8, color: LIGHT_GREY }
  )

  return doc.save()
}
