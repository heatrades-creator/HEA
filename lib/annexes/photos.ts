// lib/annexes/photos.ts
// Annexes: Client Intake Photos | Client Follow-up Photos | Post-Install Installer Photos
// Slugs: client-photos-intake | client-photos-followup | installer-photos
// Drive: 05-photos/
// Status: available — generator is complete. Requires Drive photo fetch to be wired up.
//
// ══════════════════════════════════════════════════════════════════════════════
// HOW TO WIRE UP DRIVE PHOTOS (breadcrumb for future AI)
// ══════════════════════════════════════════════════════════════════════════════
//
// STEP 1 — Add a GAS action to GAS/HEAJobsAPI.gs:
//
//   if (e.parameter.action === 'listPhotos' && e.parameter.jobNumber) {
//     const type = e.parameter.type || 'intake'   // 'intake' | 'installer' | 'followup'
//     return jsonResponse(listJobPhotos_(e.parameter.jobNumber, type))
//   }
//
//   function listJobPhotos_(jobNumber, type) {
//     const subfolder = getJobSubfolder_(jobNumber, '05-photos')
//     if (!subfolder) return { photos: [] }
//     const files  = subfolder.getFiles()
//     const photos = []
//     while (files.hasNext()) {
//       const f    = files.next()
//       const name = f.getName().toLowerCase()
//       // Filter by annex type using naming convention patterns:
//       // intake:    photo-roof | photo-switchboard | photo-battery | photo-ev-charger
//       // installer: photo-panel-array | photo-inverter | photo-meter-box | photo-site
//       // followup:  photo-followup
//       if (matchesPhotoType_(name, type)) {
//         const b64  = Utilities.base64Encode(f.getBlob().getBytes())
//         const mime = f.getBlob().getContentType()
//         photos.push({ name, label: labelFromFilename_(name), b64, mime })
//       }
//     }
//     return { photos }
//   }
//
//   function matchesPhotoType_(name, type) {
//     if (type === 'intake')    return /photo-(roof|switchboard|battery|ev)/.test(name)
//     if (type === 'installer') return /photo-(panel-array|inverter|meter-box|site)/.test(name)
//     if (type === 'followup')  return /photo-followup/.test(name)
//     return false
//   }
//
//   function labelFromFilename_(name) {
//     // e.g. "ts00001-photo-roof-ground-john-smith-2026-05-03.jpg" → "Roof — Ground Angle"
//     const m = name.match(/photo-([a-z0-9-]+)-[a-z]+/)
//     if (!m) return name
//     return m[1].split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')
//   }
//
// STEP 2 — Add a Next.js API route app/api/dashboard/jobs/[jobNumber]/photos/route.ts:
//
//   export async function GET(req, { params }) {
//     const { jobNumber } = params
//     const type = new URL(req.url).searchParams.get('type') || 'intake'
//     const res  = await fetch(`${process.env.JOBS_GAS_URL}?action=listPhotos&jobNumber=${jobNumber}&type=${type}`)
//     const text = await res.text()
//     const data = JSON.parse(text)
//     if (data.error) return NextResponse.json({ error: data.error }, { status: 502 })
//     return NextResponse.json(data)
//   }
//
// STEP 3 — Call the generator from your document generation code:
//
//   import { generatePhotosAnnex } from '@/lib/annexes'
//
//   const res   = await fetch(`/api/dashboard/jobs/${jobNumber}/photos?type=intake`)
//   const { photos } = await res.json()
//   const photoData = photos.map(p => ({
//     label:     p.label,
//     jpegBytes: Uint8Array.from(atob(p.b64), c => c.charCodeAt(0)),
//   }))
//   const pdfBytes = await generatePhotosAnnex({ job, type: 'intake', photos: photoData })
//
// NOTE: pdf-lib supports JPEG and PNG only.
//       Convert other formats (HEIC, WEBP) in GAS before base64-encoding.
//       Photos are already resized to 800px by the intake form (see app/intake/page.tsx
//       compressImage()) and by the installer app upload pipeline.
//
// ══════════════════════════════════════════════════════════════════════════════

import { PDFDocument, PDFImage, StandardFonts } from 'pdf-lib'
import {
  GASJob, PdfFonts, A4,
  DARK_GREY, MID_GREY, LIGHT_GREY, rgb,
  hr, pageHeaderCompact, pageFooter,
  COMPANY, REC, WEBSITE,
} from './_helpers'

export interface PhotoAnnexPhoto {
  label:     string       // e.g. "Roof — North Face"
  jpegBytes: Uint8Array   // JPEG or PNG bytes
}

export type PhotoAnnexType = 'intake' | 'installer' | 'followup'

export interface PhotoAnnexParams {
  job:     GASJob
  type:    PhotoAnnexType
  photos:  PhotoAnnexPhoto[]
  date?:   string
}

const TYPE_LABELS: Record<PhotoAnnexType, string> = {
  intake:    'Client Intake Photos',
  installer: 'Post-Install Installer Photos',
  followup:  'Client Follow-up Photos',
}

const PHOTO_W  = 220
const PHOTO_H  = 165
const COL_GAP  = 18
const COL_X    = [56, 56 + PHOTO_W + COL_GAP] as const
const LABEL_H  = 14
const ROW_H    = PHOTO_H + LABEL_H + 16
const FOOTER_Y = 55

export async function generatePhotosAnnex(
  params: PhotoAnnexParams
): Promise<Uint8Array> {
  const { job, type, photos, date = new Date().toISOString().split('T')[0] } = params

  const doc  = await PDFDocument.create()
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const fonts: PdfFonts = { bold, font }

  const annexTitle = TYPE_LABELS[type]
  const subtitle   = `${job.jobNumber}  ·  ${job.clientName}  ·  ${job.address}`

  if (photos.length === 0) {
    const page = doc.addPage([A4.width, A4.height])
    let y = pageHeaderCompact(page, annexTitle, subtitle, fonts)
    page.drawText('No photos available for this job.', {
      x: 56, y, font, size: 12, color: MID_GREY,
    })
    pageFooter(page, font, date)
    return doc.save()
  }

  // Each page fits 2 columns × up to 3 rows = 6 photos
  // Track current page state
  let page  = doc.addPage([A4.width, A4.height])
  let y     = pageHeaderCompact(page, annexTitle, subtitle, fonts)
  let col   = 0
  let rowY  = y

  function ensureRowSpace() {
    if (rowY - ROW_H < FOOTER_Y) {
      // Close current page
      pageFooter(page, font, date)
      // New page
      page = doc.addPage([A4.width, A4.height])
      y    = pageHeaderCompact(page, annexTitle, subtitle, fonts)
      rowY = y
      col  = 0
    }
  }

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i]

    // Move to next row after filling both columns
    if (col === 2) {
      col  = 0
      rowY -= ROW_H
    }

    ensureRowSpace()

    const x = COL_X[col]
    const labelY = rowY - 10

    // Photo label
    page.drawText(photo.label, { x, y: labelY, font: bold, size: 8, color: DARK_GREY })

    // Embed image (JPEG first, fall back to PNG)
    let img: PDFImage | null = null
    try {
      img = await doc.embedJpg(photo.jpegBytes)
    } catch {
      try {
        img = await doc.embedPng(photo.jpegBytes)
      } catch {
        img = null
      }
    }

    const imgY = labelY - LABEL_H - PHOTO_H

    if (img) {
      const dims = img.scaleToFit(PHOTO_W, PHOTO_H)
      const imgX = x + (PHOTO_W - dims.width) / 2
      page.drawImage(img, {
        x: imgX,
        y: imgY + (PHOTO_H - dims.height),
        width:  dims.width,
        height: dims.height,
      })
      page.drawRectangle({
        x: imgX - 1,
        y: imgY + (PHOTO_H - dims.height) - 1,
        width:  dims.width  + 2,
        height: dims.height + 2,
        borderColor: LIGHT_GREY,
        borderWidth: 0.5,
      })
    } else {
      // Placeholder box if image failed to embed
      page.drawRectangle({
        x, y: imgY, width: PHOTO_W, height: PHOTO_H,
        color: rgb(0.93, 0.93, 0.93), borderColor: LIGHT_GREY, borderWidth: 0.5,
      })
      page.drawText('Photo unavailable', {
        x: x + 60, y: imgY + PHOTO_H / 2,
        font, size: 8, color: MID_GREY,
      })
    }

    col++
  }

  pageFooter(page, font, date)
  return doc.save()
}
