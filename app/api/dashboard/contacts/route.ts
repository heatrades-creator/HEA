import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const contacts = await prisma.contact.findMany({
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
  })
  return NextResponse.json(contacts)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { name?: string; company?: string; phone?: string; email?: string; category?: string; notes?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { name, company, phone, email, category = 'other', notes } = body
  if (!name?.trim()) return NextResponse.json({ error: 'name required' }, { status: 400 })

  const contact = await prisma.contact.create({
    data: { name: name.trim(), company: company?.trim() || null, phone: phone?.trim() || null, email: email?.trim() || null, category, notes: notes?.trim() || null },
  })
  return NextResponse.json(contact, { status: 201 })
}
