import OnboardingTracker from '@/components/dashboard/c2/OnboardingTracker';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Onboarding | HEA Command' };

async function getData() {
  const url = process.env.C2_GAS_URL;
  if (!url) return { cases: [], people: [] };
  try {
    const [casesRes, peopleRes] = await Promise.all([
      fetch(`${url}?action=listOnboarding`, { cache: 'no-store' }),
      fetch(`${url}?action=listPeople`, { cache: 'no-store' }),
    ]);
    const cases = await casesRes.json();
    const people = await peopleRes.json();
    return {
      cases: Array.isArray(cases) ? cases : [],
      people: Array.isArray(people) ? people : [],
    };
  } catch {
    return { cases: [], people: [] };
  }
}

export default async function OnboardingPage() {
  const { cases, people } = await getData();

  // Enrich with person names
  const enriched = cases.map((c: { case_id: string; person_id: string; status: string; target_start_date?: string; contract_sent_at?: string; contract_signed_at?: string; induction_date?: string; supervisor_id?: string; notes?: string }) => {
    const p = people.find((p: { person_id: string; full_name?: string }) => p.person_id === c.person_id);
    return { ...c, personName: p?.full_name ?? c.person_id };
  });

  const active = enriched.filter((c: { status: string }) => c.status !== 'COMPLETE' && c.status !== 'CANCELLED');

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-white text-xl font-semibold">Onboarding</h1>
        <p className="text-[#555] text-sm mt-0.5">
          {active.length > 0 ? `${active.length} active onboarding case${active.length !== 1 ? 's' : ''}` : 'Track new starters through induction and setup'}
        </p>
      </div>
      <OnboardingTracker cases={active} />
    </div>
  );
}
