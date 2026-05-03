'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import NewJobModal from './NewJobModal';
import type { Job, Stage } from './KanbanBoard';

const STAGES = ['Lead', 'Estimation', 'Contract', 'Booked', 'In Progress', 'Complete'] as const;
type FilterStage = Stage | 'All' | 'Archived';

const STAGE_STYLES: Record<Stage | 'Archived', { badge: string; pill: string }> = {
  Lead:          { badge: 'bg-gray-100 text-gray-600',            pill: 'border-gray-400 text-gray-600' },
  Estimation:    { badge: 'bg-blue-100 text-blue-700',             pill: 'border-blue-400 text-blue-700' },
  Contract:      { badge: 'bg-orange-100 text-orange-700',         pill: 'border-orange-400 text-orange-700' },
  Booked:        { badge: 'bg-purple-100 text-purple-700',         pill: 'border-purple-400 text-purple-700' },
  'In Progress': { badge: 'bg-amber-100 text-amber-900',           pill: 'border-amber-600 text-amber-900' },
  Complete:      { badge: 'bg-green-100 text-green-700',           pill: 'border-green-500 text-green-700' },
  Archived:      { badge: 'bg-gray-100 text-gray-500',             pill: 'border-gray-300 text-gray-400' },
};

const PAGE_SIZE = 25;
type SortKey = 'jobNumber' | 'clientName' | 'createdDate';
type AnyJob = Job & { systemSize?: string };

// ── localStorage helpers for follow-up tracking ──────────────────────────────

function getFollowups(jobNumber: string): string[] {
  try {
    const raw = localStorage.getItem(`hea_followup_${jobNumber}`);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveFollowup(jobNumber: string, iso: string) {
  try {
    const prev = getFollowups(jobNumber);
    localStorage.setItem(`hea_followup_${jobNumber}`, JSON.stringify([...prev, iso]));
  } catch {}
}

function daysAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (diff === 0) return 'today';
  if (diff === 1) return '1 day ago';
  return `${diff} days ago`;
}

// ── Confirmation modal ────────────────────────────────────────────────────────

type ConfirmAction = { type: 'archive' | 'delete'; jobNumber: string; clientName: string };

function ConfirmModal({
  action,
  pending,
  error,
  onConfirm,
  onCancel,
}: {
  action: ConfirmAction;
  pending: boolean;
  error: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const isDelete = action.type === 'delete';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className={`px-5 py-4 ${isDelete ? 'bg-red-50' : 'bg-amber-50'}`}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{isDelete ? '🗑️' : '🗄️'}</span>
            <h2 className="text-[#111827] font-bold text-lg">
              {isDelete ? 'Permanently Delete Job' : 'Archive Job'}
            </h2>
          </div>
        </div>
        <div className="px-5 py-4 space-y-3">
          <p className="text-[#374151] text-sm">
            <span className="font-semibold text-[#111827]">{action.clientName}</span>
            {' · '}
            <span className="font-mono text-[#ffd100] font-bold text-xs">{action.jobNumber}</span>
          </p>
          {isDelete ? (
            <p className="text-[#6b7280] text-sm leading-relaxed">
              This will <strong className="text-red-600">permanently delete</strong> the job from
              the sheet and move the Google Drive folder to trash. This cannot be undone.
            </p>
          ) : (
            <p className="text-[#6b7280] text-sm leading-relaxed">
              This will mark the job as <strong className="text-amber-600">Archived</strong> and
              move the Google Drive folder into the monthly archive. You can still view it later
              by filtering for Archived jobs.
            </p>
          )}
          {error && (
            <p className="text-red-600 text-xs bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}
        </div>
        <div className="px-5 pb-5 flex gap-2">
          <button
            onClick={onCancel}
            disabled={pending}
            className="flex-1 py-2.5 rounded-xl border border-[#e5e9f0] text-[#374151] text-sm font-medium hover:bg-[#f5f7fa] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={pending}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 ${
              isDelete
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-amber-500 text-white hover:bg-amber-600'
            }`}
          >
            {pending ? 'Working…' : isDelete ? 'Delete Forever' : 'Archive Job'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Mobile job card ───────────────────────────────────────────────────────────

function MobileJobCard({
  job,
  onMove,
  onArchive,
  onDelete,
}: {
  job: AnyJob;
  onMove: (jobNumber: string, newStatus: Stage) => void;
  onArchive: (jobNumber: string, clientName: string) => void;
  onDelete: (jobNumber: string, clientName: string) => void;
}) {
  const router = useRouter();
  const [followups, setFollowups] = useState<string[]>([]);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    setFollowups(getFollowups(job.jobNumber));
  }, [job.jobNumber]);

  const statusStr = job.status as string;
  const styles = STAGE_STYLES[statusStr as Stage | 'Archived'] ?? STAGE_STYLES.Lead;
  const isArchived = statusStr === 'Archived';
  const fullName    = job.clientName;
  const fullAddress = job.address ?? '';

  const analyserUrl = `/solar-analyser?${new URLSearchParams({
    name:          fullName,
    email:         job.email         ?? '',
    phone:         job.phone         ?? '',
    address:       fullAddress,
    annualBill:    job.annualBill    ?? '',
    occupants:     job.occupants     ?? '',
    homeDaytime:   job.homeDaytime   ?? '',
    hotWater:      job.hotWater      ?? '',
    gasAppliances: job.gasAppliances ?? '',
    ev:            job.ev            ?? '',
    driveUrl:      job.driveUrl      ?? '',
  }).toString()}`;

  async function sendFollowup() {
    if (!job.email) { setEmailError('No email on file for this client'); return; }
    setSendingEmail(true);
    setEmailError('');
    try {
      const res = await fetch(`/api/jobs/${job.jobNumber}/followup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName:    job.clientName,
          email:         job.email,
          phone:         job.phone,
          address:       job.address,
          jobNumber:     job.jobNumber,
          followupCount: followups.length + 1,
        }),
      });
      const data = await res.json();
      if (res.ok && data.sentAt) {
        saveFollowup(job.jobNumber, data.sentAt);
        setFollowups(getFollowups(job.jobNumber));
        setEmailSent(true);
        setTimeout(() => setEmailSent(false), 3000);
      } else {
        setEmailError(data.error ?? 'Email failed — check Resend config');
      }
    } catch {
      setEmailError('Network error');
    }
    setSendingEmail(false);
  }

  async function markComplete() {
    setCompleting(true);
    await onMove(job.jobNumber, 'Complete');
    setCompleting(false);
  }

  const btnBase = 'flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-xl border text-xs font-medium transition-colors min-h-[64px] text-center leading-tight';

  return (
    <div className="bg-white border border-[#e5e9f0] rounded-2xl overflow-hidden shadow-sm">

      {/* ── Header ────────────────────────────────────────── */}
      <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[#ffd100] font-mono font-bold text-sm">{job.jobNumber}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles.badge}`}>
              {statusStr}
            </span>
          </div>
          <h3 className="text-[#111827] font-semibold text-base leading-snug">{job.clientName}</h3>
          {job.address && (
            <p className="text-[#6b7280] text-xs mt-0.5 leading-snug">{job.address}</p>
          )}
        </div>
        <p className="text-[#9ca3af] text-xs whitespace-nowrap flex-shrink-0">{job.createdDate}</p>
      </div>

      {/* ── Contact quick access ───────────────────────────── */}
      {(job.phone || job.email) && (
        <div className="px-4 pb-3 flex flex-wrap gap-3">
          {job.phone && (
            <a
              href={`tel:${job.phone}`}
              className="flex items-center gap-1.5 text-sm text-[#111827] font-medium bg-[#f5f7fa] rounded-lg px-3 py-1.5 hover:bg-[#ffd100]/10 transition-colors"
            >
              <svg className="w-3.5 h-3.5 text-[#ffd100]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              {job.phone}
            </a>
          )}
          {job.email && (
            <a
              href={`mailto:${job.email}`}
              className="flex items-center gap-1.5 text-xs text-[#6b7280] bg-[#f5f7fa] rounded-lg px-3 py-1.5 hover:bg-[#f5f7fa] transition-colors truncate max-w-[180px]"
            >
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {job.email}
            </a>
          )}
        </div>
      )}

      {/* ── Follow-up history ─────────────────────────────── */}
      {followups.length > 0 && (
        <div className="mx-4 mb-3 bg-[#f5f7fa] rounded-xl px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af] mb-1">
            Follow-up history
          </p>
          <div className="space-y-0.5">
            {followups.map((iso, i) => (
              <p key={iso} className="text-xs text-[#6b7280]">
                #{i + 1} — {new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                <span className="text-[#9ca3af] ml-1">({daysAgo(iso)})</span>
              </p>
            ))}
          </div>
        </div>
      )}

      {/* ── Action buttons ────────────────────────────────── */}
      {!isArchived && (
        <div className="px-4 pb-3 grid grid-cols-3 gap-2">

          {/* 1. Solar Analyser */}
          <a
            href={analyserUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`${btnBase} border-[#ffd100]/40 bg-[#ffd100]/5 text-[#111827] hover:bg-[#ffd100]/15`}
          >
            <span className="text-lg">☀️</span>
            <span>Solar Analyser</span>
          </a>

          {/* 2. Drive Folder */}
          {job.driveUrl ? (
            <a
              href={job.driveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`${btnBase} border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100`}
            >
              <span className="text-lg">📁</span>
              <span>Client Files</span>
            </a>
          ) : (
            <span className={`${btnBase} border-[#e5e9f0] bg-[#f9fafb] text-[#9ca3af] cursor-not-allowed`}>
              <span className="text-lg">📁</span>
              <span>No Drive Folder</span>
            </span>
          )}

          {/* 3. Follow-up Email */}
          <button
            onClick={sendFollowup}
            disabled={sendingEmail || !job.email}
            className={`${btnBase} ${
              emailSent
                ? 'border-green-300 bg-green-50 text-green-700'
                : !job.email
                ? 'border-[#e5e9f0] bg-[#f9fafb] text-[#9ca3af] cursor-not-allowed'
                : 'border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 active:bg-purple-200'
            } disabled:opacity-60`}
          >
            <span className="text-lg">{emailSent ? '✅' : '📧'}</span>
            <span>
              {sendingEmail ? 'Sending…' : emailSent ? 'Email Sent!' : 'Follow-up Email'}
            </span>
            {followups.length > 0 && !emailSent && (
              <span className="text-[10px] opacity-70">#{followups.length + 1}</span>
            )}
          </button>

          {/* 4. OpenSolar Design */}
          {(job as any).openSolarProjectId ? (
            <a
              href={`https://app.opensolar.com/220067/projects/${(job as any).openSolarProjectId}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`${btnBase} border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100`}
            >
              <span className="text-lg">🔆</span>
              <span>Open Design</span>
            </a>
          ) : (
            <a
              href="/admin"
              className={`${btnBase} border-[#e5e9f0] bg-[#f9fafb] text-[#9ca3af] hover:bg-[#eef0f5] hover:text-[#374151]`}
            >
              <span className="text-lg">🔆</span>
              <span>Create Design</span>
            </a>
          )}

          {/* 5. Full Job Details */}
          <button
            onClick={() => router.push(`/dashboard/jobs/${job.jobNumber}`)}
            className={`${btnBase} border-[#e5e9f0] bg-[#f5f7fa] text-[#374151] hover:bg-[#eef0f5]`}
          >
            <span className="text-lg">📋</span>
            <span>Full Details</span>
          </button>

          {/* 6. Complete — full width */}
          {job.status !== 'Complete' ? (
            <button
              onClick={markComplete}
              disabled={completing}
              className={`${btnBase} col-span-3 border-green-300 bg-green-50 text-green-800 hover:bg-green-100 disabled:opacity-60`}
            >
              <span className="text-lg">{completing ? '⏳' : '✅'}</span>
              <span>{completing ? 'Marking complete…' : 'Mark as Complete'}</span>
            </button>
          ) : (
            <button
              onClick={() => onMove(job.jobNumber, 'Lead')}
              className={`${btnBase} col-span-3 border-[#e5e9f0] bg-[#f5f7fa] text-[#6b7280] hover:bg-[#eef0f5]`}
            >
              <span className="text-lg">↩️</span>
              <span>Reopen Job</span>
            </button>
          )}
        </div>
      )}

      {/* ── Archived: Drive link only ──────────────────────── */}
      {isArchived && job.driveUrl && (
        <div className="px-4 pb-3">
          <a
            href={job.driveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`${btnBase} w-full border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 flex-row gap-2`}
          >
            <span className="text-lg">📁</span>
            <span>View Archived Files</span>
          </a>
        </div>
      )}

      {/* Email error */}
      {emailError && (
        <div className="mx-4 mb-4 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
          <p className="text-xs text-red-600">{emailError}</p>
        </div>
      )}

      {/* ── Archive / Delete strip ─────────────────────────── */}
      <div className="border-t border-[#f0f0f0] px-4 py-2.5 flex items-center gap-2">
        {!isArchived && (
          <button
            onClick={() => onArchive(job.jobNumber, job.clientName)}
            className="flex items-center gap-1.5 text-xs font-medium text-amber-600 hover:text-amber-700 px-2.5 py-1.5 rounded-lg hover:bg-amber-50 transition-colors"
          >
            <span>🗄️</span> Archive
          </button>
        )}
        <button
          onClick={() => onDelete(job.jobNumber, job.clientName)}
          className="flex items-center gap-1.5 text-xs font-medium text-red-500 hover:text-red-600 px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
        >
          <span>🗑️</span> Delete
        </button>
        {!isArchived && (
          <>
            <div className="flex-1" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af] whitespace-nowrap flex-shrink-0">
              Move to:
            </span>
            {STAGES.filter((s) => s !== job.status).map((s) => (
              <button
                key={s}
                onClick={() => onMove(job.jobNumber, s)}
                className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border font-medium transition-colors whitespace-nowrap ${STAGE_STYLES[s].pill} bg-transparent hover:opacity-80`}
              >
                {s}
              </button>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function JobsListPage({ initialJobs }: { initialJobs: Job[] }) {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [showNewJob, setShowNewJob] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStage, setFilterStage] = useState<FilterStage>('All');
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>('jobNumber');
  const [sortAsc, setSortAsc] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [actionPending, setActionPending] = useState(false);
  const [actionError, setActionError] = useState('');

  // Archived jobs are hidden from 'All' — only shown when 'Archived' filter is active
  const filtered = jobs.filter((j) => {
    const status = j.status as string;
    if (status === 'Archived' && filterStage !== 'Archived') return false;
    const matchStage = filterStage === 'All' || status === filterStage;
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
  const safePage   = Math.min(page, totalPages);
  const pageJobs   = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

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

  function requestArchive(jobNumber: string, clientName: string) {
    setActionError('');
    setConfirmAction({ type: 'archive', jobNumber, clientName });
  }

  function requestDelete(jobNumber: string, clientName: string) {
    setActionError('');
    setConfirmAction({ type: 'delete', jobNumber, clientName });
  }

  async function handleConfirm() {
    if (!confirmAction) return;
    setActionPending(true);
    setActionError('');
    const route = confirmAction.type === 'archive' ? 'archive' : 'delete';
    try {
      const res = await fetch(`/api/jobs/${confirmAction.jobNumber}/${route}`, { method: 'POST' });
      if (res.ok) {
        if (confirmAction.type === 'delete') {
          setJobs((prev) => prev.filter((j) => j.jobNumber !== confirmAction.jobNumber));
        } else {
          setJobs((prev) =>
            prev.map((j) =>
              j.jobNumber === confirmAction.jobNumber
                ? { ...j, status: 'Archived' as unknown as Stage }
                : j
            )
          );
        }
        setConfirmAction(null);
      } else {
        const data = await res.json().catch(() => ({}));
        setActionError((data as any).error ?? 'Something went wrong — try again');
      }
    } catch {
      setActionError('Network error — check connection');
    }
    setActionPending(false);
  }

  const stageCountFor = (stage: FilterStage) => {
    if (stage === 'All') return jobs.filter((j) => (j.status as string) !== 'Archived').length;
    return jobs.filter((j) => (j.status as string) === stage).length;
  };

  // ─────────────────────────────────────────────────────────────────────────
  // MOBILE VIEW
  // ─────────────────────────────────────────────────────────────────────────
  const mobileView = (
    <div className="md:hidden flex flex-col min-h-[calc(100vh-56px-64px)] bg-[#f5f7fa]">

      {/* Sticky top bar */}
      <div className="sticky top-0 z-10 bg-[#f5f7fa] border-b border-[#e8ecf3] px-4 pt-3 pb-2 space-y-2">
        {/* Search + New Job */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af] pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
            </svg>
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search jobs…"
              className="w-full bg-white border border-[#e5e9f0] rounded-xl pl-9 pr-3 py-2.5 text-[#111827] text-sm placeholder:text-[#9ca3af] focus:outline-none focus:border-[#ffd100]"
            />
          </div>
          <button
            onClick={() => setShowNewJob(true)}
            className="bg-[#ffd100] text-[#181818] font-semibold px-4 py-2.5 rounded-xl text-sm whitespace-nowrap"
          >
            + New
          </button>
        </div>

        {/* Filter pills — horizontal scroll */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {(['All', ...STAGES, 'Archived'] as FilterStage[]).map((stage) => {
            const count  = stageCountFor(stage);
            const active = filterStage === stage;
            return (
              <button
                key={stage}
                onClick={() => { setFilterStage(stage); setPage(1); }}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-[#ffd100] text-[#111827] border-[#ffd100]'
                    : 'bg-white text-[#6b7280] border-[#e5e9f0] hover:border-[#ffd100]/50'
                }`}
              >
                {stage}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full tabular-nums ${
                  active ? 'bg-[#111827]/10 text-[#111827]' : 'bg-[#f5f7fa] text-[#9ca3af]'
                }`}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* Count */}
        <p className="text-[#9ca3af] text-xs">
          {sorted.length === 0 ? 'No jobs found' : `${sorted.length} job${sorted.length !== 1 ? 's' : ''}`}
          {filterStage !== 'All' && ` · ${filterStage}`}
          {search && ` · "${search}"`}
        </p>
      </div>

      {/* Job cards */}
      <div className="px-4 py-4 space-y-4">
        {pageJobs.length === 0 ? (
          <div className="text-center py-16 text-[#9ca3af]">
            <p className="text-4xl mb-3">📋</p>
            <p className="font-medium text-[#6b7280]">No jobs match the current filters</p>
          </div>
        ) : (
          pageJobs.map((job) => (
            <MobileJobCard
              key={job.jobNumber}
              job={job}
              onMove={moveJob}
              onArchive={requestArchive}
              onDelete={requestDelete}
            />
          ))
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="text-xs text-[#6b7280] px-4 py-2 border border-[#e5e9f0] rounded-xl bg-white disabled:opacity-30"
            >
              ← Prev
            </button>
            <span className="text-[#9ca3af] text-xs">Page {safePage} of {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="text-xs text-[#6b7280] px-4 py-2 border border-[#e5e9f0] rounded-xl bg-white disabled:opacity-30"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // DESKTOP VIEW
  // ─────────────────────────────────────────────────────────────────────────
  const desktopView = (
    <div className="hidden md:flex min-h-[calc(100vh-56px)]">
      {/* Sidebar */}
      <aside className="w-48 flex-shrink-0 bg-[#f5f7fb] border-r border-[#e8ecf3] p-4 flex flex-col gap-5">
        <div className="pt-1">
          <div className="text-3xl font-bold text-[#111827] tabular-nums leading-none">
            {jobs.filter((j) => (j.status as string) !== 'Archived').length}
          </div>
          <div className="text-[#6b7280] text-xs mt-1">Active Jobs</div>
        </div>
        <div className="border-t border-[#e8ecf3]" />
        <div>
          <p className="text-[#6b7280] text-[10px] uppercase tracking-widest font-semibold mb-2">Quick Filters</p>
          <p className="text-[#6b7280] text-[10px] uppercase tracking-widest mb-1.5">Status</p>
          <div className="space-y-0.5">
            {(['All', ...STAGES, 'Archived'] as FilterStage[]).map((stage) => {
              const count  = stageCountFor(stage);
              const active = filterStage === stage;
              return (
                <button
                  key={stage}
                  onClick={() => { setFilterStage(stage); setPage(1); }}
                  className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-colors ${
                    active ? 'bg-[#ffd100]/10 text-[#ffd100]' : 'text-[#6b7280] hover:text-[#aaa] hover:bg-[#f5f7fb]'
                  }`}
                >
                  <span>{stage}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full tabular-nums ${
                    active ? 'bg-[#ffd100]/20 text-[#ffd100]' : 'bg-gray-100 text-[#6b7280]'
                  }`}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col p-6 min-w-0">
        <div className="flex items-center gap-3 mb-3">
          <div className="relative flex-1 max-w-xs">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7280] w-3.5 h-3.5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
            </svg>
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search jobs…"
              className="w-full bg-white border border-[#e5e9f0] rounded-lg pl-9 pr-3 py-2 text-[#111827] text-sm placeholder:text-[#3a3a3a] focus:outline-none focus:border-[#ffd100] transition-colors"
            />
          </div>
          <button
            onClick={() => setShowNewJob(true)}
            className="bg-[#ffd100] text-[#181818] font-semibold px-4 py-2 rounded-lg hover:bg-[#e6bc00] transition-colors text-sm whitespace-nowrap"
          >
            + New Job
          </button>
        </div>

        <p className="text-[#6b7280] text-xs mb-3">
          {sorted.length === 0 ? 'No jobs found' : `${(safePage - 1) * PAGE_SIZE + 1}–${Math.min(safePage * PAGE_SIZE, sorted.length)} of ${sorted.length} jobs`}
          {filterStage !== 'All' && ` · ${filterStage}`}
          {search && ` · "${search}"`}
        </p>

        <div className="overflow-x-auto rounded-xl border border-[#e5e9f0]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e5e9f0] bg-[#f5f7fb]">
                <Th label="Status" />
                <Th label="Job #"   sortKey="jobNumber"   current={sortKey} asc={sortAsc} onSort={toggleSort} />
                <Th label="Client"  sortKey="clientName"  current={sortKey} asc={sortAsc} onSort={toggleSort} />
                <Th label="Address" className="hidden md:table-cell" />
                <Th label="System"  className="hidden lg:table-cell" />
                <Th label="Created" sortKey="createdDate" current={sortKey} asc={sortAsc} onSort={toggleSort} className="hidden lg:table-cell" />
                <Th label="Phone"   className="hidden xl:table-cell" />
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-[#6b7280]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageJobs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center text-[#6b7280] text-sm">No jobs match the current filters.</td>
                </tr>
              ) : (
                pageJobs.map((job, i) => (
                  <JobRow
                    key={job.jobNumber}
                    job={job}
                    isEven={i % 2 === 0}
                    onMove={moveJob}
                    onArchive={requestArchive}
                    onDelete={requestDelete}
                    onClick={() => router.push(`/dashboard/jobs/${job.jobNumber}`)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage === 1} className="text-xs text-[#6b7280] hover:text-[#aaa] disabled:opacity-30 transition-colors px-3 py-1.5 border border-[#e5e9f0] rounded-lg">← Previous</button>
            <span className="text-[#6b7280] text-xs">Page {safePage} of {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} className="text-xs text-[#6b7280] hover:text-[#aaa] disabled:opacity-30 transition-colors px-3 py-1.5 border border-[#e5e9f0] rounded-lg">Next →</button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {mobileView}
      {desktopView}
      {showNewJob && <NewJobModal onClose={() => setShowNewJob(false)} onCreated={onJobCreated} />}
      {confirmAction && (
        <ConfirmModal
          action={confirmAction}
          pending={actionPending}
          error={actionError}
          onConfirm={handleConfirm}
          onCancel={() => { setConfirmAction(null); setActionError(''); }}
        />
      )}
    </>
  );
}

/* ── Desktop table header cell ── */
function Th({ label, sortKey, current, asc, onSort, className = '' }: {
  label: string; sortKey?: SortKey; current?: string; asc?: boolean;
  onSort?: (k: SortKey) => void; className?: string;
}) {
  const sortable = !!sortKey && !!onSort;
  const active   = sortable && current === sortKey;
  return (
    <th
      onClick={sortable ? () => onSort!(sortKey!) : undefined}
      className={`px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest select-none ${active ? 'text-[#ffd100]' : 'text-[#6b7280]'} ${sortable ? 'cursor-pointer hover:text-[#6b7280]' : ''} ${className}`}
    >
      {label}
      {active && <span className="ml-1 text-[#ffd100]">{asc ? '▲' : '▼'}</span>}
    </th>
  );
}

/* ── Desktop table row ── */
function JobRow({ job, isEven, onMove, onArchive, onDelete, onClick }: {
  job: AnyJob; isEven: boolean;
  onMove: (jobNumber: string, newStatus: Stage) => void;
  onArchive: (jobNumber: string, clientName: string) => void;
  onDelete: (jobNumber: string, clientName: string) => void;
  onClick: () => void;
}) {
  const router = useRouter();
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent]       = useState(false);
  const [emailError, setEmailError]     = useState('');

  const statusStr = job.status as string;
  const styles = STAGE_STYLES[statusStr as Stage | 'Archived'] ?? STAGE_STYLES.Lead;
  const isArchived = statusStr === 'Archived';

  const analyserUrl = `/solar-analyser?${new URLSearchParams({
    name:          job.clientName,
    email:         job.email         ?? '',
    phone:         job.phone         ?? '',
    address:       job.address       ?? '',
    annualBill:    job.annualBill    ?? '',
    occupants:     job.occupants     ?? '',
    homeDaytime:   job.homeDaytime   ?? '',
    hotWater:      job.hotWater      ?? '',
    gasAppliances: job.gasAppliances ?? '',
    ev:            job.ev            ?? '',
    driveUrl:      job.driveUrl      ?? '',
  }).toString()}`;

  const openSolarUrl = (job as any).openSolarProjectId
    ? `https://app.opensolar.com/220067/projects/${(job as any).openSolarProjectId}`
    : `/admin`;

  async function sendFollowup() {
    if (!job.email) { setEmailError('No email on file'); return; }
    setSendingEmail(true);
    setEmailError('');
    try {
      const res = await fetch(`/api/jobs/${job.jobNumber}/followup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientName: job.clientName, email: job.email,
          phone: job.phone, address: job.address, jobNumber: job.jobNumber, followupCount: 1 }),
      });
      const data = await res.json();
      if (res.ok && data.sentAt) {
        setEmailSent(true);
        setTimeout(() => setEmailSent(false), 3000);
      } else {
        setEmailError(data.error ?? 'Email failed');
      }
    } catch { setEmailError('Network error'); }
    setSendingEmail(false);
  }

  const iconBtn = 'p-1.5 rounded-lg text-sm transition-colors hover:bg-[#f0f0f0] disabled:opacity-40';

  return (
    <tr onClick={onClick} className="border-b border-[#e5e9f0] cursor-pointer transition-colors group bg-white hover:bg-[#fafbfc]">
      <td className="px-4 py-3">
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap ${styles.badge}`}>{statusStr}</span>
      </td>
      <td className="px-4 py-3 font-mono text-[#ffd100] text-xs font-bold whitespace-nowrap">{job.jobNumber}</td>
      <td className="px-4 py-3 text-[#111827] font-medium">{job.clientName}</td>
      <td className="px-4 py-3 text-[#6b7280] hidden md:table-cell"><span className="block truncate max-w-[180px]">{job.address ?? '—'}</span></td>
      <td className="px-4 py-3 text-[#6b7280] hidden lg:table-cell whitespace-nowrap text-xs">{job.systemSize ? `${job.systemSize} kW` : '—'}</td>
      <td className="px-4 py-3 text-[#6b7280] hidden lg:table-cell whitespace-nowrap">{job.createdDate ?? '—'}</td>
      <td className="px-4 py-3 text-[#6b7280] hidden xl:table-cell whitespace-nowrap">{job.phone ?? '—'}</td>
      {/* Quick actions */}
      <td className="px-3 py-2 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-end gap-1">
          {!isArchived && (
            <>
              {/* Solar Analyser */}
              <a href={analyserUrl} target="_blank" rel="noopener noreferrer"
                title="Solar Analyser" className={iconBtn}>☀️</a>

              {/* OpenSolar Design */}
              <a href={openSolarUrl} target="_blank" rel="noopener noreferrer"
                title={(job as any).openSolarProjectId ? 'Open OpenSolar project' : 'Create design (admin)'}
                className={`${iconBtn} ${!(job as any).openSolarProjectId ? 'opacity-50' : ''}`}>🔆</a>
            </>
          )}

          {/* Client Files */}
          {job.driveUrl ? (
            <a href={job.driveUrl} target="_blank" rel="noopener noreferrer"
              title="Client Files" className={iconBtn}>📁</a>
          ) : (
            <span title="No Drive folder yet" className={`${iconBtn} opacity-30 cursor-default`}>📁</span>
          )}

          {!isArchived && (
            <>
              {/* Follow-up Email */}
              <button onClick={sendFollowup} disabled={sendingEmail || !job.email}
                title={emailError || (emailSent ? 'Sent!' : 'Send follow-up email')}
                className={`${iconBtn} ${emailSent ? 'text-green-600' : ''}`}>
                {emailSent ? '✅' : sendingEmail ? '⏳' : '📧'}
              </button>

              {/* Full Details */}
              <button onClick={() => router.push(`/dashboard/jobs/${job.jobNumber}`)}
                title="Full Details" className={iconBtn}>📋</button>

              {/* Full job detail is where stage progression happens */}
            </>
          )}

          {/* Archive */}
          {!isArchived && (
            <button
              onClick={() => onArchive(job.jobNumber, job.clientName)}
              title="Archive job"
              className={`${iconBtn} text-amber-500 hover:text-amber-600 hover:bg-amber-50`}
            >
              🗄️
            </button>
          )}

          {/* Delete */}
          <button
            onClick={() => onDelete(job.jobNumber, job.clientName)}
            title="Delete job permanently"
            className={`${iconBtn} text-red-400 hover:text-red-600 hover:bg-red-50`}
          >
            🗑️
          </button>
        </div>
        {emailError && <p className="text-red-500 text-[10px] mt-0.5 text-right">{emailError}</p>}
      </td>
    </tr>
  );
}
