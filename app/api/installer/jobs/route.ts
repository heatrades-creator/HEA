import { NextRequest, NextResponse } from 'next/server'
import { getInstallerFromRequest } from '@/lib/installer-auth'
import { prisma } from '@/lib/db'

const ACTIVE_STATUSES = new Set(['Booked', 'In Progress'])

export async function GET(req: NextRequest) {
  const installer = getInstallerFromRequest(req)
  if (!installer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const gasUrl = process.env.JOBS_GAS_URL
  if (!gasUrl) return NextResponse.json({ error: 'GAS not configured' }, { status: 503 })

  const [gasRes, claims] = await Promise.all([
    fetch(gasUrl, { cache: 'no-store' }),
    prisma.jobClaim.findMany({ include: { installer: { select: { id: true, name: true } } } }),
  ])

  const text = await gasRes.text()
  let jobs
  try {
    jobs = JSON.parse(text)
  } catch {
    return NextResponse.json({ error: 'GAS parse error' }, { status: 502 })
  }
  if (jobs.error) return NextResponse.json({ error: jobs.error }, { status: 502 })

  type ClaimWithInstaller = (typeof claims)[number]
  const claimMap = new Map<string, ClaimWithInstaller>(claims.map(c => [c.jobNumber, c]))

  const active = jobs
    .filter((j: { status: string }) => ACTIVE_STATUSES.has(j.status))
    .map((j: { jobNumber: string }) => {
      const claim = claimMap.get(j.jobNumber)
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
