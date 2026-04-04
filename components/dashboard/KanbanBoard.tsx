'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import NewJobModal from './NewJobModal';
import JobListView from './JobListView';

const STAGES = ['Lead', 'Quoted', 'Booked', 'In Progress', 'Complete'] as const;
export type Stage = (typeof STAGES)[number];

const STAGE_STYLES: Record<Stage, { border: string; badge: string; header: string }> = {
  Lead:          { border: 'border-[#3a3a3a]', badge: 'bg-[#3a3a3a] text-[#aaa]',         header: 'text-[#aaa]' },
  Quoted:        { border: 'border-blue-800',   badge: 'bg-blue-900/40 text-blue-300',       header: 'text-blue-300' },
  Booked:        { border: 'border-purple-800', badge: 'bg-purple-900/40 text-purple-300',   header: 'text-purple-300' },
  'In Progress': { border: 'border-yellow-700', badge: 'bg-yellow-900/40 text-[#ffd100]',    header: 'text-[#ffd100]' },
  Complete:      { border: 'border-green-800',  badge: 'bg-green-900/40 text-green-400',     header: 'text-green-400' },
};

export type Job = {
  jobNumber: string;
  clientName: string;
  phone?: string;
  email?: string;
  address?: string;
  status: Stage;
  driveUrl?: string;
  notes?: string;
  createdDate?: string;
};

export default function KanbanBoard({ initialJobs }: { initialJobs: Job[] }) {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [showNewJob, setShowNewJob] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStage, setFilterStage] = useState<Stage | 'All'>('All');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  const filteredJobs = jobs.filter((j) => {
    const matchesStage = filterStage === 'All' || j.status === filterStage;
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      j.clientName.toLowerCase().includes(q) ||
      j.jobNumber.toLowerCase().includes(q) ||
      (j.address ?? '').toLowerCase().includes(q);
    return matchesStage && matchesSearch;
  });

  async function moveJob(jobNumber: string, newStatus: Stage) {
    setJobs((prev) =>
      prev.map((j) => (j.jobNumber === jobNumber ? { ...j, status: newStatus } : j))
    );
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
    <div className="flex min-h-[calc(100vh-57px)] -m-6">
      {/* ── Left sidebar ── */}
      <aside className="w-52 flex-shrink-0 bg-[#f5f7fb] border-r border-[#e8ecf3] p-5 flex flex-col gap-6">
        {/* Total count */}
        <div className="pt-1">
          <div className="text-4xl font-bold text-[#111827] tabular-nums leading-none">{jobs.length}</div>
          <div className="text-[#9ca3af] text-xs mt-1.5">Total Jobs</div>
        </div>

        {/* Divider */}
        <div className="border-t border-[#e8ecf3]" />

        {/* Quick Filters */}
        <div>
          <p className="text-[#9ca3af] text-[10px] uppercase tracking-widest font-semibold mb-3">
            Quick Filters
          </p>
          <p className="text-[#9ca3af] text-[10px] uppercase tracking-widest mb-2">Status</p>
          <div className="space-y-0.5">
            {(['All', ...STAGES] as const).map((stage) => {
              const count = stage === 'All'
                ? jobs.length
                : jobs.filter((j) => j.status === stage).length;
              const isActive = filterStage === stage;
              return (
                <button
                  key={stage}
                  onClick={() => setFilterStage(stage as Stage | 'All')}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                    isActive
                      ? 'bg-[#ffd100]/10 text-[#ffd100]'
                      : 'text-[#6b7280] hover:text-[#aaa] hover:bg-[#f5f7fb]'
                  }`}
                >
                  <span>{stage}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full tabular-nums ${
                      isActive
                        ? 'bg-[#ffd100]/20 text-[#ffd100]'
                        : 'bg-gray-100 text-[#9ca3af]'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col p-6 min-w-0">
        {/* Top action bar */}
        <div className="flex items-center gap-3 mb-3">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] w-3.5 h-3.5 pointer-events-none"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search jobs..."
              className="w-full bg-white border border-[#e5e9f0] rounded-lg pl-9 pr-3 py-2 text-[#111827] text-sm placeholder:text-[#3a3a3a] focus:outline-none focus:border-[#ffd100] transition-colors"
            />
          </div>

          {/* View toggle */}
          <div className="flex bg-white border border-[#e5e9f0] rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('list')}
              title="List view"
              className={`px-3 py-2 transition-colors text-sm ${
                viewMode === 'list'
                  ? 'bg-[#ffd100]/10 text-[#ffd100]'
                  : 'text-[#9ca3af] hover:text-[#aaa]'
              }`}
            >
              {/* List icon */}
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              title="Kanban view"
              className={`px-3 py-2 transition-colors text-sm border-l border-[#e5e9f0] ${
                viewMode === 'kanban'
                  ? 'bg-[#ffd100]/10 text-[#ffd100]'
                  : 'text-[#9ca3af] hover:text-[#aaa]'
              }`}
            >
              {/* Kanban / columns icon */}
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M9 17V7m0 10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m0 10a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 7a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m0 10V7m0 10a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2" />
              </svg>
            </button>
          </div>

          {/* New Job */}
          <button
            onClick={() => setShowNewJob(true)}
            className="bg-[#ffd100] text-[#181818] font-semibold px-4 py-2 rounded-lg hover:bg-[#e6bc00] transition-colors text-sm whitespace-nowrap"
          >
            + New Job
          </button>
        </div>

        {/* Job count line */}
        <p className="text-[#9ca3af] text-xs mb-4">
          {filteredJobs.length} {filteredJobs.length === 1 ? 'job' : 'jobs'}
          {filterStage !== 'All' && ` · filtered by ${filterStage}`}
          {search && ` · "${search}"`}
        </p>

        {/* View content */}
        {viewMode === 'kanban' ? (
          <KanbanColumns
            jobs={filteredJobs}
            onMove={moveJob}
            onJobClick={(jobNumber) => router.push(`/dashboard/jobs/${jobNumber}`)}
          />
        ) : (
          <JobListView jobs={filteredJobs} onMove={moveJob} />
        )}
      </div>

      {showNewJob && (
        <NewJobModal onClose={() => setShowNewJob(false)} onCreated={onJobCreated} />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Kanban columns (extracted sub-component)
───────────────────────────────────────────── */
function KanbanColumns({
  jobs,
  onMove,
  onJobClick,
}: {
  jobs: Job[];
  onMove: (jobNumber: string, newStatus: Stage) => void;
  onJobClick: (jobNumber: string) => void;
}) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 flex-1">
      {STAGES.map((stage) => {
        const stageJobs = jobs.filter((j) => j.status === stage);
        const styles = STAGE_STYLES[stage];
        return (
          <div key={stage} className="flex-shrink-0 w-72">
            {/* Column header */}
            <div className="flex items-center justify-between mb-3">
              <span className={`text-sm font-semibold ${styles.header}`}>{stage}</span>
              <span className="text-xs text-[#9ca3af] bg-[#f5f7fb] px-2 py-0.5 rounded-full tabular-nums">
                {stageJobs.length}
              </span>
            </div>

            {/* Cards */}
            <div className="space-y-3 min-h-[200px]">
              {stageJobs.length === 0 && (
                <div className="border border-dashed border-[#e5e9f0] rounded-xl h-20 flex items-center justify-center">
                  <span className="text-[#9ca3af] text-xs">No jobs</span>
                </div>
              )}
              {stageJobs.map((job) => (
                <JobCard
                  key={job.jobNumber}
                  job={job}
                  styles={styles}
                  onMove={(newStage) => onMove(job.jobNumber, newStage)}
                  onClick={() => onJobClick(job.jobNumber)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Individual Kanban card
───────────────────────────────────────────── */
function JobCard({
  job,
  styles,
  onMove,
  onClick,
}: {
  job: Job;
  styles: { border: string; badge: string };
  onMove: (stage: Stage) => void;
  onClick: () => void;
}) {
  const [showMove, setShowMove] = useState(false);

  return (
    <div
      className={`bg-white border ${styles.border} rounded-xl p-4 cursor-pointer hover:border-[#ffd100]/50 transition-all relative`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-[#ffd100] font-mono text-xs font-bold">{job.jobNumber}</span>
        {job.driveUrl && (
          <a
            href={job.driveUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-[#9ca3af] hover:text-[#ffd100] transition-colors text-xs"
            title="Open Drive folder"
          >
            &#128193;
          </a>
        )}
      </div>

      <p className="text-[#111827] text-sm font-medium leading-snug">{job.clientName}</p>
      {job.address && (
        <p className="text-[#9ca3af] text-xs mt-1 truncate">{job.address}</p>
      )}
      {job.createdDate && (
        <p className="text-[#9ca3af] text-xs mt-2">{job.createdDate}</p>
      )}

      {/* Move stage */}
      <div className="mt-3 relative" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => setShowMove(!showMove)}
          className="text-[#9ca3af] hover:text-[#6b7280] text-xs transition-colors"
        >
          Move stage ▾
        </button>
        {showMove && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowMove(false)} />
            <div className="absolute left-0 top-6 bg-[#eef0f5] border border-[#e5e9f0] rounded-lg overflow-hidden z-20 w-40 shadow-xl">
              {STAGES.map((s) => (
                <button
                  key={s}
                  onClick={() => { onMove(s); setShowMove(false); }}
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
    </div>
  );
}
