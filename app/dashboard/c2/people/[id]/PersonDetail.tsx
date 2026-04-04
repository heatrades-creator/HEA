'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DeployabilityBadge from '@/components/dashboard/c2/DeployabilityBadge';
import PersonStatusBadge from '@/components/dashboard/c2/PersonStatusBadge';

const EMPLOYMENT_TYPES = ['FULL_TIME','PART_TIME','CASUAL','APPRENTICE','SUBCONTRACTOR','LABOUR_HIRE','CONSULTANT','DIRECTOR'];
const STATUSES = ['CANDIDATE','ONBOARDING','PROBATION','ACTIVE','ACTIVE_RESTRICTED','LEAVE','MEDICAL_LEAVE','PARENTAL_LEAVE','SUSPENDED','PIP','DISCIPLINARY','TERMINATING','RESIGNED','TERMINATED','REDUNDANT','INACTIVE'];

type Person = Record<string, string | boolean | undefined>;

export default function PersonDetail({ person }: { person: Person }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [transitionError, setTransitionError] = useState('');

  const [fullName, setFullName] = useState(String(person.full_name ?? ''));
  const [email, setEmail] = useState(String(person.email ?? ''));
  const [phone, setPhone] = useState(String(person.phone ?? ''));
  const [address, setAddress] = useState(String(person.address ?? ''));
  const [employmentType, setEmploymentType] = useState(String(person.employment_type ?? 'FULL_TIME'));
  const [notes, setNotes] = useState(String(person.notes ?? ''));
  const [supervisorId, setSupervisorId] = useState(String(person.supervisor_id ?? ''));
  const [probationEndDate, setProbationEndDate] = useState(String(person.probation_end_date ?? ''));

  const [pendingStatus, setPendingStatus] = useState(String(person.status ?? 'ACTIVE'));

  async function save() {
    setSaving(true);
    try {
      await fetch(`/api/c2/people/${person.person_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName, email, phone, address, employment_type: employmentType, notes, supervisor_id: supervisorId, probation_end_date: probationEndDate }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function transitionStatus(newStatus: string) {
    setTransitionError('');
    try {
      const res = await fetch(`/api/c2/people/${person.person_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _transition: true, status: newStatus }),
      });
      const data = await res.json();
      if (data.error) { setTransitionError(data.error); return; }
      router.refresh();
    } catch {
      setTransitionError('Transition failed');
    }
  }

  return (
    <div className="bg-white rounded-xl border border-[#e5e9f0] overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-[#e5e9f0] flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <span className="font-mono text-[#ffd100] font-bold text-sm">{String(person.person_id).substring(0, 8)}…</span>
            <PersonStatusBadge status={String(person.status ?? '')} />
            <DeployabilityBadge value={String(person.deployability ?? 'FULL')} />
          </div>
          <h1 className="text-[#111827] text-xl font-semibold">{fullName}</h1>
          <p className="text-[#6b7280] text-sm mt-0.5">{(String(person.employment_type ?? '')).replace(/_/g, ' ')}</p>
        </div>
        <p className="text-[#6b7280] text-xs whitespace-nowrap">{String(person.created_at ?? '').substring(0, 10)}</p>
      </div>

      <div className="p-6 space-y-7">
        {/* Fields */}
        <div>
          <SectionHeader label="Personal Details" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextInput label="Full Name" value={fullName} onChange={setFullName} />
            <TextInput label="Phone" value={phone} onChange={setPhone} />
            <TextInput label="Email" value={email} onChange={setEmail} />
            <TextInput label="Address" value={address} onChange={setAddress} />
          </div>
        </div>

        {/* Employment */}
        <div>
          <SectionHeader label="Employment" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[#374151] text-xs uppercase tracking-wider mb-1.5">Employment Type</label>
              <select value={employmentType} onChange={e => setEmploymentType(e.target.value)} className="w-full bg-[#eef0f5] border border-[#e5e9f0] rounded-lg px-3 py-2 text-[#111827] text-sm focus:outline-none focus:border-[#ffd100]">
                {EMPLOYMENT_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <TextInput label="Supervisor ID" value={supervisorId} onChange={setSupervisorId} placeholder="person_id" />
            <TextInput label="Probation End Date" value={probationEndDate} onChange={setProbationEndDate} placeholder="YYYY-MM-DD" />
          </div>
        </div>

        {/* Status transition */}
        <div>
          <SectionHeader label="Status Transition" />
          <p className="text-[#6b7280] text-xs mb-3">Current: <span className="text-[#111827] font-medium">{String(person.status ?? '')}</span>. Select a new status — transitions are validated and audit-logged.</p>
          <div className="flex flex-wrap gap-2">
            {STATUSES.filter(s => s !== String(person.status ?? '').toUpperCase()).map(s => (
              <button key={s} onClick={() => transitionStatus(s)} className="px-3 py-1.5 border border-[#e5e9f0] rounded-lg text-xs text-[#6b7280] hover:border-[#555] hover:text-[#aaa] transition-colors">
                → {s.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
          {transitionError && <p className="text-red-400 text-xs mt-2">{transitionError}</p>}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-[#374151] text-xs uppercase tracking-wider mb-2">Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4} className="w-full bg-[#eef0f5] border border-[#e5e9f0] rounded-lg px-3 py-2 text-[#111827] text-sm placeholder:text-[#6b7280] focus:outline-none focus:border-[#ffd100] resize-none" />
        </div>

        <button onClick={save} disabled={saving} className="bg-[#ffd100] text-[#202020] font-semibold px-6 py-2.5 rounded-lg hover:bg-[#e6bc00] transition-colors disabled:opacity-50">
          {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <p className="text-[#374151] text-xs uppercase tracking-wider">{label}</p>
      <div className="flex-1 h-px bg-[#eef0f5]" />
    </div>
  );
}

function TextInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block text-[#374151] text-xs uppercase tracking-wider mb-1.5">{label}</label>
      <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full bg-[#eef0f5] border border-[#e5e9f0] rounded-lg px-3 py-2 text-[#111827] text-sm placeholder:text-[#6b7280] focus:outline-none focus:border-[#ffd100]" />
    </div>
  );
}
