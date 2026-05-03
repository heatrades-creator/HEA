// lib/document-merge.ts
// PDF merge utility using pdf-lib. Merges a base document with ordered annex PDFs.
// Called at generate-time to produce the final combined document for each job.

import { PDFDocument } from 'pdf-lib'

// Merges multiple PDF byte arrays into a single PDF, preserving page order.
export async function mergePdfs(pdfs: Uint8Array[]): Promise<Uint8Array> {
  const merged = await PDFDocument.create()
  for (const pdfBytes of pdfs) {
    const src = await PDFDocument.load(pdfBytes)
    const pages = await merged.copyPages(src, src.getPageIndices())
    for (const page of pages) {
      merged.addPage(page)
    }
  }
  return merged.save()
}
