import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const gasUrl = process.env.JOBS_GAS_URL
  if (!gasUrl) return NextResponse.json([], { status: 200 })

  try {
    const raw = await fetch(`${gasUrl}?action=getAnnexTemplateInfo`, { cache: 'no-store' }).then(
      (r) => r.text()
    )
    const data = JSON.parse(raw)
    if (data.error) return NextResponse.json([], { status: 200 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}
