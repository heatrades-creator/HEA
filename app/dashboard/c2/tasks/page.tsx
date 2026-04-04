import TaskList from '@/components/dashboard/c2/TaskList';

export const metadata = { title: 'Tasks | HEA Command' };

async function getTasks() {
  const url = process.env.C2_GAS_URL;
  if (!url) return [];
  try {
    const res = await fetch(`${url}?action=listTasks`, { next: { revalidate: 30 } });
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export default async function TasksPage() {
  const tasks = await getTasks();
  const openCount = tasks.filter((t: { status?: string }) => (t.status || 'OPEN').toUpperCase() === 'OPEN' || (t.status || '').toUpperCase() === 'IN_PROGRESS').length;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-white text-xl font-semibold">Tasks</h1>
        <p className="text-[#555] text-sm mt-0.5">
          {openCount > 0 ? `${openCount} open task${openCount !== 1 ? 's' : ''} — ${tasks.length} total` : 'All tasks — automated and manual'}
        </p>
      </div>
      <TaskList initialTasks={tasks} />
    </div>
  );
}
