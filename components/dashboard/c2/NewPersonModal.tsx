'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Props = { onClose: () => void };

const EMPLOYMENT_TYPES = [
  'FULL_TIME','PART_TIME','CASUAL','APPRENTICE','SUBCONTRACTOR',
  'LABOUR_HIRE','CONSULTANT','DIRECTOR',
];

export default function NewPersonModal({ onClose }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    full_name: '', email: '', phone: '', address: '',
    employment_type: 'FULL_TIME', start_date: '', notes: '',
  });

  function set(field: string, val: string) {
    setForm(f => ({ ...f, [field]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.full_name.trim()) { setError('Name is required'); return; }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/c2/people', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      router.refresh();
      onClose();
    } catch {
      setError('Network error — try again');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#202020] border border-[#2e2e2e] rounded-xl w-full max-w-lg">
        <div className="px-6 py-4 border-b border-[#2e2e2e] flex items-center justify-between">
          <h2 className="text-white font-semibold">Add Person</h2>
          <button onClick={onClose} className="text-[#555] hover:text-white transition-colors text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[#888] text-xs uppercase tracking-wider mb-1.5">Full Name <span className="text-[#ffd100]">*</span></label>
            <input value={form.full_name} onChange={e => set('full_name', e.target.value)} className="w-full bg-[#2a2a2a] border border-[#333] rounded-lg px-3 py-2 text-white text-sm placeholder:text-[#444] focus:outline-none focus:border-[#ffd100]" placeholder="Jesse Heffernan" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#888] text-xs uppercase tracking-wider mb-1.5">Phone</label>
              <input value={form.phone} onChange={e => set('phone', e.target.value)} className="w-full bg-[#2a2a2a] border border-[#333] rounded-lg px-3 py-2 text-white text-sm placeholder:text-[#444] focus:outline-none focus:border-[#ffd100]" placeholder="04xx xxx xxx" />
            </div>
            <div>
              <label className="block text-[#888] text-xs uppercase tracking-wider mb-1.5">Email</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} className="w-full bg-[#2a2a2a] border border-[#333] rounded-lg px-3 py-2 text-white text-sm placeholder:text-[#444] focus:outline-none focus:border-[#ffd100]" placeholder="name@example.com" />
            </div>
          </div>

          <div>
            <label className="block text-[#888] text-xs uppercase tracking-wider mb-1.5">Address</label>
            <input value={form.address} onChange={e => set('address', e.target.value)} className="w-full bg-[#2a2a2a] border border-[#333] rounded-lg px-3 py-2 text-white text-sm placeholder:text-[#444] focus:outline-none focus:border-[#ffd100]" placeholder="123 Smith St, Bendigo VIC 3550" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#888] text-xs uppercase tracking-wider mb-1.5">Employment Type</label>
              <select value={form.employment_type} onChange={e => set('employment_type', e.target.value)} className="w-full bg-[#2a2a2a] border border-[#333] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#ffd100]">
                {EMPLOYMENT_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[#888] text-xs uppercase tracking-wider mb-1.5">Start Date</label>
              <input type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} className="w-full bg-[#2a2a2a] border border-[#333] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#ffd100]" />
            </div>
          </div>

          <div>
            <label className="block text-[#888] text-xs uppercase tracking-wider mb-1.5">Notes</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} className="w-full bg-[#2a2a2a] border border-[#333] rounded-lg px-3 py-2 text-white text-sm placeholder:text-[#444] focus:outline-none focus:border-[#ffd100] resize-none" placeholder="Any additional notes…" />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-[#333] rounded-lg text-[#888] hover:text-white hover:border-[#555] transition-colors text-sm">Cancel</button>
            <button type="submit" disabled={saving || !form.full_name.trim()} className="flex-1 px-4 py-2 bg-[#ffd100] text-[#181818] font-semibold rounded-lg hover:bg-[#e6bc00] transition-colors text-sm disabled:opacity-50">
              {saving ? 'Adding…' : 'Add Person'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
