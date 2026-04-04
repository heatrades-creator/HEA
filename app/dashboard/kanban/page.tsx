import KanbanBoard from '@/components/dashboard/KanbanBoard';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Kanban | HEA' };

async function getJobs() {
  const gasUrl = process.env.JOBS_GAS_URL;
  if (!gasUrl) return [];
  try {
    const res = await fetch(gasUrl, { cache: 'no-store' });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function KanbanPage() {
  const jobs = await getJobs();
  return <KanbanBoard initialJobs={jobs} />;
}
