import { NextRequest, NextResponse } from 'next/server'
import { getInstallerFromRequest } from '@/lib/installer-auth'
import { prisma } from '@/lib/db'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: Ctx) {
  const installer = getInstallerFromRequest(req)
  if (!installer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const claim = await prisma.jobClaim.findUnique({
    where: { jobNumber: id },
    include: { installer: { select: { id: true, name: true } } },
  })
  return NextResponse.json(claim ?? null)
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const installer = getInstallerFromRequest(req)
  if (!installer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const installDate = (body as { installDate?: string }).installDate?.trim()
  if (!installDate) return NextResponse.json({ error: 'installDate required' }, { status: 400 })

  const existing = await prisma.jobClaim.findUnique({ where: { jobNumber: id } })
  if (existing && existing.installerId !== installer.sub) {
    return NextResponse.json({ error: 'Already claimed by another installer' }, { status: 409 })
  }

  const claim = await prisma.jobClaim.upsert({
    where: { jobNumber: id },
    create: { jobNumber: id, installerId: installer.sub, installDate },
    update: { installDate },
    include: { installer: { select: { id: true, name: true } } },
  })
  return NextResponse.json(claim)
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const installer = getInstallerFromRequest(req)
  if (!installer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const existing = await prisma.jobClaim.findUnique({ where: { jobNumber: id } })
  if (!existing) return NextResponse.json({ error: 'Not claimed' }, { status: 404 })
  if (existing.installerId !== installer.sub) {
    return NextResponse.json({ error: 'Cannot unclaim another installer\'s job' }, { status: 403 })
  }

  await prisma.jobClaim.delete({ where: { jobNumber: id } })
  return NextResponse.json({ success: true })
}
