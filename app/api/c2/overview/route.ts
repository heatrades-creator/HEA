import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: 'Unauthorised' }, { status: 401 });

  const url = process.env.C2_GAS_URL;
  if (!url) return Response.json({ error: 'C2_GAS_URL not configured' }, { status: 503 });

  try {
    const res = await fetch(`${url}?action=getOverview`, { cache: 'no-store' });
    const data = await res.json();
    return Response.json(data);
  } catch {
    return Response.json({ error: 'GAS request failed' }, { status: 502 });
  }
}
