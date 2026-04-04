'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Task = {
  task_id: string;
  title: string;
  description?: string;
  assigned_to?: string;
  entity_type?: string;
  entity_id?: string;
  due_date?: string;
  priority?: string;
  status?: string;
  trigger_key?: string;
};

const PRIORITY_STYLES: Record<string, string> = {
  URGENT: 'bg-red-100 text-red-700',
  HIGH:   'bg-orange-100 text-orange-700',
  MEDIUM: 'bg-yellow-100 text-yellow-700',
  LOW:    'bg-gray-100 text-gray-600',
};

export default function TaskList({ initialTasks }: { initialTasks: Task[] }) {
  const router = useRouter();
  const [tasks, setTasks] = useState(initialTasks);
  const [filter, setFilter] = useState('OPEN');

  const filtered = tasks.filter(t => {
    if (filter === 'ALL') return true;
    return (t.status || 'OPEN').toUpperCase() === filter;
  });

  async function markDone(taskId: string) {
    setTasks(ts => ts.map(t => t.task_id === taskId ? { ...t, status: 'DONE' } : t));
    await fetch(`/api/c2/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'DONE' }),
    });
    router.refresh();
  }

  async function markOpen(taskId: string) {
    setTasks(ts => ts.map(t => t.task_id === taskId ? { ...t, status: 'OPEN' } : t));
    await fetch(`/api/c2/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'OPEN' }),
    });
    router.refresh();
  }

  const openCount = tasks.filter(t => (t.status || 'OPEN').toUpperCase() === 'OPEN' || (t.status || '').toUpperCase() === 'IN_PROGRESS').length;

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        {['OPEN','DONE','ALL'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${filter === f ? 'bg-[#ffd100]/15 text-[#ffd100] border border-[#ffd100]/30' : 'text-[#6b7280] hover:text-[#6b7280] border border-transparent'}`}>
            {f === 'OPEN' ? `Open (${openCount})` : f}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="bg-white border border-[#e5e9f0] rounded-xl p-8 text-center">
            <p className="text-[#6b7280] text-sm">{filter === 'OPEN' ? 'No open tasks — all clear.' : 'No tasks.'}</p>
          </div>
        )}
        {filtered.map(t => {
          const isDone = (t.status || '').toUpperCase() === 'DONE';
          const priorityStyle = PRIORITY_STYLES[(t.priority || 'MEDIUM').toUpperCase()] ?? PRIORITY_STYLES.MEDIUM;
          const isOverdue = t.due_date && new Date(t.due_date) < new Date() && !isDone;

          return (
            <div key={t.task_id} className={`bg-white border rounded-xl px-4 py-3 flex items-start gap-3 ${isDone ? 'border-[#edf0f5] opacity-50' : 'border-[#e5e9f0]'}`}>
              <button
                onClick={() => isDone ? markOpen(t.task_id) : markDone(t.task_id)}
                className={`mt-0.5 w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${isDone ? 'bg-green-100 border-green-400 text-green-600' : 'border-gray-300 hover:border-[#ffd100]'}`}
              >
                {isDone && <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${isDone ? 'line-through text-[#6b7280]' : 'text-[#111827]'}`}>{t.title}</p>
                {t.description && <p className="text-[#6b7280] text-xs mt-0.5 truncate">{t.description}</p>}
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${priorityStyle}`}>{t.priority || 'MEDIUM'}</span>
                  {t.due_date && (
                    <span className={`text-xs ${isOverdue ? 'text-red-400' : 'text-[#6b7280]'}`}>
                      Due {String(t.due_date).substring(0, 10)}{isOverdue ? ' — OVERDUE' : ''}
                    </span>
                  )}
                  {t.trigger_key && <span className="text-[#333] text-xs font-mono">{t.trigger_key}</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
