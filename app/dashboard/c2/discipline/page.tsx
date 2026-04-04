'use client';

import { useEffect, useState } from 'react';
import DisciplineTable from '@/components/dashboard/c2/DisciplineTable';
import { getCached, setCached } from '@/lib/c2Cache';

export default function DisciplinePage() {
  const [cases, setCases] = useState<unknown[]>(() => getCached('discipline') ?? []);
  const [loading, setLoading] = useState(!getCached('discipline'));

  useEffect(() => {
    if (getCached('discipline')) return;
    Promise.all([
      fetch('/api/c2/discipline').then(r => r.json()),
      fetch('/api/c2/people').then(r => r.json()),
    ]).then(([casesData, peopleData]) => {
      const caseList = Array.isArray(casesData) ? casesData : [];
      const peopleList = Array.isArray(peopleData) ? peopleData : [];
      const enriched = caseList.map((c: { person_id: string }) => {
        const p = (peopleList as { person_id: string; full_name?: string }[]).find(p => p.person_id === c.person_id);
        return { ...c, personName: p?.full_name };
      });
      setCached('discipline', enriched);
      setCases(enriched);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="p-6 max-w-5xl mx-auto animate-pulse">
      <div className="mb-6"><div className="h-6 w-28 bg-gray-200 rounded mb-2" /><div className="h-4 w-44 bg-gray-100 rounded" /></div>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {[...Array(4)].map((_, i) => <div key={i} className="flex items-center justify-between px-5 py-4 border-b border-gray-100 h-16" />)}
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-[#111827] text-xl font-semibold">Discipline</h1>
        <p className="text-[#6b7280] text-sm mt-0.5">
          {cases.length > 0 ? `${cases.length} case${cases.length !== 1 ? 's' : ''}` : 'Discipline cases and performance improvement plans'}
        </p>
      </div>
      <DisciplineTable cases={cases as never} />
    </div>
  );
}
