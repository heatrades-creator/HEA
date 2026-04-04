import UnitTree from '@/components/dashboard/c2/UnitTree';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Units | HEA Command' };

async function getData() {
  const url = process.env.C2_GAS_URL;
  if (!url) return { units: [], roles: [], ranks: [] };
  try {
    const [uRes, rRes, rkRes] = await Promise.all([
      fetch(`${url}?action=listUnits`, { cache: 'no-store' }),
      fetch(`${url}?action=listRoles`, { cache: 'no-store' }),
      fetch(`${url}?action=listRanks`, { cache: 'no-store' }),
    ]);
    return {
      units: await uRes.json(),
      roles: await rRes.json(),
      ranks: await rkRes.json(),
    };
  } catch {
    return { units: [], roles: [], ranks: [] };
  }
}

export default async function UnitsPage() {
  const { units, roles, ranks } = await getData();
  const unitArr = Array.isArray(units) ? units : [];

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-white text-xl font-semibold">Units</h1>
        <p className="text-[#555] text-sm mt-0.5">Organisational structure — squads, teams, sections, departments</p>
      </div>
      <UnitTree units={unitArr} />

      {(Array.isArray(roles) && roles.length > 0) && (
        <div className="mt-8">
          <div className="flex items-center gap-3 mb-4">
            <p className="text-[#888] text-xs uppercase tracking-wider">Roles ({roles.length})</p>
            <div className="flex-1 h-px bg-[#2a2a2a]" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {roles.map((r: { role_id: string; title: string; is_supervisory?: string | boolean }) => (
              <div key={r.role_id} className="bg-[#202020] border border-[#2e2e2e] rounded-lg px-3 py-2">
                <p className="text-white text-sm">{r.title}</p>
                {(r.is_supervisory === true || r.is_supervisory === 'TRUE') && (
                  <p className="text-[#ffd100] text-xs mt-0.5">Supervisory</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {(Array.isArray(ranks) && ranks.length > 0) && (
        <div className="mt-8">
          <div className="flex items-center gap-3 mb-4">
            <p className="text-[#888] text-xs uppercase tracking-wider">Ranks ({ranks.length})</p>
            <div className="flex-1 h-px bg-[#2a2a2a]" />
          </div>
          <div className="space-y-1">
            {[...ranks].sort((a: { tier?: number }, b: { tier?: number }) => Number(a.tier ?? 0) - Number(b.tier ?? 0)).map((r: { rank_id: string; title: string; tier?: number; description?: string }) => (
              <div key={r.rank_id} className="flex items-center gap-3 bg-[#202020] border border-[#2e2e2e] rounded-lg px-3 py-2">
                <span className="text-[#ffd100] font-mono text-xs w-6 text-center">{r.tier ?? '—'}</span>
                <p className="text-white text-sm">{r.title}</p>
                {r.description && <p className="text-[#555] text-xs ml-auto">{r.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
