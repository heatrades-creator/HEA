"use client"

import { useState } from "react"

interface Props {
  lead: { id: string; firstName: string; lastName: string }
  current: { appointmentAt: string | null; appointmentNotes: string | null }
  onClose: () => void
  onSaved: (appointmentAt: string, appointmentNotes: string) => void
}

export function AppointmentModal({ lead, current, onClose, onSaved }: Props) {
  const defaultDt = current.appointmentAt
    ? new Date(current.appointmentAt).toISOString().slice(0, 16)
    : new Date(Date.now() + 86400000).toISOString().slice(0, 16)

  const [dt, setDt]       = useState(defaultDt)
  const [notes, setNotes] = useState(current.appointmentNotes ?? "")
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  async function handleSave() {
    if (!dt) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/pipeline/${lead.id}/appointment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentAt: new Date(dt).toISOString(), appointmentNotes: notes || undefined }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data?.error ?? "Something went wrong."); setLoading(false); return }
      onSaved(new Date(dt).toISOString(), notes)
    } catch {
      setError("Network error. Please try again.")
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="bg-[#202020] border border-[#2e2e2e] rounded-2xl w-full max-w-md shadow-2xl">
        <div className="px-6 py-5 border-b border-[#2e2e2e]">
          <h2 className="text-white font-semibold text-lg">Schedule Appointment</h2>
          <p className="text-[#aaa] text-sm mt-0.5">{lead.firstName} {lead.lastName}</p>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#aaa] mb-2">Date &amp; time</label>
            <input
              type="datetime-local"
              value={dt}
              onChange={e => setDt(e.target.value)}
              className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#ffd100] transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#aaa] mb-2">Notes <span className="text-[#555]">(optional)</span></label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder="Call notes, confirmed contact, property details…"
              className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg px-4 py-3 text-white placeholder-[#555] focus:outline-none focus:border-[#ffd100] transition-colors resize-none"
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
          <button onClick={handleSave} disabled={!dt || loading} className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-[#ffd100] text-black hover:bg-[#e6bc00] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            {loading ? "Saving…" : "Save Appointment"}
          </button>
        </div>
      </div>
    </div>
  )
}
