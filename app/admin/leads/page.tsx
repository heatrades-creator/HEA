"use client"

import { useState, useEffect, useCallback } from "react"
import { LeadCard } from "@/components/admin/LeadCard"
import { getCostClient } from "@/lib/cost-client"

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

export default function LeadsPage() {
  const [leads, setLeads]       = useState<Lead[]>([])
  const [loading, setLoading]   = useState(true)
  const [costAud, setCostAud]   = useState<number | null>(null)
  const [blocked, setBlocked]   = useState<string | null>(null)

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    const res  = await fetch("/api/admin/leads?status=pending_review")
    const data = await res.json()
    setLeads(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchLeads()
    // Fetch cost from a lightweight config endpoint
    fetch("/api/admin/cost")
      .then(r => r.json())
      .then(d => {
        setCostAud(d.amountAud ?? null)
        setBlocked(d.blockedReason ?? null)
      })
      .catch(() => {})
  }, [fetchLeads])

  function onConfirmed(leadId: string) {
    setLeads(l => l.filter(x => x.id !== leadId))
  }

  function onRejected(leadId: string) {
    setLeads(l => l.filter(x => x.id !== leadId))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Lead Queue</h1>
          <p className="text-[#555] text-sm mt-1">
            Leads waiting for review. Each confirmation creates a project in OpenSolar.
          </p>
        </div>
        <button
          onClick={fetchLeads}
          className="text-sm text-[#aaa] hover:text-white transition-colors"
        >
          Refresh
        </button>
      </div>

      {blocked && (
        <div className="bg-amber-950/40 border border-amber-800 rounded-xl px-5 py-4 mb-6">
          <p className="text-amber-300 font-semibold text-sm">Confirm button disabled</p>
          <p className="text-amber-400/70 text-xs mt-1">{blocked}</p>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-[#202020] border border-[#2e2e2e] rounded-xl h-40 animate-pulse" />
          ))}
        </div>
      ) : leads.length === 0 ? (
        <div className="text-center py-20 text-[#555]">
          <p className="text-4xl mb-4">✓</p>
          <p className="font-medium text-white">All caught up</p>
          <p className="text-sm mt-1">No leads waiting for review.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {leads.map(lead => (
            <LeadCard
              key={lead.id}
              lead={lead}
              costAud={costAud}
              blockedReason={blocked}
              onConfirmed={(leadId) => onConfirmed(leadId)}
              onRejected={onRejected}
            />
          ))}
        </div>
      )}
    </div>
  )
}
