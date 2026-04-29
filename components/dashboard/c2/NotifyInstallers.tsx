'use client'

import { useState } from 'react'

export function NotifyInstallers() {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ sent?: number; error?: string } | null>(null)

  async function handleSend() {
    if (!title.trim() || !body.trim()) return
    setSending(true)
    setResult(null)
    try {
      const res = await fetch('/api/dashboard/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), body: body.trim() }),
      })
      const data = await res.json()
      if (!res.ok) setResult({ error: data.error ?? 'Failed to send' })
      else setResult({ sent: data.sent })
      if (res.ok) { setTitle(''); setBody('') }
    } catch {
      setResult({ error: 'Network error' })
    }
    setSending(false)
  }

  return (
    <div className="bg-white rounded-xl border border-[#e5e9f0] overflow-hidden mt-6">
      <div className="px-5 py-4 border-b border-[#e5e9f0]">
        <p className="text-sm font-semibold text-[#111827]">Push Notification</p>
        <p className="text-xs text-gray-500 mt-0.5">Send an instant alert to all installer devices</p>
      </div>

      {result?.sent !== undefined && (
        <div className="px-5 py-3 bg-green-50 border-b border-green-200 flex items-center justify-between">
          <p className="text-sm text-green-800 font-medium">
            ✓ Sent to {result.sent} device{result.sent !== 1 ? 's' : ''}
          </p>
          <button onClick={() => setResult(null)} className="text-green-600 text-xs hover:underline">Dismiss</button>
        </div>
      )}
      {result?.error && (
        <div className="px-5 py-3 bg-red-50 border-b border-red-200 flex items-center justify-between">
          <p className="text-sm text-red-800 font-medium">{result.error}</p>
          <button onClick={() => setResult(null)} className="text-red-500 text-xs hover:underline ml-4">Dismiss</button>
        </div>
      )}

      <div className="px-5 py-4 space-y-3">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Site safety reminder"
            disabled={sending}
            className="w-full border border-[#e5e9f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#ffd100] disabled:opacity-50"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Message</label>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="e.g. All installers must sign the site induction sheet before starting today."
            rows={3}
            disabled={sending}
            className="w-full border border-[#e5e9f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#ffd100] disabled:opacity-50 resize-none"
          />
        </div>
        <button
          onClick={handleSend}
          disabled={sending || !title.trim() || !body.trim()}
          className="px-5 py-2 text-sm font-semibold rounded-lg bg-[#111827] text-white hover:bg-[#2d2d2d] disabled:opacity-40 transition-colors"
        >
          {sending ? 'Sending…' : 'Send to All Installers'}
        </button>
      </div>
    </div>
  )
}
