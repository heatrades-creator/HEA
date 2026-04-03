'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import JobDocuments from '@/components/dashboard/JobDocuments';

const STAGES = ['Lead', 'Quoted', 'Booked', 'In Progress', 'Complete'] as const;

const STAGE_COLORS: Record<string, string> = {
  Lead: 'bg-[#3a3a3a] text-[#aaa]',
  Quoted: 'bg-blue-900/40 text-blue-300',
  Booked: 'bg-purple-900/40 text-purple-300',
  'In Progress': 'bg-yellow-900/40 text-[#ffd100]',
  Complete: 'bg-green-900/40 text-green-400',
};

export default function JobDetail({ job }: { job: any }) {
  const router = useRouter();
  const [status, setStatus] = useState(job.status);
  const [notes, setNotes] = useState(job.notes ?? '');
  const [driveUrl, setDriveUrl] = useState(job.driveUrl ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await fetch(`/api/jobs/${job.jobNumber}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes, driveUrl }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-[#202020] rounded-xl border border-[#2e2e2e] overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-[#2e2e2e] flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-[#ffd100] font-mono font-bold text-lg">{job.jobNumber}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STAGE_COLORS[status] ?? 'bg-[#3a3a3a] text-[#aaa]'}`}>
              {status}
            </span>
          </div>
          <h1 className="text-white text-xl font-semibold">{job.clientName}</h1>
          {job.address && <p className="text-[#888] text-sm mt-0.5">{job.address}</p>}
        </div>
        <p className="text-[#555] text-xs whitespace-nowrap">{job.createdDate}</p>
      </div>

      <div className="p-6 space-y-6">
        {/* Contact */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Phone" value={job.phone} href={`tel:${job.phone}`} />
          <Field label="Email" value={job.email} href={`mailto:${job.email}`} />
        </div>

        {/* Stage selector */}
        <div>
          <label className="block text-[#888] text-xs uppercase tracking-wider mb-2">Stage</label>
          <div className="flex flex-wrap gap-2">
            {STAGES.map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                  status === s
                    ? 'border-[#ffd100] text-[#ffd100] bg-[#ffd100]/10'
                    : 'border-[#333] text-[#666] hover:border-[#555] hover:text-[#aaa]'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Drive URL */}
        <div>
          <label className="block text-[#888] text-xs uppercase tracking-wider mb-2">
            Google Drive Folder URL
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              value={driveUrl}
              onChange={(e) => setDriveUrl(e.target.value)}
              placeholder="https://drive.google.com/drive/folders/..."
              className="flex-1 bg-[#2a2a2a] border border-[#333] rounded-lg px-3 py-2 text-white text-sm placeholder:text-[#444] focus:outline-none focus:border-[#ffd100]"
            />
            {driveUrl && (
              <a
                href={driveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 bg-[#2a2a2a] border border-[#333] rounded-lg text-[#888] hover:text-[#ffd100] hover:border-[#ffd100] transition-colors text-sm"
              >
                Open ↗
              </a>
            )}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-[#888] text-xs uppercase tracking-wider mb-2">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={5}
            className="w-full bg-[#2a2a2a] border border-[#333] rounded-lg px-3 py-2 text-white text-sm placeholder:text-[#444] focus:outline-none focus:border-[#ffd100] resize-none"
            placeholder="Job notes, site details, equipment..."
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

function Field({ label, value, href }: { label: string; value?: string; href?: string }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-[#888] text-xs uppercase tracking-wider mb-1">{label}</p>
      {href ? (
        <a href={href} className="text-white hover:text-[#ffd100] transition-colors text-sm">
          {value}
        </a>
      ) : (
        <p className="text-white text-sm">{value}</p>
      )}
    </div>
  );
}
