import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

const GAS_URL = process.env.JOBS_GAS_URL!;

export async function GET() {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!GAS_URL) return NextResponse.json([], { status: 200 });

  try {
    const res = await fetch(`${GAS_URL}?action=getAllDocuments`, { cache: 'no-store' });
    if (!res.ok) return NextResponse.json([], { status: 200 });
    const data = await res.json();
    return NextResponse.json(Array.isArray(data) ? data : []);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
