'use client'

import { useState } from 'react'
import type { GASJob } from './BuildTheDealCard'

interface Props {
  job: GASJob
  onAdvanced: (jobNumber: string) => void
}

export function CloseTheDealCard({ job, onAdvanced }: Props) {
  const [stockDone, setStockDone]   = useState(false)
  const [buildDate, setBuildDate]   = useState('')
  const [showDate, setShowDate]     = useState(false)
  const [deposit, setDeposit]       = useState('')
  const [depositDone, setDepositDone] = useState(false)
  const [moving, setMoving]         = useState(false)

  async function moveToComplete() {
    setMoving(true)
    try {
      await fetch('/api/dashboard/pipeline/move-stage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobNumber: job.jobNumber, status: 'Complete' }),
      })
      onAdvanced(job.jobNumber)
    } catch {
      setMoving(false)
    }
  }

  const suggestedDeposit = job.totalPrice
    ? `$${Math.round(parseFloat(job.totalPrice.replace(/[^0-9.]/g, '')) * 0.1).toLocaleString()}`
    : null

  return (
    <div className="bg-white rounded-xl border border-[#e5e9f0] p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[#111827] font-semibold text-base truncate">{job.clientName}</p>
          <p className="text-[#6b7280] text-sm mt-0.5 truncate">{job.address}</p>
        </div>
        <div className="flex-shrink-0 text-right">
          {job.systemSize && <p className="text-[#ffd100] text-xs font-bold">{job.systemSize} kW</p>}
          {job.totalPrice && <p className="text-[#9ca3af] text-xs">${job.totalPrice}</p>}
        </div>
      </div>

      <a href={`tel:${job.phone}`} className="flex items-center gap-1.5 text-[#ffd100] text-sm font-medium">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.948V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
        {job.phone}
      </a>

      {/* Checklist */}
      <div className="space-y-3 border-t border-[#f3f4f6] pt-3">
        {/* Stock */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setStockDone(s => !s)}
            className={`w-5 h-5 rounded flex-shrink-0 border-2 flex items-center justify-center transition-colors ${stockDone ? 'bg-green-500 border-green-500 text-white' : 'border-[#d1d5db] hover:border-[#ffd100]'}`}
          >
            {stockDone && <span className="text-[10px]">✓</span>}
          </button>
          <div className="flex-1">
            <span className={`text-sm ${stockDone ? 'text-green-600 font-medium' : 'text-[#374151]'}`}>
              {stockDone ? 'Stock confirmed — Solar Juice' : 'Confirm stock with Solar Juice'}
            </span>
          </div>
          <a href="https://www.solarjuice.com.au" target="_blank" rel="noopener noreferrer"
            className="text-xs text-[#9ca3af] hover:text-[#ffd100] transition-colors flex-shrink-0">
            Open ↗
          </a>
        </div>

        {/* Build date */}
        <div className="flex items-center gap-3">
          <span className={`w-5 h-5 rounded-full flex-shrink-0 border-2 flex items-center justify-center text-[10px] transition-colors ${buildDate ? 'bg-green-500 border-green-500 text-white' : 'border-[#d1d5db]'}`}>
            {buildDate && '✓'}
          </span>
          {buildDate ? (
            <span className="text-sm text-green-600 font-medium flex-1">
              Build date — {new Date(buildDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          ) : showDate ? (
            <input
              type="date"
              autoFocus
              onChange={e => { setBuildDate(e.target.value); setShowDate(false) }}
              className="flex-1 text-sm border border-[#e5e9f0] rounded-lg px-2 py-1 focus:outline-none focus:border-[#ffd100]"
            />
          ) : (
            <button onClick={() => setShowDate(true)} className="text-sm text-[#6b7280] hover:text-[#ffd100] transition-colors flex-1 text-left">
              Set build date
            </button>
          )}
        </div>

        {/* Deposit */}
        <div className="flex items-center gap-3">
          <span className={`w-5 h-5 rounded-full flex-shrink-0 border-2 flex items-center justify-center text-[10px] ${depositDone ? 'bg-green-500 border-green-500 text-white' : 'border-[#d1d5db]'}`}>
            {depositDone && '✓'}
          </span>
          {depositDone ? (
            <span className="text-sm text-green-600 font-medium flex-1">Deposit {deposit} received</span>
          ) : (
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                value={deposit}
                onChange={e => setDeposit(e.target.value)}
                placeholder={suggestedDeposit ?? 'Deposit amount'}
                className="flex-1 text-sm border border-[#e5e9f0] rounded-lg px-2 py-1 focus:outline-none focus:border-[#ffd100]"
              />
              <button
                onClick={() => { if (deposit || suggestedDeposit) { setDeposit(deposit || suggestedDeposit!); setDepositDone(true) } }}
                className="text-xs bg-[#ffd100] text-black px-2 py-1 rounded-lg font-medium hover:bg-[#e6bc00] transition-colors"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Links */}
      {job.driveUrl && (
        <a href={job.driveUrl} target="_blank" rel="noopener noreferrer"
          className="block text-center py-2 rounded-lg text-xs font-medium border border-[#e5e9f0] text-[#6b7280] hover:border-[#ffd100] hover:text-[#111827] transition-colors">
          Open Client Files ↗
        </a>
      )}

      {/* CTA */}
      <button
        onClick={moveToComplete}
        disabled={moving}
        className="w-full py-3 rounded-xl text-sm font-bold bg-[#111827] text-white hover:bg-[#1f2937] disabled:opacity-50 transition-colors"
      >
        {moving ? 'Marking…' : 'Mark Installed → Complete'}
      </button>
    </div>
  )
}
