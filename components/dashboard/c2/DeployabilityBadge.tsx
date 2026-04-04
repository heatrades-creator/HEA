'use client';

const STYLES: Record<string, string> = {
  FULL:    'bg-green-900/40 text-green-400 border border-green-800/50',
  LIMITED: 'bg-yellow-900/40 text-[#ffd100] border border-yellow-800/50',
  BLOCKED: 'bg-red-900/40 text-red-400 border border-red-800/50',
};

const DOTS: Record<string, string> = {
  FULL:    'bg-green-400',
  LIMITED: 'bg-[#ffd100]',
  BLOCKED: 'bg-red-400',
};

export default function DeployabilityBadge({ value }: { value: string }) {
  const key = String(value || '').toUpperCase();
  const style = STYLES[key] ?? 'bg-[#2a2a2a] text-[#555] border border-[#333]';
  const dot = DOTS[key] ?? 'bg-[#555]';
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full font-medium ${style}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {key || '—'}
    </span>
  );
}
