import { NextRequest, NextResponse } from 'next/server'
import { getInstallerFromRequest } from '@/lib/installer-auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  const installer = getInstallerFromRequest(req)
  if (!installer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const claims = await prisma.jobClaim.findMany({
    include: { installer: { select: { id: true, name: true } } },
  })

  return NextResponse.json(claims.map(c => ({
    jobNumber: c.jobNumber,
    installDate: c.installDate,
    installerId: c.installerId,
    installerName: c.installer.name,
  })))
}
