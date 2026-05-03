import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const gasUrl = process.env.JOBS_GAS_URL
  if (!gasUrl) return NextResponse.json({ error: 'GAS not configured' }, { status: 503 })

  const { id: jobNumber } = await params
  const { annexSlug } = await req.json()

  if (!annexSlug) return NextResponse.json({ error: 'annexSlug required' }, { status: 400 })

  const raw = await fetch(gasUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'generateAnnex', jobNumber, annexSlug }),
  }).then((r) => r.text())

  let data: Record<string, unknown>
  try {
    data = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: 'GAS returned invalid JSON', raw }, { status: 502 })
  }

  if (data.error) return NextResponse.json({ error: data.error }, { status: 502 })

  return NextResponse.json(data)
}
