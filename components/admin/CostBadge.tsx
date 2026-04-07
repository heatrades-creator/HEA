// components/admin/CostBadge.tsx
// Reusable badge showing a cost amount or UNKNOWN state.

interface CostBadgeProps {
  amountAud: number | null
  size?: "sm" | "md"
}

export function CostBadge({ amountAud, size = "md" }: CostBadgeProps) {
  const base = size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-3 py-1"

  if (amountAud === null || amountAud <= 0) {
    return (
      <span className={`inline-flex items-center rounded-full font-mono font-semibold bg-red-950 text-red-400 border border-red-800 ${base}`}>
        COST UNKNOWN
      </span>
    )
  }

  return (
    <span className={`inline-flex items-center rounded-full font-mono font-semibold bg-amber-950 text-amber-400 border border-amber-800 ${base}`}>
      ${amountAud.toFixed(2)} AUD
    </span>
  )
}
