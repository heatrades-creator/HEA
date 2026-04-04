import { notFound } from 'next/navigation';
import Link from 'next/link';
import PersonDetail from './PersonDetail';

export const dynamic = 'force-dynamic';

async function getPerson(id: string) {
  const url = process.env.C2_GAS_URL;
  if (!url) return null;
  try {
    const res = await fetch(`${url}?action=getPerson&id=${encodeURIComponent(id)}`, { cache: 'no-store' });
    const data = await res.json();
    if (data?.error) return null;
    return data;
  } catch {
    return null;
  }
}

export default async function PersonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const person = await getPerson(id);
  if (!person) notFound();

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-4">
        <Link href="/dashboard/c2/people" className="text-[#9ca3af] text-sm hover:text-[#6b7280] transition-colors">← People</Link>
      </div>
      <PersonDetail person={person} />
    </div>
  );
}
