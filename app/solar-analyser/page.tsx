"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Nav from "@/components/Nav"

function SolarAnalyserContent() {
  const params = useSearchParams()
  const name       = params.get("name")
  const address    = params.get("address")
  const phone      = params.get("phone")
  const email      = params.get("email")
  const annualBill = params.get("annualBill")

  return (
    <>
      <Nav />
      {/* Accent stripe + iframe container — fills full viewport below the fixed nav */}
      <div
        className="w-full bg-heffgray2 border-t-4 border-heffdark relative"
        style={{ marginTop: "80px", height: "calc(100vh - 80px)", overflow: "hidden" }}
      >
        {/* Subtle branded gradient visible briefly while the iframe loads */}
        <div className="relative w-full h-full">
          {/* Loading backdrop */}
          <div
            className="absolute inset-0 bg-gradient-to-br from-heffblack via-slate-800 to-heffdark opacity-5 pointer-events-none"
            aria-hidden="true"
          />
          <iframe
            src="https://script.google.com/macros/s/AKfycbwYbZHXmEguJJFmGT0hd94M5heR8TUJFVConEBwcEI5x-DTgLUibdN5dlLp-VKr5tQ/exec"
            title="Solar Analyser"
            allow="fullscreen"
            style={{ width: "100%", height: "100%", border: "none", display: "block" }}
          />
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
            <a
              href="https://myenergy.powercor.com.au/s/nmi-register"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-yellow-700 hover:underline mt-2 block"
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
