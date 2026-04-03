// lib/cost-client.ts
// Client-safe re-export of cost display helpers.
// Does NOT import process.env directly (that only works server-side).
// Client components fetch cost from /api/admin/cost instead.

export interface CostInfo {
  knownCost: boolean
  amountAud: number | null
  displayString: string
  blockedReason: string | null
}

// Placeholder for future client-side cost utilities if needed.
export function getCostClient(): CostInfo {
  return {
    knownCost: false,
    amountAud: null,
    displayString: "loading...",
    blockedReason: null,
  }
}
