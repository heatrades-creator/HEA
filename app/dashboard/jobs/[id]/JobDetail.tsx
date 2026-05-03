'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import JobDocuments from '@/components/dashboard/JobDocuments';
import { JobComments } from '@/components/dashboard/JobComments';

const STAGES = ['Lead', 'Quoted', 'Booked', 'In Progress', 'Complete'] as const;

const STAGE_COLORS: Record<string, string> = {
  Lead:          'bg-[#3a3a3a] text-[#aaa]',
  Quoted:        'bg-blue-900/40 text-blue-300',
  Booked:        'bg-purple-900/40 text-purple-300',
  'In Progress': 'bg-yellow-900/40 text-[#ffd100]',
  Complete:      'bg-green-900/40 text-green-400',
};

const MILESTONE_LABELS: Record<string, string> = {
  deposit:    '10% Deposit',
  completion: '80% Completion',
  esv:        '10% ESV Certificate',
};

export default function JobDetail({ job, paymentStatus, paymentMilestone }: { job: any; paymentStatus?: string; paymentMilestone?: string }) {
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

  // Site info fields (shown in installer app)
  const [wifiSsid, setWifiSsid]       = useState(job.wifiSsid ?? '');
  const [wifiPassword, setWifiPassword] = useState(job.wifiPassword ?? '');
  const [epsCircuit1, setEpsCircuit1]   = useState(job.epsCircuit1 ?? '');
  const [epsCircuit2, setEpsCircuit2]   = useState(job.epsCircuit2 ?? '');
  const [epsCircuit3, setEpsCircuit3]   = useState(job.epsCircuit3 ?? '');

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
          wifiSsid,
          wifiPassword,
          epsCircuit1,
          epsCircuit2,
          epsCircuit3,
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
    <div className="space-y-4">
      {/* Payment result banners */}
      {paymentStatus === 'success' && (
        <div className="bg-green-50 border border-green-300 rounded-xl px-5 py-4 flex items-center gap-3">
          <span className="text-2xl">✅</span>
          <div>
            <p className="text-green-800 font-semibold text-sm">Payment received!</p>
            <p className="text-green-700 text-xs mt-0.5">
              {paymentMilestone ? MILESTONE_LABELS[paymentMilestone] ?? paymentMilestone : 'Payment'} was completed successfully by the client.
            </p>
          </div>
        </div>
      )}
      {paymentStatus === 'cancelled' && (
        <div className="bg-yellow-50 border border-yellow-300 rounded-xl px-5 py-3">
          <p className="text-yellow-800 text-sm font-medium">Payment was cancelled — the Stripe link is still valid if the client wants to try again.</p>
        </div>
      )}

    <div className="bg-white rounded-xl border border-[#e5e9f0] overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-[#e5e9f0]">
        <div className="flex items-start justify-between gap-4 mb-4">
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
        {/* Contact strip — always visible */}
        <div className="flex flex-wrap gap-3">
          {job.phone && (
            <a href={`tel:${job.phone}`}
              className="inline-flex items-center gap-1.5 text-sm text-[#111827] font-medium bg-[#f5f7fa] border border-[#e5e9f0] rounded-lg px-3 py-1.5 hover:border-[#ffd100] transition-colors">
              📞 {job.phone}
            </a>
          )}
          {job.email && (
            <a href={`mailto:${job.email}`}
              className="inline-flex items-center gap-1.5 text-sm text-[#111827] font-medium bg-[#f5f7fa] border border-[#e5e9f0] rounded-lg px-3 py-1.5 hover:border-[#ffd100] transition-colors">
              ✉️ {job.email}
            </a>
          )}
          {!job.phone && !job.email && (
            <p className="text-xs text-[#9ca3af] italic">No contact details on file</p>
          )}
        </div>
      </div>

      <div className="p-6 space-y-7">

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

        {/* ── Site Info (shown in installer app) ── */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <p className="text-[#374151] text-xs uppercase tracking-wider">Site Info</p>
            <div className="flex-1 h-px bg-[#eef0f5]" />
            <p className="text-[#9ca3af] text-xs">Visible in installer app</p>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <TextInput label="WiFi Network (SSID)" value={wifiSsid} onChange={setWifiSsid} placeholder="e.g. SmithHouseWifi" />
            <TextInput label="WiFi Password" value={wifiPassword} onChange={setWifiPassword} placeholder="e.g. hunter2" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <TextInput label="EPS Circuit 1" value={epsCircuit1} onChange={setEpsCircuit1} placeholder="e.g. Fridge" />
            <TextInput label="EPS Circuit 2" value={epsCircuit2} onChange={setEpsCircuit2} placeholder="e.g. Lights" />
            <TextInput label="EPS Circuit 3" value={epsCircuit3} onChange={setEpsCircuit3} placeholder="e.g. Wifi" />
          </div>
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

        {/* ── Payments ── */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <p className="text-[#374151] text-xs uppercase tracking-wider">Payments</p>
            <div className="flex-1 h-px bg-[#eef0f5]" />
          </div>
          <p className="text-[#6b7280] text-xs mb-3">Payment schedule: 10% deposit → 80% on completion → 10% after ESV certificate</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <PaymentMilestone
              label="10% Deposit"
              description="Ordered and delivered to site"
              milestone="deposit"
              jobNumber={job.jobNumber}
              totalPrice={totalPrice}
              clientEmail={job.email}
              clientName={job.clientName}
              paid={job.depositPaidAt}
            />
            <PaymentMilestone
              label="80% Completion"
              description="Works complete"
              milestone="completion"
              jobNumber={job.jobNumber}
              totalPrice={totalPrice}
              clientEmail={job.email}
              clientName={job.clientName}
              paid={job.completionPaidAt}
            />
            <PaymentMilestone
              label="10% ESV Certificate"
              description="After ESV cert returned"
              milestone="esv"
              jobNumber={job.jobNumber}
              totalPrice={totalPrice}
              clientEmail={job.email}
              clientName={job.clientName}
              paid={job.esvPaidAt}
            />
          </div>
        </div>

        {/* Field notes from installers */}
        <JobComments jobNumber={job.jobNumber} />

        {/* Document generation */}
        <JobDocuments jobNumber={job.jobNumber} />
      </div>
    </div>
    </div>
  );
}

function PaymentMilestone({
  label, description, milestone, jobNumber, totalPrice, clientEmail, clientName, paid,
}: {
  label: string; description: string; milestone: string;
  jobNumber: string; totalPrice?: string; clientEmail?: string; clientName?: string;
  paid?: string | null;
}) {
  const [sending, setSending]   = useState(false);
  const [result, setResult]     = useState<{ url: string; emailSent: boolean; amount: string; emailError?: string } | null>(null);
  const [error, setError]       = useState('');

  const total = totalPrice ? parseFloat(String(totalPrice).replace(/[^0-9.]/g, '')) : 0;
  const pct   = milestone === 'completion' ? 0.80 : 0.10;
  const amount = total > 0
    ? new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(total * pct)
    : null;

  async function sendLink() {
    setSending(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobNumber, milestone, totalPrice, clientEmail, clientName }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setResult({ url: data.url, emailSent: data.emailSent, amount: data.amount, emailError: data.emailError });
      } else {
        setError(data.error ?? 'Failed — check Stripe config in Vercel');
      }
    } catch {
      setError('Network error — check your connection');
    }
    setSending(false);
  }

  const canSend = !!clientEmail && total > 0;

  return (
    <div className={`rounded-xl border p-4 ${paid ? 'border-green-300 bg-green-50' : 'border-[#e5e9f0] bg-[#f9fafb]'}`}>
      <p className={`text-sm font-semibold mb-0.5 ${paid ? 'text-green-800' : 'text-[#374151]'}`}>{label}</p>
      <p className="text-xs text-[#6b7280] mb-2">{description}</p>
      {amount && !paid && (
        <p className="text-base font-bold text-[#111827] mb-1">{amount}</p>
      )}
      {clientEmail && !paid && (
        <p className="text-[11px] text-[#9ca3af] mb-3">→ {clientEmail}</p>
      )}
      {paid ? (
        <p className="text-xs text-green-700 font-medium">✓ Paid {new Date(paid).toLocaleDateString('en-AU')}</p>
      ) : result ? (
        <div className="space-y-2">
          {result.emailSent ? (
            <p className="text-xs text-green-700 font-semibold">✅ Email sent to {clientEmail}</p>
          ) : (
            <>
              <p className="text-xs text-orange-600 font-semibold">⚠️ Link created but email failed — copy link below</p>
              {result.emailError && (
                <p className="text-[10px] text-red-500 mt-0.5">{result.emailError}</p>
              )}
            </>
          )}
          <p className="text-[10px] text-[#6b7280]">Saved to client Drive folder automatically.</p>
          <a href={result.url} target="_blank" rel="noopener noreferrer"
            className="block text-[10px] text-blue-600 underline break-all">
            {result.url}
          </a>
          <button onClick={() => { navigator.clipboard.writeText(result.url); }}
            className="text-[10px] text-[#6b7280] hover:text-[#111827] underline">
            Copy link
          </button>
        </div>
      ) : (
        <>
          <button
            onClick={sendLink}
            disabled={sending || !canSend}
            title={!clientEmail ? 'No client email on file' : !total ? 'Save a Quote Value first' : 'Create Stripe link and email to client'}
            className="inline-block bg-[#ffd100] text-[#111827] text-xs font-bold px-4 py-2 rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? '⏳ Creating…' : 'Send Payment Link →'}
          </button>
          {error && (
            <p className="text-red-500 text-[11px] mt-1.5 leading-snug">{error}</p>
          )}
          {!clientEmail && <p className="text-[#9ca3af] text-[11px] mt-1.5">No email on file</p>}
          {!total && !error && <p className="text-[#9ca3af] text-[11px] mt-1.5">Set Quote Value to calculate</p>}
        </>
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
