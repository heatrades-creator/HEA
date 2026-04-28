import { NextRequest, NextResponse } from 'next/server'
import { getInstallerFromRequest } from '@/lib/installer-auth'
import prisma from '@/lib/db'

export async function GET(req: NextRequest) {
  const payload = getInstallerFromRequest(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const contacts = await prisma.contact.findMany({
    where: { active: true },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(contacts)
}
