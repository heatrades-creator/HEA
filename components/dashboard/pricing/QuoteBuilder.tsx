'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'

// ── Types ────────────────────────────────────────────────────────────────────

export type Bundle = {
  phase: string; solarKw: number; batteryBrand: string; batteryModel: string
  batteryKwh: number; inverter: string; heaPrice: number; notes: string
}

export type Extra = {
  section: string; item: string; unit: string; heaPrice: number
  heaPriceDisplay: string; sjWholesale: string; description: string
}

export type PricingSettings = {
  salesCommission: number; installCommission: number; solarVictoriaRebate: number; lastUpdated: string
}

type ExtraState = { enabled: boolean; qty: number }

type Props = {
  bundles1P: Bundle[]; bundles3P: Bundle[]; extras: Extra[]
  settings: PricingSettings; sheetUrl: string; jobNumber?: string; clientName?: string
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) { return '$' + Math.round(n).toLocaleString('en-AU') }

const STC_ZONE = 1.382
const STC_YEARS = 4
const STC_SPOT = 39
const SOLAR_SIZES = [6.6, 8.55, 10.45, 13.3]
const SECTION_ORDER = ['Solar', 'Battery', 'Switchboard']

// ── Component ────────────────────────────────────────────────────────────────

export default function QuoteBuilder({ bundles1P, bundles3P, extras, settings, sheetUrl, jobNumber, clientName }: Props) {
  const router = useRouter()

  const [phase, setPhase] = useState<'1P' | '3P'>('1P')
  const [solarKw, setSolarKw] = useState(6.6)
  const [batteryOnly, setBatteryOnly] = useState(false)
  const [selectedBundle, setSelectedBundle] = useState<Bundle | null>(null)
  const [extraStates, setExtraStates] = useState<Record<string, ExtraState>>({})
  const [activeTab, setActiveTab] = useState<'packages' | 'extras' | 'commission' | 'solar'>('packages')

  // Extras live state (editable prices, new rows)
  const [localExtras, setLocalExtras] = useState<Extra[]>(extras)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({})
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editPriceVal, setEditPriceVal] = useState('')
  const [savingPrice, setSavingPrice] = useState(false)
  const [addingSection, setAddingSection] = useState<string | null>(null)
  const [newItemName, setNewItemName] = useState('')
  const [newItemUnit, setNewItemUnit] = useState('each')
  const [newItemPrice, setNewItemPrice] = useState('')
  const [addingRow, setAddingRow] = useState(false)

  // Travel
  const travelItem = useMemo(() => localExtras.find(e => e.section.toUpperCase() === 'TRAVEL'), [localExtras])
  const [travelKm, setTravelKm] = useState('')
  const [travelRate, setTravelRate] = useState<number>(travelItem?.heaPrice ?? 2.20)
  const [editingTravelRate, setEditingTravelRate] = useState(false)
  const [travelRateEdit, setTravelRateEdit] = useState('')

  // Commission
  const [salesComm, setSalesComm] = useState(settings.salesCommission)
  const [installComm, setInstallComm] = useState(settings.installCommission)

  // Save
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)

  // ── Derived ──────────────────────────────────────────────────────────────

  const bundles = phase === '3P' ? bundles3P : bundles1P

  const filteredBundles = useMemo(() => {
    if (batteryOnly) return bundles.filter(b => b.solarKw === 0)
    return bundles.filter(b => b.solarKw === solarKw)
  }, [bundles, solarKw, batteryOnly])

  const extrasBySection = useMemo(() => {
    const map: Record<string, Extra[]> = {}
    localExtras.forEach(e => {
      if (e.section.toUpperCase() === 'TRAVEL') return
      if (!map[e.section]) map[e.section] = []
      map[e.section].push(e)
    })
    return map
  }, [localExtras])

  const orderedSections = useMemo(() => {
    const all = Object.keys(extrasBySection)
    const ordered = SECTION_ORDER.filter(s => all.includes(s))
    const rest = all.filter(s => !SECTION_ORDER.includes(s))
    return [...ordered, ...rest]
  }, [extrasBySection])

  const extrasTotal = useMemo(() => {
    return localExtras.reduce((sum, e) => {
      if (e.section.toUpperCase() === 'TRAVEL') return sum
      const key = e.section + ':' + e.item
      const st = extraStates[key]
      if (!st?.enabled) return sum
      return sum + e.heaPrice * (st.qty || 1)
    }, 0)
  }, [localExtras, extraStates])

  const km = parseFloat(travelKm || '0')
  const travelTotal = km > 0 ? 2 * km * travelRate : 0
  const basePrice = selectedBundle?.heaPrice ?? 0
  const subtotal = basePrice + extrasTotal + travelTotal

  const solarKwForStc = batteryOnly ? 0 : (selectedBundle ? selectedBundle.solarKw : 0)
  const stcEstimate = solarKwForStc > 0 ? Math.round(solarKwForStc * STC_ZONE * STC_YEARS * STC_SPOT) : 0

  // ── Handlers ─────────────────────────────────────────────────────────────

  function toggleExtra(section: string, item: string) {
    const key = section + ':' + item
    setExtraStates(prev => ({ ...prev, [key]: { enabled: !prev[key]?.enabled, qty: prev[key]?.qty ?? 1 } }))
  }

  function setExtraQty(section: string, item: string, qty: number) {
    const key = section + ':' + item
    setExtraStates(prev => ({ ...prev, [key]: { enabled: prev[key]?.enabled ?? true, qty: Math.max(0, qty) } }))
  }

  function isSectionOpen(s: string) { return openSections[s] !== false }
  function toggleSection(s: string) { setOpenSections(prev => ({ ...prev, [s]: !isSectionOpen(s) })) }

  function startEdit(section: string, item: string, price: number) {
    setEditingKey(section + ':' + item)
    setEditPriceVal(String(price))
  }

  async function saveEdit() {
    if (!editingKey) return
    const colonIdx = editingKey.indexOf(':')
    const section = editingKey.slice(0, colonIdx)
    const item = editingKey.slice(colonIdx + 1)
    const newPrice = parseFloat(editPriceVal) || 0
    setSavingPrice(true)
    setLocalExtras(prev => prev.map(e =>
      e.section === section && e.item === item ? { ...e, heaPrice: newPrice } : e
    ))
    setEditingKey(null)
    try {
      await fetch('/api/dashboard/pricing/update-extra', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section, item, newPrice }),
      })
    } catch { /* non-fatal */ }
    setSavingPrice(false)
  }

  async function saveTravelRate() {
    const rate = parseFloat(travelRateEdit) || 2.20
    setTravelRate(rate)
    setEditingTravelRate(false)
    if (travelItem) {
      setLocalExtras(prev => prev.map(e => e.section.toUpperCase() === 'TRAVEL' ? { ...e, heaPrice: rate } : e))
      try {
        await fetch('/api/dashboard/pricing/update-extra', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ section: travelItem.section, item: travelItem.item, newPrice: rate }),
        })
      } catch { /* non-fatal */ }
    }
  }

  async function handleAddRow(section: string) {
    if (!newItemName.trim() || !newItemPrice) return
    const price = parseFloat(newItemPrice) || 0
    const newExtra: Extra = {
      section, item: newItemName.trim(), unit: newItemUnit,
      heaPrice: price, heaPriceDisplay: fmt(price), sjWholesale: '', description: '',
    }
    setAddingRow(true)
    setLocalExtras(prev => [...prev, newExtra])
    const savedName = newItemName.trim()
    const savedUnit = newItemUnit
    setNewItemName(''); setNewItemUnit('each'); setNewItemPrice(''); setAddingSection(null)
    try {
      await fetch('/api/dashboard/pricing/add-extra', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section, item: savedName, unit: savedUnit, price }),
      })
    } catch { /* non-fatal */ }
    setAddingRow(false)
  }

  async function handleSave() {
    if (!jobNumber || !selectedBundle) return
    setSaving(true); setSaveError(''); setSaveSuccess(false)
    const enabledExtras = localExtras.flatMap(e => {
      if (e.section.toUpperCase() === 'TRAVEL') return []
      const key = e.section + ':' + e.item
      const st = extraStates[key]
      if (!st?.enabled) return []
      return [{ item: e.item, qty: st.qty || 1, unitPrice: e.heaPrice }]
    })
    if (travelTotal > 0) enabledExtras.push({ item: `Travel (${km}km × 2 × $${travelRate}/km)`, qty: 1, unitPrice: travelTotal })
    const solarLabel = batteryOnly ? 'Battery Only' : `${solarKw}kW Solar`
    const label = `${solarLabel} + ${selectedBundle.batteryBrand} ${selectedBundle.batteryModel} ${phase}`
    const res = await fetch('/api/dashboard/pricing/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobNumber, totalPrice: subtotal, packageLabel: label,
        panelBrand: batteryOnly ? '' : 'Risen', panelModel: batteryOnly ? '' : 'Risen 475W',
        inverterBrand: selectedBundle.batteryBrand, inverterModel: selectedBundle.inverter,
        batteryBrand: selectedBundle.batteryBrand, batteryModel: selectedBundle.batteryModel,
        batteryKwh: selectedBundle.batteryKwh, extras: enabledExtras,
      }),
    })
    const data = await res.json()
    setSaving(false)
    if (data.error) setSaveError(data.error)
    else { setSaveSuccess(true); router.refresh() }
  }

  function generateReport() {
    const date = new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })
    const extrasHtml = localExtras.flatMap(e => {
      if (e.section.toUpperCase() === 'TRAVEL') return []
      const key = e.section + ':' + e.item
      const st = extraStates[key]
      if (!st?.enabled) return []
      const qty = st.qty || 1
      return [`<tr><td>${e.item}</td><td style="text-align:center">${qty > 1 ? qty : ''}</td><td style="text-align:right">${fmt(e.heaPrice * qty)}</td></tr>`]
    }).join('')
    const travelHtml = travelTotal > 0 ? `<tr><td>Travel (${km}km one-way, $${travelRate}/km)</td><td></td><td style="text-align:right">${fmt(travelTotal)}</td></tr>` : ''
    const bundleHtml = selectedBundle ? `<tr><td><strong>${batteryOnly ? 'Battery Only' : `${selectedBundle.solarKw}kW Solar`} + ${selectedBundle.batteryBrand} ${selectedBundle.batteryModel} (${selectedBundle.batteryKwh}kWh)</strong><br><small style="color:#666">${selectedBundle.inverter} · ${phase}</small></td><td></td><td style="text-align:right"><strong>${fmt(selectedBundle.heaPrice)}</strong></td></tr>` : ''
    const rebatesHtml = stcEstimate > 0 ? `<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:6px;padding:12px 16px;margin:16px 0;font-size:13px"><strong>Government Rebates (informational)</strong><br>• Federal STC rebate: ~${fmt(stcEstimate)} — already applied to prices above<br>• Solar Victoria Battery Rebate: $1,400 — customer applies at solarvictoria.vic.gov.au<br>• Solar Victoria Solar Rebate: up to $1,400 — for eligible households (income &lt;$180k)</div>` : ''
    const html = `<!DOCTYPE html><html><head><title>HEA Quote</title><style>body{font-family:Arial,sans-serif;padding:40px;max-width:680px;margin:0 auto;color:#111}h1{border-bottom:3px solid #ffd100;padding-bottom:8px}table{width:100%;border-collapse:collapse;margin:16px 0}th{background:#f5f5f5;text-align:left;padding:8px 10px;font-size:11px;text-transform:uppercase;letter-spacing:.05em}td{padding:8px 10px;border-bottom:1px solid #eee}tr.total td{font-weight:bold;font-size:17px;border-top:2px solid #111;border-bottom:none}.note{color:#999;font-size:11px;margin-top:20px}</style></head><body><h1>HEA Group — Rapid Quote</h1><p style="color:#666;font-size:13px">Date: ${date}${clientName ? ` &nbsp;·&nbsp; Client: ${clientName}` : ''}${jobNumber ? ` &nbsp;·&nbsp; Job: ${jobNumber}` : ''}</p><table><thead><tr><th>Item</th><th style="text-align:center">Qty</th><th style="text-align:right">Price</th></tr></thead><tbody>${bundleHtml}${extrasHtml}${travelHtml}<tr class="total"><td colspan="2">Customer Total</td><td style="text-align:right">${fmt(subtotal)}</td></tr></tbody></table>${rebatesHtml}<p class="note">Indicative quote only. Final price may vary based on site inspection, switchboard condition, and STC rebate at time of installation. All prices include GST. STC rebates applied to base prices.</p></body></html>`
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(html)
    win.document.close()
    setTimeout(() => win.print(), 400)
  }

  // ── No data ───────────────────────────────────────────────────────────────

  if (bundles.length === 0 && localExtras.length === 0) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
        <p className="font-semibold text-amber-800 mb-1">Pricing sheet not connected</p>
        <p className="text-amber-700 text-sm">Run setupPricingSheet() in GAS editor, then set PRICING_SHEET_ID in Script Properties.</p>
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Quote mode header */}
      {jobNumber && (
        <div className="flex items-center justify-between mb-5 p-4 bg-[#ffd100]/10 border border-[#ffd100]/30 rounded-xl">
          <div>
            <p className="text-xs text-[#6b7280] uppercase tracking-wider font-semibold">Quote Mode</p>
            <p className="font-bold text-[#111827]">{jobNumber}{clientName ? ` — ${clientName}` : ''}</p>
          </div>
          {subtotal > 0 && (
            <div className="text-right">
              <p className="text-xs text-[#6b7280]">Customer Total</p>
              <p className="text-2xl font-bold text-[#111827]">{fmt(subtotal)}</p>
            </div>
          )}
        </div>
      )}

      {/* Selectors */}
      <div className="flex flex-wrap gap-4 mb-5">
        <div>
          <p className="text-xs font-bold text-[#6b7280] uppercase tracking-wider mb-1.5">Phase</p>
          <div className="flex gap-1.5">
            {(['1P', '3P'] as const).map(p => (
              <button key={p} onClick={() => { setPhase(p); setSelectedBundle(null) }}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold border transition-colors ${phase === p ? 'bg-[#ffd100] border-[#ffd100] text-[#111827]' : 'border-[#e5e9f0] text-[#6b7280] hover:border-[#ffd100]'}`}>
                {p}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-bold text-[#6b7280] uppercase tracking-wider mb-1.5">System Type</p>
          <div className="flex gap-1.5">
            <button onClick={() => { setBatteryOnly(false); setSelectedBundle(null) }}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors ${!batteryOnly ? 'bg-[#ffd100] border-[#ffd100] text-[#111827]' : 'border-[#e5e9f0] text-[#6b7280] hover:border-[#ffd100]'}`}>
              Solar + Battery
            </button>
            <button onClick={() => { setBatteryOnly(true); setSelectedBundle(null) }}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors ${batteryOnly ? 'bg-[#ffd100] border-[#ffd100] text-[#111827]' : 'border-[#e5e9f0] text-[#6b7280] hover:border-[#ffd100]'}`}>
              Battery Only
            </button>
          </div>
        </div>
        {!batteryOnly && (
          <div>
            <p className="text-xs font-bold text-[#6b7280] uppercase tracking-wider mb-1.5">Solar Size</p>
            <div className="flex gap-1.5 flex-wrap">
              {SOLAR_SIZES.map(kw => (
                <button key={kw} onClick={() => { setSolarKw(kw); setSelectedBundle(null) }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors ${solarKw === kw ? 'bg-[#111827] border-[#111827] text-white' : 'border-[#e5e9f0] text-[#6b7280] hover:border-[#111827]'}`}>
                  {kw} kW
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#e5e9f0] mb-5 overflow-x-auto">
        {([['packages', 'Packages'], ['extras', 'Extras'], ['commission', 'Commission'], ['solar', 'Solar Base']] as const).map(([tab, label]) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${activeTab === tab ? 'border-[#ffd100] text-[#111827]' : 'border-transparent text-[#6b7280] hover:text-[#111827]'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* ── PACKAGES TAB ── */}
      {activeTab === 'packages' && (
        <div className="space-y-2">
          {filteredBundles.length === 0 ? (
            <p className="text-[#6b7280] text-sm py-4 text-center">No packages for {phase} {batteryOnly ? 'battery only' : `${solarKw}kW`}.</p>
          ) : filteredBundles.map((b, i) => {
            const active = selectedBundle?.batteryBrand === b.batteryBrand && selectedBundle?.batteryModel === b.batteryModel && selectedBundle?.inverter === b.inverter
            return (
              <button key={i} onClick={() => setSelectedBundle(b)}
                className={`w-full flex items-center justify-between p-4 rounded-xl border-2 text-left transition-all ${active ? 'border-[#ffd100] bg-[#ffd100]/5' : 'border-[#e5e9f0] hover:border-[#ffd100]/50'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${active ? 'border-[#ffd100] bg-[#ffd100]' : 'border-[#d1d5db]'}`} />
                  <div>
                    <p className="font-semibold text-[#111827] text-sm">{b.batteryBrand} {b.batteryModel}</p>
                    <p className="text-xs text-[#6b7280]">{b.batteryKwh} kWh · {b.inverter}</p>
                  </div>
                </div>
                <p className="font-bold text-[#111827]">{fmt(b.heaPrice)}</p>
              </button>
            )
          })}
        </div>
      )}

      {/* ── EXTRAS TAB ── */}
      {activeTab === 'extras' && (
        <div className="space-y-3">
          {/* Regular sections as accordions */}
          {orderedSections.map(section => {
            const items = extrasBySection[section] ?? []
            const open = isSectionOpen(section)
            return (
              <div key={section} className="border border-[#e5e9f0] rounded-xl overflow-hidden">
                {/* Accordion header */}
                <button onClick={() => toggleSection(section)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-[#f9fafb] hover:bg-[#f3f4f6] transition-colors">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#374151]">{section}</span>
                  <svg className={`w-4 h-4 text-[#9ca3af] transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {open && (
                  <div>
                    {items.map(e => {
                      const key = e.section + ':' + e.item
                      const st = extraStates[key]
                      const enabled = st?.enabled ?? false
                      const qty = st?.qty ?? 1
                      const lineTotal = enabled ? e.heaPrice * qty : 0
                      const isEditing = editingKey === key

                      return (
                        <div key={key} className={`flex items-center gap-2 px-4 py-2.5 border-t border-[#f3f4f6] group transition-colors ${enabled ? 'bg-[#ffd100]/5' : 'hover:bg-[#f9fafb]'}`}>
                          {/* Checkbox */}
                          <input type="checkbox" checked={enabled} onChange={() => toggleExtra(e.section, e.item)}
                            className="w-4 h-4 accent-[#ffd100] flex-shrink-0 cursor-pointer" />

                          {/* Item name */}
                          <span className={`flex-1 text-sm min-w-0 truncate ${enabled ? 'text-[#111827] font-medium' : 'text-[#374151]'}`}>{e.item}</span>

                          {/* QTY controls — compact */}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button onClick={() => setExtraQty(e.section, e.item, qty - 1)}
                              className="w-6 h-6 rounded border border-[#e5e9f0] text-[#9ca3af] hover:border-[#111827] hover:text-[#111827] text-xs font-bold leading-none">−</button>
                            <input type="number" min={0} value={qty}
                              onChange={ev => setExtraQty(e.section, e.item, parseInt(ev.target.value) || 0)}
                              className="w-10 text-center border border-[#e5e9f0] rounded py-0.5 text-xs text-[#111827] focus:outline-none focus:border-[#ffd100]" />
                            <button onClick={() => setExtraQty(e.section, e.item, qty + 1)}
                              className="w-6 h-6 rounded border border-[#e5e9f0] text-[#9ca3af] hover:border-[#111827] hover:text-[#111827] text-xs font-bold leading-none">+</button>
                          </div>

                          {/* Price — editable */}
                          <div className="flex items-center gap-1 flex-shrink-0 w-28 justify-end">
                            {isEditing ? (
                              <>
                                <span className="text-xs text-[#6b7280]">$</span>
                                <input autoFocus type="number" step="0.01" value={editPriceVal}
                                  onChange={e => setEditPriceVal(e.target.value)}
                                  onKeyDown={ev => { if (ev.key === 'Enter') saveEdit(); if (ev.key === 'Escape') setEditingKey(null) }}
                                  className="w-16 border border-[#ffd100] rounded px-1 py-0.5 text-xs text-[#111827] focus:outline-none" />
                                <button onClick={saveEdit} disabled={savingPrice}
                                  className="text-green-600 hover:text-green-700 text-xs font-bold">✓</button>
                                <button onClick={() => setEditingKey(null)} className="text-[#9ca3af] hover:text-[#374151] text-xs">✕</button>
                              </>
                            ) : (
                              <>
                                <span className="text-xs text-[#6b7280]">{fmt(e.heaPrice)}/{e.unit}</span>
                                <button onClick={() => startEdit(e.section, e.item, e.heaPrice)}
                                  className="opacity-0 group-hover:opacity-100 text-[#9ca3af] hover:text-[#374151] transition-opacity ml-1"
                                  title="Edit price">
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                  </svg>
                                </button>
                              </>
                            )}
                          </div>

                          {/* Line total */}
                          <div className="w-16 text-right flex-shrink-0">
                            {enabled && <span className="text-sm font-semibold text-[#111827]">{lineTotal > 0 ? fmt(lineTotal) : '—'}</span>}
                          </div>
                        </div>
                      )
                    })}

                    {/* Add new row */}
                    {addingSection === section ? (
                      <div className="flex items-center gap-2 px-4 py-2.5 border-t border-[#f3f4f6] bg-blue-50/50">
                        <input autoFocus placeholder="Item description" value={newItemName} onChange={e => setNewItemName(e.target.value)}
                          onKeyDown={ev => { if (ev.key === 'Enter') handleAddRow(section); if (ev.key === 'Escape') setAddingSection(null) }}
                          className="flex-1 text-sm border border-[#e5e9f0] rounded px-2 py-1 focus:outline-none focus:border-[#ffd100]" />
                        <select value={newItemUnit} onChange={e => setNewItemUnit(e.target.value)}
                          className="text-xs border border-[#e5e9f0] rounded px-1 py-1 text-[#374151] focus:outline-none">
                          <option value="each">each</option>
                          <option value="per panel">per panel</option>
                          <option value="per metre">per metre</option>
                          <option value="per array">per array</option>
                          <option value="job">job</option>
                        </select>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-[#6b7280]">$</span>
                          <input type="number" step="0.01" placeholder="0.00" value={newItemPrice} onChange={e => setNewItemPrice(e.target.value)}
                            onKeyDown={ev => { if (ev.key === 'Enter') handleAddRow(section); if (ev.key === 'Escape') setAddingSection(null) }}
                            className="w-20 text-sm border border-[#e5e9f0] rounded px-2 py-1 focus:outline-none focus:border-[#ffd100]" />
                        </div>
                        <button onClick={() => handleAddRow(section)} disabled={addingRow || !newItemName.trim() || !newItemPrice}
                          className="bg-[#111827] text-white text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50">
                          Add
                        </button>
                        <button onClick={() => setAddingSection(null)} className="text-[#9ca3af] hover:text-[#374151] text-xs">✕</button>
                      </div>
                    ) : (
                      <button onClick={() => setAddingSection(section)}
                        className="w-full flex items-center gap-2 px-4 py-2 border-t border-[#f3f4f6] text-xs text-[#9ca3af] hover:text-[#374151] hover:bg-[#f9fafb] transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        Add item to {section}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}

          {/* TRAVEL — special section */}
          <div className="border border-[#e5e9f0] rounded-xl overflow-hidden">
            <button onClick={() => toggleSection('__travel')}
              className="w-full flex items-center justify-between px-4 py-3 bg-[#f9fafb] hover:bg-[#f3f4f6] transition-colors">
              <span className="text-xs font-bold uppercase tracking-wider text-[#374151]">Travel</span>
              <svg className={`w-4 h-4 text-[#9ca3af] transition-transform ${isSectionOpen('__travel') ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {isSectionOpen('__travel') && (
              <div className="px-4 py-4 border-t border-[#f3f4f6] space-y-3">
                <div className="flex items-center gap-3">
                  <label className="text-sm text-[#374151] w-44 flex-shrink-0">Rate per km</label>
                  {editingTravelRate ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-[#6b7280]">$</span>
                      <input autoFocus type="number" step="0.10" value={travelRateEdit}
                        onChange={e => setTravelRateEdit(e.target.value)}
                        onKeyDown={ev => { if (ev.key === 'Enter') saveTravelRate(); if (ev.key === 'Escape') setEditingTravelRate(false) }}
                        className="w-20 border border-[#ffd100] rounded px-2 py-1 text-sm focus:outline-none" />
                      <button onClick={saveTravelRate} className="text-green-600 text-sm font-bold">✓</button>
                      <button onClick={() => setEditingTravelRate(false)} className="text-[#9ca3af] text-sm">✕</button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[#111827]">${travelRate.toFixed(2)} / km</span>
                      <button onClick={() => { setTravelRateEdit(String(travelRate)); setEditingTravelRate(true) }}
                        className="text-[#9ca3af] hover:text-[#374151]" title="Edit rate">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-sm text-[#374151] w-44 flex-shrink-0">One-way distance (km)</label>
                  <input type="number" min={0} step={1} placeholder="0" value={travelKm}
                    onChange={e => setTravelKm(e.target.value)}
                    className="w-24 border border-[#e5e9f0] rounded-lg px-3 py-1.5 text-sm text-[#111827] focus:outline-none focus:border-[#ffd100]" />
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-[#6b7280] w-44 flex-shrink-0">Formula: 2 × {km || '0'}km × ${travelRate.toFixed(2)}/km</span>
                  <span className={`text-sm font-bold ${travelTotal > 0 ? 'text-[#111827]' : 'text-[#9ca3af]'}`}>
                    {travelTotal > 0 ? fmt(travelTotal) : '$0'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── COMMISSION TAB ── */}
      {activeTab === 'commission' && (
        <div className="space-y-5">
          {/* Price breakdown */}
          <div className="bg-[#f9fafb] rounded-xl border border-[#e5e9f0] p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-[#6b7280] mb-3">Quote Breakdown</p>
            <div className="space-y-2">
              {selectedBundle ? (
                <div className="flex justify-between text-sm">
                  <span className="text-[#374151]">Base package ({selectedBundle.batteryBrand} {selectedBundle.batteryModel})</span>
                  <span className="font-semibold text-[#111827]">{fmt(selectedBundle.heaPrice)}</span>
                </div>
              ) : (
                <p className="text-sm text-[#9ca3af] italic">No package selected</p>
              )}
              {extrasTotal > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#374151]">Extras</span>
                  <span className="font-semibold text-[#111827]">{fmt(extrasTotal)}</span>
                </div>
              )}
              {travelTotal > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#374151]">Travel ({km}km)</span>
                  <span className="font-semibold text-[#111827]">{fmt(travelTotal)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold border-t border-[#e5e9f0] pt-2 mt-2">
                <span className="text-[#111827]">Customer Total</span>
                <span className="text-[#111827]">{subtotal > 0 ? fmt(subtotal) : '—'}</span>
              </div>
            </div>
          </div>

          {/* Internal commissions */}
          <div className="bg-[#f9fafb] rounded-xl border border-[#e5e9f0] p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-[#6b7280] mb-3">Internal Commissions</p>
            <p className="text-xs text-[#9ca3af] mb-3">Paid by HEA from margin — not charged to customer.</p>
            <div className="space-y-3">
              {[
                { label: 'Sales commission', value: salesComm, set: setSalesComm },
                { label: 'Install commission', value: installComm, set: setInstallComm },
              ].map(({ label, value, set }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-sm text-[#374151]">{label}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-[#6b7280]">$</span>
                    <input type="number" step={100} value={value}
                      onChange={e => set(parseInt(e.target.value) || 0)}
                      className="w-24 text-right border border-[#e5e9f0] rounded-lg px-2 py-1 text-sm font-semibold text-[#111827] focus:outline-none focus:border-[#ffd100]" />
                  </div>
                </div>
              ))}
              <div className="flex justify-between text-sm font-bold border-t border-[#e5e9f0] pt-2">
                <span className="text-[#374151]">Total commissions paid out</span>
                <span className="text-[#111827]">{fmt(salesComm + installComm)}</span>
              </div>
            </div>
          </div>

          {/* Government rebates */}
          <div className="bg-[#fffbeb] rounded-xl border border-[#fde68a] p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-[#92400e] mb-3">Government Rebates</p>
            <div className="space-y-3">
              {/* Federal STCs */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[#111827]">Federal STC Rebate</p>
                  <p className="text-xs text-[#6b7280] mt-0.5">
                    {solarKwForStc > 0
                      ? `${solarKwForStc}kW × ${STC_ZONE} zone factor × ${STC_YEARS} years × $${STC_SPOT}/STC — already applied to base price`
                      : 'Select a solar package to estimate'}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  {solarKwForStc > 0 ? (
                    <>
                      <p className="text-sm font-bold text-green-700">~{fmt(stcEstimate)}</p>
                      <p className="text-xs text-green-600">Applied ✓</p>
                    </>
                  ) : (
                    <p className="text-sm text-[#9ca3af]">—</p>
                  )}
                </div>
              </div>

              {/* Solar Victoria battery */}
              <div className="flex items-start justify-between gap-3 pt-2 border-t border-[#fde68a]">
                <div>
                  <p className="text-sm font-semibold text-[#111827]">Solar Victoria Battery Rebate</p>
                  <p className="text-xs text-[#6b7280] mt-0.5">Customer applies at solarvictoria.vic.gov.au — not included in price</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-[#111827]">{fmt(settings.solarVictoriaRebate)}</p>
                  <p className="text-xs text-amber-600">Customer applies</p>
                </div>
              </div>

              {/* Solar Victoria solar */}
              <div className="flex items-start justify-between gap-3 pt-2 border-t border-[#fde68a]">
                <div>
                  <p className="text-sm font-semibold text-[#111827]">Solar Victoria Solar Rebate</p>
                  <p className="text-xs text-[#6b7280] mt-0.5">Up to $1,400 for eligible households (income &lt;$180k) — not included in price</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-[#111827]">up to $1,400</p>
                  <p className="text-xs text-amber-600">Customer applies</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SOLAR BASE TAB ── */}
      {activeTab === 'solar' && (
        <div>
          <p className="text-xs text-[#6b7280] mb-3">Solar-only base prices (reference — use Packages tab for bundles)</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e5e9f0]">
                  {['Size', 'Panel', 'Inverter', 'HEA Price'].map(h => (
                    <th key={h} className={`py-2 px-3 text-xs font-semibold text-[#6b7280] uppercase tracking-wider ${h === 'HEA Price' ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['6.6 kW', 'Risen 475W', 'GoodWe', '$4,000'],
                  ['Above 6.6kW', 'Risen 475W', 'GoodWe', '$0.59/watt'],
                  ['6.6 kW', 'Jinko 440W', 'GoodWe', '$4,150'],
                  ['Above 6.6kW', 'Jinko', 'GoodWe', '$0.612/watt'],
                  ['8.55 kW', 'Risen 475W', 'GoodWe', '$5,045'],
                  ['10.45 kW', 'Risen 475W', 'GoodWe', '$6,140'],
                  ['13.3 kW', 'Risen 475W', 'GoodWe', '$7,847'],
                ].map(([size, panel, inv, price]) => (
                  <tr key={size + panel} className="border-b border-[#e5e9f0] hover:bg-slate-50">
                    <td className="py-2 px-3 font-medium text-[#111827]">{size}</td>
                    <td className="py-2 px-3 text-[#374151]">{panel}</td>
                    <td className="py-2 px-3 text-[#374151]">{inv}</td>
                    <td className="py-2 px-3 text-right font-semibold text-[#111827]">{price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── BOTTOM BAR ── */}
      {(selectedBundle || extrasTotal > 0 || travelTotal > 0) && (
        <div className="mt-6 pt-5 border-t border-[#e5e9f0]">
          <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
            <div>
              <div className="flex flex-wrap gap-x-3 text-sm text-[#374151]">
                {selectedBundle && <span>Base: <strong>{fmt(basePrice)}</strong></span>}
                {extrasTotal > 0 && <span>+ Extras: <strong>{fmt(extrasTotal)}</strong></span>}
                {travelTotal > 0 && <span>+ Travel: <strong>{fmt(travelTotal)}</strong></span>}
              </div>
              <p className="text-xs text-[#9ca3af] mt-0.5">
                Commissions internal · Solar Victoria rebate not included
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-[#6b7280]">Customer Total</p>
              <p className="text-2xl font-bold text-[#111827]">{fmt(subtotal)}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={generateReport}
              className="flex items-center gap-2 px-4 py-2.5 border-2 border-[#e5e9f0] text-[#374151] font-semibold rounded-xl text-sm hover:border-[#111827] transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Generate Report
            </button>

            {jobNumber && selectedBundle && (
              <button onClick={handleSave} disabled={saving}
                className="flex-1 bg-[#111827] text-white font-semibold py-2.5 px-4 rounded-xl text-sm hover:bg-[#1f2937] disabled:opacity-60 transition-colors">
                {saving ? 'Saving…' : 'Save Quote to Job'}
              </button>
            )}

            {sheetUrl && (
              <a href={sheetUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-2.5 border-2 border-[#ffd100] text-[#111827] font-semibold rounded-xl text-sm hover:bg-[#ffd100]/10 transition-colors whitespace-nowrap">
                Edit in Sheets →
              </a>
            )}
          </div>

          {saveError && <p className="text-red-600 text-sm mt-2">{saveError}</p>}
          {saveSuccess && <p className="text-green-600 text-sm mt-2">Quote saved to job.</p>}
        </div>
      )}

      {/* Browse mode sheet link when nothing selected */}
      {!selectedBundle && extrasTotal === 0 && travelTotal === 0 && sheetUrl && (
        <div className="mt-6 flex justify-end">
          <a href={sheetUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-[#6b7280] hover:text-[#111827] transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Edit in Google Sheets
          </a>
        </div>
      )}
    </div>
  )
}
