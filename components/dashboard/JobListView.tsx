'use client';

import { useRouter } from 'next/navigation';
import type { Job, Stage } from './KanbanBoard';

const STAGES = ['Lead', 'Estimation', 'Contract', 'Booked', 'In Progress', 'Complete'] as const;

const STAGE_STYLES: Record<Stage, { badge: string }> = {
  Lead:          { badge: 'bg-gray-100 text-gray-600' },
  Estimation:    { badge: 'bg-blue-100 text-blue-700' },
  Contract:      { badge: 'bg-orange-100 text-orange-700' },
  Booked:        { badge: 'bg-purple-100 text-purple-700' },
  'In Progress': { badge: 'bg-amber-100 text-amber-900' },
  Complete:      { badge: 'bg-green-100 text-green-700' },
};

export default function JobListView({
  jobs,
  onMove,
}: {
  jobs: Job[];
  onMove: (jobNumber: string, newStatus: Stage) => void;
}) {
  const router = useRouter();

  return (
    <div className="overflow-x-auto rounded-xl border border-[#e5e9f0] flex-1">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#e5e9f0] bg-[#f5f7fb]">
            <th className="px-4 py-3 text-left text-[#374151] text-xs uppercase tracking-wider font-medium">Status</th>
            <th className="px-4 py-3 text-left text-[#374151] text-xs uppercase tracking-wider font-medium">Job #</th>
            <th className="px-4 py-3 text-left text-[#374151] text-xs uppercase tracking-wider font-medium">Client</th>
            <th className="px-4 py-3 text-left text-[#374151] text-xs uppercase tracking-wider font-medium hidden md:table-cell">Address</th>
            <th className="px-4 py-3 text-left text-[#374151] text-xs uppercase tracking-wider font-medium hidden lg:table-cell">Created</th>
            <th className="px-4 py-3 text-left text-[#374151] text-xs uppercase tracking-wider font-medium hidden lg:table-cell">Phone</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {jobs.length === 0 && (
            <tr>
              <td colSpan={7} className="px-4 py-16 text-center text-[#6b7280] text-sm">
                No jobs found
              </td>
            </tr>
          )}
          {jobs.map((job, i) => (
            <JobRow
              key={job.jobNumber}
              job={job}
              isEven={i % 2 === 0}
              onMove={onMove}
              onClick={() => router.push(`/dashboard/jobs/${job.jobNumber}`)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function JobRow({
  job,
  isEven,
  onMove,
  onClick,
}: {
  job: Job;
  isEven: boolean;
  onMove: (jobNumber: string, newStatus: Stage) => void;
  onClick: () => void;
}) {
  const styles = STAGE_STYLES[job.status] ?? STAGE_STYLES.Lead;

  return (
    <tr
      onClick={onClick}
      className={`border-b border-[#1e1e1e] cursor-pointer transition-colors group ${
        isEven ? 'bg-[#f5f7fb]' : 'bg-[#f5f7fb]'
      } hover:bg-[#232323]`}
    >
      <td className="px-4 py-3">
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${styles.badge}`}>
          {job.status}
        </span>
      </td>
      <td className="px-4 py-3 font-mono text-[#ffd100] text-xs font-bold whitespace-nowrap">
        {job.jobNumber}
      </td>
      <td className="px-4 py-3 text-[#111827] font-medium">{job.clientName}</td>
      <td className="px-4 py-3 text-[#6b7280] hidden md:table-cell">
        <span className="block truncate max-w-[200px]">{job.address ?? '—'}</span>
      </td>
      <td className="px-4 py-3 text-[#6b7280] hidden lg:table-cell whitespace-nowrap">
        {job.createdDate ?? '—'}
      </td>
      <td className="px-4 py-3 text-[#6b7280] hidden lg:table-cell whitespace-nowrap">
        {job.phone ?? '—'}
      </td>
      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-end gap-1 flex-wrap">
          <span className="text-[10px] text-[#9ca3af] font-medium mr-0.5">→</span>
          {STAGES.filter((s) => s !== job.status).map((s) => (
            <button
              key={s}
              onClick={() => onMove(job.jobNumber, s)}
              className={`text-[10px] px-2 py-0.5 rounded-full border border-current font-medium transition-colors hover:opacity-80 ${STAGE_STYLES[s].badge}`}
            >
              {s}
            </button>
          ))}
        </div>
      </td>
    </tr>
  );
}
