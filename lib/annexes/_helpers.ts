// lib/annexes/_helpers.ts
// Shared PDF primitives for all annex generators.
// Same visual language as lib/intake-pdf.ts — Helvetica, A4, HEA brand palette.

import { PDFDocument, PDFPage, PDFFont, rgb } from 'pdf-lib'

export { rgb }

// ── Company constants ──────────────────────────────────────────────────────────
export const COMPANY = 'Heffernan Electrical Automation'
export const REC     = 'REC 37307'
export const WEBSITE = 'hea-group.com.au'
export const PHONE   = '0481 267 812'

// ── Brand palette (mirrors lib/intake-pdf.ts) ──────────────────────────────────
export const BLACK      = rgb(0.06, 0.06, 0.06)
export const DARK_GREY  = rgb(0.33, 0.33, 0.33)
export const MID_GREY   = rgb(0.55, 0.55, 0.55)
export const LIGHT_GREY = rgb(0.82, 0.82, 0.82)
export const NAVY       = rgb(0.10, 0.23, 0.54)
export const YELLOW_BG  = rgb(1.00, 0.97, 0.80)
export const GREEN      = rgb(0.08, 0.50, 0.24)
export const GREEN_FILL = rgb(0.94, 0.99, 0.96)
export const GREEN_BDR  = rgb(0.73, 0.97, 0.81)

// ── A4 page dimensions ─────────────────────────────────────────────────────────
export const A4 = { width: 595, height: 842 } as const

// ── GASJob type — matches mobile/lib/types.ts GASJob ──────────────────────────
// Keep in sync if GAS adds new columns to the jobs sheet.
export type GASJob = {
  jobNumber:      string
  clientName:     string
  phone:          string
  email:          string
  address:        string
  postcode:       string
  status:         string
  driveUrl:       string
  notes:          string
  createdDate:    string
  systemSize:     string   // kW as string e.g. "6.6"
  batterySize:    string   // kWh as string e.g. "10" or ""
  totalPrice:     string   // e.g. "$12,500"
  annualBill:     string   // e.g. "2400"
  financeRequired: boolean
  occupants:      string
  homeDaytime:    string
  hotWater:       string
  gasAppliances:  string
  ev:             string
  wifiSsid:       string
  wifiPassword:   string
  epsCircuit1:    string
  epsCircuit2:    string
  epsCircuit3:    string
}

export type PdfFonts = { bold: PDFFont; font: PDFFont }

// ── Text helpers ───────────────────────────────────────────────────────────────

export function wrapText(
  page: PDFPage,
  text: string,
  x: number,
  startY: number,
  maxWidth: number,
  size: number,
  font: PDFFont,
  color: ReturnType<typeof rgb>,
  lineHeight = size + 3
): number {
  const words = text.split(' ')
  let line = ''
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

export function hr(
  page: PDFPage,
  y: number,
  x1 = 56,
  x2 = A4.width - 56
) {
  page.drawLine({ start: { x: x1, y }, end: { x: x2, y }, thickness: 0.5, color: LIGHT_GREY })
}

export function sectionLabel(page: PDFPage, label: string, y: number, bold: PDFFont) {
  page.drawText(label, { x: 56, y, font: bold, size: 8, color: MID_GREY })
}

// Renders label: value row. If value is undefined/empty, draws a blank dashed line.
export function fieldRow(
  page: PDFPage,
  label: string,
  value: string | undefined,
  y: number,
  bold: PDFFont,
  font: PDFFont,
  labelX  = 56,
  valueX  = 165,
  blankEnd = 460
) {
  page.drawText(`${label}:`, { x: labelX, y, font: bold, size: 10, color: BLACK })
  if (value) {
    page.drawText(value, { x: valueX, y, font, size: 10, color: DARK_GREY })
  } else {
    page.drawLine({
      start: { x: valueX,  y: y + 1 },
      end:   { x: blankEnd, y: y + 1 },
      thickness: 0.5,
      color: LIGHT_GREY,
    })
  }
}

// ── Standard page chrome ───────────────────────────────────────────────────────

// Draws the company header + title + subtitle + two HRs. Returns y after the second HR.
export function pageHeader(
  page: PDFPage,
  title: string,
  subtitle: string,
  fonts: PdfFonts
): number {
  const { bold, font } = fonts
  let y = A4.height - 50

  page.drawText(COMPANY.toUpperCase(), { x: 56, y, font: bold, size: 10, color: BLACK })
  page.drawText(`${REC}  ·  ${WEBSITE}  ·  ${PHONE}`, { x: 56, y: y - 14, font, size: 8, color: MID_GREY })
  y -= 38
  hr(page, y); y -= 18

  page.drawText(title, { x: 56, y, font: bold, size: 18, color: BLACK }); y -= 14
  page.drawText(subtitle, { x: 56, y, font, size: 10, color: MID_GREY }); y -= 14
  hr(page, y); y -= 16

  return y
}

// Compact header for continuation pages (photo sheets, long reports).
export function pageHeaderCompact(
  page: PDFPage,
  title: string,
  subtitle: string,
  fonts: PdfFonts
): number {
  const { bold, font } = fonts
  let y = A4.height - 42

  page.drawText(`${COMPANY.toUpperCase()}  ·  ${REC}`, { x: 56, y, font: bold, size: 8, color: BLACK })
  page.drawText(title, { x: 56, y: y - 12, font: bold, size: 12, color: BLACK })
  page.drawText(subtitle, { x: 56, y: y - 24, font, size: 8, color: MID_GREY })
  y -= 34
  hr(page, y); y -= 12

  return y
}

export function pageFooter(page: PDFPage, font: PDFFont, date: string) {
  hr(page, 44)
  page.drawText(
    `${COMPANY}  ·  ${REC}  ·  ${WEBSITE}  ·  Generated: ${date}`,
    { x: 56, y: 30, font, size: 8, color: LIGHT_GREY }
  )
}

// ── Number utilities ───────────────────────────────────────────────────────────

export function parseAmount(val: string): number {
  return parseFloat(val.replace(/[$,\s]/g, '')) || 0
}

export function parseKw(val: string): number {
  return parseFloat(val) || 0
}

export function fmtMoney(n: number): string {
  return '$' + Math.round(n).toLocaleString('en-AU')
}

export function fmtKwh(n: number): string {
  return Math.round(n).toLocaleString('en-AU') + ' kWh'
}

// Creates a new PDFDocument with embedded Helvetica fonts. Convenience wrapper.
export async function newPdfDoc(): Promise<{ doc: PDFDocument; fonts: PdfFonts }> {
  const { StandardFonts } = await import('pdf-lib')
  const doc  = await PDFDocument.create()
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const font = await doc.embedFont(StandardFonts.Helvetica)
  return { doc, fonts: { bold, font } }
}
