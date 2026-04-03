"use client"

import { useState } from "react"
import { CostBadge } from "./CostBadge"

interface Feature {
  key: string
  name: string
  phase: number
  costType: string
  warning: string
  envKey: string | null
  costAud?: number | null
  enabled: boolean
}

interface FeaturePanelProps {
  features: Feature[]
}

export function FeaturePanel({ features }: FeaturePanelProps) {
  const [states, setStates] = useState<Record<string, boolean>>(
    Object.fromEntries(features.map(f => [f.key, f.enabled]))
  )
  const [pending, setPending] = useState<string | null>(null)
  const [confirmFeature, setConfirmFeature] = useState<Feature | null>(null)

  async function toggle(feature: Feature) {
    const newValue = !states[feature.key]

    // Show confirmation for paid features being enabled
    if (newValue && (feature.costType === "paid_per_project" || feature.costType === "paid_per_order")) {
      setConfirmFeature(feature)
      return
    }

    await applyToggle(feature.key, newValue)
  }

  async function applyToggle(key: string, value: boolean) {
    setPending(key)
    try {
      await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value: value ? "true" : "false" }),
      })
      setStates(s => ({ ...s, [key]: value }))
    } finally {
      setPending(null)
    }
  }

  const phaseGroups = [1, 2, 3]

  return (
    <div className="space-y-8">
      {phaseGroups.map(phase => {
        const phaseFeatures = features.filter(f => f.phase === phase)
        if (phaseFeatures.length === 0) return null

        return (
          <div key={phase}>
            <h3 className="text-[#555] text-xs uppercase tracking-wider font-medium mb-3">
              Phase {phase} — {phase === 1 ? "Foundation" : phase === 2 ? "Growth" : "Scale"}
            </h3>
            <div className="space-y-3">
              {phaseFeatures.map(feature => {
                const enabled = states[feature.key]
                const isPaid  = feature.costType === "paid_per_project" || feature.costType === "paid_per_order"

                return (
                  <div
                    key={feature.key}
                    className="bg-[#202020] border border-[#2e2e2e] rounded-xl p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h4 className="text-white font-medium">{feature.name}</h4>
                          {isPaid && (
                            <CostBadge amountAud={feature.costAud ?? null} size="sm" />
                          )}
                          <span className="text-[#444] text-xs px-2 py-0.5 rounded-full border border-[#2e2e2e]">
                            {feature.costType.replace(/_/g, " ")}
                          </span>
                        </div>
                        <p className="text-[#555] text-xs leading-relaxed">{feature.warning}</p>
                      </div>

                      {/* Toggle */}
                      <button
                        onClick={() => toggle(feature)}
                        disabled={pending === feature.key}
                        className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors focus:outline-none ${
                          enabled ? "bg-[#ffd100]" : "bg-[#333]"
                        } disabled:opacity-50`}
                        aria-pressed={enabled}
                        aria-label={`${enabled ? "Disable" : "Enable"} ${feature.name}`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                            enabled ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Paid feature confirmation modal */}
      {confirmFeature && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="bg-[#202020] border border-[#2e2e2e] rounded-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-white font-semibold">Enable paid feature?</h3>
            <p className="text-[#aaa] text-sm">
              Enabling <strong className="text-white">{confirmFeature.name}</strong> will allow actions that cost money.
            </p>
            <div className="flex items-center gap-3">
              <span className="text-[#aaa] text-sm">Cost per use:</span>
              <CostBadge amountAud={confirmFeature.costAud ?? null} />
            </div>
            <p className="text-[#555] text-xs">{confirmFeature.warning}</p>
            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setConfirmFeature(null)}
                className="px-4 py-2 rounded-lg text-sm text-[#aaa] hover:text-white hover:bg-[#2a2a2a] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await applyToggle(confirmFeature.key, true)
                  setConfirmFeature(null)
                }}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#ffd100] text-black hover:bg-[#e6bc00] transition-colors"
              >
                Enable anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
