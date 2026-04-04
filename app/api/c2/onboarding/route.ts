import { getServerSession } from 'next-auth';

const gasUrl = () => process.env.C2_GAS_URL;

export async function GET() {
  const session = await getServerSession();
  if (!session) return Response.json({ error: 'Unauthorised' }, { status: 401 });
  const url = gasUrl();
  if (!url) return Response.json({ error: 'C2_GAS_URL not configured' }, { status: 503 });
  try {
    const res = await fetch(`${url}?action=listOnboarding`, { cache: 'no-store' });
    return Response.json(await res.json());
  } catch {
    return Response.json({ error: 'GAS request failed' }, { status: 502 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session) return Response.json({ error: 'Unauthorised' }, { status: 401 });
  const url = gasUrl();
  if (!url) return Response.json({ error: 'C2_GAS_URL not configured' }, { status: 503 });
  const body = await req.json();
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'createOnboardingCase', actor: session.user?.email, ...body }),
    });
    return Response.json(await res.json());
  } catch {
    return Response.json({ error: 'GAS request failed' }, { status: 502 });
  }
}
