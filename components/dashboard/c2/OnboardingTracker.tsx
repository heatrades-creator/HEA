'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type OnboardingCase = {
  case_id: string;
  person_id: string;
  status: string;
  target_start_date?: string;
  contract_sent_at?: string;
  contract_signed_at?: string;
  induction_date?: string;
  supervisor_id?: string;
  notes?: string;
  personName?: string;
};

const STEPS = [
  { key: 'CREATED',           label: 'Case Created' },
  { key: 'CONTRACT_SENT',     label: 'Contract Sent' },
  { key: 'CONTRACT_SIGNED',   label: 'Contract Signed' },
  { key: 'INDUCTION_SCHEDULED', label: 'Induction Scheduled' },
  { key: 'INDUCTION_COMPLETE', label: 'Induction Complete' },
  { key: 'EQUIPMENT_ISSUED',  label: 'Equipment Issued' },
  { key: 'SYSTEM_ACCESS_GRANTED', label: 'System Access Granted' },
  { key: 'SUPERVISOR_ASSIGNED', label: 'Supervisor Assigned' },
  { key: 'COMPLETE',          label: 'Complete — moves to Probation' },
];

function stepIndex(status: string) {
  return STEPS.findIndex(s => s.key === (status || '').toUpperCase());
}

export default function OnboardingTracker({ cases }: { cases: OnboardingCase[] }) {
  const router = useRouter();
  const [advancing, setAdvancing] = useState<string | null>(null);

  async function advance(caseId: string, currentStatus: string) {
    const idx = stepIndex(currentStatus);
    if (idx < 0 || idx >= STEPS.length - 1) return;
    const nextStatus = STEPS[idx + 1].key;
    setAdvancing(caseId);
    await fetch(`/api/c2/onboarding/${caseId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus }),
    });
    setAdvancing(null);
    router.refresh();
  }

  if (cases.length === 0) {
    return (
      <div className="bg-white border border-[#e5e9f0] rounded-xl p-8 text-center">
        <p className="text-[#6b7280] text-sm">No active onboarding cases.</p>
        <p className="text-[#333] text-xs mt-1">Onboarding cases are created automatically when a candidate accepts an offer.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {cases.map(c => {
        const currentIdx = stepIndex(c.status);
        const isComplete = c.status === 'COMPLETE' || c.status === 'CANCELLED';

        return (
          <div key={c.case_id} className="bg-white border border-[#e5e9f0] rounded-xl p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-[#111827] font-medium">{c.personName || c.person_id}</p>
                {c.target_start_date && (
                  <p className="text-[#6b7280] text-xs mt-0.5">Target start: {String(c.target_start_date).substring(0, 10)}</p>
                )}
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isComplete ? 'bg-green-900/40 text-green-400' : 'bg-blue-900/40 text-blue-300'}`}>
                {c.status.replace(/_/g, ' ')}
              </span>
            </div>

            {/* Step progress */}
            <div className="space-y-1.5 mb-4">
              {STEPS.map((step, i) => {
                const done = i <= currentIdx;
                const current = i === currentIdx;
                return (
                  <div key={step.key} className="flex items-center gap-2.5">
                    <div className={`w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center ${done ? (current ? 'bg-[#ffd100]' : 'bg-green-900/60 border border-green-700') : 'border border-[#e5e9f0] bg-[#f5f7fb]'}`}>
                      {done && !current && (
                        <svg className="w-2.5 h-2.5 text-green-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                      )}
                    </div>
                    <p className={`text-xs ${done ? (current ? 'text-[#ffd100] font-medium' : 'text-[#6b7280]') : 'text-[#333]'}`}>{step.label}</p>
                  </div>
                );
              })}
            </div>

            {!isComplete && currentIdx < STEPS.length - 1 && (
              <button
                onClick={() => advance(c.case_id, c.status)}
                disabled={advancing === c.case_id}
                className="bg-[#ffd100] text-[#181818] text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-[#e6bc00] transition-colors disabled:opacity-50"
              >
                {advancing === c.case_id ? 'Updating…' : `Mark: ${STEPS[currentIdx + 1]?.label}`}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
