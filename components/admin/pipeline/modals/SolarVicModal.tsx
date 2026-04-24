"use client"

import { useState } from "react"

interface Props {
  lead: { id: string; firstName: string; lastName: string }
  current: { solarVicEligible: boolean | null; solarVicAppliedAt: string | null }
  onClose: () => void
  onSaved: (eligible: boolean, appliedAt: string | null) => void
}

export function SolarVicModal({ lead, current, onClose, onSaved }: Props) {
  const [eligible, setEligible] = useState<boolean>(current.solarVicEligible ?? true)
  const [appliedAt, setAppliedAt] = useState(
    current.solarVicAppliedAt ? new Date(current.solarVicAppliedAt).toISOString().slice(0, 10) : ""
  )
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  async function handleSave() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/pipeline/${lead.id}/solar-vic`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eligible,
          appliedAt: appliedAt ? new Date(appliedAt).toISOString() : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data?.error ?? "Something went wrong."); setLoading(false); return }
      onSaved(eligible, appliedAt ? new Date(appliedAt).toISOString() : null)
    } catch {
      setError("Network error. Please try again.")
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="bg-[#202020] border border-[#2e2e2e] rounded-2xl w-full max-w-md shadow-2xl">
        <div className="px-6 py-5 border-b border-[#2e2e2e]">
          <h2 className="text-white font-semibold text-lg">Solar Vic Rebate</h2>
          <p className="text-[#aaa] text-sm mt-0.5">{lead.firstName} {lead.lastName}</p>
        </div>
        <div className="px-6 py-5 space-y-5">
          <div>
            <p className="text-sm font-medium text-[#aaa] mb-3">Eligibility</p>
            <div className="flex gap-3">
              {([true, false] as const).map(v => (
                <button
                  key={String(v)}
                  onClick={() => setEligible(v)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                    eligible === v
                      ? "bg-[#ffd100] text-black border-[#ffd100]"
                      : "text-[#aaa] border-[#3a3a3a] hover:border-[#ffd100] hover:text-white"
                  }`}
                >
                  {v ? "Eligible" : "Not eligible"}
                </button>
              ))}
            </div>
          </div>
          {eligible && (
            <div>
              <label className="block text-sm font-medium text-[#aaa] mb-2">Application submitted <span className="text-[#555]">(optional)</span></label>
              <input
                type="date"
                value={appliedAt}
                onChange={e => setAppliedAt(e.target.value)}
                className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#ffd100] transition-colors"
              />
            </div>
          )}
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
          <button onClick={handleSave} disabled={loading} className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-[#ffd100] text-black hover:bg-[#e6bc00] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            {loading ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  )
}
