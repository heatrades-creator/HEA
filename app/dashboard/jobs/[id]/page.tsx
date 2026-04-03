import { notFound } from 'next/navigation';
import Link from 'next/link';
import JobDetail from './JobDetail';

export const dynamic = 'force-dynamic';

async function getJob(id: string) {
  const gasUrl = process.env.JOBS_GAS_URL;
  if (!gasUrl) return null;
  try {
    const res = await fetch(`${gasUrl}?id=${encodeURIComponent(id)}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    return data ?? null;
  } catch {
    return null;
  }
}

export default async function JobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await getJob(id);
  if (!job) notFound();

  return (
    <div className="max-w-3xl mx-auto p-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-[#888] hover:text-[#ffd100] text-sm mb-6 transition-colors"
      >
        ← Back to Dashboard
      </Link>
      <JobDetail job={job} />
    </div>
  );
}
