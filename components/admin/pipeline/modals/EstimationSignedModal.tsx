"use client"

import { useState } from "react"

interface Props {
  lead: { id: string; firstName: string; lastName: string; address: string }
  onClose: () => void
  onSigned: (signedAt: string) => void
}

export function EstimationSignedModal({ lead, onClose, onSigned }: Props) {
  const [date, setDate]       = useState(new Date().toISOString().slice(0, 10))
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  async function handleConfirm() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/pipeline/${lead.id}/estimation-signed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signedAt: new Date(date).toISOString() }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data?.error ?? "Something went wrong."); setLoading(false); return }
      onSigned(new Date(date).toISOString())
    } catch {
      setError("Network error. Please try again.")
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="bg-[#202020] border border-[#2e2e2e] rounded-2xl w-full max-w-md shadow-2xl">
        <div className="px-6 py-5 border-b border-[#2e2e2e]">
          <h2 className="text-white font-semibold text-lg">Mark Estimation Signed</h2>
          <p className="text-[#aaa] text-sm mt-0.5">{lead.firstName} {lead.lastName}</p>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="bg-[#181818] rounded-lg p-4 space-y-1">
            <p className="text-white font-medium">{lead.firstName} {lead.lastName}</p>
            <p className="text-[#aaa] text-sm">{lead.address}</p>
          </div>
          <p className="text-[#aaa] text-sm leading-relaxed">
            This will move the lead to <span className="text-white font-medium">Stage 2 — Close the Deal</span> and update HubSpot to Contract stage.
          </p>
          <div>
            <label className="block text-sm font-medium text-[#aaa] mb-2">Date signed</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#ffd100] transition-colors"
            />
          </div>
          {error && (
            <div className="bg-red-950/50 border border-red-800 rounded-lg px-4 py-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-[#2e2e2e] flex gap-3 justify-end">
          <button onClick={onClose} disabled={loading} className="px-5 py-2.5 rounded-lg text-sm font-medium text-[#aaa] hover:text-white hover:bg-[#2a2a2a] transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button onClick={handleConfirm} disabled={!date || loading} className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-[#ffd100] text-black hover:bg-[#e6bc00] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            {loading ? "Saving…" : "Confirm Signed →"}
          </button>
        </div>
      </div>
    </div>
  )
}
