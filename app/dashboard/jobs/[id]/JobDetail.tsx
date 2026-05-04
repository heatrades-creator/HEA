'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import JobDocuments from '@/components/dashboard/JobDocuments';
import { formatHEADate } from '@/lib/format';
import { JobComments } from '@/components/dashboard/JobComments';
import OpenSolarPanel from '@/components/dashboard/OpenSolarPanel';

const STAGE_COLORS: Record<string, string> = {
  Lead:          'bg-gray-100 text-gray-600',
  Estimation:    'bg-blue-100 text-blue-700',
  Contract:      'bg-orange-100 text-orange-700',
  Booked:        'bg-purple-100 text-purple-700',
  'In Progress': 'bg-amber-100 text-amber-900',
  Complete:      'bg-green-100 text-green-700',
};

type WorkflowTask = {
  id: string;
  emoji: string;
  label: string;
  detail?: string;
  autoKey?: 'nmi' | 'openSolar';
  informational?: boolean;
  links?: Array<{ label: string; href: string }>;
};

const STAGE_WORKFLOW: Record<string, {
  bg: string; border: string; nextStage: string | null; autoAdvances: boolean; tasks: WorkflowTask[];
}> = {
  Lead: {
    bg: 'bg-gray-50', border: 'border-gray-200', nextStage: 'Estimation', autoAdvances: true,
    tasks: [
      {
        id: 'bill_nmi', emoji: '📄',
        label: 'Electricity bill viewed & NMI uploaded to PowerCor',
        detail: 'Download detailed NMI data → save to client Drive NMI folder',
        autoKey: 'nmi',
        links: [{ label: 'PowerCor Portal ↗', href: 'https://energyeasy.ue.com.au' }],
      },
      {
        id: 'opensolar', emoji: '🔆',
        label: 'System pre-designed on OpenSolar',
        links: [{ label: 'Open OpenSolar ↗', href: 'https://app.opensolar.com/220067/projects' }],
      },
      {
        id: 'analyser', emoji: '☀️',
        label: 'HEA Solar Analyser run — system size & payback period designed',
        detail: 'Estimation may be signed here on the spot',
        autoKey: 'estimation',
      },
    ],
  },
  Estimation: {
    bg: 'bg-blue-50', border: 'border-blue-200', nextStage: 'Contract', autoAdvances: true,
    tasks: [
      {
        id: 'estimation_signed', emoji: '✍️',
        label: 'Estimation accepted & contract signed',
        detail: 'Turns the estimation into a formal contract/quote',
      },
    ],
  },
  Contract: {
    bg: 'bg-orange-50', border: 'border-orange-200', nextStage: 'Booked', autoAdvances: true,
    tasks: [
      { id: 'deposit_paid', emoji: '💰', label: '10% system deposit paid by client' },
      {
        id: 'materials_ordered', emoji: '📦',
        label: 'Materials ordered & delivered to site',
        detail: 'To storage or client\'s address, prior to installation date',
      },
    ],
  },
  Booked: {
    bg: 'bg-purple-50', border: 'border-purple-200', nextStage: 'In Progress', autoAdvances: false,
    tasks: [
      {
        id: 'install_date', emoji: '📅', informational: true,
        label: 'Awaiting installation date — installers will mark on-site via the app',
        detail: 'Stage advances automatically when installers check in via the installer app',
      },
    ],
  },
  'In Progress': {
    bg: 'bg-amber-50', border: 'border-amber-300', nextStage: 'Complete', autoAdvances: false,
    tasks: [
      {
        id: 'installing', emoji: '🔨', informational: true,
        label: 'Installers currently on-site installing the system',
        detail: 'Stage advances automatically when installers mark the job complete in the app',
      },
    ],
  },
  Complete: {
    bg: 'bg-green-50', border: 'border-green-200', nextStage: null, autoAdvances: false,
    tasks: [
      { id: 'installer_complete', emoji: '✅', label: 'Installers marked job complete in app' },
      { id: 'invoice_80', emoji: '📧', label: 'Invoice for 80% of system cost sent to client', detail: 'Use the Payments section below' },
      { id: 'esv_booked', emoji: '🔍', label: 'ESV (Energy Safe Victoria) electrical inspection date booked' },
      { id: 'coes_received', emoji: '📋', label: 'COES (Certificate of Electrical Safety) received from ESV' },
      { id: 'invoice_10', emoji: '💰', label: 'Final 10% invoiced to client — job auto-archives on full payment', detail: 'Use the Payments section below' },
    ],
  },
};

const MILESTONE_LABELS: Record<string, string> = {
  deposit:    '10% Deposit',
  completion: '80% Completion',
  esv:        '10% ESV Certificate',
};

export default function JobDetail({ job, paymentStatus, paymentMilestone }: { job: any; paymentStatus?: string; paymentMilestone?: string }) {
  const router = useRouter();
  const advancingRef = useRef(false);

  // Core fields
  const [status, setStatus]   = useState<string>(job.status);
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

  // Workflow checklist state
  const [tasksDone, setTasksDone]       = useState<Record<string, boolean>>({});
  const [autoDetected, setAutoDetected] = useState<{ nmi: boolean; estimation: boolean }>({ nmi: false, estimation: false });

  // Load per-job checklist state from localStorage
  useEffect(() => {
    const workflow = STAGE_WORKFLOW[status];
    if (!workflow) return;
    const loaded: Record<string, boolean> = {};
    for (const task of workflow.tasks) {
      loaded[task.id] = localStorage.getItem(`hea_task_${job.jobNumber}_${task.id}`) === 'true';
    }
    setTasksDone(loaded);
  }, [status, job.jobNumber]);

  // Auto-detect NMI and estimation files for Lead stage (polls every 30s)
  useEffect(() => {
    if (status !== 'Lead') { setAutoDetected({ nmi: false, estimation: false }); return; }
    let cancelled = false;
    async function check() {
      try {
        const [nmiRes, estRes] = await Promise.all([
          fetch(`/api/dashboard/pipeline/check-nmi?jobNumber=${job.jobNumber}`),
          fetch(`/api/dashboard/pipeline/check-estimation?jobNumber=${job.jobNumber}`),
        ]);
        const [nmiData, estData] = await Promise.all([nmiRes.json(), estRes.json()]);
        if (!cancelled) setAutoDetected({ nmi: !!nmiData.hasNMI, estimation: !!estData.hasEstimation });
      } catch {}
    }
    check();
    const interval = setInterval(check, 30000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [status, job.jobNumber]);

  // Auto-advance stage when all checklist tasks are done
  useEffect(() => {
    const workflow = STAGE_WORKFLOW[status];
    if (!workflow?.autoAdvances || !workflow.nextStage || advancingRef.current) return;
    const allDone = workflow.tasks.every((t) => {
      if (t.informational) return true;
      if (t.autoKey === 'nmi') return autoDetected.nmi;
      if (t.autoKey === 'estimation') return autoDetected.estimation;
      return tasksDone[t.id] ?? false;
    });
    if (!allDone) return;
    advancingRef.current = true;
    const nextStage = workflow.nextStage;
    fetch(`/api/jobs/${job.jobNumber}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStage }),
    }).then(() => {
      setStatus(nextStage);
      advancingRef.current = false;
      router.refresh();
    }).catch(() => { advancingRef.current = false; });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasksDone, autoDetected]);

  function toggleTask(taskId: string, done: boolean) {
    localStorage.setItem(`hea_task_${job.jobNumber}_${taskId}`, String(done));
    setTasksDone((prev) => ({ ...prev, [taskId]: done }));
  }

  const analyserUrl = `/solar-analyser?${new URLSearchParams({
    name: job.clientName, email: job.email ?? '', phone: job.phone ?? '',
    address: job.address ?? '', annualBill: job.annualBill ?? '',
    driveUrl: job.driveUrl ?? '',
  }).toString()}`;

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
          <p className="text-[#6b7280] text-xs whitespace-nowrap">{formatHEADate(job.createdDate)}</p>
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

        {/* ── Stage Workflow Checklist ── */}
        {(() => {
          const workflow = STAGE_WORKFLOW[status];
          if (!workflow) return null;
          const { bg, border, nextStage, autoAdvances, tasks } = workflow;
          const allDone = tasks.every((t) => {
            if (t.informational) return true;
            if (t.autoKey === 'nmi') return autoDetected.nmi;
            if (t.autoKey === 'estimation') return autoDetected.estimation;
            return tasksDone[t.id] ?? false;
          });
          return (
            <div className={`rounded-xl border ${border} ${bg} p-4`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${STAGE_COLORS[status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {status}
                  </span>
                  {nextStage && (
                    <span className="text-[#9ca3af] text-xs">
                      → next: <span className={`font-medium px-1.5 py-0.5 rounded-full text-[11px] ${STAGE_COLORS[nextStage] ?? ''}`}>{nextStage}</span>
                    </span>
                  )}
                  {!nextStage && <span className="text-[#9ca3af] text-xs">— final stage</span>}
                </div>
                {autoAdvances && allDone && (
                  <span className="text-[11px] text-green-700 font-semibold bg-green-100 px-2 py-0.5 rounded-full">
                    ✓ Advancing…
                  </span>
                )}
              </div>

              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af] mb-2">
                What needs to be done
              </p>

              <div className="space-y-3">
                {tasks.map((task) => {
                  const isDone = task.informational ? false
                    : task.autoKey === 'nmi' ? autoDetected.nmi
                    : task.autoKey === 'estimation' ? autoDetected.estimation
                    : (tasksDone[task.id] ?? false);
                  const isAuto = !!task.autoKey;

                  const taskLinks = [
                    ...(task.links ?? []),
                    ...(task.id === 'analyser' ? [{ label: 'Solar Analyser ↗', href: analyserUrl }] : []),
                    ...(task.autoKey === 'nmi' && job.driveUrl ? [{ label: 'Drive Folder ↗', href: job.driveUrl }] : []),
                  ];

                  return (
                    <div key={task.id} className="flex items-start gap-3">
                      {/* Checkbox / auto indicator / info indicator */}
                      {task.informational ? (
                        <span className="flex-shrink-0 mt-0.5 text-base">ℹ️</span>
                      ) : isAuto ? (
                        <span className={`flex-shrink-0 mt-0.5 text-base ${isDone ? '' : 'opacity-40'}`}>
                          {isDone ? '✅' : '⏳'}
                        </span>
                      ) : (
                        <input
                          type="checkbox"
                          checked={isDone}
                          onChange={(e) => toggleTask(task.id, e.target.checked)}
                          className="flex-shrink-0 mt-1 w-4 h-4 accent-[#ffd100] cursor-pointer"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-medium leading-snug ${isDone && !task.informational ? 'line-through text-[#9ca3af]' : 'text-[#111827]'}`}>
                          {task.emoji} {task.label}
                        </p>
                        {task.detail && (
                          <p className="text-xs text-[#6b7280] mt-0.5 leading-snug">{task.detail}</p>
                        )}
                        {taskLinks.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-1.5">
                            {taskLinks.map((link) => (
                              <a
                                key={link.href}
                                href={link.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`text-[11px] font-medium px-2 py-0.5 rounded border transition-colors ${STAGE_COLORS[status]?.replace('bg-', 'border-').replace('text-', 'text-') ?? ''} hover:opacity-80`}
                              >
                                {link.label}
                              </a>
                            ))}
                          </div>
                        )}
                        {isAuto && !isDone && (
                          <p className="text-[10px] text-[#9ca3af] mt-0.5">Auto-detecting — checking every 30s</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Progress bar */}
              {!tasks.every((t) => t.informational) && (
                <div className="mt-4">
                  <div className="w-full h-1.5 bg-white/60 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${STAGE_COLORS[status]?.includes('green') ? 'bg-green-500' : STAGE_COLORS[status]?.includes('blue') ? 'bg-blue-500' : STAGE_COLORS[status]?.includes('orange') ? 'bg-orange-500' : STAGE_COLORS[status]?.includes('purple') ? 'bg-purple-500' : STAGE_COLORS[status]?.includes('amber') ? 'bg-amber-700' : 'bg-gray-500'}`}
                      style={{
                        width: `${Math.round(
                          (tasks.filter((t) => !t.informational && (
                            t.autoKey === 'nmi' ? autoDetected.nmi
                            : t.autoKey === 'estimation' ? autoDetected.estimation
                            : (tasksDone[t.id] ?? false)
                          )).length / Math.max(1, tasks.filter((t) => !t.informational).length)
                        ) * 100)}%`
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })()}

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

        {/* OpenSolar design panel — Ada packet generator + project linking */}
        <OpenSolarPanel job={job} />

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
