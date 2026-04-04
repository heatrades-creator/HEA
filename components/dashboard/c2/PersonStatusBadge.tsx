'use client';

const STATUS_STYLES: Record<string, string> = {
  CANDIDATE:       'bg-[#2a2a2a] text-[#888]',
  ONBOARDING:      'bg-blue-900/40 text-blue-300',
  PROBATION:       'bg-purple-900/40 text-purple-300',
  ACTIVE:          'bg-green-900/40 text-green-400',
  ACTIVE_RESTRICTED: 'bg-yellow-900/30 text-yellow-400',
  LEAVE:           'bg-sky-900/40 text-sky-300',
  MEDICAL_LEAVE:   'bg-sky-900/40 text-sky-300',
  PARENTAL_LEAVE:  'bg-sky-900/40 text-sky-300',
  SUSPENDED:       'bg-orange-900/40 text-orange-400',
  PIP:             'bg-orange-900/50 text-orange-300',
  DISCIPLINARY:    'bg-red-900/40 text-red-400',
  TERMINATING:     'bg-red-900/50 text-red-400',
  RESIGNED:        'bg-[#2e2e2e] text-[#666]',
  TERMINATED:      'bg-[#2e2e2e] text-[#555]',
  REDUNDANT:       'bg-[#2e2e2e] text-[#555]',
  INACTIVE:        'bg-[#2e2e2e] text-[#555]',
  DECEASED:        'bg-[#1a1a1a] text-[#444]',
};

const LABELS: Record<string, string> = {
  ACTIVE_RESTRICTED: 'Active (R)',
  MEDICAL_LEAVE:     'Medical Leave',
  PARENTAL_LEAVE:    'Parental Leave',
};

export default function PersonStatusBadge({ status }: { status: string }) {
  const key = String(status || '').toUpperCase();
  const style = STATUS_STYLES[key] ?? 'bg-[#2a2a2a] text-[#888]';
  const label = LABELS[key] ?? key.replace(/_/g, ' ');
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${style}`}>
      {label || '—'}
    </span>
  );
}
