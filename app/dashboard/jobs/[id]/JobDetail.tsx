'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import JobDocuments from '@/components/dashboard/JobDocuments';

const STAGES = ['Lead', 'Quoted', 'Booked', 'In Progress', 'Complete'] as const;

const STAGE_COLORS: Record<string, string> = {
  Lead:          'bg-[#3a3a3a] text-[#aaa]',
  Quoted:        'bg-blue-900/40 text-blue-300',
  Booked:        'bg-purple-900/40 text-purple-300',
  'In Progress': 'bg-yellow-900/40 text-[#ffd100]',
  Complete:      'bg-green-900/40 text-green-400',
};

export default function JobDetail({ job }: { job: any }) {
  const router = useRouter();

  // Core fields
  const [status, setStatus]   = useState(job.status);
  const [notes, setNotes]     = useState(job.notes ?? '');
  const [driveUrl, setDriveUrl] = useState(job.driveUrl ?? '');

  // Solar system fields
  const [systemSize, setSystemSize]       = useState(job.systemSize ?? '');
  const [batterySize, setBatterySize]     = useState(job.batterySize ?? '');
  const [totalPrice, setTotalPrice]       = useState(job.totalPrice ?? '');
  const [annualBill, setAnnualBill]       = useState(job.annualBill ?? '');
  const [financeRequired, setFinanceRequired] = useState<boolean>(
    job.financeRequired === true || job.financeRequired === 'TRUE' || job.financeRequired === 'true'
  );

  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  async function save() {
    setSaving(true);
    try {
      await fetch(`/api/jobs/${job.jobNumber}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          notes,
          driveUrl,
          systemSize,
          batterySize,
          totalPrice,
          annualBill,
          financeRequired,
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-[#e5e9f0] overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-[#e5e9f0] flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-[#ffd100] font-mono font-bold text-lg">{job.jobNumber}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STAGE_COLORS[status] ?? 'bg-[#3a3a3a] text-[#aaa]'}`}>
              {status}
            </span>
          </div>
          <h1 className="text-[#111827] text-xl font-semibold">{job.clientName}</h1>
          {job.address && <p className="text-[#6b7280] text-sm mt-0.5">{job.address}</p>}
        </div>
        <p className="text-[#6b7280] text-xs whitespace-nowrap">{job.createdDate}</p>
      </div>

      <div className="p-6 space-y-7">
        {/* Contact info (read-only) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ReadField label="Phone" value={job.phone} href={`tel:${job.phone}`} />
          <ReadField label="Email" value={job.email} href={`mailto:${job.email}`} />
        </div>

        {/* Stage selector */}
        <div>
          <label className="block text-[#374151] text-xs uppercase tracking-wider mb-2">Stage</label>
          <div className="flex flex-wrap gap-2">
            {STAGES.map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                  status === s
                    ? 'border-[#ffd100] text-[#ffd100] bg-[#ffd100]/10'
                    : 'border-[#e5e9f0] text-[#6b7280] hover:border-[#555] hover:text-[#aaa]'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* ── System Details ── */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <p className="text-[#374151] text-xs uppercase tracking-wider">System Details</p>
            <div className="flex-1 h-px bg-[#eef0f5]" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
            <TextInput
              label="System Size (kW)"
              value={systemSize}
              onChange={setSystemSize}
              placeholder="e.g. 6.6"
            />
            <TextInput
              label="Battery Size (kWh)"
              value={batterySize}
              onChange={setBatterySize}
              placeholder="e.g. 10"
            />
            <TextInput
              label="Quote Value ($)"
              value={totalPrice}
              onChange={setTotalPrice}
              placeholder="e.g. 12500"
            />
            <TextInput
              label="Est. Annual Bill ($)"
              value={annualBill}
              onChange={setAnnualBill}
              placeholder="e.g. 2400"
            />
          </div>
          <label className="inline-flex items-center gap-2.5 cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={financeRequired}
                onChange={(e) => setFinanceRequired(e.target.checked)}
              />
              <div className="w-9 h-5 bg-[#eef0f5] border border-[#e5e9f0] rounded-full peer-checked:bg-[#ffd100] transition-colors" />
              <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-[#555] rounded-full peer-checked:translate-x-4 peer-checked:bg-[#f1f3f8] transition-all" />
            </div>
            <span className="text-[#374151] text-xs uppercase tracking-wider">Finance Required</span>
          </label>
        </div>

        {/* Drive URL */}
        <div>
          <label className="block text-[#374151] text-xs uppercase tracking-wider mb-2">
            Google Drive Folder
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              value={driveUrl}
              onChange={(e) => setDriveUrl(e.target.value)}
              placeholder="https://drive.google.com/drive/folders/…"
              className="flex-1 bg-[#eef0f5] border border-[#e5e9f0] rounded-lg px-3 py-2 text-[#111827] text-sm placeholder:text-[#6b7280] focus:outline-none focus:border-[#ffd100]"
            />
            {driveUrl && (
              <a
                href={driveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 bg-[#eef0f5] border border-[#e5e9f0] rounded-lg text-[#6b7280] hover:text-[#ffd100] hover:border-[#ffd100] transition-colors text-sm"
              >
                Open ↗
              </a>
            )}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-[#374151] text-xs uppercase tracking-wider mb-2">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={5}
            className="w-full bg-[#eef0f5] border border-[#e5e9f0] rounded-lg px-3 py-2 text-[#111827] text-sm placeholder:text-[#6b7280] focus:outline-none focus:border-[#ffd100] resize-none"
            placeholder="Job notes, site details, equipment, special requirements…"
          />
        </div>

        {/* Save */}
        <button
          onClick={save}
          disabled={saving}
          className="bg-[#ffd100] text-[#202020] font-semibold px-6 py-2.5 rounded-lg hover:bg-[#e6bc00] transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save Changes'}
        </button>

        {/* Document generation */}
        <JobDocuments jobNumber={job.jobNumber} />
      </div>
    </div>
  );
}

function ReadField({ label, value, href }: { label: string; value?: string; href?: string }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-[#374151] text-xs uppercase tracking-wider mb-1">{label}</p>
      {href ? (
        <a href={href} className="text-white hover:text-[#ffd100] transition-colors text-sm">
          {value}
        </a>
      ) : (
        <p className="text-[#111827] text-sm">{value}</p>
      )}
    </div>
  );
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-[#374151] text-xs uppercase tracking-wider mb-1.5">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-[#eef0f5] border border-[#e5e9f0] rounded-lg px-3 py-2 text-[#111827] text-sm placeholder:text-[#6b7280] focus:outline-none focus:border-[#ffd100]"
      />
    </div>
  );
}
