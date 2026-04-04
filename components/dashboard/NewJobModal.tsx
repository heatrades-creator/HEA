'use client';

import { useState } from 'react';
import type { Job } from './KanbanBoard';

export default function NewJobModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (job: Job) => void;
}) {
  const [form, setForm] = useState({
    clientName: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.clientName.trim()) { setError('Client name is required.'); return; }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed to create job');
      const job = await res.json();
      onCreated(job);
    } catch {
      setError('Something went wrong. Please try again.');
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-[#e5e9f0] rounded-xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e9f0]">
          <h2 className="text-[#111827] font-semibold">New Job</h2>
          <button onClick={onClose} className="text-[#6b7280] hover:text-[#111827] transition-colors text-xl leading-none">
            ×
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          <Input label="Client Name *" value={form.clientName} onChange={(v) => set('clientName', v)} placeholder="Jane Smith" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Phone" value={form.phone} onChange={(v) => set('phone', v)} placeholder="04xx xxx xxx" />
            <Input label="Email" value={form.email} onChange={(v) => set('email', v)} placeholder="jane@example.com" type="email" />
          </div>
          <Input label="Address" value={form.address} onChange={(v) => set('address', v)} placeholder="12 Example St, Bendigo VIC 3550" />
          <div>
            <label className="block text-[#374151] text-xs uppercase tracking-wider mb-1.5">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              rows={3}
              className="w-full bg-[#eef0f5] border border-[#e5e9f0] rounded-lg px-3 py-2 text-[#111827] text-sm placeholder:text-[#6b7280] focus:outline-none focus:border-[#ffd100] resize-none"
              placeholder="Initial notes..."
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-[#e5e9f0] text-[#6b7280] py-2.5 rounded-lg hover:border-[#555] hover:text-[#111827] transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-[#ffd100] text-[#202020] font-semibold py-2.5 rounded-lg hover:bg-[#e6bc00] transition-colors disabled:opacity-50 text-sm"
            >
              {saving ? 'Creating…' : 'Create Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-[#374151] text-xs uppercase tracking-wider mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-[#eef0f5] border border-[#e5e9f0] rounded-lg px-3 py-2 text-[#111827] text-sm placeholder:text-[#6b7280] focus:outline-none focus:border-[#ffd100]"
      />
    </div>
  );
}
