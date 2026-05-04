import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const gasUrl = process.env.JOBS_GAS_URL
  if (!gasUrl) return NextResponse.json({ error: 'GAS not configured' }, { status: 503 })

  const jobNumber = req.nextUrl.searchParams.get('jobNumber')
  if (!jobNumber) return NextResponse.json({ error: 'jobNumber required' }, { status: 400 })

  const raw = await fetch(`${gasUrl}?action=checkEstimation&jobNumber=${encodeURIComponent(jobNumber)}`, { cache: 'no-store' })
  const text = await raw.text()
  try {
    const data = JSON.parse(text)
    if (data.error) return NextResponse.json({ hasEstimation: false }, { status: 200 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ hasEstimation: false })
  }
}
