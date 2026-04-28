import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  let body: { name?: string; company?: string; phone?: string; email?: string; category?: string; notes?: string; active?: boolean }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const contact = await prisma.contact.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name.trim() }),
      ...(body.company !== undefined && { company: body.company.trim() || null }),
      ...(body.phone !== undefined && { phone: body.phone.trim() || null }),
      ...(body.email !== undefined && { email: body.email.trim() || null }),
      ...(body.category !== undefined && { category: body.category }),
      ...(body.notes !== undefined && { notes: body.notes.trim() || null }),
      ...(body.active !== undefined && { active: body.active }),
    },
  })
  return NextResponse.json(contact)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  await prisma.contact.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
