// lib/cost.ts
// SINGLE SOURCE OF TRUTH for all paid OpenSolar actions.
// Never hardcode costs elsewhere. Always read from here.

export type PaidAction =
  | "create_project"
  | "premium_imagery"
  | "permit_pack"

export interface CostResult {
  knownCost: boolean
  amountAud: number | null
  displayString: string
  blockedReason: string | null
}

const ENV_KEYS: Record<PaidAction, string> = {
  create_project:  "OPENSOLAR_API_COST_PER_PROJECT",
  premium_imagery: "OPENSOLAR_PREMIUM_IMAGERY_COST",
  permit_pack:     "OPENSOLAR_PERMITTING_COST",
}

const ACTION_LABELS: Record<PaidAction, string> = {
  create_project:  "Create project in OpenSolar",
  premium_imagery: "Enable Nearmap Premium Imagery",
  permit_pack:     "Order Permit & Engineering Package",
}

export { ACTION_LABELS }

export function getCost(action: PaidAction): CostResult {
  const raw = process.env[ENV_KEYS[action]]
  const parsed = parseFloat(raw ?? "")

  if (!raw || raw === "0" || isNaN(parsed) || parsed <= 0) {
    return {
      knownCost: false,
      amountAud: null,
      displayString: "COST UNKNOWN",
      blockedReason:
        `Set ${ENV_KEYS[action]} in .env.local. ` +
        `Check OpenSolar: Control → Connect for the exact AUD value.`,
    }
  }

  return {
    knownCost: true,
    amountAud: parsed,
    displayString: `$${parsed.toFixed(2)} AUD`,
    blockedReason: null,
  }
}

/** Returns true only if the cost env var is set to a positive number */
export function isSafeToFire(action: PaidAction): boolean {
  return getCost(action).knownCost
}

/** Returns a JSON snapshot string for audit logging */
export function getCostSnapshot(action: PaidAction): string {
  return JSON.stringify({
    action,
    envKey: ENV_KEYS[action],
    value: process.env[ENV_KEYS[action]] ?? "not_set",
    timestamp: new Date().toISOString(),
  })
}
