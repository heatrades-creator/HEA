'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DeployabilityBadge from './DeployabilityBadge';
import PersonStatusBadge from './PersonStatusBadge';
import NewPersonModal from './NewPersonModal';

type Person = {
  person_id: string;
  full_name: string;
  employment_type?: string;
  status?: string;
  deployability?: string;
  unit_id?: string;
  start_date?: string;
  email?: string;
  phone?: string;
};

export default function PeopleTable({ initialPeople }: { initialPeople: Person[] }) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterDeploy, setFilterDeploy] = useState('ALL');
  const [showModal, setShowModal] = useState(false);

  const filtered = initialPeople.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.full_name?.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q);
    const matchStatus = filterStatus === 'ALL' || (p.status || '').toUpperCase() === filterStatus;
    const matchDeploy = filterDeploy === 'ALL' || (p.deployability || '').toUpperCase() === filterDeploy;
    return matchSearch && matchStatus && matchDeploy;
  });

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search name or email…"
          className="flex-1 bg-white border border-[#e5e9f0] rounded-lg px-3 py-2 text-[#111827] text-sm placeholder:text-[#6b7280] focus:outline-none focus:border-[#ffd100]"
        />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-white border border-[#e5e9f0] rounded-lg px-3 py-2 text-sm text-[#6b7280] focus:outline-none focus:border-[#ffd100]">
          <option value="ALL">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="PROBATION">Probation</option>
          <option value="ONBOARDING">Onboarding</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="TERMINATED">Terminated</option>
        </select>
        <select value={filterDeploy} onChange={e => setFilterDeploy(e.target.value)} className="bg-white border border-[#e5e9f0] rounded-lg px-3 py-2 text-sm text-[#6b7280] focus:outline-none focus:border-[#ffd100]">
          <option value="ALL">All Deployability</option>
          <option value="FULL">Full</option>
          <option value="LIMITED">Limited</option>
          <option value="BLOCKED">Blocked</option>
        </select>
        <button onClick={() => setShowModal(true)} className="bg-[#ffd100] text-[#181818] font-semibold px-4 py-2 rounded-lg hover:bg-[#e6bc00] transition-colors text-sm whitespace-nowrap">
          + Add Person
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#e5e9f0] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#e5e9f0] bg-[#f5f7fb]">
              <th className="px-5 py-3 text-left text-[10px] text-[#6b7280] uppercase tracking-widest font-medium">Name</th>
              <th className="px-5 py-3 text-left text-[10px] text-[#6b7280] uppercase tracking-widest font-medium hidden sm:table-cell">Type</th>
              <th className="px-5 py-3 text-left text-[10px] text-[#6b7280] uppercase tracking-widest font-medium">Status</th>
              <th className="px-5 py-3 text-left text-[10px] text-[#6b7280] uppercase tracking-widest font-medium">Deploy</th>
              <th className="px-5 py-3 text-left text-[10px] text-[#6b7280] uppercase tracking-widest font-medium hidden lg:table-cell">Start Date</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-[#6b7280] text-sm">
                  {initialPeople.length === 0 ? 'No people yet. Add your first person above.' : 'No results match your filters.'}
                </td>
              </tr>
            ) : filtered.map((p, i) => (
              <tr key={p.person_id} className={`border-b border-[#edf0f5] hover:bg-[#232323] transition-colors cursor-pointer ${i % 2 === 0 ? '' : 'bg-[#1e1e1e]'}`}>
                <td className="px-5 py-3">
                  <Link href={`/dashboard/c2/people/${p.person_id}`} className="block">
                    <p className="text-[#111827] font-medium">{p.full_name || '—'}</p>
                    {p.email && <p className="text-[#6b7280] text-xs mt-0.5">{p.email}</p>}
                  </Link>
                </td>
                <td className="px-5 py-3 text-[#6b7280] text-xs hidden sm:table-cell">
                  {(p.employment_type || '').replace(/_/g, ' ')}
                </td>
                <td className="px-5 py-3">
                  <PersonStatusBadge status={p.status || ''} />
                </td>
                <td className="px-5 py-3">
                  <DeployabilityBadge value={p.deployability || 'FULL'} />
                </td>
                <td className="px-5 py-3 text-[#6b7280] text-xs hidden lg:table-cell">
                  {p.start_date ? String(p.start_date).substring(0, 10) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-[#6b7280] text-xs mt-3">{filtered.length} of {initialPeople.length} people</p>

      {showModal && <NewPersonModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
