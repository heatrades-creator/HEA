import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { sendExpoPush } from '@/lib/expo-push'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { title, body } = await req.json() as { title?: string; body?: string }
  if (!title?.trim() || !body?.trim()) {
    return NextResponse.json({ error: 'title and body required' }, { status: 400 })
  }

  const installers = await prisma.installer.findMany({
    where: { active: true, pushToken: { not: null } },
    select: { pushToken: true },
  })

  const tokens = installers.map(i => i.pushToken).filter(Boolean) as string[]
  if (tokens.length === 0) {
    return NextResponse.json({ sent: 0, message: 'No registered devices' })
  }

  await sendExpoPush(tokens.map(to => ({ to, title: title.trim(), body: body.trim(), sound: 'default' as const })))
  return NextResponse.json({ sent: tokens.length })
}
