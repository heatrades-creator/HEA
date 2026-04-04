import Link from 'next/link';

export const metadata = { title: 'Command | HEA' };

async function getOverview() {
  const url = process.env.C2_GAS_URL;
  if (!url) return null;
  try {
    const res = await fetch(`${url}?action=getOverview`, { next: { revalidate: 30 } });
    return await res.json();
  } catch {
    return null;
  }
}

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="bg-white border border-[#e5e9f0] rounded-xl p-5">
      <p className="text-[#374151] text-xs uppercase tracking-wider mb-3">{label}</p>
      <p className={`text-3xl font-bold ${color ?? 'text-[#111827]'}`}>{value}</p>
      {sub && <p className="text-[#6b7280] text-xs mt-1">{sub}</p>}
    </div>
  );
}

export default async function C2OverviewPage() {
  const data = await getOverview();

  const notConfigured = !process.env.C2_GAS_URL;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-[#111827] text-xl font-semibold">Command</h1>
        <p className="text-[#6b7280] text-sm mt-0.5">Workforce overview — HEA Command & Control</p>
      </div>

      {notConfigured && (
        <div className="bg-[#f5f7fb] border border-[#ffd100]/30 rounded-xl p-5 mb-6">
          <p className="text-[#ffd100] text-sm font-semibold mb-1">C2_GAS_URL not configured</p>
          <p className="text-[#6b7280] text-sm">Add <code className="bg-[#eef0f5] px-1 rounded text-[#aaa]">C2_GAS_URL</code> to your Vercel environment variables and redeploy. See the Setup Report for full instructions.</p>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Headcount" value={data?.headcount ?? '—'} sub="active staff" />
        <StatCard
          label="Deployable"
          value={data?.deployable_full ?? '—'}
          sub={`${data?.deployable_limited ?? 0} limited · ${data?.deployable_blocked ?? 0} blocked`}
          color="text-green-400"
        />
        <StatCard
          label="Open Tasks"
          value={data?.open_tasks ?? '—'}
          sub="requiring action"
          color={data?.open_tasks > 0 ? 'text-[#ffd100]' : 'text-[#111827]'}
        />
        <StatCard
          label="Doc Alerts"
          value={data?.expiring_docs ?? '—'}
          sub="expiring or expired"
          color={data?.expiring_docs > 0 ? 'text-red-400' : 'text-[#111827]'}
        />
      </div>

      {/* Deployability breakdown */}
      {data && (
        <div className="bg-white border border-[#e5e9f0] rounded-xl p-5 mb-6">
          <p className="text-[#374151] text-xs uppercase tracking-wider mb-4">Deployability Breakdown</p>
          <div className="flex items-center gap-4">
            <div className="flex-1 bg-[#f5f7fb] rounded-full h-2.5 overflow-hidden">
              {data.headcount > 0 && (
                <div className="h-full flex">
                  <div className="bg-green-600" style={{ width: `${(data.deployable_full / data.headcount) * 100}%` }} />
                  <div className="bg-[#ffd100]" style={{ width: `${(data.deployable_limited / data.headcount) * 100}%` }} />
                  <div className="bg-red-600" style={{ width: `${(data.deployable_blocked / data.headcount) * 100}%` }} />
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-6 mt-3">
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-600" /><span className="text-[#6b7280] text-xs">Full ({data.deployable_full})</span></div>
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#ffd100]" /><span className="text-[#6b7280] text-xs">Limited ({data.deployable_limited})</span></div>
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-600" /><span className="text-[#6b7280] text-xs">Blocked ({data.deployable_blocked})</span></div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent people */}
        <div className="bg-white border border-[#e5e9f0] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#e5e9f0] flex items-center justify-between">
            <p className="text-[#111827] text-sm font-medium">Recent People</p>
            <Link href="/dashboard/c2/people" className="text-[#ffd100] text-xs hover:underline">View all →</Link>
          </div>
          {!data?.recent_people?.length ? (
            <p className="px-5 py-8 text-center text-[#6b7280] text-sm">No people yet</p>
          ) : (
            <div className="divide-y divide-[#edf0f5]">
              {(data.recent_people || []).map((p: { person_id: string; full_name: string; employment_type?: string; status?: string; deployability?: string }) => (
                <Link key={p.person_id} href={`/dashboard/c2/people/${p.person_id}`} className="flex items-center justify-between px-5 py-3 hover:bg-gray-100 transition-colors">
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

        {/* Quick links */}
        <div className="bg-white border border-[#e5e9f0] rounded-xl p-5">
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
              <Link key={item.href} href={item.href} className="bg-[#f5f7fb] border border-[#e5e9f0] rounded-lg p-3 hover:border-[#ffd100]/30 hover:bg-[#f5f7fb] transition-colors">
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
