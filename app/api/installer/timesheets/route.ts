import { NextRequest, NextResponse } from 'next/server'
import { getInstallerFromRequest } from '@/lib/installer-auth'

export async function POST(req: NextRequest) {
  const payload = getInstallerFromRequest(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { jobNumber?: string; type?: string; timestamp?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { jobNumber, type, timestamp } = body
  if (!jobNumber || !type) {
    return NextResponse.json({ error: 'jobNumber and type required' }, { status: 400 })
  }
  if (type !== 'clock_in' && type !== 'clock_out') {
    return NextResponse.json({ error: 'type must be clock_in or clock_out' }, { status: 400 })
  }

  const gasUrl = process.env.JOBS_GAS_URL
  if (!gasUrl) return NextResponse.json({ error: 'GAS not configured' }, { status: 503 })

  const res = await fetch(gasUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'logTimeEntry',
      jobNumber,
      installerName: payload.name,
      type,
      timestamp: timestamp ?? new Date().toISOString(),
    }),
  })
  const text = await res.text()
  let data
  try {
    data = JSON.parse(text)
  } catch {
    return NextResponse.json({ error: 'GAS parse error' }, { status: 502 })
  }
  if (data.error) return NextResponse.json({ error: data.error }, { status: 502 })
  return NextResponse.json({ success: true })
}
