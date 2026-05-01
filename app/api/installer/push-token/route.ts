import { NextRequest, NextResponse } from 'next/server'
import { getInstallerFromRequest } from '@/lib/installer-auth'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  const payload = getInstallerFromRequest(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { token } = await req.json() as { token?: string }
  if (!token || typeof token !== 'string') {
    return NextResponse.json({ error: 'token required' }, { status: 400 })
  }

  await prisma.installer.update({
    where: { id: payload.sub },
    data: { pushToken: token },
  })

  return NextResponse.json({ ok: true })
}
