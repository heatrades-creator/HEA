import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

type ExtraLine = { item: string; qty: number; unitPrice: number }

type ApplyBody = {
  jobNumber: string
  totalPrice: number
  packageLabel: string
  panelBrand: string
  panelModel?: string
  inverterBrand: string
  inverterModel: string
  batteryBrand: string
  batteryModel: string
  batteryKwh: number
  evCharger?: string
  extras: ExtraLine[]
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const gasUrl = process.env.JOBS_GAS_URL
  if (!gasUrl) return NextResponse.json({ error: 'JOBS_GAS_URL not configured' }, { status: 503 })

  let body: ApplyBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.jobNumber || !body.totalPrice) {
    return NextResponse.json({ error: 'jobNumber and totalPrice are required' }, { status: 400 })
  }

  const extrasSummary = body.extras
    .filter(e => e.qty > 0)
    .map(e => `${e.item} ×${e.qty} ($${(e.qty * e.unitPrice).toLocaleString('en-AU')})`)
    .join('; ')

  const payload = {
    action: 'updateJob',
    jobNumber: body.jobNumber,
    totalPrice: `$${Math.round(body.totalPrice).toLocaleString('en-AU')}`,
    quoteLabel: body.packageLabel,
    panelBrand: body.panelBrand || '',
    panelModel: body.panelModel || '',
    inverterBrand: body.inverterBrand || '',
    inverterModel: body.inverterModel || '',
    batteryBrand: body.batteryBrand || '',
    batteryModel: body.batteryModel || '',
    batteryKwh: body.batteryKwh ? String(body.batteryKwh) : '',
    evCharger: body.evCharger || '',
    extrasSummary,
  }

  const text = await fetch(gasUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    cache: 'no-store',
  }).then(r => r.text())

  try {
    const data = JSON.parse(text)
    if (data.error) return NextResponse.json({ error: data.error }, { status: 400 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'GAS returned non-JSON', raw: text.slice(0, 200) }, { status: 502 })
  }
}
