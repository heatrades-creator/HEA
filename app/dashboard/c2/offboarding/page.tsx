'use client';

import { useEffect, useState } from 'react';
import { getCached, setCached } from '@/lib/c2Cache';

type OffboardingCase = {
  case_id: string; person_id: string; reason?: string; status?: string; last_day?: string;
  assets_returned?: string | boolean; access_revoked?: string | boolean;
  final_pay_processed?: string | boolean; notes?: string; personName?: string;
};

const STATUS_STYLES: Record<string, string> = {
  CREATED: 'bg-gray-100 text-gray-600', NOTICE_RECEIVED: 'bg-blue-100 text-blue-700',
  HANDOVER_IN_PROGRESS: 'bg-yellow-100 text-yellow-700', ASSETS_RETURNED: 'bg-purple-100 text-purple-700',
  ACCESS_REVOKED: 'bg-orange-100 text-orange-700', FINAL_PAY_PROCESSED: 'bg-indigo-100 text-indigo-700',
  REFERENCE_ISSUED: 'bg-sky-100 text-sky-700', COMPLETE: 'bg-green-100 text-green-700',
};

const CHECKLIST = [
  { key: 'assets_returned', label: 'Assets Returned' },
  { key: 'access_revoked', label: 'Access Revoked' },
  { key: 'final_pay_processed', label: 'Final Pay Processed' },
];

export default function OffboardingPage() {
  const [cases, setCases] = useState<OffboardingCase[]>(() => getCached('offboarding') ?? []);
  const [loading, setLoading] = useState(!getCached('offboarding'));

  useEffect(() => {
    if (getCached('offboarding')) return;
    Promise.all([
      fetch('/api/c2/offboarding').then(r => r.json()),
      fetch('/api/c2/people').then(r => r.json()),
    ]).then(([casesData, peopleData]) => {
      const caseList = Array.isArray(casesData) ? casesData : [];
      const peopleList = Array.isArray(peopleData) ? peopleData : [];
      const enriched = caseList.map((c: OffboardingCase) => {
        const p = (peopleList as { person_id: string; full_name?: string }[]).find(p => p.person_id === c.person_id);
        return { ...c, personName: p?.full_name };
      }).filter((c: OffboardingCase) => c.status !== 'COMPLETE');
      setCached('offboarding', enriched);
      setCases(enriched);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="p-6 max-w-3xl mx-auto animate-pulse">
      <div className="mb-6"><div className="h-6 w-32 bg-gray-200 rounded mb-2" /><div className="h-4 w-48 bg-gray-100 rounded" /></div>
      <div className="space-y-4">{[...Array(2)].map((_, i) => <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 h-28" />)}</div>
    </div>
  );

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-[#111827] text-xl font-semibold">Offboarding</h1>
        <p className="text-[#6b7280] text-sm mt-0.5">{cases.length > 0 ? `${cases.length} active offboarding case${cases.length !== 1 ? 's' : ''}` : 'No active offboarding cases'}</p>
      </div>
      {cases.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center"><p className="text-[#6b7280] text-sm">No active offboarding cases.</p></div>
      ) : (
        <div className="space-y-4">
          {cases.map(c => (
            <div key={c.case_id} className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-[#111827] font-medium">{c.personName || c.person_id}</p>
                  <p className="text-[#6b7280] text-xs mt-0.5">{(c.reason || '').replace(/_/g, ' ')}</p>
                  {c.last_day && <p className="text-[#6b7280] text-xs mt-1">Last day: <span className="text-[#374151]">{String(c.last_day).substring(0, 10)}</span></p>}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[(c.status || 'CREATED').toUpperCase()] ?? 'bg-gray-100 text-gray-600'}`}>
                  {(c.status || 'CREATED').replace(/_/g, ' ')}
                </span>
              </div>
              <div className="flex items-center gap-4">
                {CHECKLIST.map(item => {
                  const val = c[item.key as keyof OffboardingCase];
                  const done = val === true || val === 'TRUE' || val === 'true';
                  return (
                    <div key={item.key} className="flex items-center gap-1.5">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${done ? 'bg-green-100 border-green-400' : 'border-gray-300'}`}>
                        {done && <svg className="w-2.5 h-2.5 text-green-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>}
                      </div>
                      <span className={`text-xs ${done ? 'text-[#9ca3af] line-through' : 'text-[#374151]'}`}>{item.label}</span>
                    </div>
                  );
                })}
              </div>
              {c.notes && <p className="text-[#6b7280] text-xs mt-3 border-t border-gray-100 pt-3">{c.notes}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
