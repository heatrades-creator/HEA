import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const gasUrl = process.env.JOBS_GAS_URL;
  if (!gasUrl) return NextResponse.json({ error: 'GAS not configured' }, { status: 503 });

  const raw = await fetch(gasUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'archiveJob', jobNumber: id }),
  });

  const text = await raw.text();
  let data: Record<string, unknown>;
  try { data = JSON.parse(text); } catch { return NextResponse.json({ error: 'GAS parse error' }, { status: 502 }); }
  if (data.error) return NextResponse.json({ error: data.error }, { status: 400 });

  // Release any installer claim + mark the Prisma lead archived so it's
  // excluded from the installer app even if GAS is temporarily unreachable.
  await Promise.all([
    prisma.jobClaim.deleteMany({ where: { jobNumber: id } }).catch(() => {}),
    prisma.lead.updateMany({ where: { gasJobNumber: id }, data: { status: 'archived' } }).catch(() => {}),
  ]);

  return NextResponse.json(data);
}
