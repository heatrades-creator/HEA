export const dynamic = 'force-dynamic'
export const metadata = { title: 'Pipeline | HEA' }

import { SalesPipelineBoard } from '@/components/dashboard/pipeline/SalesPipelineBoard'
import type { GASJob } from '@/components/dashboard/pipeline/BuildTheDealCard'

async function getJobs(): Promise<GASJob[]> {
  const gasUrl = process.env.JOBS_GAS_URL
  if (!gasUrl) return []
  try {
    const res = await fetch(gasUrl, { cache: 'no-store' })
    if (!res.ok) return []
    return await res.json()
  } catch {
    return []
  }
}

const STAGE2_STATUSES = new Set(['Quoted', 'Contract', 'Booked', 'In Progress'])

export default async function PipelinePage() {
  const jobs = await getJobs()

  const stage1 = jobs.filter(j => j.status === 'Lead')
  const stage2 = jobs.filter(j => STAGE2_STATUSES.has(j.status))
  const stage3 = jobs.filter(j => j.status === 'Complete')

  return (
    <SalesPipelineBoard
      stage1Jobs={stage1}
      stage2Jobs={stage2}
      stage3Jobs={stage3}
    />
  )
}
