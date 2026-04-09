"use client"

import { useState } from "react"
import { CostBadge } from "./CostBadge"

interface ConfirmModalProps {
  lead: {
    id: string
    firstName: string
    lastName: string
    email: string
    address: string
    suburb: string
    state: string
  }
  costAud: number | null
  blockedReason: string | null
  onClose: () => void
  onConfirmed: (projectId: number, shareLink: string, costAud: number) => void
}

export function ConfirmModal({
  lead,
  costAud,
  blockedReason,
  onClose,
  onConfirmed,
}: ConfirmModalProps) {
  const [confirmText, setConfirmText] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isBlocked = !!blockedReason
  const isReady   = !isBlocked && confirmText === "CONFIRM"

  async function handleConfirm() {
    if (!isReady) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/admin/leads/${lead.id}/confirm`, {
        method: "POST",
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data?.error ?? "Something went wrong.")
        setLoading(false)
        return
      }

      onConfirmed(data.openSolarProjectId, data.shareLink, data.costAud)
    } catch {
      setError("Network error. Please try again.")
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="bg-[#202020] border border-[#2e2e2e] rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-[#2e2e2e]">
          <h2 className="text-white font-semibold text-lg">
            {isBlocked ? "Cannot Confirm Lead" : `Confirm Lead — ${lead.firstName} ${lead.lastName}`}
          </h2>
        </div>

        <div className="px-4 sm:px-6 py-4 sm:py-5 space-y-5">
          {/* Customer summary */}
          <div className="bg-[#181818] rounded-lg p-4 space-y-1">
            <p className="text-white font-medium">{lead.firstName} {lead.lastName}</p>
            <p className="text-[#aaa] text-sm">{lead.email}</p>
            <p className="text-[#aaa] text-sm">{lead.address}, {lead.suburb} {lead.state}</p>
          </div>

          {isBlocked ? (
            /* BLOCKED state */
            <div className="bg-red-950/50 border border-red-800 rounded-lg p-4">
              <p className="text-red-400 font-semibold text-sm mb-2">API cost not configured</p>
              <p className="text-red-300/70 text-sm leading-relaxed">{blockedReason}</p>
            </div>
          ) : (
            /* Cost known state */
            <>
              <div className="space-y-2">
                <p className="text-[#aaa] text-sm">
                  This will create a project in OpenSolar. The following cost will be charged to your OpenSolar wallet:
                </p>
                <div className="flex items-center gap-3">
                  <CostBadge amountAud={costAud} />
                  <span className="text-[#555] text-xs">per project created</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#aaa] mb-2">
                  Type <span className="font-mono text-white">CONFIRM</span> to proceed:
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={e => setConfirmText(e.target.value)}
                  placeholder="CONFIRM"
                  className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg px-4 py-3 text-white placeholder-[#555] focus:outline-none focus:border-[#ffd100] transition-colors font-mono"
                  autoFocus
                  autoComplete="off"
                />
              </div>
            </>
          )}

          {error && (
            <div className="bg-red-950/50 border border-red-800 rounded-lg px-4 py-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-4 sm:px-6 py-4 border-t border-[#2e2e2e] flex flex-wrap gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 rounded-lg text-sm font-medium text-[#aaa] hover:text-white hover:bg-[#2a2a2a] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isReady || loading || isBlocked}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-[#ffd100] text-black hover:bg-[#e6bc00] disabled:bg-[#ffd100]"
          >
            {loading
              ? "Creating project…"
              : isBlocked
              ? "Confirm — BLOCKED"
              : `Confirm — ${costAud ? `$${costAud.toFixed(2)} AUD` : "…"}`}
          </button>
        </div>
      </div>
    </div>
  )
}
