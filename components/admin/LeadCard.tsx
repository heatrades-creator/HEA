"use client"

import { useState } from "react"
import { ConfirmModal } from "./ConfirmModal"
import { CostBadge } from "./CostBadge"

interface Lead {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  suburb: string
  state: string
  postcode: string
  annualBillAud: number | null
  roofType: string | null
  storeys: number | null
  notes: string | null
  leadSource: string
  status: string
  createdAt: string
  openSolarProjectId: number | null
  gasJobNumber: string | null
  gasDriveUrl: string | null
}

interface LeadCardProps {
  lead: Lead
  costAud: number | null
  blockedReason: string | null
  onConfirmed: (leadId: string) => void
  onRejected: (leadId: string) => void
}

export function LeadCard({ lead, costAud, blockedReason, onConfirmed, onRejected }: LeadCardProps) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [reviewSending, setReviewSending] = useState(false)
  const [reviewSent, setReviewSent] = useState(false)

  const createdDate = new Intl.DateTimeFormat("en-AU", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(new Date(lead.createdAt))

  async function handleReject() {
    setRejecting(true)
    try {
      const res = await fetch(`/api/admin/leads/${lead.id}/reject`, { method: "POST" })
      if (res.ok) onRejected(lead.id)
    } finally {
      setRejecting(false)
    }
  }

  async function handleRequestReview() {
    setReviewSending(true)
    try {
      const res = await fetch(`/api/admin/leads/${lead.id}/review`, { method: "POST" })
      if (res.ok) setReviewSent(true)
    } finally {
      setReviewSending(false)
    }
  }

  const fullName = `${lead.firstName} ${lead.lastName}`
  const fullAddress = `${lead.address}, ${lead.suburb} ${lead.state} ${lead.postcode}`
  const analyserUrl = `/solar-analyser?name=${encodeURIComponent(fullName)}&email=${encodeURIComponent(lead.email)}&phone=${encodeURIComponent(lead.phone)}&address=${encodeURIComponent(fullAddress)}&annualBill=${lead.annualBillAud ?? ""}`

  const actionBtnClass = "text-xs px-3 py-2.5 rounded-lg bg-[#2a2a2a] border border-[#3a3a3a] text-[#aaa] hover:text-white hover:border-[#555] transition-colors text-center"
  const dimBtnClass = "text-xs px-3 py-2.5 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-[#444] text-center cursor-not-allowed"

  return (
    <>
      <div className="bg-[#202020] border border-[#2e2e2e] rounded-xl p-5 hover:border-[#3a3a3a] transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4 mb-4">
          <div>
            <h3 className="text-white font-semibold text-base">
              {lead.firstName} {lead.lastName}
            </h3>
            <p className="text-[#aaa] text-sm mt-0.5">{lead.email}</p>
            <p className="text-[#aaa] text-sm">{lead.phone}</p>
          </div>
          <div className="sm:text-right flex-shrink-0 flex sm:flex-col items-center sm:items-end gap-2 sm:gap-0">
            <p className="text-[#555] text-xs">{createdDate}</p>
            <span className="inline-block sm:mt-1 text-xs px-2 py-0.5 rounded-full bg-[#2a2a2a] border border-[#3a3a3a] text-[#aaa]">
              {lead.leadSource}
            </span>
          </div>
        </div>

        <div className="space-y-1 mb-4">
          <p className="text-[#888] text-sm">
            📍 {lead.address}, {lead.suburb} {lead.state} {lead.postcode}
          </p>
          {lead.annualBillAud && (
            <p className="text-[#888] text-sm">
              💡 Annual bill: ${lead.annualBillAud.toLocaleString()}
            </p>
          )}
          {lead.roofType && (
            <p className="text-[#888] text-sm capitalize">
              🏠 {lead.roofType} roof{lead.storeys ? `, ${lead.storeys} storey${lead.storeys > 1 ? "s" : ""}` : ""}
            </p>
          )}
          {lead.notes && (
            <p className="text-[#555] text-xs mt-2 line-clamp-2 italic">
              &ldquo;{lead.notes}&rdquo;
            </p>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#2e2e2e]">
          <CostBadge amountAud={costAud} size="sm" />
          <div className="flex gap-2">
            <button
              onClick={handleReject}
              disabled={rejecting}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#888] hover:text-red-400 hover:bg-red-950/30 transition-colors disabled:opacity-50"
            >
              Reject
            </button>
            <button
              onClick={() => setShowConfirm(true)}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-[#ffd100] text-black hover:bg-[#e6bc00] transition-colors"
            >
              Confirm Lead →
            </button>
          </div>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3 pt-3 border-t border-[#2e2e2e]">
          <a
            href={analyserUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={actionBtnClass}
          >
            ☀️ Solar Analyser
          </a>
          <a
            href="https://calendly.com/hea-trades/free-solar-consultation-hea"
            target="_blank"
            rel="noopener noreferrer"
            className={actionBtnClass}
          >
            📅 Book Meeting
          </a>
          {lead.gasDriveUrl ? (
            <a
              href={lead.gasDriveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={actionBtnClass}
            >
              📁 Customer Files
            </a>
          ) : (
            <span className={dimBtnClass} title="Awaiting GAS sync">
              📁 Files pending
            </span>
          )}
          {lead.openSolarProjectId ? (
            <a
              href={`https://app.opensolar.com/220067/projects/${lead.openSolarProjectId}`}
              target="_blank"
              rel="noopener noreferrer"
              className={actionBtnClass}
            >
              🔆 OpenSolar
            </a>
          ) : (
            <span className={dimBtnClass} title="Confirm lead first">
              🔆 No project yet
            </span>
          )}
          <button
            onClick={handleRequestReview}
            disabled={reviewSending || reviewSent}
            className="col-span-2 text-xs px-3 py-2.5 rounded-lg bg-[#2a2a2a] border border-[#3a3a3a] text-[#aaa] hover:text-white hover:border-[#555] transition-colors disabled:opacity-50"
          >
            {reviewSending ? "Sending…" : reviewSent ? "✅ Review Sent" : "⭐ Request Review"}
          </button>
        </div>
      </div>

      {showConfirm && (
        <ConfirmModal
          lead={lead}
          costAud={costAud}
          blockedReason={blockedReason}
          onClose={() => setShowConfirm(false)}
          onConfirmed={() => {
            setShowConfirm(false)
            onConfirmed(lead.id)
          }}
        />
      )}
    </>
  )
}
