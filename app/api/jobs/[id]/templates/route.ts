import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

type Params = { params: Promise<{ id: string }> };

/** GET /api/jobs/[id]/templates — available document templates from TEMPLATE_CONFIG */
export async function GET(_req: NextRequest, _ctx: Params) {
  const session = await getServerSession();
  if (!session) return NextResponse.json([], { status: 401 });

  const gasUrl = process.env.JOBS_GAS_URL;
  if (!gasUrl) return NextResponse.json([]);

  try {
    const res = await fetch(`${gasUrl}?action=getAvailableTemplates`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`GAS error ${res.status}`);
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json([]);
  }
}
