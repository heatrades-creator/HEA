"use client"

import { useState } from "react"

interface Props {
  lead: { id: string; firstName: string; lastName: string; openSolarPriceAud: number | null }
  onClose: () => void
  onSaved: (amountAud: number, paidAt: string) => void
}

export function DepositModal({ lead, onClose, onSaved }: Props) {
  const suggested = lead.openSolarPriceAud ? Math.round(lead.openSolarPriceAud * 0.1 * 100) / 100 : null
  const [amount, setAmount] = useState(suggested?.toString() ?? "")
  const [date, setDate]     = useState(new Date().toISOString().slice(0, 10))
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  const parsedAmount = parseFloat(amount)
  const isValid = !isNaN(parsedAmount) && parsedAmount > 0 && !!date

  async function handleSave() {
    if (!isValid) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/pipeline/${lead.id}/deposit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountAud: parsedAmount, paidAt: new Date(date).toISOString() }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data?.error ?? "Something went wrong."); setLoading(false); return }
      onSaved(parsedAmount, new Date(date).toISOString())
    } catch {
      setError("Network error. Please try again.")
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="bg-[#202020] border border-[#2e2e2e] rounded-2xl w-full max-w-md shadow-2xl">
        <div className="px-6 py-5 border-b border-[#2e2e2e]">
          <h2 className="text-white font-semibold text-lg">Record Deposit</h2>
          <p className="text-[#aaa] text-sm mt-0.5">{lead.firstName} {lead.lastName}</p>
        </div>
        <div className="px-6 py-5 space-y-4">
          {suggested && (
            <p className="text-[#aaa] text-sm">
              Suggested 10% deposit:{" "}
              <span className="text-white font-semibold">${suggested.toFixed(2)} AUD</span>
            </p>
          )}
          <div>
            <label className="block text-sm font-medium text-[#aaa] mb-2">Deposit amount (AUD)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#aaa]">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="890.00"
                className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg pl-8 pr-4 py-3 text-white placeholder-[#555] focus:outline-none focus:border-[#ffd100] transition-colors"
                autoFocus
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#aaa] mb-2">Date received</label>
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
          <button onClick={handleSave} disabled={!isValid || loading} className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-[#ffd100] text-black hover:bg-[#e6bc00] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            {loading ? "Saving…" : "Record Deposit"}
          </button>
        </div>
      </div>
    </div>
  )
}
