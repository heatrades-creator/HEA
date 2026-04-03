import { prisma } from "@/lib/db"
import Link from "next/link"
import { getCost } from "@/lib/cost"

export const dynamic = "force-dynamic"

export default async function AdminOverviewPage() {
  const now   = new Date()
  const week  = new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000)
  const month = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const [
    pendingCount,
    leadsThisWeek,
    leadsThisMonth,
    activeJobs,
    recentAudit,
    monthlySpend,
  ] = await Promise.all([
    prisma.lead.count({ where: { status: "pending_review" } }),
    prisma.lead.count({ where: { createdAt: { gte: week } } }),
    prisma.lead.count({ where: { createdAt: { gte: month } } }),
    prisma.lead.count({ where: { status: "opensolar_created" } }),
    prisma.auditEntry.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { lead: { select: { firstName: true, lastName: true } } },
    }),
    prisma.auditEntry.aggregate({
      where: { createdAt: { gte: month }, costAud: { not: null } },
      _sum: { costAud: true },
    }),
  ])

  const spendAud  = monthlySpend._sum.costAud ?? 0
  const projectCost = getCost("create_project")

  const stats = [
    {
      label: "Pending review",
      value: pendingCount,
      href:  "/admin/leads",
      urgent: pendingCount > 3,
      sub: "leads waiting",
    },
    {
      label: "Leads this week",
      value: leadsThisWeek,
      href:  "/admin/leads",
      urgent: false,
      sub: "new quote requests",
    },
    {
      label: "Active jobs",
      value: activeJobs,
      href:  "/admin/jobs",
      urgent: false,
      sub: "in OpenSolar",
    },
    {
      label: "API spend (30 days)",
      value: `$${spendAud.toFixed(2)}`,
      href:  "/admin/audit",
      urgent: false,
      sub: "charged to wallet",
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">OpenSolar Dashboard</h1>
        <p className="text-[#555] text-sm mt-1">
          HEA Group — Solar Lead Management
        </p>
      </div>

      {/* Cost config warning */}
      {!projectCost.knownCost && (
        <div className="bg-amber-950/40 border border-amber-800 rounded-xl px-5 py-4 flex items-start gap-3">
          <span className="text-amber-400 text-lg flex-shrink-0">⚠</span>
          <div>
            <p className="text-amber-300 font-semibold text-sm">API cost not configured</p>
            <p className="text-amber-400/70 text-xs mt-1">
              {projectCost.blockedReason}
            </p>
            <p className="text-amber-400/70 text-xs mt-0.5">
              The confirm button will be disabled until this is set.
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(({ label, value, href, urgent, sub }) => (
          <Link
            key={label}
            href={href}
            className={`bg-[#202020] border rounded-xl p-5 hover:border-[#3a3a3a] transition-colors block ${
              urgent ? "border-amber-800 bg-amber-950/20" : "border-[#2e2e2e]"
            }`}
          >
            <p className="text-[#555] text-xs uppercase tracking-wider mb-2">{label}</p>
            <p className={`text-3xl font-bold ${urgent ? "text-amber-400" : "text-white"}`}>
              {value}
            </p>
            <p className="text-[#555] text-xs mt-1">{sub}</p>
          </Link>
        ))}
      </div>

      {/* Recent activity */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold">Recent activity</h2>
          <Link href="/admin/audit" className="text-sm text-[#ffd100] hover:underline">
            View all →
          </Link>
        </div>
        <div className="bg-[#202020] border border-[#2e2e2e] rounded-xl overflow-hidden">
          {recentAudit.length === 0 ? (
            <p className="text-[#555] text-center py-8 text-sm">No activity yet.</p>
          ) : (
            <div className="divide-y divide-[#2a2a2a]">
              {recentAudit.map(entry => (
                <div key={entry.id} className={`px-5 py-3.5 flex items-center justify-between ${entry.costAud ? "bg-amber-950/10" : ""}`}>
                  <div>
                    <p className="text-white text-sm">
                      {entry.lead.firstName} {entry.lead.lastName}
                    </p>
                    <p className="text-[#555] text-xs">{entry.action.replace(/_/g, " ")}</p>
                  </div>
                  <div className="text-right">
                    {entry.costAud ? (
                      <span className="text-amber-400 font-mono text-sm font-semibold">
                        ${entry.costAud.toFixed(2)}
                      </span>
                    ) : null}
                    <p className="text-[#555] text-xs">
                      {new Intl.DateTimeFormat("en-AU", {
                        day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                      }).format(new Date(entry.createdAt))}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-4">
        <Link
          href="/admin/leads"
          className="bg-[#202020] border border-[#2e2e2e] rounded-xl p-5 hover:border-[#ffd100] transition-colors"
        >
          <p className="text-[#ffd100] font-semibold mb-1">Review leads →</p>
          <p className="text-[#555] text-sm">
            {pendingCount} lead{pendingCount !== 1 ? "s" : ""} waiting for review
          </p>
        </Link>
        <Link
          href="/quote"
          target="_blank"
          className="bg-[#202020] border border-[#2e2e2e] rounded-xl p-5 hover:border-[#3a3a3a] transition-colors"
        >
          <p className="text-white font-semibold mb-1">Public quote form ↗</p>
          <p className="text-[#555] text-sm">View the customer-facing quote page</p>
        </Link>
      </div>
    </div>
  )
}
