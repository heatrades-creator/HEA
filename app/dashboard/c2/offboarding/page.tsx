export const metadata = { title: 'Offboarding | HEA Command' };

type OffboardingCase = {
  case_id: string;
  person_id: string;
  reason?: string;
  status?: string;
  last_day?: string;
  assets_returned?: string | boolean;
  access_revoked?: string | boolean;
  final_pay_processed?: string | boolean;
  notes?: string;
  created_at?: string;
  personName?: string;
};

async function getData() {
  const url = process.env.C2_GAS_URL;
  if (!url) return { cases: [], people: [] };
  try {
    const [casesRes, peopleRes] = await Promise.all([
      fetch(`${url}?action=listOffboarding`, { next: { revalidate: 30 } }),
      fetch(`${url}?action=listPeople`, { next: { revalidate: 30 } }),
    ]);
    const cases = await casesRes.json();
    const people = await peopleRes.json();
    return { cases: Array.isArray(cases) ? cases : [], people: Array.isArray(people) ? people : [] };
  } catch {
    return { cases: [], people: [] };
  }
}

const CHECKLIST = [
  { key: 'assets_returned', label: 'Assets Returned' },
  { key: 'access_revoked', label: 'Access Revoked' },
  { key: 'final_pay_processed', label: 'Final Pay Processed' },
];

const STATUS_STYLES: Record<string, string> = {
  CREATED:              'bg-gray-100 text-gray-600',
  NOTICE_RECEIVED:      'bg-blue-100 text-blue-700',
  HANDOVER_IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
  ASSETS_RETURNED:      'bg-purple-100 text-purple-700',
  ACCESS_REVOKED:       'bg-orange-100 text-orange-700',
  FINAL_PAY_PROCESSED:  'bg-indigo-100 text-indigo-700',
  REFERENCE_ISSUED:     'bg-sky-100 text-sky-700',
  COMPLETE:             'bg-green-100 text-green-700',
};

export default async function OffboardingPage() {
  const { cases, people } = await getData();
  const enriched: OffboardingCase[] = cases.map((c: OffboardingCase) => {
    const p = (people as { person_id: string; full_name?: string }[]).find(p => p.person_id === c.person_id);
    return { ...c, personName: p?.full_name };
  });
  const active = enriched.filter(c => c.status !== 'COMPLETE');

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-[#111827] text-xl font-semibold">Offboarding</h1>
        <p className="text-[#6b7280] text-sm mt-0.5">
          {active.length > 0 ? `${active.length} active offboarding case${active.length !== 1 ? 's' : ''}` : 'No active offboarding cases'}
        </p>
      </div>

      {active.length === 0 ? (
        <div className="bg-white border border-[#e5e9f0] rounded-xl p-8 text-center">
          <p className="text-[#6b7280] text-sm">No active offboarding cases.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {active.map(c => (
            <div key={c.case_id} className="bg-white border border-[#e5e9f0] rounded-xl p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-[#111827] font-medium">{c.personName || c.person_id}</p>
                  <p className="text-[#6b7280] text-xs mt-0.5">{(c.reason || '').replace(/_/g, ' ')}</p>
                  {c.last_day && <p className="text-[#6b7280] text-xs mt-1">Last day: <span className="{String(c.last_day).substring(0, 10)}</span>">{String(c.last_day).substring(0, 10)}</span></p>}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[(c.status || 'CREATED').toUpperCase()] ?? 'bg-[#eef0f5] text-[#6b7280]'}`}>
                  {(c.status || 'CREATED').replace(/_/g, ' ')}
                </span>
              </div>

              <div className="flex items-center gap-4">
                {CHECKLIST.map(item => {
                  const val = c[item.key as keyof OffboardingCase];
                  const done = val === true || val === 'TRUE' || val === 'true';
                  return (
                    <div key={item.key} className="flex items-center gap-1.5">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${done ? 'bg-green-100 border-green-400' : 'border-[#444]'}`}>
                        {done && <svg className="w-2.5 h-2.5 text-green-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>}
                      </div>
                      <span className={`text-xs ${done ? 'text-[#6b7280] line-through' : 'text-[#6b7280]'}`}>{item.label}</span>
                    </div>
                  );
                })}
              </div>

              {c.notes && <p className="text-[#6b7280] text-xs mt-3 border-t border-[#edf0f5] pt-3">{c.notes}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
