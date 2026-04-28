import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/db'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const installers = await prisma.installer.findMany({
    select: { id: true, name: true, role: true, active: true, createdAt: true },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(installers)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { name?: string; pin?: string; role?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { name, pin, role = 'installer' } = body
  if (!name?.trim()) return NextResponse.json({ error: 'name required' }, { status: 400 })
  if (!pin || !/^\d{4}$/.test(pin)) return NextResponse.json({ error: 'pin must be 4 digits' }, { status: 400 })

  const pinHash = await bcrypt.hash(pin, 10)
  const installer = await prisma.installer.create({
    data: { name: name.trim(), pinHash, role },
    select: { id: true, name: true, role: true, active: true, createdAt: true },
  })
  return NextResponse.json(installer, { status: 201 })
}
