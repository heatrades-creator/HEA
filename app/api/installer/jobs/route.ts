import { NextRequest, NextResponse } from 'next/server'
import { getInstallerFromRequest } from '@/lib/installer-auth'

const ACTIVE_STATUSES = new Set(['Booked', 'In Progress'])

export async function GET(req: NextRequest) {
  const installer = getInstallerFromRequest(req)
  if (!installer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const gasUrl = process.env.JOBS_GAS_URL
  if (!gasUrl) return NextResponse.json({ error: 'GAS not configured' }, { status: 503 })

  const res = await fetch(gasUrl, { cache: 'no-store' })
  const text = await res.text()
  let jobs
  try {
    jobs = JSON.parse(text)
  } catch {
    return NextResponse.json({ error: 'GAS parse error' }, { status: 502 })
  }
  if (jobs.error) return NextResponse.json({ error: jobs.error }, { status: 502 })

  const active = jobs.filter((j: { status: string }) => ACTIVE_STATUSES.has(j.status))
  return NextResponse.json(active)
}
