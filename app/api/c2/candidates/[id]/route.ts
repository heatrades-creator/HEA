import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const gasUrl = () => process.env.C2_GAS_URL;

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: 'Unauthorised' }, { status: 401 });
  const { id } = await params;
  const url = gasUrl();
  if (!url) return Response.json({ error: 'C2_GAS_URL not configured' }, { status: 503 });
  const body = await req.json();
  const action = body.status ? 'transitionCandidateStatus' : 'updateCandidate';
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, id, actor: session.user?.email, ...body }),
    });
    return Response.json(await res.json());
  } catch {
    return Response.json({ error: 'GAS request failed' }, { status: 502 });
  }
}
