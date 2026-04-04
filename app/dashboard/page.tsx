import Link from 'next/link';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Overview | HEA' };

type Job = {
  jobNumber: string;
  clientName: string;
  address?: string;
  status: string;
  createdDate?: string;
  phone?: string;
};

type UsageStats = {
  pdfs_today: number;
  tokens_today: number;
  remaining: number;
  daily_limit: number;
  avg_tokens: number;
};

async function getJobs(): Promise<Job[]> {
  const gasUrl = process.env.JOBS_GAS_URL;
  if (!gasUrl) return [];
  try {
    const res = await fetch(gasUrl, { cache: 'no-store' });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

async function getUsage(): Promise<UsageStats> {
  const fallback: UsageStats = { pdfs_today: 0, tokens_today: 0, remaining: 500, daily_limit: 500, avg_tokens: 0 };
  const gasUrl = process.env.JOBS_GAS_URL;
  if (!gasUrl) return fallback;
  try {
    const res = await fetch(`${gasUrl}?action=proposalStats`, { cache: 'no-store' });
    if (!res.ok) return fallback;
    return res.json();
  } catch {
    return fallback;
  }
}

const STAGE_STYLES: Record<string, string> = {
  Lead:          'bg-[#3a3a3a] text-[#aaa]',
  Quoted:        'bg-blue-900/40 text-blue-300',
  Booked:        'bg-purple-900/40 text-purple-300',
  'In Progress': 'bg-yellow-900/40 text-[#ffd100]',
  Complete:      'bg-green-900/40 text-green-400',
};

function currentMonth() {
  const now = new Date();
  return { month: now.getMonth(), year: now.getFullYear() };
}

function parseCreatedDate(d?: string): Date | null {
  if (!d) return null;
  // Format: "3 Apr 2026"
  const parsed = new Date(d);
  return isNaN(parsed.getTime()) ? null : parsed;
}

export default async function DashboardPage() {
  const [jobs, usage] = await Promise.all([getJobs(), getUsage()]);

  const { month, year } = currentMonth();
  const totalJobs = jobs.length;
  const activeJobs = jobs.filter((j) => j.status !== 'Complete').length;
  const inProgress = jobs.filter((j) => j.status === 'In Progress').length;
  const completedThisMonth = jobs.filter((j) => {
    if (j.status !== 'Complete') return false;
    const d = parseCreatedDate(j.createdDate);
    return d && d.getMonth() === month && d.getFullYear() === year;
  }).length;

  const recentJobs = jobs.slice(0, 5);
  const usagePct = Math.min(100, Math.round((usage.pdfs_today / usage.daily_limit) * 100));

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-white text-xl font-semibold">Overview</h1>
        <p className="text-[#555] text-sm mt-0.5">Heffernan Electrical Automation</p>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Jobs"
          value={totalJobs}
          accent="border-[#333]"
          href="/dashboard/jobs"
        />
        <StatCard
          label="Active Jobs"
          value={activeJobs}
          accent="border-blue-800"
          sub="not complete"
          href="/dashboard/jobs"
        />
        <StatCard
          label="In Progress"
          value={inProgress}
          accent="border-yellow-700"
          valueColor="text-[#ffd100]"
          href="/dashboard/kanban"
        />
        <StatCard
          label="Completed"
          value={completedThisMonth}
          accent="border-green-800"
          valueColor="text-green-400"
          sub="this month"
          href="/dashboard/jobs"
        />
      </div>

      {/* ── Bottom row: Recent Jobs + AI Usage ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Jobs — takes 2/3 width */}
        <div className="lg:col-span-2 bg-[#202020] border border-[#2e2e2e] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#2e2e2e] flex items-center justify-between">
            <h2 className="text-white text-sm font-semibold">Recent Jobs</h2>
            <Link href="/dashboard/jobs" className="text-[#ffd100] text-xs hover:text-[#e6bc00] transition-colors">
              View all →
            </Link>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#252525]">
                <th className="px-5 py-2.5 text-left text-[10px] text-[#444] uppercase tracking-widest font-medium">Job #</th>
                <th className="px-5 py-2.5 text-left text-[10px] text-[#444] uppercase tracking-widest font-medium">Client</th>
                <th className="px-5 py-2.5 text-left text-[10px] text-[#444] uppercase tracking-widest font-medium hidden sm:table-cell">Status</th>
                <th className="px-5 py-2.5 text-left text-[10px] text-[#444] uppercase tracking-widest font-medium hidden md:table-cell">Created</th>
              </tr>
            </thead>
            <tbody>
              {recentJobs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-[#444] text-sm">
                    No jobs yet. <Link href="/dashboard/jobs" className="text-[#ffd100] hover:underline">Create your first job →</Link>
                  </td>
                </tr>
              ) : (
                recentJobs.map((job, i) => (
                  <tr
                    key={job.jobNumber}
                    className={`border-b border-[#252525] hover:bg-[#252525] transition-colors ${i % 2 === 0 ? '' : 'bg-[#1e1e1e]'}`}
                  >
                    <td className="px-5 py-3">
                      <Link
                        href={`/dashboard/jobs/${job.jobNumber}`}
                        className="font-mono text-[#ffd100] text-xs font-bold hover:underline"
                      >
                        {job.jobNumber}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-white text-sm">{job.clientName}</td>
                    <td className="px-5 py-3 hidden sm:table-cell">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STAGE_STYLES[job.status] ?? 'bg-[#3a3a3a] text-[#aaa]'}`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-[#555] text-xs hidden md:table-cell">{job.createdDate ?? '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* AI Usage card — takes 1/3 */}
        <div className="bg-[#202020] border border-[#2e2e2e] rounded-xl p-5 flex flex-col gap-4">
          <h2 className="text-white text-sm font-semibold">AI Usage Today</h2>

          <div>
            <div className="flex items-end justify-between mb-1.5">
              <span className="text-[#555] text-xs">Proposals generated</span>
              <span className={`text-lg font-bold tabular-nums ${usagePct >= 80 ? 'text-red-400' : 'text-white'}`}>
                {usage.pdfs_today}
                <span className="text-[#444] text-xs font-normal ml-1">/ {usage.daily_limit}</span>
              </span>
            </div>
            <div className="w-full h-1.5 bg-[#2a2a2a] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${usagePct >= 80 ? 'bg-red-500' : 'bg-[#ffd100]'}`}
                style={{ width: `${Math.max(2, usagePct)}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-3">
              <p className="text-[#444] text-[10px] uppercase tracking-wider mb-1">Tokens Today</p>
              <p className="text-white font-bold tabular-nums text-sm">{usage.tokens_today.toLocaleString()}</p>
            </div>
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-3">
              <p className="text-[#444] text-[10px] uppercase tracking-wider mb-1">Remaining</p>
              <p className={`font-bold tabular-nums text-sm ${usagePct >= 80 ? 'text-red-400' : 'text-white'}`}>
                {usage.remaining}
              </p>
            </div>
          </div>

          {usage.avg_tokens > 0 && (
            <p className="text-[#444] text-xs">
              Avg {usage.avg_tokens.toLocaleString()} tokens / proposal
            </p>
          )}

          <Link
            href="/dashboard/documents"
            className="text-[#ffd100] text-xs hover:text-[#e6bc00] transition-colors mt-auto"
          >
            View all documents →
          </Link>
        </div>
      </div>

      {/* Quick actions */}
      <div className="mt-6 flex gap-3">
        <Link
          href="/dashboard/jobs"
          className="border border-[#333] text-[#888] hover:border-[#555] hover:text-white transition-colors px-4 py-2 rounded-lg text-sm"
        >
          View all jobs →
        </Link>
        <Link
          href="/dashboard/kanban"
          className="border border-[#333] text-[#888] hover:border-[#555] hover:text-white transition-colors px-4 py-2 rounded-lg text-sm"
        >
          Open Kanban board →
        </Link>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
  sub,
  valueColor = 'text-white',
  href,
}: {
  label: string;
  value: number;
  accent: string;
  sub?: string;
  valueColor?: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className={`bg-[#202020] border border-[#2e2e2e] border-l-2 ${accent} rounded-xl p-5 hover:bg-[#252525] transition-colors`}
    >
      <p className="text-[#555] text-xs uppercase tracking-wider mb-2">{label}</p>
      <p className={`text-3xl font-bold tabular-nums leading-none ${valueColor}`}>{value}</p>
      {sub && <p className="text-[#444] text-xs mt-1.5">{sub}</p>}
    </Link>
  );
}
