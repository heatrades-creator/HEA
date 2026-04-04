'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import NewCandidateModal from './NewCandidateModal';

type Candidate = {
  candidate_id: string;
  full_name: string;
  email?: string;
  phone?: string;
  role_applied?: string;
  employment_type?: string;
  source?: string;
  status: string;
  created_at?: string;
};

const STAGES = ['NEW','SCREENING','PHONE_SCREEN','INTERVIEWED','REFERENCE_CHECK','OFFER_SENT','OFFER_ACCEPTED','OFFER_DECLINED','REJECTED'] as const;

const STAGE_STYLES: Record<string, { header: string; badge: string }> = {
  NEW:              { header: 'border-gray-300',    badge: 'bg-gray-100 text-gray-600' },
  SCREENING:        { header: 'border-blue-400',    badge: 'bg-blue-100 text-blue-700' },
  PHONE_SCREEN:     { header: 'border-sky-400',     badge: 'bg-sky-100 text-sky-700' },
  INTERVIEWED:      { header: 'border-purple-400',  badge: 'bg-purple-100 text-purple-700' },
  REFERENCE_CHECK:  { header: 'border-indigo-400',  badge: 'bg-indigo-100 text-indigo-700' },
  OFFER_SENT:       { header: 'border-yellow-400',  badge: 'bg-yellow-100 text-yellow-700' },
  OFFER_ACCEPTED:   { header: 'border-green-400',   badge: 'bg-green-100 text-green-700' },
  OFFER_DECLINED:   { header: 'border-red-400',     badge: 'bg-red-100 text-red-700' },
  REJECTED:         { header: 'border-gray-300',    badge: 'bg-gray-100 text-gray-500' },
};

const MOVE_OPTIONS: Record<string, string[]> = {
  NEW:              ['SCREENING','REJECTED'],
  SCREENING:        ['PHONE_SCREEN','INTERVIEWED','REJECTED'],
  PHONE_SCREEN:     ['INTERVIEWED','REJECTED'],
  INTERVIEWED:      ['REFERENCE_CHECK','OFFER_SENT','REJECTED'],
  REFERENCE_CHECK:  ['OFFER_SENT','REJECTED'],
  OFFER_SENT:       ['OFFER_ACCEPTED','OFFER_DECLINED'],
  OFFER_ACCEPTED:   [],
  OFFER_DECLINED:   [],
  REJECTED:         ['NEW'],
};

export default function CandidatePipeline({ initialCandidates }: { initialCandidates: Candidate[] }) {
  const router = useRouter();
  const [candidates, setCandidates] = useState(initialCandidates);
  const [showModal, setShowModal] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  async function moveCandidate(candidateId: string, newStatus: string) {
    setCandidates(cs => cs.map(c => c.candidate_id === candidateId ? { ...c, status: newStatus } : c));
    setOpenMenu(null);
    await fetch(`/api/c2/candidates/${candidateId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    router.refresh();
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-[#6b7280] text-sm">{candidates.length} candidate{candidates.length !== 1 ? 's' : ''}</p>
        <button onClick={() => setShowModal(true)} className="bg-[#ffd100] text-[#181818] font-semibold px-4 py-2 rounded-lg hover:bg-[#e6bc00] transition-colors text-sm">+ New Candidate</button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-4">
        {STAGES.map(stage => {
          const cols = candidates.filter(c => (c.status || 'NEW').toUpperCase() === stage);
          const style = STAGE_STYLES[stage] ?? { header: 'border-[#e5e9f0]', badge: 'bg-[#eef0f5] text-[#6b7280]' };
          return (
            <div key={stage} className="flex-shrink-0 w-64">
              <div className={`border-t-2 ${style.header} bg-[#f5f7fb] rounded-xl p-3`}>
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${style.badge}`}>{stage.replace(/_/g, ' ')}</span>
                  <span className="text-[#6b7280] text-xs">{cols.length}</span>
                </div>

                <div className="space-y-2">
                  {cols.length === 0 && (
                    <div className="border border-dashed border-[#e5e9f0] rounded-lg p-4 text-center">
                      <p className="text-[#333] text-xs">Empty</p>
                    </div>
                  )}
                  {cols.map(c => (
                    <div key={c.candidate_id} className="bg-white border border-[#e5e9f0] rounded-lg p-3 relative">
                      <p className="text-[#111827] text-sm font-medium">{c.full_name}</p>
                      {c.role_applied && <p className="text-[#6b7280] text-xs mt-0.5">{c.role_applied}</p>}
                      {c.phone && <p className="text-[#6b7280] text-xs mt-1">{c.phone}</p>}

                      {(MOVE_OPTIONS[stage] || []).length > 0 && (
                        <div className="relative mt-2">
                          <button
                            onClick={e => { e.stopPropagation(); setOpenMenu(openMenu === c.candidate_id ? null : c.candidate_id); }}
                            className="text-[#6b7280] text-xs hover:text-[#ffd100] transition-colors"
                          >Move ▾</button>
                          {openMenu === c.candidate_id && (
                            <div onClick={e => e.stopPropagation()} className="absolute top-5 left-0 z-20 bg-white border border-gray-200 rounded-lg py-1 w-44 shadow-lg">
                              {(MOVE_OPTIONS[stage] || []).map(target => (
                                <button key={target} onClick={() => moveCandidate(c.candidate_id, target)} className="block w-full text-left px-3 py-1.5 text-xs text-[#374151] hover:bg-gray-50 transition-colors">
                                  → {target.replace(/_/g, ' ')}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && <NewCandidateModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
