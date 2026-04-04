import DisciplineTable from '@/components/dashboard/c2/DisciplineTable';

export const metadata = { title: 'Discipline | HEA Command' };

async function getData() {
  const url = process.env.C2_GAS_URL;
  if (!url) return { cases: [], people: [] };
  try {
    const [casesRes, peopleRes] = await Promise.all([
      fetch(`${url}?action=listDiscipline`, { next: { revalidate: 30 } }),
      fetch(`${url}?action=listPeople`, { next: { revalidate: 30 } }),
    ]);
    return {
      cases: Array.isArray(await casesRes.clone().json()) ? await casesRes.json() : [],
      people: Array.isArray(await peopleRes.clone().json()) ? await peopleRes.json() : [],
    };
  } catch {
    return { cases: [], people: [] };
  }
}

export default async function DisciplinePage() {
  const url = process.env.C2_GAS_URL;
  let cases: { case_id: string; person_id: string; category?: string; severity?: string; status?: string; description?: string; outcome?: string; created_at?: string }[] = [];
  let people: { person_id: string; full_name?: string }[] = [];

  if (url) {
    try {
      const [casesRes, peopleRes] = await Promise.all([
        fetch(`${url}?action=listDiscipline`, { next: { revalidate: 30 } }),
        fetch(`${url}?action=listPeople`, { next: { revalidate: 30 } }),
      ]);
      const casesData = await casesRes.json();
      const peopleData = await peopleRes.json();
      cases = Array.isArray(casesData) ? casesData : [];
      people = Array.isArray(peopleData) ? peopleData : [];
    } catch {}
  }

  const enriched = cases.map(c => {
    const p = people.find(p => p.person_id === c.person_id);
    return { ...c, personName: p?.full_name };
  });

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-white text-xl font-semibold">Discipline</h1>
        <p className="text-[#555] text-sm mt-0.5">
          {cases.length > 0 ? `${cases.length} case${cases.length !== 1 ? 's' : ''}` : 'Discipline cases and performance improvement plans'}
        </p>
      </div>
      <DisciplineTable cases={enriched} />
    </div>
  );
}
