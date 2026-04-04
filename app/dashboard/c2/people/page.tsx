import PeopleTable from '@/components/dashboard/c2/PeopleTable';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'People | HEA Command' };

async function getPeople() {
  const url = process.env.C2_GAS_URL;
  if (!url) return [];
  try {
    const res = await fetch(`${url}?action=listPeople`, { cache: 'no-store' });
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export default async function PeoplePage() {
  const people = await getPeople();
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-white text-xl font-semibold">People</h1>
        <p className="text-[#555] text-sm mt-0.5">
          {people.length > 0 ? `${people.length} personnel record${people.length !== 1 ? 's' : ''}` : 'All HEA personnel'}
        </p>
      </div>
      <PeopleTable initialPeople={people} />
    </div>
  );
}
