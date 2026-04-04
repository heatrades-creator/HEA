'use client';

import { useEffect, useState } from 'react';
import TaskList from '@/components/dashboard/c2/TaskList';
import { getCached, setCached } from '@/lib/c2Cache';

export default function TasksPage() {
  const [tasks, setTasks] = useState<unknown[]>(() => getCached('tasks') ?? []);
  const [loading, setLoading] = useState(!getCached('tasks'));

  useEffect(() => {
    if (getCached('tasks')) return;
    fetch('/api/c2/tasks')
      .then(r => r.json())
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setCached('tasks', list);
        setTasks(list);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const openCount = (tasks as { status?: string }[]).filter(t =>
    ['OPEN', 'IN_PROGRESS'].includes((t.status || 'OPEN').toUpperCase())
  ).length;

  if (loading) return (
    <div className="p-6 max-w-3xl mx-auto animate-pulse">
      <div className="mb-6"><div className="h-6 w-20 bg-gray-200 rounded mb-2" /><div className="h-4 w-44 bg-gray-100 rounded" /></div>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
            <div className="h-4 w-64 bg-gray-200 rounded" />
            <div className="h-5 w-12 bg-gray-200 rounded-full ml-4" />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-[#111827] text-xl font-semibold">Tasks</h1>
        <p className="text-[#6b7280] text-sm mt-0.5">
          {openCount > 0 ? `${openCount} open task${openCount !== 1 ? 's' : ''} — ${tasks.length} total` : 'All tasks — automated and manual'}
        </p>
      </div>
      <TaskList initialTasks={tasks} />
    </div>
  );
}
