/**
 * ProposalUsageBadge — server component.
 * Fetches today's proposal count from the HEA Document Stack GAS and
 * renders a compact usage indicator for the dashboard nav.
 */

type UsageStats = {
  today: number;
  daily_limit: number;
  remaining: number;
};

async function fetchStats(): Promise<UsageStats> {
  const gasUrl = process.env.JOBS_GAS_URL;
  if (!gasUrl) return { today: 0, daily_limit: 500, remaining: 500 };
  try {
    const res = await fetch(`${gasUrl}?action=proposalStats`, { cache: 'no-store' });
    if (!res.ok) throw new Error('GAS error');
    return res.json();
  } catch {
    return { today: 0, daily_limit: 500, remaining: 500 };
  }
}

export default async function ProposalUsageBadge() {
  const stats = await fetchStats();
  const pct = Math.min(100, Math.round((stats.today / stats.daily_limit) * 100));
  const isNearLimit = pct >= 80;

  return (
    <div className="hidden sm:flex items-center gap-2 bg-[#2a2a2a] border border-[#333] rounded-lg px-3 py-1.5 text-xs">
      <span className="text-[#666]">PDFs today</span>
      <span className={`font-bold tabular-nums ${isNearLimit ? 'text-red-400' : 'text-white'}`}>
        {stats.today}
      </span>
      <span className="text-[#3a3a3a]">/</span>
      <span className="text-[#444] tabular-nums">{stats.daily_limit}</span>
      <div className="w-14 h-1.5 bg-[#333] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${isNearLimit ? 'bg-red-500' : 'bg-[#ffd100]'}`}
          style={{ width: `${Math.max(2, pct)}%` }}
        />
      </div>
      <span className={`tabular-nums ${isNearLimit ? 'text-red-400' : 'text-[#555]'}`}>
        {stats.remaining} left
      </span>
    </div>
  );
}
