import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const comments = await prisma.jobComment.findMany({
    where: { jobNumber: id, parentId: null },
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

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  let body: { body?: string; parentId?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.body?.trim()) return NextResponse.json({ error: 'body required' }, { status: 400 })

  if (body.parentId) {
    const parent = await prisma.jobComment.findUnique({ where: { id: body.parentId } })
    if (!parent || parent.parentId !== null) {
      return NextResponse.json({ error: 'Invalid parentId — max reply depth is 1' }, { status: 400 })
    }
  }

  const comment = await prisma.jobComment.create({
    data: {
      jobNumber: id,
      body: body.body.trim(),
      staffEmail: session.user?.email ?? 'staff',
      parentId: body.parentId ?? null,
    },
    include: { installer: { select: { id: true, name: true } } },
  })
  return NextResponse.json(comment, { status: 201 })
}
