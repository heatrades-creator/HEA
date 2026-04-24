'use client'

import { useState, useEffect, useCallback } from 'react'

export type GASJob = {
  jobNumber: string
  clientName: string
  phone: string
  email: string
  address: string
  status: string
  driveUrl: string
  notes: string
  systemSize: string
  totalPrice: string
  annualBill: string
}

interface Props {
  job: GASJob
  onAdvanced: (jobNumber: string) => void
}

type NMIState = { checked: false } | { checked: true; hasNMI: boolean; fileName?: string; fileUrl?: string; nmiSubfolderUrl?: string }
type EstState = { checked: false } | { checked: true; hasEstimation: boolean; fileName?: string; fileUrl?: string }

export function BuildTheDealCard({ job, onAdvanced }: Props) {
  const [nmi, setNmi]   = useState<NMIState>({ checked: false })
  const [est, setEst]   = useState<EstState>({ checked: false })
  const [moving, setMoving] = useState(false)
  const [polling, setPolling] = useState(false)

  const checkNMI = useCallback(async () => {
    try {
      const res = await fetch(`/api/dashboard/pipeline/check-nmi?jobNumber=${encodeURIComponent(job.jobNumber)}`)
      const data = await res.json()
      setNmi({ checked: true, ...data })
    } catch { /* silent */ }
  }, [job.jobNumber])

  const checkEst = useCallback(async () => {
    try {
      const res = await fetch(`/api/dashboard/pipeline/check-estimation?jobNumber=${encodeURIComponent(job.jobNumber)}`)
      const data = await res.json()
      setEst({ checked: true, ...data })
    } catch { /* silent */ }
  }, [job.jobNumber])

  // Auto-check both on mount
  useEffect(() => {
    checkNMI()
    checkEst()
  }, [checkNMI, checkEst])

  // Poll every 30s after "Open NMI" is clicked until NMI is found
  useEffect(() => {
    if (!polling) return
    if (nmi.checked && (nmi as { checked: true; hasNMI: boolean }).hasNMI) {
      setPolling(false)
      return
    }
    const t = setInterval(() => {
      checkNMI()
      checkEst()
    }, 30000)
    return () => clearInterval(t)
  }, [polling, nmi, checkNMI, checkEst])

  function openNMI() {
    // Open Powercor portal
    window.open('https://myenergy.powercor.com.au/s/nmi-register', '_blank', 'noopener')
    // Open the NMI subfolder if known, otherwise the main client folder
    const nmiUrl = (nmi.checked && (nmi as { nmiSubfolderUrl?: string }).nmiSubfolderUrl)
      ? (nmi as { nmiSubfolderUrl: string }).nmiSubfolderUrl
      : job.driveUrl
    if (nmiUrl) window.open(nmiUrl, '_blank', 'noopener')
    // Start polling
    setPolling(true)
    // Also check immediately after a short delay
    setTimeout(() => { checkNMI(); checkEst() }, 5000)
  }

  async function moveToQuoted() {
    setMoving(true)
    try {
      await fetch('/api/dashboard/pipeline/move-stage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobNumber: job.jobNumber, status: 'Quoted' }),
      })
      onAdvanced(job.jobNumber)
    } catch {
      setMoving(false)
    }
  }

  const analyserUrl = `/solar-analyser?name=${encodeURIComponent(job.clientName)}&address=${encodeURIComponent(job.address)}&phone=${encodeURIComponent(job.phone)}&email=${encodeURIComponent(job.email)}&annualBill=${encodeURIComponent(job.annualBill)}`

  const nmiDone = nmi.checked && (nmi as { hasNMI: boolean }).hasNMI
  const estDone = est.checked && (est as { hasEstimation: boolean }).hasEstimation

  return (
    <div className={`bg-white rounded-xl border border-[#e5e9f0] p-4 space-y-3 ${polling ? 'ring-1 ring-[#ffd100]/40' : ''}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[#111827] font-semibold text-base leading-tight truncate">{job.clientName}</p>
          <p className="text-[#6b7280] text-sm mt-0.5 truncate">{job.address}</p>
        </div>
        <span className="flex-shrink-0 text-[#9ca3af] text-xs">{job.jobNumber}</span>
      </div>

      {/* Contact */}
      <a href={`tel:${job.phone}`} className="flex items-center gap-1.5 text-[#ffd100] text-sm font-medium">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.948V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
        {job.phone}
      </a>

      {/* Auto-sensed status rows */}
      <div className="space-y-2 py-1 border-t border-[#f3f4f6]">
        {/* NMI */}
        <div className="flex items-center gap-2.5">
          {!nmi.checked ? (
            <span className="w-4 h-4 rounded-full border-2 border-[#d1d5db] flex-shrink-0 animate-pulse" />
          ) : nmiDone ? (
            <span className="w-4 h-4 rounded-full bg-green-500 flex-shrink-0 flex items-center justify-center text-white text-[9px]">✓</span>
          ) : (
            <span className="w-4 h-4 rounded-full border-2 border-[#fbbf24] flex-shrink-0" />
          )}
          <span className="text-sm text-[#374151] flex-1 min-w-0">
            {nmiDone
              ? <span className="text-green-600 font-medium truncate block">NMI detected — {(nmi as { fileName?: string }).fileName}</span>
              : <span className="text-[#6b7280]">NMI data — {!nmi.checked ? 'checking…' : 'not yet in Drive'}</span>
            }
          </span>
          {!nmiDone && nmi.checked && (
            <button onClick={checkNMI} className="text-xs text-[#9ca3af] hover:text-[#ffd100] transition-colors flex-shrink-0">
              Check
            </button>
          )}
        </div>

        {/* Estimation */}
        <div className="flex items-center gap-2.5">
          {!est.checked ? (
            <span className="w-4 h-4 rounded-full border-2 border-[#d1d5db] flex-shrink-0 animate-pulse" />
          ) : estDone ? (
            <span className="w-4 h-4 rounded-full bg-green-500 flex-shrink-0 flex items-center justify-center text-white text-[9px]">✓</span>
          ) : (
            <span className="w-4 h-4 rounded-full border-2 border-[#d1d5db] flex-shrink-0" />
          )}
          <span className="text-sm flex-1 min-w-0">
            {estDone
              ? <a href={(est as { fileUrl?: string }).fileUrl} target="_blank" rel="noopener noreferrer" className="text-green-600 font-medium truncate block hover:underline">
                  Estimation ready — {(est as { fileName?: string }).fileName}
                </a>
              : <span className="text-[#6b7280]">Estimation — not yet in Drive</span>
            }
          </span>
          {!estDone && est.checked && (
            <button onClick={checkEst} className="text-xs text-[#9ca3af] hover:text-[#ffd100] transition-colors flex-shrink-0">
              Check
            </button>
          )}
        </div>

        {polling && !nmiDone && (
          <p className="text-[10px] text-[#ffd100] pl-6.5">Watching Drive for NMI file… auto-checks every 30s</p>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={openNMI}
          className="flex-1 py-2.5 rounded-lg text-sm font-medium border border-[#e5e9f0] text-[#374151] hover:border-[#ffd100] hover:text-[#111827] transition-colors text-center"
        >
          {polling ? '📡 Watching…' : '⚡ Get NMI Data'}
        </button>
        <a
          href={analyserUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 py-2.5 rounded-lg text-sm font-medium border border-[#e5e9f0] text-[#374151] hover:border-[#ffd100] hover:text-[#111827] transition-colors text-center"
        >
          ☀ Solar Analyser
        </a>
      </div>

      {/* Primary CTA */}
      <button
        onClick={moveToQuoted}
        disabled={moving}
        className="w-full py-3 rounded-xl text-sm font-bold bg-[#ffd100] text-[#111827] hover:bg-[#e6bc00] disabled:opacity-50 transition-colors"
      >
        {moving ? 'Moving…' : 'Estimation Signed — Move to Quoted →'}
      </button>
    </div>
  )
}
