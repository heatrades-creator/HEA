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
  MINOR:            'bg-gray-100 text-gray-600',
  MODERATE:         'bg-yellow-100 text-yellow-700',
  SERIOUS:          'bg-orange-100 text-orange-700',
  GROSS_MISCONDUCT: 'bg-red-100 text-red-700',
};

const STATUS_STYLES: Record<string, string> = {
  RAISED:               'bg-orange-100 text-orange-700',
  UNDER_INVESTIGATION:  'bg-yellow-100 text-yellow-700',
  SHOW_CAUSE_ISSUED:    'bg-red-100 text-red-700',
  HEARING_SCHEDULED:    'bg-purple-100 text-purple-700',
  HEARING_COMPLETE:     'bg-blue-100 text-blue-700',
  WARNING_ISSUED:       'bg-orange-100 text-orange-600',
  FINAL_WARNING_ISSUED: 'bg-red-100 text-red-700',
  DISMISSED:            'bg-red-100 text-red-700',
  CLOSED:               'bg-green-100 text-green-700',
};

export default function DisciplineTable({ cases }: { cases: DisciplineCase[] }) {
  if (cases.length === 0) {
    return (
      <div className="bg-white border border-[#e5e9f0] rounded-xl p-8 text-center">
        <p className="text-[#6b7280] text-sm">No active discipline cases.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#e5e9f0] rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#e5e9f0] bg-[#f5f7fb]">
            <th className="px-5 py-3 text-left text-[10px] text-[#6b7280] uppercase tracking-widest font-medium">Person</th>
            <th className="px-5 py-3 text-left text-[10px] text-[#6b7280] uppercase tracking-widest font-medium hidden sm:table-cell">Category</th>
            <th className="px-5 py-3 text-left text-[10px] text-[#6b7280] uppercase tracking-widest font-medium">Severity</th>
            <th className="px-5 py-3 text-left text-[10px] text-[#6b7280] uppercase tracking-widest font-medium">Status</th>
            <th className="px-5 py-3 text-left text-[10px] text-[#6b7280] uppercase tracking-widest font-medium hidden md:table-cell">Opened</th>
          </tr>
        </thead>
        <tbody>
          {cases.map((c, i) => (
            <tr key={c.case_id} className={`border-b border-[#edf0f5] ${i % 2 === 0 ? '' : 'bg-[#f9fafb]'}`}>
              <td className="px-5 py-3">
                <p className="text-[#111827]">{c.personName || c.person_id}</p>
                {c.description && <p className="text-[#6b7280] text-xs mt-0.5 truncate max-w-xs">{c.description}</p>}
              </td>
              <td className="px-5 py-3 text-[#6b7280] text-xs hidden sm:table-cell">{(c.category || '').replace(/_/g, ' ')}</td>
              <td className="px-5 py-3">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SEVERITY_STYLES[(c.severity || 'MINOR').toUpperCase()] ?? SEVERITY_STYLES.MINOR}`}>
                  {(c.severity || 'MINOR').replace(/_/g, ' ')}
                </span>
              </td>
              <td className="px-5 py-3">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[(c.status || 'RAISED').toUpperCase()] ?? 'bg-[#eef0f5] text-[#6b7280]'}`}>
                  {(c.status || 'RAISED').replace(/_/g, ' ')}
                </span>
              </td>
              <td className="px-5 py-3 text-[#6b7280] text-xs hidden md:table-cell">
                {c.created_at ? String(c.created_at).substring(0, 10) : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
