'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'

// ── Types ────────────────────────────────────────────────────────────────────

export type Bundle = {
  phase: string
  solarKw: number
  batteryBrand: string
  batteryModel: string
  batteryKwh: number
  inverter: string
  heaPrice: number
  notes: string
}

export type Extra = {
  section: string
  item: string
  unit: string
  heaPrice: number
  heaPriceDisplay: string
  sjWholesale: string
  description: string
}

export type PricingSettings = {
  salesCommission: number
  installCommission: number
  solarVictoriaRebate: number
  lastUpdated: string
}

type ExtraState = {
  enabled: boolean
  qty: number
}

type Props = {
  bundles1P: Bundle[]
  bundles3P: Bundle[]
  extras: Extra[]
  settings: PricingSettings
  sheetUrl: string
  jobNumber?: string
  clientName?: string
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtPrice(n: number): string {
  return '$' + Math.round(n).toLocaleString('en-AU')
}

function isPerUnit(unit: string): boolean {
  return unit.includes('per') || unit.includes('metre') || unit.includes('panel') || unit.includes('array')
}

const SOLAR_SIZES = [6.6, 8.55, 10.45, 13.3]

// ── Component ────────────────────────────────────────────────────────────────

export default function QuoteBuilder({ bundles1P, bundles3P, extras, settings, sheetUrl, jobNumber, clientName }: Props) {
  const router = useRouter()
  const [phase, setPhase] = useState<'1P' | '3P'>('1P')
  const [solarKw, setSolarKw] = useState<number>(6.6)
  const [batteryOnly, setBatteryOnly] = useState(false)
  const [selectedBundle, setSelectedBundle] = useState<Bundle | null>(null)
  const [extraStates, setExtraStates] = useState<Record<string, ExtraState>>({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [activeTab, setActiveTab] = useState<'bundles' | 'extras' | 'solar'>('bundles')

  const bundles = phase === '3P' ? bundles3P : bundles1P

  const filteredBundles = useMemo(() => {
    if (batteryOnly) return bundles.filter(b => b.solarKw === 0)
    return bundles.filter(b => b.solarKw === solarKw)
  }, [bundles, solarKw, batteryOnly])

  const extrasTotal = useMemo(() => {
    return extras.reduce((sum, e) => {
      const key = e.section + ':' + e.item
      const state = extraStates[key]
      if (!state?.enabled) return sum
      const qty = isPerUnit(e.unit) ? (state.qty || 0) : 1
      return sum + e.heaPrice * qty
    }, 0)
  }, [extras, extraStates])

  const total = (selectedBundle?.heaPrice ?? 0) + extrasTotal

  function toggleExtra(section: string, item: string) {
    const key = section + ':' + item
    setExtraStates(prev => ({
      ...prev,
      [key]: { enabled: !prev[key]?.enabled, qty: prev[key]?.qty ?? 1 },
    }))
  }

  function setExtraQty(section: string, item: string, qty: number) {
    const key = section + ':' + item
    setExtraStates(prev => ({
      ...prev,
      [key]: { enabled: prev[key]?.enabled ?? true, qty: Math.max(0, qty) },
    }))
  }

  async function handleSave() {
    if (!jobNumber || !selectedBundle) return
    setSaving(true)
    setSaveError('')
    setSaveSuccess(false)

    const enabledExtras = extras.flatMap(e => {
      const key = e.section + ':' + e.item
      const state = extraStates[key]
      if (!state?.enabled) return []
      const qty = isPerUnit(e.unit) ? (state.qty || 0) : 1
      if (qty === 0) return []
      return [{ item: e.item, qty, unitPrice: e.heaPrice }]
    })

    const solarLabel = batteryOnly ? 'Battery Only' : `${solarKw}kW Solar`
    const label = `${solarLabel} + ${selectedBundle.batteryBrand} ${selectedBundle.batteryModel} ${phase}`

    const [inverterBrand, ...inverterModelParts] = (selectedBundle.inverter || '').split(' ')

    const res = await fetch('/api/dashboard/pricing/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobNumber,
        totalPrice: total,
        packageLabel: label,
        panelBrand: batteryOnly ? '' : 'Risen',
        panelModel: batteryOnly ? '' : 'Risen 475W',
        inverterBrand: inverterBrand || selectedBundle.batteryBrand,
        inverterModel: selectedBundle.inverter,
        batteryBrand: selectedBundle.batteryBrand,
        batteryModel: selectedBundle.batteryModel,
        batteryKwh: selectedBundle.batteryKwh,
        extras: enabledExtras,
      }),
    })

    const data = await res.json()
    setSaving(false)
    if (data.error) {
      setSaveError(data.error)
    } else {
      setSaveSuccess(true)
      router.refresh()
    }
  }

  const extrasBySection = useMemo(() => {
    const map: Record<string, Extra[]> = {}
    extras.forEach(e => {
      if (!map[e.section]) map[e.section] = []
      map[e.section].push(e)
    })
    return map
  }, [extras])

  const hasData = bundles.length > 0 || extras.length > 0

  if (!hasData) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
        <p className="font-semibold text-amber-800 mb-1">Pricing sheet not connected</p>
        <p className="text-amber-700 text-sm">
          Complete Jesse&apos;s one-time setup: create the &quot;HEA Master Pricing&quot; Google Sheet,
          create a new GAS project, add the script ID to GAS/HEAPricingAPI/.clasp.json, push to main,
          then set <code className="bg-amber-100 px-1 rounded">PRICING_SHEET_ID</code> in GAS Script Properties.
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Quote mode header */}
      {jobNumber && (
        <div className="flex items-center justify-between mb-4 p-4 bg-[#ffd100]/10 border border-[#ffd100]/30 rounded-xl">
          <div>
            <p className="text-xs text-[#6b7280] uppercase tracking-wider font-semibold">Quote Builder</p>
            <p className="font-bold text-[#111827]">{jobNumber}{clientName ? ` — ${clientName}` : ''}</p>
          </div>
          {total > 0 && (
            <div className="text-right">
              <p className="text-xs text-[#6b7280]">Customer Total</p>
              <p className="text-2xl font-bold text-[#111827]">{fmtPrice(total)}</p>
            </div>
          )}
        </div>
      )}

      {/* Phase + Solar size selectors */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div>
          <label className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider block mb-1">Phase</label>
          <div className="flex gap-1.5">
            {(['1P', '3P'] as const).map(p => (
              <button key={p} onClick={() => { setPhase(p); setSelectedBundle(null) }}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold border transition-colors ${
                  phase === p ? 'bg-[#ffd100] border-[#ffd100] text-[#111827]' : 'border-[#e5e9f0] text-[#6b7280] hover:border-[#ffd100]'
                }`}>
                {p}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider block mb-1">System Type</label>
          <div className="flex gap-1.5">
            <button onClick={() => { setBatteryOnly(false); setSelectedBundle(null) }}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors ${
                !batteryOnly ? 'bg-[#ffd100] border-[#ffd100] text-[#111827]' : 'border-[#e5e9f0] text-[#6b7280] hover:border-[#ffd100]'
              }`}>Solar + Battery</button>
            <button onClick={() => { setBatteryOnly(true); setSelectedBundle(null) }}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors ${
                batteryOnly ? 'bg-[#ffd100] border-[#ffd100] text-[#111827]' : 'border-[#e5e9f0] text-[#6b7280] hover:border-[#ffd100]'
              }`}>Battery Only</button>
          </div>
        </div>

        {!batteryOnly && (
          <div>
            <label className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider block mb-1">Solar Size</label>
            <div className="flex gap-1.5 flex-wrap">
              {SOLAR_SIZES.map(kw => (
                <button key={kw} onClick={() => { setSolarKw(kw); setSelectedBundle(null) }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors ${
                    solarKw === kw ? 'bg-[#111827] border-[#111827] text-white' : 'border-[#e5e9f0] text-[#6b7280] hover:border-[#111827]'
                  }`}>
                  {kw} kW
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#e5e9f0] mb-5">
        {([['bundles', 'Packages'], ['extras', 'Extras'], ['solar', 'Solar Base']] as const).map(([tab, label]) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === tab ? 'border-[#ffd100] text-[#111827]' : 'border-transparent text-[#6b7280] hover:text-[#111827]'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* Packages tab */}
      {activeTab === 'bundles' && (
        <div className="space-y-2">
          {filteredBundles.length === 0 ? (
            <p className="text-[#6b7280] text-sm py-4 text-center">No packages for {phase} {batteryOnly ? 'battery only' : `${solarKw}kW`}. Check the pricing sheet.</p>
          ) : (
            filteredBundles.map((b, i) => {
              const key = `${b.batteryBrand}-${b.batteryModel}-${b.inverter}`
              const active = selectedBundle && selectedBundle.batteryBrand === b.batteryBrand && selectedBundle.batteryModel === b.batteryModel && selectedBundle.inverter === b.inverter
              return (
                <button key={i} onClick={() => setSelectedBundle(b)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border-2 text-left transition-all ${
                    active ? 'border-[#ffd100] bg-[#ffd100]/5' : 'border-[#e5e9f0] hover:border-[#ffd100]/50'
                  }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${active ? 'border-[#ffd100] bg-[#ffd100]' : 'border-[#d1d5db]'}`} />
                    <div>
                      <p className="font-semibold text-[#111827] text-sm">{b.batteryBrand} {b.batteryModel}</p>
                      <p className="text-xs text-[#6b7280]">{b.batteryKwh} kWh · {b.inverter}</p>
                    </div>
                  </div>
                  <p className="font-bold text-[#111827]">{fmtPrice(b.heaPrice)}</p>
                </button>
              )
            })
          )}
        </div>
      )}

      {/* Extras tab */}
      {activeTab === 'extras' && (
        <div className="space-y-6">
          {Object.entries(extrasBySection).map(([section, items]) => (
            <div key={section}>
              <p className="text-xs font-bold uppercase tracking-wider text-[#6b7280] mb-2">{section}</p>
              <div className="space-y-1">
                {items.map(e => {
                  const key = e.section + ':' + e.item
                  const state = extraStates[key]
                  const enabled = state?.enabled ?? false
                  const perUnit = isPerUnit(e.unit)
                  const qty = state?.qty ?? 1
                  const lineTotal = enabled ? e.heaPrice * (perUnit ? qty : 1) : 0

                  return (
                    <div key={key} className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${enabled ? 'border-[#ffd100]/50 bg-[#ffd100]/5' : 'border-[#e5e9f0] hover:border-[#ffd100]/30'}`}>
                      <input type="checkbox" checked={enabled} onChange={() => toggleExtra(e.section, e.item)}
                        className="w-4 h-4 accent-[#ffd100] flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#111827]">{e.item}</p>
                        <p className="text-xs text-[#6b7280]">{fmtPrice(e.heaPrice)} / {e.unit}</p>
                      </div>
                      {perUnit && enabled && (
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => setExtraQty(e.section, e.item, qty - 1)}
                            className="w-7 h-7 rounded-lg border border-[#e5e9f0] text-[#6b7280] hover:border-[#111827] text-sm font-bold flex items-center justify-center">−</button>
                          <input type="number" min={0} value={qty} onChange={ev => setExtraQty(e.section, e.item, parseInt(ev.target.value) || 0)}
                            className="w-14 text-center border border-[#e5e9f0] rounded-lg py-1 text-sm text-[#111827] focus:outline-none focus:border-[#ffd100]" />
                          <button onClick={() => setExtraQty(e.section, e.item, qty + 1)}
                            className="w-7 h-7 rounded-lg border border-[#e5e9f0] text-[#6b7280] hover:border-[#111827] text-sm font-bold flex items-center justify-center">+</button>
                        </div>
                      )}
                      {enabled && <p className="text-sm font-semibold text-[#111827] w-20 text-right">{lineTotal > 0 ? fmtPrice(lineTotal) : '—'}</p>}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Solar base tab — read-only reference */}
      {activeTab === 'solar' && (
        <div className="space-y-2">
          <p className="text-xs text-[#6b7280] mb-3">Solar-only base prices (for reference — use Packages tab for bundles)</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e5e9f0]">
                  <th className="text-left py-2 px-3 text-xs font-semibold text-[#6b7280] uppercase tracking-wider">Size</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-[#6b7280] uppercase tracking-wider">Panel</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-[#6b7280] uppercase tracking-wider">Inverter</th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-[#6b7280] uppercase tracking-wider">HEA Price</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-[#e5e9f0] hover:bg-slate-50">
                  <td className="py-2 px-3 font-medium text-[#111827]">6.6 kW</td>
                  <td className="py-2 px-3 text-[#374151]">Risen 475W</td>
                  <td className="py-2 px-3 text-[#374151]">GoodWe</td>
                  <td className="py-2 px-3 text-right font-semibold text-[#111827]">$4,000</td>
                </tr>
                <tr className="border-b border-[#e5e9f0] hover:bg-slate-50">
                  <td className="py-2 px-3 font-medium text-[#111827]">Above 6.6kW</td>
                  <td className="py-2 px-3 text-[#374151]">Risen 475W</td>
                  <td className="py-2 px-3 text-[#374151]">GoodWe</td>
                  <td className="py-2 px-3 text-right font-semibold text-[#111827]">$0.59/watt</td>
                </tr>
                <tr className="border-b border-[#e5e9f0] hover:bg-slate-50">
                  <td className="py-2 px-3 font-medium text-[#111827]">6.6 kW</td>
                  <td className="py-2 px-3 text-[#374151]">Jinko 440W</td>
                  <td className="py-2 px-3 text-[#374151]">GoodWe</td>
                  <td className="py-2 px-3 text-right font-semibold text-[#111827]">$4,150</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="py-2 px-3 font-medium text-[#111827]">Above 6.6kW</td>
                  <td className="py-2 px-3 text-[#374151]">Jinko</td>
                  <td className="py-2 px-3 text-[#374151]">GoodWe</td>
                  <td className="py-2 px-3 text-right font-semibold text-[#111827]">$0.612/watt</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Running total + save */}
      {(selectedBundle || extrasTotal > 0) && (
        <div className="mt-6 pt-5 border-t border-[#e5e9f0]">
          <div className="flex items-center justify-between mb-2">
            <div>
              {selectedBundle && (
                <p className="text-sm text-[#374151]">
                  Base: <span className="font-semibold">{fmtPrice(selectedBundle.heaPrice)}</span>
                  {extrasTotal > 0 && <span className="text-[#6b7280]"> + Extras: <span className="font-semibold">{fmtPrice(extrasTotal)}</span></span>}
                </p>
              )}
              <p className="text-xs text-[#6b7280] mt-0.5">
                + Sales $1,000 + Install $2,000 commission (internal) · Solar Victoria ${settings.solarVictoriaRebate.toLocaleString('en-AU')} rebate not included
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-[#6b7280]">Customer Total</p>
              <p className="text-2xl font-bold text-[#111827]">{fmtPrice(total)}</p>
            </div>
          </div>

          {jobNumber && selectedBundle && (
            <div className="flex gap-3 mt-4">
              <button onClick={handleSave} disabled={saving}
                className="flex-1 bg-[#111827] text-white font-semibold py-3 rounded-xl text-sm hover:bg-[#1f2937] disabled:opacity-60 transition-colors">
                {saving ? 'Saving…' : 'Save Quote to Job'}
              </button>
              {sheetUrl && (
                <a href={sheetUrl} target="_blank" rel="noopener noreferrer"
                  className="px-4 py-3 border-2 border-[#ffd100] text-[#111827] font-semibold rounded-xl text-sm hover:bg-[#ffd100]/10 transition-colors whitespace-nowrap">
                  Edit in Sheets →
                </a>
              )}
            </div>
          )}

          {!jobNumber && sheetUrl && (
            <a href={sheetUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 border-2 border-[#ffd100] text-[#111827] font-semibold rounded-xl text-sm hover:bg-[#ffd100]/10 transition-colors mt-2">
              Edit in Google Sheets →
            </a>
          )}

          {saveError && <p className="text-red-600 text-sm mt-2">{saveError}</p>}
          {saveSuccess && <p className="text-green-600 text-sm mt-2">Quote saved to job successfully.</p>}
        </div>
      )}

      {/* Browse mode bottom edit link */}
      {!jobNumber && !selectedBundle && sheetUrl && (
        <div className="mt-6 text-right">
          <a href={sheetUrl} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-[#6b7280] hover:text-[#111827] transition-colors">
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
