'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type DisciplineCase = {
  case_id: string;
  person_id: string;
  category?: string;
  severity?: string;
  status?: string;
  description?: string;
  outcome?: string;
  created_at?: string;
  personName?: string;
};

const SEVERITY_STYLES: Record<string, string> = {
  MINOR:            'bg-[#2a2a2a] text-[#888]',
  MODERATE:         'bg-yellow-900/30 text-[#ffd100]',
  SERIOUS:          'bg-orange-900/40 text-orange-400',
  GROSS_MISCONDUCT: 'bg-red-900/40 text-red-400',
};

const STATUS_STYLES: Record<string, string> = {
  RAISED:               'bg-orange-900/40 text-orange-400',
  UNDER_INVESTIGATION:  'bg-yellow-900/40 text-[#ffd100]',
  SHOW_CAUSE_ISSUED:    'bg-red-900/30 text-red-400',
  HEARING_SCHEDULED:    'bg-purple-900/40 text-purple-400',
  HEARING_COMPLETE:     'bg-blue-900/40 text-blue-300',
  WARNING_ISSUED:       'bg-orange-900/30 text-orange-300',
  FINAL_WARNING_ISSUED: 'bg-red-900/40 text-red-400',
  DISMISSED:            'bg-red-900/50 text-red-500',
  CLOSED:               'bg-green-900/30 text-green-500',
};

export default function DisciplineTable({ cases }: { cases: DisciplineCase[] }) {
  if (cases.length === 0) {
    return (
      <div className="bg-[#202020] border border-[#2e2e2e] rounded-xl p-8 text-center">
        <p className="text-[#444] text-sm">No active discipline cases.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#202020] border border-[#2e2e2e] rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#2a2a2a] bg-[#1a1a1a]">
            <th className="px-5 py-3 text-left text-[10px] text-[#444] uppercase tracking-widest font-medium">Person</th>
            <th className="px-5 py-3 text-left text-[10px] text-[#444] uppercase tracking-widest font-medium hidden sm:table-cell">Category</th>
            <th className="px-5 py-3 text-left text-[10px] text-[#444] uppercase tracking-widest font-medium">Severity</th>
            <th className="px-5 py-3 text-left text-[10px] text-[#444] uppercase tracking-widest font-medium">Status</th>
            <th className="px-5 py-3 text-left text-[10px] text-[#444] uppercase tracking-widest font-medium hidden md:table-cell">Opened</th>
          </tr>
        </thead>
        <tbody>
          {cases.map((c, i) => (
            <tr key={c.case_id} className={`border-b border-[#252525] ${i % 2 === 0 ? '' : 'bg-[#1e1e1e]'}`}>
              <td className="px-5 py-3">
                <p className="text-white">{c.personName || c.person_id}</p>
                {c.description && <p className="text-[#555] text-xs mt-0.5 truncate max-w-xs">{c.description}</p>}
              </td>
              <td className="px-5 py-3 text-[#666] text-xs hidden sm:table-cell">{(c.category || '').replace(/_/g, ' ')}</td>
              <td className="px-5 py-3">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SEVERITY_STYLES[(c.severity || 'MINOR').toUpperCase()] ?? SEVERITY_STYLES.MINOR}`}>
                  {(c.severity || 'MINOR').replace(/_/g, ' ')}
                </span>
              </td>
              <td className="px-5 py-3">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[(c.status || 'RAISED').toUpperCase()] ?? 'bg-[#2a2a2a] text-[#888]'}`}>
                  {(c.status || 'RAISED').replace(/_/g, ' ')}
                </span>
              </td>
              <td className="px-5 py-3 text-[#555] text-xs hidden md:table-cell">
                {c.created_at ? String(c.created_at).substring(0, 10) : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
