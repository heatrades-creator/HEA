import { getServerSession } from 'next-auth';

const gasUrl = () => process.env.C2_GAS_URL;

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession();
  if (!session) return Response.json({ error: 'Unauthorised' }, { status: 401 });
  const { id } = await params;
  const url = gasUrl();
  if (!url) return Response.json({ error: 'C2_GAS_URL not configured' }, { status: 503 });
  try {
    const res = await fetch(`${url}?action=getPerson&id=${encodeURIComponent(id)}`, { cache: 'no-store' });
    const data = await res.json();
    if (data?.error) return Response.json(data, { status: 404 });
    return Response.json(data);
  } catch {
    return Response.json({ error: 'GAS request failed' }, { status: 502 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession();
  if (!session) return Response.json({ error: 'Unauthorised' }, { status: 401 });
  const { id } = await params;
  const url = gasUrl();
  if (!url) return Response.json({ error: 'C2_GAS_URL not configured' }, { status: 503 });
  const body = await req.json();

  // If body contains 'status' only → transition; else → update
  const action = body._transition ? 'transitionPersonStatus' : 'updatePerson';

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
