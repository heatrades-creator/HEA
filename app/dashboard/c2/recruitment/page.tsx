'use client';

import { useEffect, useState } from 'react';
import CandidatePipeline from '@/components/dashboard/c2/CandidatePipeline';
import { getCached, setCached } from '@/lib/c2Cache';

export default function RecruitmentPage() {
  const [candidates, setCandidates] = useState<unknown[]>(() => getCached('candidates') ?? []);
  const [loading, setLoading] = useState(!getCached('candidates'));

  useEffect(() => {
    if (getCached('candidates')) return;
    fetch('/api/c2/candidates')
      .then(r => r.json())
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setCached('candidates', list);
        setCandidates(list);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="p-6 animate-pulse">
      <div className="mb-6"><div className="h-6 w-32 bg-gray-200 rounded mb-2" /><div className="h-4 w-52 bg-gray-100 rounded" /></div>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex-shrink-0 w-56 bg-gray-50 border border-gray-200 rounded-xl p-3">
            <div className="h-4 w-20 bg-gray-200 rounded mb-3" />
            <div className="space-y-2">{[...Array(2)].map((_, j) => <div key={j} className="bg-white border border-gray-200 rounded-lg p-3 h-16" />)}</div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-[#111827] text-xl font-semibold">Recruitment</h1>
        <p className="text-[#6b7280] text-sm mt-0.5">Candidate pipeline — from application to offer accepted</p>
      </div>
      <CandidatePipeline initialCandidates={candidates as never[]} />
    </div>
  );
}
