import { NextRequest, NextResponse } from 'next/server'
import { getInstallerFromRequest } from '@/lib/installer-auth'
import { prisma } from '@/lib/db'
import { leadToJob } from '@/lib/installer-jobs'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const installer = getInstallerFromRequest(req)
  if (!installer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  // Synthetic Prisma lead IDs (LEAD-{cuid})
  if (id.startsWith('LEAD-')) {
    const leadId = id.replace('LEAD-', '')
    const [lead, claim] = await Promise.all([
      prisma.lead.findUnique({ where: { id: leadId } }),
      prisma.jobClaim.findUnique({
        where: { jobNumber: id },
        include: { installer: { select: { id: true, name: true } } },
      }),
    ])
    if (!lead) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({
      ...leadToJob(lead),
      claim: claim
        ? {
            installerId: claim.installerId,
            installerName: claim.installer.name,
            installDate: claim.installDate,
            claimedAt: claim.createdAt.toISOString(),
          }
        : null,
    })
  }

  // GAS job lookup
  const gasUrl = process.env.JOBS_GAS_URL
  if (!gasUrl) return NextResponse.json({ error: 'GAS not configured' }, { status: 503 })

  const [gasRes, claim] = await Promise.all([
    fetch(`${gasUrl}?id=${encodeURIComponent(id)}`, { cache: 'no-store' }),
    prisma.jobClaim.findUnique({
      where: { jobNumber: id },
      include: { installer: { select: { id: true, name: true } } },
    }),
  ])

  const text = await gasRes.text()
  let job
  try {
    job = JSON.parse(text)
  } catch {
    return NextResponse.json({ error: 'GAS parse error' }, { status: 502 })
  }
  if (job.error) return NextResponse.json({ error: job.error }, { status: 404 })

  return NextResponse.json({
    ...job,
    claim: claim
      ? {
          installerId: claim.installerId,
          installerName: claim.installer.name,
          installDate: claim.installDate,
          claimedAt: claim.createdAt.toISOString(),
        }
      : null,
  })
}
