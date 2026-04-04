import { prisma } from "@/lib/db"
import { Prisma } from "@prisma/client"
import { AuditLog } from "@/components/admin/AuditLog"

type AuditEntryWithLead = Prisma.AuditEntryGetPayload<{
  include: { lead: { select: { firstName: true; lastName: true } } }
}>

export const dynamic = "force-dynamic"

export default async function AuditPage() {
  const [entries, spendResult] = await Promise.all([
    prisma.auditEntry.findMany({
      orderBy: { createdAt: "desc" },
      include: { lead: { select: { firstName: true, lastName: true } } },
    }),
    prisma.auditEntry.aggregate({
      where: { costAud: { not: null } },
      _sum: { costAud: true },
    }),
  ])

  const totalSpendAud = spendResult._sum.costAud ?? 0

  // Serialize dates
  const serialized = entries.map((e: AuditEntryWithLead) => ({
    ...e,
    createdAt: e.createdAt.toISOString(),
  }))

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Audit Log</h1>
        <p className="text-[#555] text-sm mt-1">
          Every action, who did it, and what it cost. Amber rows = paid actions.
        </p>
      </div>
      <AuditLog entries={serialized} totalSpendAud={totalSpendAud} />
    </div>
  )
}
