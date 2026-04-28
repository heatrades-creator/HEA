import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/db'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  let body: { name?: string; pin?: string; role?: string; active?: boolean }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const data: Record<string, unknown> = {}
  if (body.name !== undefined) data.name = body.name.trim()
  if (body.role !== undefined) data.role = body.role
  if (body.active !== undefined) data.active = body.active
  if (body.pin !== undefined) {
    if (!/^\d{4}$/.test(body.pin)) return NextResponse.json({ error: 'pin must be 4 digits' }, { status: 400 })
    data.pinHash = await bcrypt.hash(body.pin, 10)
  }

  const installer = await prisma.installer.update({
    where: { id },
    data,
    select: { id: true, name: true, role: true, active: true, createdAt: true },
  })
  return NextResponse.json(installer)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  await prisma.installer.update({ where: { id }, data: { active: false } })
  return NextResponse.json({ success: true })
}
