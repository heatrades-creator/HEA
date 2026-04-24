"use client"

import { useState } from "react"
import { BuildDateModal } from "./modals/BuildDateModal"
import { DepositModal }   from "./modals/DepositModal"

export interface Stage2Lead {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  suburb: string
  state: string
  estimationSignedAt: string
  openSolarProjectId: number | null
  openSolarShareLink: string | null
  openSolarSystemKw:  number | null
  openSolarPriceAud:  number | null
  gasDriveUrl:        string | null
  // Stage 2 fields
  stockConfirmed:  boolean | null
  buildDate:       string | null
  quoteSignedAt:   string | null
  depositAmountAud: number | null
  depositPaidAt:   string | null
}

interface Props {
  lead: Stage2Lead
}

function fmtDate(iso: string) {
  return new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso))
}

type Modal = "builddate" | "deposit"

export function Stage2Card({ lead: initial }: Props) {
  const [lead, setLead]         = useState(initial)
  const [modal, setModal]       = useState<Modal | null>(null)
  const [stockLoading, setStockLoading] = useState(false)
  const [quoteLoading, setQuoteLoading] = useState(false)
  const [error, setError]       = useState<string | null>(null)

  async function toggleStock() {
    setStockLoading(true)
    setError(null)
    const next = !lead.stockConfirmed
    const res = await fetch(`/api/admin/pipeline/${lead.id}/stock-confirmed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirmed: next }),
    })
    setStockLoading(false)
    if (res.ok) {
      setLead(l => ({ ...l, stockConfirmed: next }))
    } else {
      setError("Failed to update stock status.")
    }
  }

  async function markQuoteSigned() {
    setQuoteLoading(true)
    setError(null)
    const res = await fetch(`/api/admin/pipeline/${lead.id}/quote-signed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    })
    setQuoteLoading(false)
    if (res.ok) {
      setLead(l => ({ ...l, quoteSignedAt: new Date().toISOString() }))
    } else {
      setError("Failed to mark quote signed.")
    }
  }

  return (
    <>
      <div className="bg-[#202020] border border-[#2e2e2e] rounded-xl p-4 space-y-3 hover:border-[#3a3a3a] transition-colors">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-white font-semibold truncate">{lead.firstName} {lead.lastName}</p>
            <p className="text-[#aaa] text-xs mt-0.5">{lead.address}, {lead.suburb}</p>
          </div>
          <div className="flex-shrink-0 text-right">
            {lead.openSolarSystemKw && (
              <p className="text-[#ffd100] text-xs font-semibold">{lead.openSolarSystemKw} kW</p>
            )}
            {lead.openSolarPriceAud && (
              <p className="text-[#aaa] text-xs">${lead.openSolarPriceAud.toLocaleString()}</p>
            )}
          </div>
        </div>

        <p className="text-[#555] text-xs">Estimation signed {fmtDate(lead.estimationSignedAt)}</p>

        {/* Checklist */}
        <div className="space-y-2 py-1">
          {/* Stock */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleStock}
              disabled={stockLoading}
              className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center text-xs border transition-colors ${
                lead.stockConfirmed
                  ? "bg-green-600 border-green-600 text-white"
                  : "border-[#444] hover:border-[#ffd100]"
              } disabled:opacity-50`}
            >
              {lead.stockConfirmed && "✓"}
            </button>
            <button onClick={toggleStock} disabled={stockLoading} className="text-xs text-left hover:text-white transition-colors text-[#aaa] disabled:opacity-50">
              {lead.stockConfirmed ? "Stock confirmed — Solar Juice" : "Confirm stock with Solar Juice"}
            </button>
            <a
              href="https://www.solarjuice.com.au"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto text-xs text-[#555] hover:text-[#aaa] transition-colors flex-shrink-0"
            >
              ↗
            </a>
          </div>

          {/* Build date */}
          <div className="flex items-center gap-2">
            <span className={`w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center text-xs ${
              lead.buildDate ? "bg-green-600 text-white" : "border border-[#444]"
            }`}>
              {lead.buildDate && "✓"}
            </span>
            {lead.buildDate ? (
              <span className="text-xs text-[#aaa]">Build date — {fmtDate(lead.buildDate)}</span>
            ) : (
              <button onClick={() => setModal("builddate")} className="text-xs text-[#555] hover:text-white transition-colors">
                Set build date
              </button>
            )}
            {lead.buildDate && (
              <button onClick={() => setModal("builddate")} className="ml-auto text-xs text-[#555] hover:text-[#aaa] transition-colors">
                Edit
              </button>
            )}
          </div>

          {/* Quote signed */}
          <div className="flex items-center gap-2">
            <span className={`w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center text-xs ${
              lead.quoteSignedAt ? "bg-green-600 text-white" : "border border-[#444]"
            }`}>
              {lead.quoteSignedAt && "✓"}
            </span>
            {lead.quoteSignedAt ? (
              <span className="text-xs text-[#aaa]">Quote signed — {fmtDate(lead.quoteSignedAt)}</span>
            ) : (
              <button onClick={markQuoteSigned} disabled={quoteLoading} className="text-xs text-[#555] hover:text-white transition-colors disabled:opacity-50">
                {quoteLoading ? "Saving…" : "Mark quote signed"}
              </button>
            )}
          </div>

          {/* Deposit */}
          <div className="flex items-center gap-2">
            <span className={`w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center text-xs ${
              lead.depositPaidAt ? "bg-green-600 text-white" : "border border-[#444]"
            }`}>
              {lead.depositPaidAt && "✓"}
            </span>
            {lead.depositPaidAt ? (
              <span className="text-xs text-[#aaa]">
                Deposit ${lead.depositAmountAud?.toLocaleString() ?? "—"} received {fmtDate(lead.depositPaidAt)}
              </span>
            ) : (
              <button onClick={() => setModal("deposit")} className="text-xs text-[#555] hover:text-white transition-colors">
                Record deposit (10%)
              </button>
            )}
          </div>
        </div>

        {error && <p className="text-red-400 text-xs">{error}</p>}

        {/* Links */}
        <div className="flex gap-2 flex-wrap pt-1">
          {lead.openSolarShareLink && (
            <a href={lead.openSolarShareLink} target="_blank" rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#2a2a2a] text-[#aaa] hover:text-white border border-[#3a3a3a] transition-colors">
              OpenSolar ↗
            </a>
          )}
          {lead.gasDriveUrl && (
            <a href={lead.gasDriveUrl} target="_blank" rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#2a2a2a] text-[#aaa] hover:text-white border border-[#3a3a3a] transition-colors">
              Client Files ↗
            </a>
          )}
        </div>
      </div>

      {modal === "builddate" && (
        <BuildDateModal
          lead={lead}
          current={lead.buildDate}
          onClose={() => setModal(null)}
          onSaved={buildDate => { setLead(l => ({ ...l, buildDate })); setModal(null) }}
        />
      )}
      {modal === "deposit" && (
        <DepositModal
          lead={lead}
          onClose={() => setModal(null)}
          onSaved={(amountAud, paidAt) => {
            setLead(l => ({ ...l, depositAmountAud: amountAud, depositPaidAt: paidAt }))
            setModal(null)
          }}
        />
      )}
    </>
  )
}
