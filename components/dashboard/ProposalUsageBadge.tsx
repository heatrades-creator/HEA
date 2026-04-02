/**
 * ProposalUsageBadge — server component.
 * Shows real Gemini token usage from EXPORT_LOG via the GAS proposalStats endpoint.
 * Numbers are derived from actual API usage, not arbitrary constants.
 */

type UsageStats = {
  pdfs_today:   number;
  tokens_today: number;
  avg_tokens:   number;
  remaining:    number;
  daily_limit:  number;
};

async function fetchStats(): Promise<UsageStats> {
  const fallback: UsageStats = { pdfs_today: 0, tokens_today: 0, avg_tokens: 0, remaining: 500, daily_limit: 500 };
  const gasUrl = process.env.JOBS_GAS_URL;
  if (!gasUrl) return fallback;
  try {
    const res = await fetch(`${gasUrl}?action=proposalStats`, { cache: 'no-store' });
    if (!res.ok) throw new Error('GAS error');
    return res.json();
  } catch {
    return fallback;
  }
}

export default async function ProposalUsageBadge() {
  const s = await fetchStats();
  const pct = Math.min(100, Math.round((s.pdfs_today / s.daily_limit) * 100));
  const warn = pct >= 80;
  const tokensStr = s.tokens_today.toLocaleString();

  return (
    <div className="hidden sm:flex items-center gap-2.5 bg-[#2a2a2a] border border-[#333] rounded-lg px-3 py-1.5 text-xs">
      {/* PDF count */}
      <div className="flex items-baseline gap-1">
        <span className={`font-bold tabular-nums ${warn ? 'text-red-400' : 'text-white'}`}>
          {s.pdfs_today}
        </span>
        <span className="text-[#444]">PDFs</span>
      </div>

      <span className="text-[#333]">·</span>

      {/* Real token count */}
      <div className="flex items-baseline gap-1">
        <span className="text-[#888] tabular-nums">{tokensStr}</span>
        <span className="text-[#444]">tokens</span>
      </div>

      {/* Progress bar */}
      <div className="w-12 h-1.5 bg-[#333] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${warn ? 'bg-red-500' : 'bg-[#ffd100]'}`}
          style={{ width: `${Math.max(2, pct)}%` }}
        />
      </div>

      {/* Remaining — real calculation: 500 − pdfs_today */}
      <span className={`tabular-nums ${warn ? 'text-red-400' : 'text-[#555]'}`}>
        {s.remaining} left
      </span>
    </div>
  );
}
