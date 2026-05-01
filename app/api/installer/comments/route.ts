import { NextRequest, NextResponse } from 'next/server'
import { getInstallerFromRequest } from '@/lib/installer-auth'
import { prisma } from '@/lib/db'
import { sendExpoPush } from '@/lib/expo-push'

export async function GET(req: NextRequest) {
  const payload = getInstallerFromRequest(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const jobNumber = searchParams.get('jobNumber')
  if (!jobNumber) return NextResponse.json({ error: 'jobNumber required' }, { status: 400 })

  const comments = await prisma.jobComment.findMany({
    where: { jobNumber, parentId: null },
    include: {
      installer: { select: { id: true, name: true } },
      replies: {
        include: { installer: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: { createdAt: 'asc' },
  })
  return NextResponse.json(comments)
}

export async function POST(req: NextRequest) {
  const payload = getInstallerFromRequest(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { jobNumber?: string; body?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { jobNumber, body: text } = body
  if (!jobNumber || !text?.trim()) {
    return NextResponse.json({ error: 'jobNumber and body required' }, { status: 400 })
  }

  const comment = await prisma.jobComment.create({
    data: { jobNumber, body: text.trim(), installerId: payload.sub },
    include: { installer: { select: { id: true, name: true } } },
  })

  // Notify all other active installers with push tokens — fire and forget
  prisma.installer.findMany({
    where: { active: true, pushToken: { not: null }, NOT: { id: payload.sub } },
    select: { pushToken: true },
  }).then(others => {
    const tokens = others.map(o => o.pushToken).filter(Boolean) as string[]
    if (tokens.length > 0) {
      sendExpoPush(tokens.map(to => ({
        to,
        title: `${payload.name} — ${jobNumber}`,
        body: text.trim().slice(0, 120),
        data: { jobNumber },
        sound: 'default' as const,
      })))
    }
  }).catch(() => {})

  return NextResponse.json(comment, { status: 201 })
}
