"use client"

import { useState } from "react"
import { ThankYouModal } from "./modals/ThankYouModal"

export interface Stage3Lead {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  suburb: string
  installedAt: string
  openSolarSystemKw:  number | null
  openSolarPriceAud:  number | null
  openSolarShareLink: string | null
  gasDriveUrl:        string | null
  // Stage 3 fields
  googleReviewReceivedAt: string | null
  thankYouSentAt:         string | null
}

interface Props {
  lead: Stage3Lead
}

function fmtDate(iso: string) {
  return new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso))
}

export function Stage3Card({ lead: initial }: Props) {
  const [lead, setLead]         = useState(initial)
  const [showThankyou, setShowThankyou] = useState(false)
  const [reviewLoading, setReviewLoading]       = useState(false)
  const [reviewReceivedLoading, setReviewReceivedLoading] = useState(false)
  const [error, setError]       = useState<string | null>(null)

  async function requestReview() {
    setReviewLoading(true)
    setError(null)
    const res = await fetch(`/api/admin/leads/${lead.id}/review`, { method: "POST" })
    setReviewLoading(false)
    if (!res.ok) setError("Failed to send review request.")
  }

  async function markReviewReceived() {
    setReviewReceivedLoading(true)
    setError(null)
    const res = await fetch(`/api/admin/pipeline/${lead.id}/review-received`, { method: "POST" })
    setReviewReceivedLoading(false)
    if (res.ok) {
      setLead(l => ({ ...l, googleReviewReceivedAt: new Date().toISOString() }))
    } else {
      setError("Failed to mark review received.")
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
              <p className="text-green-400 text-xs font-semibold">{lead.openSolarSystemKw} kW</p>
            )}
            {lead.openSolarPriceAud && (
              <p className="text-[#aaa] text-xs">${lead.openSolarPriceAud.toLocaleString()}</p>
            )}
          </div>
        </div>

        <p className="text-[#555] text-xs">Installed {fmtDate(lead.installedAt)}</p>

        {/* Post-install checklist */}
        <div className="space-y-2 py-1">
          {/* Google review request */}
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full flex-shrink-0 border border-[#444] flex items-center justify-center text-xs text-[#555]">
              →
            </span>
            <button
              onClick={requestReview}
              disabled={reviewLoading}
              className="text-xs text-[#aaa] hover:text-[#ffd100] transition-colors disabled:opacity-50 text-left"
            >
              {reviewLoading ? "Sending…" : "Request Google review"}
            </button>
          </div>

          {/* Review received */}
          <div className="flex items-center gap-2">
            <span className={`w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center text-xs ${
              lead.googleReviewReceivedAt ? "bg-green-600 text-white" : "border border-[#444]"
            }`}>
              {lead.googleReviewReceivedAt && "✓"}
            </span>
            {lead.googleReviewReceivedAt ? (
              <span className="text-xs text-[#aaa]">Review received — {fmtDate(lead.googleReviewReceivedAt)}</span>
            ) : (
              <button
                onClick={markReviewReceived}
                disabled={reviewReceivedLoading}
                className="text-xs text-[#555] hover:text-white transition-colors disabled:opacity-50"
              >
                {reviewReceivedLoading ? "Saving…" : "Mark review received"}
              </button>
            )}
          </div>

          {/* Thank you */}
          <div className="flex items-center gap-2">
            <span className={`w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center text-xs ${
              lead.thankYouSentAt ? "bg-green-600 text-white" : "border border-[#444]"
            }`}>
              {lead.thankYouSentAt && "✓"}
            </span>
            {lead.thankYouSentAt ? (
              <span className="text-xs text-[#aaa]">Thank you sent — {fmtDate(lead.thankYouSentAt)}</span>
            ) : (
              <button
                onClick={() => setShowThankyou(true)}
                className="text-xs text-[#555] hover:text-white transition-colors"
              >
                Mark thank you sent
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

      {showThankyou && (
        <ThankYouModal
          lead={lead}
          onClose={() => setShowThankyou(false)}
          onSaved={() => {
            setLead(l => ({ ...l, thankYouSentAt: new Date().toISOString() }))
            setShowThankyou(false)
          }}
        />
      )}
    </>
  )
}
