import { NextRequest, NextResponse } from 'next/server'
import { getInstallerFromRequest } from '@/lib/installer-auth'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const installer = getInstallerFromRequest(req)
  if (!installer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const gasUrl = process.env.JOBS_GAS_URL
  if (!gasUrl) return NextResponse.json({ error: 'GAS not configured' }, { status: 503 })

  const { id } = await params
  const res = await fetch(`${gasUrl}?id=${encodeURIComponent(id)}`, { cache: 'no-store' })
  const text = await res.text()
  let job
  try {
    job = JSON.parse(text)
  } catch {
    return NextResponse.json({ error: 'GAS parse error' }, { status: 502 })
  }
  if (job.error) return NextResponse.json({ error: job.error }, { status: 404 })
  return NextResponse.json(job)
}
