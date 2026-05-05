import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const gasUrl = process.env.PRICING_GAS_URL
  if (!gasUrl) return NextResponse.json({ error: 'PRICING_GAS_URL not configured' }, { status: 503 })

  const body = await req.json()
  const { section, item, newPrice } = body
  if (!section || !item || newPrice === undefined) {
    return NextResponse.json({ error: 'Missing section, item, or newPrice' }, { status: 400 })
  }

  const text = await fetch(gasUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'updateExtrasPrice', section, item, newPrice }),
  }).then(r => r.text())

  const data = JSON.parse(text)
  return NextResponse.json(data)
}
