import { NextRequest, NextResponse } from 'next/server'
import { getInstallerFromRequest } from '@/lib/installer-auth'

export const maxDuration = 30

export async function POST(req: NextRequest) {
  const installer = getInstallerFromRequest(req)
  if (!installer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const gasUrl = process.env.JOBS_GAS_URL
  if (!gasUrl) return NextResponse.json({ error: 'GAS not configured' }, { status: 503 })

  const body = await req.json() as { filename?: string; base64?: string; mimeType?: string; description?: string }
  if (!body.filename || !body.base64) {
    return NextResponse.json({ error: 'filename and base64 required' }, { status: 400 })
  }

  const res = await fetch(gasUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'uploadGeneralReceipt',
      filename: body.filename,
      base64: body.base64,
      mimeType: body.mimeType ?? 'image/jpeg',
      description: body.description ?? '',
      uploadedBy: installer.name,
    }),
  })
  const text = await res.text()
  let data
  try { data = JSON.parse(text) } catch { return NextResponse.json({ error: 'GAS parse error' }, { status: 502 }) }
  if (data.error) return NextResponse.json({ error: data.error }, { status: 500 })
  return NextResponse.json(data)
}
