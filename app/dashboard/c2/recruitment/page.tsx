import CandidatePipeline from '@/components/dashboard/c2/CandidatePipeline';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Recruitment | HEA Command' };

async function getCandidates() {
  const url = process.env.C2_GAS_URL;
  if (!url) return [];
  try {
    const res = await fetch(`${url}?action=listCandidates`, { cache: 'no-store' });
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export default async function RecruitmentPage() {
  const candidates = await getCandidates();
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-white text-xl font-semibold">Recruitment</h1>
        <p className="text-[#555] text-sm mt-0.5">Candidate pipeline — from application to offer accepted</p>
      </div>
      <CandidatePipeline initialCandidates={candidates} />
    </div>
  );
}
