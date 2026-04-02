import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

// Generation takes ~40s — extend Vercel function timeout to 60s
export const maxDuration = 60;

type Params = { params: Promise<{ id: string }> };

/** GET /api/jobs/[id]/documents — list all generated documents for this job */
export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: jobNumber } = await params;
  const gasUrl = process.env.JOBS_GAS_URL;
  if (!gasUrl) return NextResponse.json([], { status: 200 });

  try {
    const res = await fetch(
      `${gasUrl}?action=getDocuments&jobNumber=${encodeURIComponent(jobNumber)}`,
      { cache: 'no-store' }
    );
    if (!res.ok) throw new Error(`GAS error ${res.status}`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json([]);
  }
}

/** POST /api/jobs/[id]/documents — trigger generation of a document type */
export async function POST(req: NextRequest, { params }: Params) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: jobNumber } = await params;
  const gasUrl = process.env.JOBS_GAS_URL;
  if (!gasUrl) return NextResponse.json({ error: 'GAS URL not configured' }, { status: 500 });

  const { docClass } = await req.json();
  if (!docClass) return NextResponse.json({ error: 'docClass required' }, { status: 400 });

  const res = await fetch(gasUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'generateDocument', jobNumber, docClass }),
    signal: AbortSignal.timeout(58_000),
  });

  const data = await res.json();
  if (!res.ok || data.error) {
    return NextResponse.json(
      { error: data.error || 'Generation failed' },
      { status: 500 }
    );
  }
  return NextResponse.json(data);
}
