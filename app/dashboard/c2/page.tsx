'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getCached, setCached } from '@/lib/c2Cache';

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <p className="text-[#374151] text-xs uppercase tracking-wider mb-3">{label}</p>
      <p className={`text-3xl font-bold ${color ?? 'text-[#111827]'}`}>{value}</p>
      {sub && <p className="text-[#6b7280] text-xs mt-1">{sub}</p>}
    </div>
  );
}

export default function C2OverviewPage() {
  const [data, setData] = useState<Record<string, number & { recent_people?: unknown[] }> | null>(
    () => getCached('overview')
  );
  const [loading, setLoading] = useState(!getCached('overview'));

  useEffect(() => {
    if (getCached('overview')) return;
    fetch('/api/c2/overview')
      .then(r => r.json())
      .then(d => { setCached('overview', d); setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-[#111827] text-xl font-semibold">Command</h1>
        <p className="text-[#6b7280] text-sm mt-0.5">Workforce overview — HEA Command & Control</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {loading ? [...Array(4)].map((_, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 animate-pulse">
            <div className="h-3 w-20 bg-gray-200 rounded mb-4" /><div className="h-8 w-12 bg-gray-200 rounded" />
          </div>
        )) : <>
          <StatCard label="Headcount" value={(data as never as { headcount: number })?.headcount ?? '—'} sub="active staff" />
          <StatCard label="Deployable" value={(data as never as { deployable_full: number })?.deployable_full ?? '—'} sub={`${(data as never as { deployable_limited: number })?.deployable_limited ?? 0} limited · ${(data as never as { deployable_blocked: number })?.deployable_blocked ?? 0} blocked`} color="text-green-600" />
          <StatCard label="Open Tasks" value={(data as never as { open_tasks: number })?.open_tasks ?? '—'} sub="requiring action" color={(data as never as { open_tasks: number })?.open_tasks > 0 ? 'text-yellow-600' : 'text-[#111827]'} />
          <StatCard label="Doc Alerts" value={(data as never as { expiring_docs: number })?.expiring_docs ?? '—'} sub="expiring or expired" color={(data as never as { expiring_docs: number })?.expiring_docs > 0 ? 'text-red-600' : 'text-[#111827]'} />
        </>}
      </div>

      {data && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
          <p className="text-[#374151] text-xs uppercase tracking-wider mb-4">Deployability Breakdown</p>
          <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
            {(data as never as { headcount: number }).headcount > 0 && (
              <div className="h-full flex">
                <div className="bg-green-500" style={{ width: `${((data as never as { deployable_full: number }).deployable_full / (data as never as { headcount: number }).headcount) * 100}%` }} />
                <div className="bg-yellow-400" style={{ width: `${((data as never as { deployable_limited: number }).deployable_limited / (data as never as { headcount: number }).headcount) * 100}%` }} />
                <div className="bg-red-500" style={{ width: `${((data as never as { deployable_blocked: number }).deployable_blocked / (data as never as { headcount: number }).headcount) * 100}%` }} />
              </div>
            )}
          </div>
          <div className="flex items-center gap-6 mt-3">
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500" /><span className="text-[#6b7280] text-xs">Full ({(data as never as { deployable_full: number }).deployable_full})</span></div>
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-yellow-400" /><span className="text-[#6b7280] text-xs">Limited ({(data as never as { deployable_limited: number }).deployable_limited})</span></div>
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500" /><span className="text-[#6b7280] text-xs">Blocked ({(data as never as { deployable_blocked: number }).deployable_blocked})</span></div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <p className="text-[#111827] text-sm font-medium">Recent People</p>
            <Link href="/dashboard/c2/people" className="text-yellow-600 text-xs hover:underline">View all →</Link>
          </div>
          {loading ? (
            <div className="divide-y divide-gray-100">{[...Array(3)].map((_, i) => <div key={i} className="flex items-center justify-between px-5 py-3 animate-pulse"><div className="h-4 w-36 bg-gray-200 rounded" /><div className="h-5 w-16 bg-gray-100 rounded-full" /></div>)}</div>
          ) : !(data as never as { recent_people: unknown[] })?.recent_people?.length ? (
            <p className="px-5 py-8 text-center text-[#6b7280] text-sm">No people yet</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {((data as never as { recent_people: { person_id: string; full_name: string; employment_type?: string; deployability?: string }[] }).recent_people || []).map(p => (
                <Link key={p.person_id} href={`/dashboard/c2/people/${p.person_id}`} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="text-[#111827] text-sm">{p.full_name}</p>
                    <p className="text-[#6b7280] text-xs">{(p.employment_type || '').replace(/_/g, ' ')}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${p.deployability === 'FULL' ? 'bg-green-100 text-green-700' : p.deployability === 'BLOCKED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {p.deployability || 'FULL'}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-[#111827] text-sm font-medium mb-4">Command Modules</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { href: '/dashboard/c2/people', label: 'People', desc: 'All personnel' },
              { href: '/dashboard/c2/recruitment', label: 'Recruitment', desc: 'Candidate pipeline' },
              { href: '/dashboard/c2/onboarding', label: 'Onboarding', desc: 'New starters' },
              { href: '/dashboard/c2/units', label: 'Units', desc: 'Org structure' },
              { href: '/dashboard/c2/tasks', label: 'Tasks', desc: 'Open actions' },
              { href: '/dashboard/c2/discipline', label: 'Discipline', desc: 'Cases & PIPs' },
            ].map(item => (
              <Link key={item.href} href={item.href} className="bg-gray-50 border border-gray-200 rounded-lg p-3 hover:border-yellow-400/50 hover:bg-yellow-50/30 transition-colors">
                <p className="text-[#111827] text-sm font-medium">{item.label}</p>
                <p className="text-[#6b7280] text-xs mt-0.5">{item.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
