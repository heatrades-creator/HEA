import { prisma } from "@/lib/db"
import { JobPipeline } from "@/components/admin/JobPipeline"

export const dynamic = "force-dynamic"

export default async function JobsPage() {
  const jobs = await prisma.lead.findMany({
    where: { status: "opensolar_created" },
    orderBy: { openSolarCreatedAt: "desc" },
  })

  // Serialize dates to strings for client component
  const serialized = jobs.map(j => ({
    ...j,
    createdAt:          j.createdAt.toISOString(),
    updatedAt:          j.updatedAt.toISOString(),
    openSolarCreatedAt: j.openSolarCreatedAt?.toISOString() ?? null,
    proposalSentAt:     j.proposalSentAt?.toISOString() ?? null,
    proposalViewedAt:   j.proposalViewedAt?.toISOString() ?? null,
    proposalAcceptedAt: j.proposalAcceptedAt?.toISOString() ?? null,
    financeApprovedAt:  j.financeApprovedAt?.toISOString() ?? null,
    contractSignedAt:   j.contractSignedAt?.toISOString() ?? null,
    depositPaidAt:      j.depositPaidAt?.toISOString() ?? null,
    permitSubmittedAt:  j.permitSubmittedAt?.toISOString() ?? null,
    soldAt:             j.soldAt?.toISOString() ?? null,
    installedAt:        j.installedAt?.toISOString() ?? null,
  }))

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Active Jobs</h1>
        <p className="text-[#555] text-sm mt-1">
          Projects created in OpenSolar — milestones updated automatically via webhooks.
        </p>
      </div>
      <JobPipeline jobs={serialized} />
    </div>
  )
}
