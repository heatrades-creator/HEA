import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const jobNumber = req.nextUrl.searchParams.get('jobNumber')
  if (!jobNumber) return NextResponse.json({ error: 'jobNumber required' }, { status: 400 })

  const gasUrl = process.env.JOBS_GAS_URL
  if (!gasUrl) return NextResponse.json({ hasNMI: false, nmiSubfolderUrl: null })

  try {
    const res = await fetch(`${gasUrl}?action=checkNMI&jobNumber=${encodeURIComponent(jobNumber)}`, {
      cache: 'no-store',
    })
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ hasNMI: false, nmiSubfolderUrl: null })
  }
}
