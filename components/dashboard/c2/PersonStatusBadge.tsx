'use client';

const STATUS_STYLES: Record<string, string> = {
  CANDIDATE:         'bg-gray-100 text-gray-600',
  ONBOARDING:        'bg-blue-100 text-blue-700',
  PROBATION:         'bg-purple-100 text-purple-700',
  ACTIVE:            'bg-green-100 text-green-700',
  ACTIVE_RESTRICTED: 'bg-yellow-100 text-yellow-700',
  LEAVE:             'bg-sky-100 text-sky-700',
  MEDICAL_LEAVE:     'bg-sky-100 text-sky-700',
  PARENTAL_LEAVE:    'bg-sky-100 text-sky-700',
  SUSPENDED:         'bg-orange-100 text-orange-700',
  PIP:               'bg-orange-100 text-orange-700',
  DISCIPLINARY:      'bg-red-100 text-red-700',
  TERMINATING:       'bg-red-100 text-red-700',
  RESIGNED:          'bg-gray-100 text-gray-500',
  TERMINATED:        'bg-gray-100 text-gray-500',
  REDUNDANT:         'bg-gray-100 text-gray-500',
  INACTIVE:          'bg-gray-100 text-gray-500',
  DECEASED:          'bg-gray-100 text-gray-400',
};

const LABELS: Record<string, string> = {
  ACTIVE_RESTRICTED: 'Active (R)',
  MEDICAL_LEAVE:     'Medical Leave',
  PARENTAL_LEAVE:    'Parental Leave',
};

export default function PersonStatusBadge({ status }: { status: string }) {
  const key = String(status || '').toUpperCase();
  const style = STATUS_STYLES[key] ?? 'bg-gray-100 text-gray-500';
  const label = LABELS[key] ?? key.replace(/_/g, ' ');
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${style}`}>
      {label || '—'}
    </span>
  );
}
