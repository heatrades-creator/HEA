import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const gasUrl = process.env.PRICING_GAS_URL
  if (!gasUrl) return NextResponse.json({ error: 'PRICING_GAS_URL not configured' }, { status: 503 })

  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action') || ''
  const phase  = searchParams.get('phase')  || '1P'

  const params = new URLSearchParams({ action })
  if (phase) params.set('phase', phase)

  const text = await fetch(`${gasUrl}?${params}`, { cache: 'no-store' }).then(r => r.text())
  try {
    return NextResponse.json(JSON.parse(text))
  } catch {
    return NextResponse.json({ error: 'GAS returned non-JSON', raw: text.slice(0, 200) }, { status: 502 })
  }
}
