'use client';

import { useEffect, useState } from 'react';
import OnboardingTracker from '@/components/dashboard/c2/OnboardingTracker';
import { getCached, setCached } from '@/lib/c2Cache';

export default function OnboardingPage() {
  const [cases, setCases] = useState<unknown[]>(() => {
    const cached = getCached<{ cases: unknown[]; people: unknown[] }>('onboarding');
    return cached?.cases ?? [];
  });
  const [loading, setLoading] = useState(!getCached('onboarding'));

  useEffect(() => {
    if (getCached('onboarding')) return;
    Promise.all([
      fetch('/api/c2/onboarding').then(r => r.json()),
      fetch('/api/c2/people').then(r => r.json()),
    ]).then(([casesData, peopleData]) => {
      const caseList = Array.isArray(casesData) ? casesData : [];
      const peopleList = Array.isArray(peopleData) ? peopleData : [];
      const enriched = caseList.map((c: { person_id: string; status?: string }) => {
        const p = (peopleList as { person_id: string; full_name?: string }[]).find(p => p.person_id === c.person_id);
        return { ...c, personName: p?.full_name ?? c.person_id };
      });
      const active = enriched.filter(c => c.status !== 'COMPLETE' && c.status !== 'CANCELLED');
      setCached('onboarding', { cases: active, people: peopleList });
      setCases(active);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="p-6 max-w-3xl mx-auto animate-pulse">
      <div className="mb-6"><div className="h-6 w-28 bg-gray-200 rounded mb-2" /><div className="h-4 w-48 bg-gray-100 rounded" /></div>
      <div className="space-y-4">{[...Array(2)].map((_, i) => <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 h-32" />)}</div>
    </div>
  );

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-[#111827] text-xl font-semibold">Onboarding</h1>
        <p className="text-[#6b7280] text-sm mt-0.5">
          {cases.length > 0 ? `${cases.length} active onboarding case${cases.length !== 1 ? 's' : ''}` : 'Track new starters through induction and setup'}
        </p>
      </div>
      <OnboardingTracker cases={cases as never[]} />
    </div>
  );
}
