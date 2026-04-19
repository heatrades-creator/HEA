import JobsListPage from '@/components/dashboard/JobsListPage';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Jobs | HEA' };

async function getJobs() {
  const gasUrl = process.env.JOBS_GAS_URL;
  if (!gasUrl) return [];
  try {
    const res = await fetch(gasUrl, { cache: 'no-store' });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export default async function JobsPage() {
  const jobs = await getJobs();
  return <JobsListPage initialJobs={jobs} />;
}
