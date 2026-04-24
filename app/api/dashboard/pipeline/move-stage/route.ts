import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Valid GAS job statuses in order
const VALID_STATUSES = ['Lead', 'Quoted', 'Contract', 'Booked', 'In Progress', 'Complete']

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { jobNumber, status } = body

  if (!jobNumber || !status) {
    return NextResponse.json({ error: 'jobNumber and status required' }, { status: 400 })
  }
  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const gasUrl = process.env.JOBS_GAS_URL
  if (!gasUrl) return NextResponse.json({ error: 'GAS not configured' }, { status: 503 })

  try {
    const res = await fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'updateJob', jobNumber, status }),
    })
    const data = await res.json()
    return NextResponse.json({ success: true, job: data })
  } catch {
    return NextResponse.json({ error: 'GAS request failed' }, { status: 502 })
  }
}
