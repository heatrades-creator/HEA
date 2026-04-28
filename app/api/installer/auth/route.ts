import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { signInstallerToken } from '@/lib/installer-auth'

export async function POST(req: NextRequest) {
  let body: { name?: string; pin?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { name, pin } = body
  if (!name || !pin) {
    return NextResponse.json({ error: 'name and pin required' }, { status: 400 })
  }

  const installer = await prisma.installer.findFirst({
    where: { name: { equals: name }, active: true },
  })

  if (!installer || !(await bcrypt.compare(pin, installer.pinHash))) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const token = signInstallerToken({ id: installer.id, name: installer.name, role: installer.role })
  return NextResponse.json({ token, installer: { id: installer.id, name: installer.name, role: installer.role } })
}
