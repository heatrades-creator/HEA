import { NextRequest, NextResponse } from 'next/server'
import { getInstallerFromRequest } from '@/lib/installer-auth'
import { prisma } from '@/lib/db'
import { leadToJob } from '@/lib/installer-jobs'

const HIDDEN_STATUSES = new Set(['Complete'])
const EXCLUDED_LEAD_STATUSES = ['rejected', 'duplicate']

export async function GET(req: NextRequest) {
  const installer = getInstallerFromRequest(req)
  if (!installer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const gasUrl = process.env.JOBS_GAS_URL

  const [gasResult, claims, leads] = await Promise.all([
    gasUrl
      ? fetch(gasUrl, { cache: 'no-store' }).then(r => r.text()).catch(() => null)
      : Promise.resolve(null),
    prisma.jobClaim.findMany({ include: { installer: { select: { id: true, name: true } } } }),
    prisma.lead.findMany({
      where: { status: { notIn: EXCLUDED_LEAD_STATUSES } },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  // Parse GAS jobs — may be null if GAS not configured or network error
  let gasJobs: Array<{ jobNumber: string; status: string; [key: string]: unknown }> = []
  if (gasResult) {
    try {
      const parsed = JSON.parse(gasResult)
      if (Array.isArray(parsed) && !parsed[0]?.error) gasJobs = parsed
    } catch {}
  }

  // Skip Prisma leads that already exist in GAS (matched by gasJobNumber)
  const gasJobNumbers = new Set(gasJobs.map(j => j.jobNumber))
  const leadJobs = leads
    .filter(l => !l.gasJobNumber || !gasJobNumbers.has(l.gasJobNumber))
    .map(leadToJob)

  // GAS jobs first, then leads; both filtered to hide Complete
  const allJobs = [
    ...gasJobs.filter(j => !HIDDEN_STATUSES.has(j.status)),
    ...leadJobs.filter(j => !HIDDEN_STATUSES.has(j.status)),
  ]

  type ClaimWithInstaller = (typeof claims)[number]
  const claimMap = new Map<string, ClaimWithInstaller>(claims.map(c => [c.jobNumber, c]))

  const active = allJobs.map(j => {
    const claim = claimMap.get(j.jobNumber as string)
    return {
      ...j,
      claim: claim
        ? {
            installerId: claim.installerId,
            installerName: claim.installer.name,
            installDate: claim.installDate,
            claimedAt: claim.createdAt.toISOString(),
          }
        : null,
    }
  })

  return NextResponse.json(active)
}
