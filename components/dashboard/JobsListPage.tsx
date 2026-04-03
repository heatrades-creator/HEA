'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import NewJobModal from './NewJobModal';
import type { Job, Stage } from './KanbanBoard';

const STAGES = ['Lead', 'Quoted', 'Booked', 'In Progress', 'Complete'] as const;

const STAGE_STYLES: Record<Stage, { badge: string }> = {
  Lead:          { badge: 'bg-[#3a3a3a] text-[#aaa]' },
  Quoted:        { badge: 'bg-blue-900/40 text-blue-300' },
  Booked:        { badge: 'bg-purple-900/40 text-purple-300' },
  'In Progress': { badge: 'bg-yellow-900/40 text-[#ffd100]' },
  Complete:      { badge: 'bg-green-900/40 text-green-400' },
};

const PAGE_SIZE = 25;

type SortKey = 'jobNumber' | 'clientName' | 'createdDate';

export default function JobsListPage({ initialJobs }: { initialJobs: Job[] }) {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [showNewJob, setShowNewJob] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStage, setFilterStage] = useState<Stage | 'All'>('All');
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>('jobNumber');
  const [sortAsc, setSortAsc] = useState(false);

  const filtered = jobs.filter((j) => {
    const matchStage = filterStage === 'All' || j.status === filterStage;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      j.clientName.toLowerCase().includes(q) ||
      j.jobNumber.toLowerCase().includes(q) ||
      (j.address ?? '').toLowerCase().includes(q);
    return matchStage && matchSearch;
  });

  const sorted = [...filtered].sort((a, b) => {
    const av = (a[sortKey] ?? '').toLowerCase();
    const bv = (b[sortKey] ?? '').toLowerCase();
    return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageJobs = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc((a) => !a);
    else { setSortKey(key); setSortAsc(true); }
    setPage(1);
  }

  async function moveJob(jobNumber: string, newStatus: Stage) {
    setJobs((prev) => prev.map((j) => (j.jobNumber === jobNumber ? { ...j, status: newStatus } : j)));
    await fetch(`/api/jobs/${jobNumber}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
  }

  function onJobCreated(job: Job) {
    setJobs((prev) => [job, ...prev]);
    setShowNewJob(false);
  }

  return (
    <div className="flex min-h-[calc(100vh-56px)]">
      {/* ── Sidebar ── */}
      <aside className="w-48 flex-shrink-0 bg-[#1a1a1a] border-r border-[#242424] p-4 flex flex-col gap-5">
        <div className="pt-1">
          <div className="text-3xl font-bold text-white tabular-nums leading-none">{jobs.length}</div>
          <div className="text-[#555] text-xs mt-1">Total Jobs</div>
        </div>
        <div className="border-t border-[#242424]" />
        <div>
          <p className="text-[#555] text-[10px] uppercase tracking-widest font-semibold mb-2">Quick Filters</p>
          <p className="text-[#555] text-[10px] uppercase tracking-widest mb-1.5">Status</p>
          <div className="space-y-0.5">
            {(['All', ...STAGES] as const).map((stage) => {
              const count = stage === 'All' ? jobs.length : jobs.filter((j) => j.status === stage).length;
              const active = filterStage === stage;
              return (
                <button
                  key={stage}
                  onClick={() => { setFilterStage(stage as Stage | 'All'); setPage(1); }}
                  className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-colors ${
                    active ? 'bg-[#ffd100]/10 text-[#ffd100]' : 'text-[#666] hover:text-[#aaa] hover:bg-[#222]'
                  }`}
                >
                  <span>{stage}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full tabular-nums ${
                    active ? 'bg-[#ffd100]/20 text-[#ffd100]' : 'bg-[#252525] text-[#444]'
                  }`}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col p-6 min-w-0">
        {/* Toolbar */}
        <div className="flex items-center gap-3 mb-3">
          <div className="relative flex-1 max-w-xs">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#444] w-3.5 h-3.5 pointer-events-none"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
            </svg>
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search jobs…"
              className="w-full bg-[#202020] border border-[#2e2e2e] rounded-lg pl-9 pr-3 py-2 text-white text-sm placeholder:text-[#3a3a3a] focus:outline-none focus:border-[#ffd100] transition-colors"
            />
          </div>
          <button
            onClick={() => setShowNewJob(true)}
            className="bg-[#ffd100] text-[#181818] font-semibold px-4 py-2 rounded-lg hover:bg-[#e6bc00] transition-colors text-sm whitespace-nowrap"
          >
            + New Job
          </button>
        </div>

        {/* Count / pagination info */}
        <p className="text-[#555] text-xs mb-3">
          {sorted.length === 0
            ? 'No jobs found'
            : `${(safePage - 1) * PAGE_SIZE + 1}–${Math.min(safePage * PAGE_SIZE, sorted.length)} of ${sorted.length} jobs`}
          {filterStage !== 'All' && ` · ${filterStage}`}
          {search && ` · "${search}"`}
        </p>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-[#2a2a2a]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2a2a2a] bg-[#1a1a1a]">
                <Th label="Status" />
                <Th label="Job #"    sortKey="jobNumber"   current={sortKey} asc={sortAsc} onSort={toggleSort} />
                <Th label="Client"   sortKey="clientName"  current={sortKey} asc={sortAsc} onSort={toggleSort} />
                <Th label="Address"  className="hidden md:table-cell" />
                <Th label="System"   className="hidden lg:table-cell" />
                <Th label="Created"  sortKey="createdDate" current={sortKey} asc={sortAsc} onSort={toggleSort} className="hidden lg:table-cell" />
                <Th label="Phone"    className="hidden xl:table-cell" />
                <th className="px-4 py-3 w-20" />
              </tr>
            </thead>
            <tbody>
              {pageJobs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center text-[#444] text-sm">
                    No jobs match the current filters.
                  </td>
                </tr>
              ) : (
                pageJobs.map((job, i) => (
                  <JobRow
                    key={job.jobNumber}
                    job={job}
                    isEven={i % 2 === 0}
                    onMove={moveJob}
                    onClick={() => router.push(`/dashboard/jobs/${job.jobNumber}`)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="text-xs text-[#666] hover:text-[#aaa] disabled:opacity-30 disabled:cursor-not-allowed transition-colors px-3 py-1.5 border border-[#2a2a2a] rounded-lg"
            >
              ← Previous
            </button>
            <span className="text-[#444] text-xs">Page {safePage} of {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="text-xs text-[#666] hover:text-[#aaa] disabled:opacity-30 disabled:cursor-not-allowed transition-colors px-3 py-1.5 border border-[#2a2a2a] rounded-lg"
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {showNewJob && (
        <NewJobModal onClose={() => setShowNewJob(false)} onCreated={onJobCreated} />
      )}
    </div>
  );
}

/* ── Table header cell ── */
function Th({
  label,
  sortKey,
  current,
  asc,
  onSort,
  className = '',
}: {
  label: string;
  sortKey?: SortKey;
  current?: string;
  asc?: boolean;
  onSort?: (k: SortKey) => void;
  className?: string;
}) {
  const sortable = !!sortKey && !!onSort;
  const active = sortable && current === sortKey;
  return (
    <th
      onClick={sortable ? () => onSort!(sortKey!) : undefined}
      className={`px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest select-none ${
        active ? 'text-[#ffd100]' : 'text-[#444]'
      } ${sortable ? 'cursor-pointer hover:text-[#777]' : ''} ${className}`}
    >
      {label}
      {active && <span className="ml-1 text-[#ffd100]">{asc ? '▲' : '▼'}</span>}
    </th>
  );
}

/* ── Table row ── */
function JobRow({
  job,
  isEven,
  onMove,
  onClick,
}: {
  job: Job & { systemSize?: string };
  isEven: boolean;
  onMove: (jobNumber: string, newStatus: Stage) => void;
  onClick: () => void;
}) {
  const [showMove, setShowMove] = useState(false);
  const styles = STAGE_STYLES[job.status] ?? STAGE_STYLES.Lead;

  return (
    <tr
      onClick={onClick}
      className={`border-b border-[#1e1e1e] cursor-pointer transition-colors group ${
        isEven ? 'bg-[#1d1d1d]' : 'bg-[#1a1a1a]'
      } hover:bg-[#232323]`}
    >
      <td className="px-4 py-3">
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap ${styles.badge}`}>
          {job.status}
        </span>
      </td>
      <td className="px-4 py-3 font-mono text-[#ffd100] text-xs font-bold whitespace-nowrap">
        {job.jobNumber}
      </td>
      <td className="px-4 py-3 text-white font-medium">{job.clientName}</td>
      <td className="px-4 py-3 text-[#666] hidden md:table-cell">
        <span className="block truncate max-w-[180px]">{job.address ?? '—'}</span>
      </td>
      <td className="px-4 py-3 text-[#555] hidden lg:table-cell whitespace-nowrap text-xs">
        {job.systemSize ? `${job.systemSize} kW` : '—'}
      </td>
      <td className="px-4 py-3 text-[#555] hidden lg:table-cell whitespace-nowrap">
        {job.createdDate ?? '—'}
      </td>
      <td className="px-4 py-3 text-[#666] hidden xl:table-cell whitespace-nowrap">
        {job.phone ?? '—'}
      </td>
      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
        <div className="relative inline-block">
          <button
            onClick={() => setShowMove(!showMove)}
            className="text-[#444] hover:text-[#888] text-xs transition-colors px-1 py-0.5"
          >
            Move ▾
          </button>
          {showMove && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMove(false)} />
              <div className="absolute right-0 top-7 bg-[#2a2a2a] border border-[#333] rounded-lg overflow-hidden z-20 w-36 shadow-xl">
                {STAGES.map((s) => (
                  <button
                    key={s}
                    onClick={() => { onMove(job.jobNumber, s); setShowMove(false); }}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-[#333] transition-colors ${
                      s === job.status ? 'text-[#ffd100]' : 'text-[#aaa]'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}
