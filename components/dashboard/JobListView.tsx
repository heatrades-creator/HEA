'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Job, Stage } from './KanbanBoard';

const STAGES = ['Lead', 'Quoted', 'Booked', 'In Progress', 'Complete'] as const;

const STAGE_STYLES: Record<Stage, { badge: string }> = {
  Lead:          { badge: 'bg-[#3a3a3a] text-[#aaa]' },
  Quoted:        { badge: 'bg-blue-900/40 text-blue-300' },
  Booked:        { badge: 'bg-purple-900/40 text-purple-300' },
  'In Progress': { badge: 'bg-yellow-900/40 text-[#ffd100]' },
  Complete:      { badge: 'bg-green-900/40 text-green-400' },
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
  const [showMove, setShowMove] = useState(false);
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
        <div className="relative inline-block">
          <button
            onClick={() => setShowMove(!showMove)}
            className="text-[#6b7280] hover:text-[#6b7280] text-xs transition-colors px-1 py-0.5"
          >
            Move ▾
          </button>
          {showMove && (
            <>
              {/* Backdrop to close on outside click */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMove(false)}
              />
              <div className="absolute right-0 top-7 bg-[#eef0f5] border border-[#e5e9f0] rounded-lg overflow-hidden z-20 w-36 shadow-xl">
                {STAGES.map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      onMove(job.jobNumber, s);
                      setShowMove(false);
                    }}
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
