"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Nav from "@/components/Nav"

function SolarAnalyserContent() {
  const params = useSearchParams()
  const name          = params.get("name")
  const address       = params.get("address")
  const phone         = params.get("phone")
  const email         = params.get("email")
  const annualBill    = params.get("annualBill")
  const occupants     = params.get("occupants")
  const homeDaytime   = params.get("homeDaytime")
  const hotWater      = params.get("hotWater")
  const gasAppliances = params.get("gasAppliances")
  const ev            = params.get("ev")
  const driveUrl      = params.get("driveUrl")

  // Build GAS URL with client params so the script can pre-fill fields
  const GAS_BASE = "https://script.google.com/macros/s/AKfycbzI42lh28ASdcxa2F6b8_euLk9KBcfvg4VfxR-bI3Jl3dLPTxvFGDKuZJh2_tqvZiE/exec"
  const gasParams = new URLSearchParams()
  if (name)          gasParams.set("name", name)
  if (email)         gasParams.set("email", email)
  if (phone)         gasParams.set("phone", phone)
  if (address)       gasParams.set("address", address)
  if (annualBill)    gasParams.set("annualBill", annualBill)
  if (occupants)     gasParams.set("occupants", occupants)
  if (homeDaytime)   gasParams.set("homeDaytime", homeDaytime)
  if (hotWater)      gasParams.set("hotWater", hotWater)
  if (gasAppliances) gasParams.set("gasAppliances", gasAppliances)
  if (ev)            gasParams.set("ev", ev)
  if (driveUrl)      gasParams.set("driveUrl", driveUrl)
  const gasUrl = gasParams.size > 0 ? `${GAS_BASE}?${gasParams.toString()}` : GAS_BASE

  return (
    <>
      <Nav />
      <div
        className="w-full bg-heffgray2 border-t-4 border-heffdark relative"
        style={{ marginTop: "80px", height: "calc(100vh - 80px)", overflow: "hidden" }}
      >
        <div className="text-center px-6">
          <div className="mb-6">
            <svg className="w-16 h-16 mx-auto text-[#ffd100]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-heffblack mb-2">HEA Solar Analyser</h1>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Upload your NEM12 interval data for a personalised solar and battery proposal from the HEA team.
          </p>
          <a
            href={gasUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-heffdark text-white font-semibold px-8 py-4 rounded-xl hover:bg-heffblack transition-colors text-lg shadow-md"
          >
            Open Solar Analyser →
          </a>
          <p className="text-gray-400 text-sm mt-4">{name ? `Pre-filled for ${name} — opens in a new tab` : "Opens in a new tab"}</p>
        </div>

        {/* Floating customer info card — shown when opened from admin lead card */}
        {name && (
          <div className="absolute top-4 right-4 z-10 p-3 rounded-xl bg-yellow-50 border border-yellow-200 shadow-lg max-w-xs">
            <p className="text-xs font-semibold text-yellow-800 mb-1.5 uppercase tracking-wide">Customer</p>
            <p className="text-sm text-gray-700 font-medium">{name}</p>
            {address && <p className="text-xs text-gray-600 mt-0.5">{address}</p>}
            {phone && <p className="text-xs text-gray-600">{phone}</p>}
            {email && <p className="text-xs text-gray-600">{email}</p>}
            {annualBill && <p className="text-xs text-gray-600">Bill: ${annualBill}/yr</p>}
            {occupants && <p className="text-xs text-gray-500 mt-1">Occupants: {occupants}</p>}
            {homeDaytime && <p className="text-xs text-gray-500">Home daytime: {homeDaytime}</p>}
            {hotWater && <p className="text-xs text-gray-500">Hot water: {hotWater}</p>}
            {gasAppliances && <p className="text-xs text-gray-500">Gas: {gasAppliances}</p>}
            {ev && <p className="text-xs text-gray-500">EV: {ev}</p>}
            {driveUrl && (
              <a href={driveUrl} target="_blank" rel="noopener noreferrer"
                className="text-xs text-yellow-700 hover:underline mt-1.5 block">
                📁 Client folder (NMI Data) →
              </a>
            )}
            <a
              href="https://myenergy.powercor.com.au/s/nmi-register"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-yellow-700 hover:underline mt-1 block"
            >
              NMI lookup (Powercor) →
            </a>
          </div>
        )}

        {/* Powercor NMI link — shown when no customer params (standalone access) */}
        {!name && (
          <div className="absolute bottom-4 right-4 z-10">
            <a
              href="https://myenergy.powercor.com.au/s/nmi-register"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs bg-black/60 text-[#ffd100] hover:text-white px-3 py-1.5 rounded-lg backdrop-blur-sm"
            >
              NMI lookup (Powercor) →
            </a>
          </div>
        )}
      </div>
    </>
  )
}

export default function SolarAnalyserPage() {
  return (
    <Suspense fallback={null}>
      <SolarAnalyserContent />
    </Suspense>
  )
}
