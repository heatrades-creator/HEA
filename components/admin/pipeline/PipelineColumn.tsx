interface Props {
  title: string
  description: string
  count: number
  accent: "amber" | "blue" | "green"
  children: React.ReactNode
}

const accentBorder = { amber: "border-[#ffd100]", blue: "border-blue-500", green: "border-green-500" }
const accentText   = { amber: "text-[#ffd100]",   blue: "text-blue-400",   green: "text-green-400" }
const accentBg     = { amber: "bg-amber-950/30",   blue: "bg-blue-950/30",  green: "bg-green-950/30" }

export function PipelineColumn({ title, description, count, accent, children }: Props) {
  return (
    <div className="flex flex-col min-h-0">
      {/* Column header */}
      <div className={`rounded-xl border-l-4 ${accentBorder[accent]} ${accentBg[accent]} px-4 py-3 mb-3`}>
        <div className="flex items-center justify-between">
          <h2 className={`font-semibold text-sm ${accentText[accent]}`}>{title}</h2>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${accentBg[accent]} border ${accentBorder[accent]} ${accentText[accent]}`}>
            {count}
          </span>
        </div>
        <p className="text-[#555] text-xs mt-0.5">{description}</p>
      </div>

      {/* Cards */}
      <div className="space-y-3 flex-1">
        {count === 0 ? (
          <div className="border border-dashed border-[#2e2e2e] rounded-xl p-8 text-center">
            <p className="text-[#444] text-sm">No leads here yet</p>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  )
}
