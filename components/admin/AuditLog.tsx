// components/admin/AuditLog.tsx
// Table of AuditEntry records. Paid rows highlighted amber.

interface AuditEntry {
  id: string
  createdAt: string
  action: string
  actor: string
  costAud: number | null
  detail: string | null
  lead: {
    firstName: string
    lastName: string
  }
}

interface AuditLogProps {
  entries: AuditEntry[]
  totalSpendAud: number
}

const ACTION_LABELS: Record<string, string> = {
  lead_received:             "Lead received",
  human_confirmed:           "Lead confirmed (project created)",
  opensolar_created:         "Project created in OpenSolar",
  opensolar_create_failed:   "Project creation FAILED",
  rejected:                  "Lead rejected",
  webhook_received:          "Webhook received",
  proposal_sent:             "Proposal sent",
  proposal_viewed:           "Proposal viewed",
  proposal_accepted:         "Proposal accepted",
  finance_approved:          "Finance approved",
  contract_signed:           "Contract signed",
  deposit_paid:              "Deposit paid",
  permit_submitted:          "Permit submitted",
  job_sold:                  "Job sold",
  job_installed:             "Installation complete",
  premium_imagery_requested: "Premium imagery enabled",
  permit_pack_requested:     "Permit pack ordered",
  review_requested:          "Google review requested",
  appointment_set:           "Appointment scheduled",
  solar_vic_updated:         "Solar Vic status updated",
  finance_updated:           "Finance details updated",
  estimation_signed:         "Estimation signed",
  stock_confirmed:           "Stock confirmed",
  build_date_set:            "Build date set",
  quote_signed:              "Quote signed",
  build_date_updated:        "Build date updated",
  google_review_received:    "Google review received",
  thank_you_sent:            "Thank you sent",
}

function fmtDate(iso: string) {
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(iso))
}

export function AuditLog({ entries, totalSpendAud }: AuditLogProps) {
  return (
    <div>
      {/* Spend summary */}
      <div className="bg-[#202020] border border-[#2e2e2e] rounded-xl p-5 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <p className="text-[#555] text-xs uppercase tracking-wider mb-1">Total API spend (all time)</p>
          <p className="text-white font-semibold text-2xl">
            ${totalSpendAud.toFixed(2)} <span className="text-[#555] text-sm font-normal">AUD</span>
          </p>
        </div>
        <div className="text-[#555] text-sm">{entries.length} entries</div>
      </div>

      <div className="bg-[#202020] border border-[#2e2e2e] rounded-xl overflow-hidden">

        {/* ── Mobile card list (hidden on sm+) ─────────────────── */}
        <div className="sm:hidden divide-y divide-[#2a2a2a]">
          {entries.length === 0 ? (
            <p className="px-4 py-12 text-center text-[#555] text-sm">No audit entries yet.</p>
          ) : (
            entries.map(entry => {
              const isPaid = entry.costAud != null && entry.costAud > 0
              return (
                <div
                  key={entry.id}
                  className={`px-4 py-3.5 ${isPaid ? "bg-amber-950/20" : ""}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium truncate">
                        {entry.lead.firstName} {entry.lead.lastName}
                      </p>
                      <p className="text-[#aaa] text-xs mt-0.5 leading-snug">
                        {ACTION_LABELS[entry.action] ?? entry.action}
                      </p>
                      <p className="text-[#555] text-xs mt-1">{fmtDate(entry.createdAt)}</p>
                    </div>
                    {isPaid && (
                      <span className="font-mono font-semibold text-amber-400 text-sm flex-shrink-0">
                        ${entry.costAud!.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* ── Desktop table (hidden on mobile) ─────────────────── */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2e2e2e]">
                <th className="px-4 py-3 text-left text-[#555] text-xs uppercase tracking-wider font-medium">Date</th>
                <th className="px-4 py-3 text-left text-[#555] text-xs uppercase tracking-wider font-medium">Customer</th>
                <th className="px-4 py-3 text-left text-[#555] text-xs uppercase tracking-wider font-medium">Action</th>
                <th className="px-4 py-3 text-left text-[#555] text-xs uppercase tracking-wider font-medium">Actor</th>
                <th className="px-4 py-3 text-right text-[#555] text-xs uppercase tracking-wider font-medium">Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a2a2a]">
              {entries.map(entry => {
                const isPaid = entry.costAud != null && entry.costAud > 0
                return (
                  <tr
                    key={entry.id}
                    className={`${isPaid ? "bg-amber-950/20" : ""} hover:bg-[#2a2a2a] transition-colors`}
                  >
                    <td className="px-4 py-3 text-[#555] whitespace-nowrap">
                      {fmtDate(entry.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-white">
                      {entry.lead.firstName} {entry.lead.lastName}
                    </td>
                    <td className="px-4 py-3 text-[#aaa]">
                      {ACTION_LABELS[entry.action] ?? entry.action}
                    </td>
                    <td className="px-4 py-3 text-[#555] font-mono text-xs">
                      {entry.actor}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {isPaid ? (
                        <span className="font-mono font-semibold text-amber-400">
                          ${entry.costAud!.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-[#444] text-xs">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
              {entries.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-[#555]">
                    No audit entries yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  )
}
