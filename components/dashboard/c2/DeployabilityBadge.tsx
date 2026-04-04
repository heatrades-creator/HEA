'use client';

const STYLES: Record<string, string> = {
  FULL:    'bg-green-100 text-green-700 border border-green-200',
  LIMITED: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
  BLOCKED: 'bg-red-100 text-red-700 border border-red-200',
};

const DOTS: Record<string, string> = {
  FULL:    'bg-green-500',
  LIMITED: 'bg-yellow-500',
  BLOCKED: 'bg-red-500',
};

export default function DeployabilityBadge({ value }: { value: string }) {
  const key = String(value || '').toUpperCase();
  const style = STYLES[key] ?? 'bg-gray-100 text-gray-500 border border-gray-200';
  const dot = DOTS[key] ?? 'bg-gray-400';
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full font-medium ${style}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {key || '—'}
    </span>
  );
}
