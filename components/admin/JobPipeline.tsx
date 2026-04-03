// components/admin/JobPipeline.tsx
// List of active jobs with OpenSolar stage + milestone timestamps.

interface Job {
  id: string
  firstName: string
  lastName: string
  email: string
  address: string
  suburb: string
  state: string
  openSolarProjectId: number | null
  openSolarShareLink: string | null
  openSolarStage: string | null
  openSolarSystemKw: number | null
  openSolarPriceAud: number | null
  openSolarCreatedAt: string | null
  openSolarCreatedBy: string | null
  proposalSentAt: string | null
  contractSignedAt: string | null
  depositPaidAt: string | null
  installedAt: string | null
  soldAt: string | null
}

function fmt(d: string | null | undefined) {
  if (!d) return null
  return new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric" }).format(new Date(d))
}

function Milestone({ label, date }: { label: string; date: string | null }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${date ? "bg-[#ffd100]" : "bg-[#333]"}`} />
      <span className={`text-xs ${date ? "text-[#aaa]" : "text-[#444]"}`}>
        {label}{date ? `: ${date}` : ""}
      </span>
    </div>
  )
}

interface JobPipelineProps {
  jobs: Job[]
}

export function JobPipeline({ jobs }: JobPipelineProps) {
  if (jobs.length === 0) {
    return (
      <div className="text-center py-16 text-[#555]">
        No active jobs yet. Confirm a lead to create an OpenSolar project.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {jobs.map(job => (
        <div key={job.id} className="bg-[#202020] border border-[#2e2e2e] rounded-xl p-5 hover:border-[#3a3a3a] transition-colors">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h3 className="text-white font-semibold">
                {job.firstName} {job.lastName}
              </h3>
              <p className="text-[#aaa] text-sm">{job.address}, {job.suburb} {job.state}</p>
              {job.openSolarCreatedBy && (
                <p className="text-[#555] text-xs mt-0.5">
                  Created by {job.openSolarCreatedBy}
                  {job.openSolarCreatedAt ? ` on ${fmt(job.openSolarCreatedAt)}` : ""}
                </p>
              )}
            </div>
            <div className="text-right flex-shrink-0 space-y-1">
              {job.openSolarProjectId && (
                <p className="text-[#555] text-xs font-mono">#{job.openSolarProjectId}</p>
              )}
              {job.openSolarStage && (
                <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-blue-950 border border-blue-800 text-blue-300">
                  {job.openSolarStage}
                </span>
              )}
            </div>
          </div>

          {/* System info */}
          {(job.openSolarSystemKw || job.openSolarPriceAud) && (
            <div className="flex gap-6 mb-4">
              {job.openSolarSystemKw && (
                <div>
                  <p className="text-[#555] text-xs">System</p>
                  <p className="text-white font-medium">{job.openSolarSystemKw} kW</p>
                </div>
              )}
              {job.openSolarPriceAud && (
                <div>
                  <p className="text-[#555] text-xs">Price</p>
                  <p className="text-white font-medium">
                    ${job.openSolarPriceAud.toLocaleString("en-AU", { maximumFractionDigits: 0 })}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Milestones */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 mb-4">
            <Milestone label="Proposal sent"    date={fmt(job.proposalSentAt)} />
            <Milestone label="Contract signed"  date={fmt(job.contractSignedAt)} />
            <Milestone label="Deposit paid"     date={fmt(job.depositPaidAt)} />
            <Milestone label="Sold"             date={fmt(job.soldAt)} />
            <Milestone label="Installed"        date={fmt(job.installedAt)} />
          </div>

          {/* Links */}
          <div className="flex gap-3 pt-3 border-t border-[#2e2e2e]">
            {job.openSolarShareLink && (
              <a
                href={job.openSolarShareLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#ffd100] hover:underline"
              >
                View proposal →
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
