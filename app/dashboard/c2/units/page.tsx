'use client';

import { useEffect, useState } from 'react';
import UnitTree from '@/components/dashboard/c2/UnitTree';
import { getCached, setCached } from '@/lib/c2Cache';

type UnitsData = { units: unknown[]; roles: unknown[]; ranks: unknown[] };

export default function UnitsPage() {
  const [data, setData] = useState<UnitsData>(() => getCached('units') ?? { units: [], roles: [], ranks: [] });
  const [loading, setLoading] = useState(!getCached('units'));

  useEffect(() => {
    if (getCached('units')) return;
    fetch('/api/c2/units')
      .then(r => r.json())
      .then(d => {
        const result = {
          units: Array.isArray(d.units) ? d.units : [],
          roles: Array.isArray(d.roles) ? d.roles : [],
          ranks: Array.isArray(d.ranks) ? d.ranks : [],
        };
        setCached('units', result);
        setData(result);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="p-6 max-w-3xl mx-auto animate-pulse">
      <div className="mb-6"><div className="h-6 w-20 bg-gray-200 rounded mb-2" /><div className="h-4 w-48 bg-gray-100 rounded" /></div>
      <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 h-12" />)}</div>
    </div>
  );

  const { units, roles, ranks } = data;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-[#111827] text-xl font-semibold">Units</h1>
        <p className="text-[#6b7280] text-sm mt-0.5">Organisational structure — squads, teams, sections, departments</p>
      </div>
      <UnitTree units={units as never[]} />
      {(Array.isArray(roles) && roles.length > 0) && (
        <div className="mt-8">
          <div className="flex items-center gap-3 mb-4">
            <p className="text-[#374151] text-xs uppercase tracking-wider">Roles ({roles.length})</p>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {(roles as { role_id: string; title: string; is_supervisory?: string | boolean }[]).map(r => (
              <div key={r.role_id} className="bg-white border border-gray-200 rounded-lg px-3 py-2">
                <p className="text-[#111827] text-sm">{r.title}</p>
                {(r.is_supervisory === true || r.is_supervisory === 'TRUE') && <p className="text-yellow-600 text-xs mt-0.5">Supervisory</p>}
              </div>
            ))}
          </div>
        </div>
      )}
      {(Array.isArray(ranks) && ranks.length > 0) && (
        <div className="mt-8">
          <div className="flex items-center gap-3 mb-4">
            <p className="text-[#374151] text-xs uppercase tracking-wider">Ranks ({ranks.length})</p>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
          <div className="space-y-1">
            {[...(ranks as { rank_id: string; title: string; tier?: number; description?: string }[])].sort((a, b) => Number(a.tier ?? 0) - Number(b.tier ?? 0)).map(r => (
              <div key={r.rank_id} className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-3 py-2">
                <span className="text-yellow-600 font-mono text-xs w-6 text-center">{r.tier ?? '—'}</span>
                <p className="text-[#111827] text-sm">{r.title}</p>
                {r.description && <p className="text-[#6b7280] text-xs ml-auto">{r.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
