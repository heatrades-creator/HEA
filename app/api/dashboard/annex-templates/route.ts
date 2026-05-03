import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const gasUrl = process.env.JOBS_GAS_URL
  if (!gasUrl) return NextResponse.json({ error: 'GAS not configured' }, { status: 503 })

  const raw = await fetch(`${gasUrl}?action=getAnnexTemplateInfo`, { cache: 'no-store' }).then(
    (r) => r.text()
  )

  let data: Record<string, unknown>
  try {
    data = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: 'GAS returned invalid JSON' }, { status: 502 })
  }

  return NextResponse.json(data)
}
