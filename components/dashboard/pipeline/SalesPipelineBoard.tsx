'use client'

import { useState } from 'react'
import { BuildTheDealCard } from './BuildTheDealCard'
import { CloseTheDealCard } from './CloseTheDealCard'
import { PostInstallCard } from './PostInstallCard'
import type { GASJob } from './BuildTheDealCard'

interface Props {
  stage1Jobs: GASJob[]
  stage2Jobs: GASJob[]
  stage3Jobs: GASJob[]
}

interface ColumnProps {
  title: string
  subtitle: string
  count: number
  accentClass: string
  children: React.ReactNode
}

function PipelineColumn({ title, subtitle, count, accentClass, children }: ColumnProps) {
  return (
    <div className="flex flex-col min-w-0">
      <div className={`flex items-center gap-2 mb-3 pb-3 border-b-2 ${accentClass}`}>
        <div className="flex-1 min-w-0">
          <h2 className="text-[#111827] font-semibold text-sm leading-tight">{title}</h2>
          <p className="text-[#9ca3af] text-xs mt-0.5">{subtitle}</p>
        </div>
        <span className="flex-shrink-0 text-xs font-bold tabular-nums bg-[#f3f4f6] text-[#6b7280] rounded-full px-2 py-0.5">
          {count}
        </span>
      </div>
      <div className="space-y-3 overflow-y-auto flex-1">
        {children}
      </div>
    </div>
  )
}

export function SalesPipelineBoard({ stage1Jobs, stage2Jobs, stage3Jobs }: Props) {
  const [s1, setS1] = useState(stage1Jobs)
  const [s2, setS2] = useState(stage2Jobs)
  const [s3, setS3] = useState(stage3Jobs)

  function advanceFromS1(jobNumber: string) {
    const job = s1.find(j => j.jobNumber === jobNumber)
    if (!job) return
    setS1(prev => prev.filter(j => j.jobNumber !== jobNumber))
    setS2(prev => [{ ...job, status: 'Quoted' }, ...prev])
  }

  function advanceFromS2(jobNumber: string) {
    const job = s2.find(j => j.jobNumber === jobNumber)
    if (!job) return
    setS2(prev => prev.filter(j => j.jobNumber !== jobNumber))
    setS3(prev => [{ ...job, status: 'Complete' }, ...prev])
  }

  const totalActive = s1.length + s2.length

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-[#111827] text-xl font-semibold">Sales Pipeline</h1>
        <p className="text-[#6b7280] text-sm mt-0.5">
          {totalActive} active {totalActive === 1 ? 'job' : 'jobs'} · {s3.length} complete
        </p>
      </div>

      {/* 3-column grid on md+, stack on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stage 1 — Build the Deal */}
        <PipelineColumn
          title="Build the Deal"
          subtitle="New leads — get NMI + estimation"
          count={s1.length}
          accentClass="border-[#fbbf24]"
        >
          {s1.length === 0 ? (
            <p className="text-[#9ca3af] text-sm text-center py-8">No leads at this stage</p>
          ) : (
            s1.map(job => (
              <BuildTheDealCard key={job.jobNumber} job={job} onAdvanced={advanceFromS1} />
            ))
          )}
        </PipelineColumn>

        {/* Stage 2 — Close the Deal */}
        <PipelineColumn
          title="Close the Deal"
          subtitle="Estimation signed — book & deposit"
          count={s2.length}
          accentClass="border-blue-400"
        >
          {s2.length === 0 ? (
            <p className="text-[#9ca3af] text-sm text-center py-8">No jobs at this stage</p>
          ) : (
            s2.map(job => (
              <CloseTheDealCard key={job.jobNumber} job={job} onAdvanced={advanceFromS2} />
            ))
          )}
        </PipelineColumn>

        {/* Stage 3 — Post-Install */}
        <PipelineColumn
          title="Post-Install"
          subtitle="Installed — review & thank you"
          count={s3.length}
          accentClass="border-green-400"
        >
          {s3.length === 0 ? (
            <p className="text-[#9ca3af] text-sm text-center py-8">No completed jobs</p>
          ) : (
            s3.map(job => (
              <PostInstallCard key={job.jobNumber} job={job} />
            ))
          )}
        </PipelineColumn>
      </div>
    </div>
  )
}
