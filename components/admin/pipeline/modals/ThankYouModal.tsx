"use client"

import { useState } from "react"

interface Props {
  lead: { id: string; firstName: string; lastName: string }
  onClose: () => void
  onSaved: () => void
}

export function ThankYouModal({ lead, onClose, onSaved }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  async function handleConfirm() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/pipeline/${lead.id}/thank-you`, {
        method: "POST",
      })
      const data = await res.json()
      if (!res.ok) { setError(data?.error ?? "Something went wrong."); setLoading(false); return }
      onSaved()
    } catch {
      setError("Network error. Please try again.")
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="bg-[#202020] border border-[#2e2e2e] rounded-2xl w-full max-w-md shadow-2xl">
        <div className="px-6 py-5 border-b border-[#2e2e2e]">
          <h2 className="text-white font-semibold text-lg">Mark Thank You Sent</h2>
          <p className="text-[#aaa] text-sm mt-0.5">{lead.firstName} {lead.lastName}</p>
        </div>
        <div className="px-6 py-5">
          <p className="text-[#aaa] text-sm leading-relaxed">
            Confirm you&apos;ve sent a personal thank-you message to{" "}
            <span className="text-white">{lead.firstName}</span> for their business.
            This will record the timestamp and complete Stage 3.
          </p>
          {error && (
            <div className="mt-4 bg-red-950/50 border border-red-800 rounded-lg px-4 py-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-[#2e2e2e] flex gap-3 justify-end">
          <button onClick={onClose} disabled={loading} className="px-5 py-2.5 rounded-lg text-sm font-medium text-[#aaa] hover:text-white hover:bg-[#2a2a2a] transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button onClick={handleConfirm} disabled={loading} className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-green-600 text-white hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            {loading ? "Saving…" : "Mark Sent"}
          </button>
        </div>
      </div>
    </div>
  )
}
