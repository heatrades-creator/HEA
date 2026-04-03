import { notFound } from "next/navigation"
import { prisma } from "@/lib/db"

export const dynamic = "force-dynamic"

function formatDate(d: Date | null | undefined) {
  if (!d) return null
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric", month: "long", year: "numeric",
  }).format(new Date(d))
}

export default async function ProposalPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  const lead = await prisma.lead.findUnique({
    where: { proposalToken: token },
  })

  if (!lead) notFound()

  // Only show meaningful info — no internal IDs or staff notes
  const milestones = [
    { label: "Quote received",       date: lead.createdAt,         done: true },
    { label: "Proposal prepared",    date: lead.proposalSentAt,    done: !!lead.proposalSentAt },
    { label: "Finance approved",     date: lead.financeApprovedAt, done: !!lead.financeApprovedAt },
    { label: "Contract signed",      date: lead.contractSignedAt,  done: !!lead.contractSignedAt },
    { label: "Deposit paid",         date: lead.depositPaidAt,     done: !!lead.depositPaidAt },
    { label: "Permit submitted",     date: lead.permitSubmittedAt, done: !!lead.permitSubmittedAt },
    { label: "Installation complete",date: lead.installedAt,       done: !!lead.installedAt },
  ]

  return (
    <main className="min-h-screen bg-[#181818] py-16 px-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-10">
          <img src="/Logo_transparent.png" alt="HEA Group" className="h-12 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-white mb-2">
            Your Solar Project
          </h1>
          <p className="text-[#aaa]">
            Hi {lead.firstName} — here&apos;s the current status of your solar quote.
          </p>
        </div>

        {/* System info if available */}
        {(lead.openSolarSystemKw || lead.openSolarPriceAud) && (
          <div className="bg-[#202020] rounded-xl border border-[#2e2e2e] p-6 mb-6 grid grid-cols-2 gap-4">
            {lead.openSolarSystemKw && (
              <div>
                <p className="text-[#555] text-xs uppercase tracking-wider mb-1">System size</p>
                <p className="text-white font-semibold text-lg">{lead.openSolarSystemKw} kW</p>
              </div>
            )}
            {lead.openSolarPriceAud && (
              <div>
                <p className="text-[#555] text-xs uppercase tracking-wider mb-1">Quoted price</p>
                <p className="text-white font-semibold text-lg">
                  ${lead.openSolarPriceAud.toLocaleString("en-AU", { maximumFractionDigits: 0 })}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Proposal link */}
        {lead.openSolarShareLink && (
          <div className="bg-[#202020] rounded-xl border border-[#2e2e2e] p-6 mb-6">
            <p className="text-[#aaa] text-sm mb-3">View your full proposal, financing options, and sign online:</p>
            <a
              href={lead.openSolarShareLink}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center bg-[#ffd100] text-black font-semibold py-3 rounded-lg hover:bg-[#e6bc00] transition-colors"
            >
              View Proposal →
            </a>
          </div>
        )}

        {/* Milestone timeline */}
        <div className="bg-[#202020] rounded-xl border border-[#2e2e2e] p-6">
          <h2 className="text-white font-semibold mb-5">Project milestones</h2>
          <div className="space-y-4">
            {milestones.map(({ label, date, done }, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  done
                    ? "border-[#ffd100] bg-[#ffd100]"
                    : "border-[#333] bg-transparent"
                }`}>
                  {done && (
                    <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <div>
                  <p className={`text-sm font-medium ${done ? "text-white" : "text-[#555]"}`}>{label}</p>
                  {date && (
                    <p className="text-[#555] text-xs mt-0.5">{formatDate(date)}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-[#555] text-xs mt-8">
          Questions? Call us on{" "}
          <a href="tel:1300123456" className="text-[#aaa] hover:text-white transition-colors">
            1300 123 456
          </a>
        </p>
      </div>
    </main>
  )
}
