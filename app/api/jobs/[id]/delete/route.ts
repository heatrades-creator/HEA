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
    body: JSON.stringify({ action: 'deleteJob', jobNumber: id }),
  });

  const text = await raw.text();
  let data: Record<string, unknown>;
  try { data = JSON.parse(text); } catch { return NextResponse.json({ error: 'GAS parse error' }, { status: 502 }); }
  if (data.error) return NextResponse.json({ error: data.error }, { status: 400 });

  // Clean up all Prisma data for this job — replies first (FK constraint), then roots
  await prisma.jobComment.deleteMany({ where: { jobNumber: id, parentId: { not: null } } }).catch(() => {});
  await prisma.jobComment.deleteMany({ where: { jobNumber: id } }).catch(() => {});
  await prisma.jobClaim.deleteMany({ where: { jobNumber: id } }).catch(() => {});
  // Detach any linked Prisma lead so it doesn't resurface in the mobile job list
  // (when GAS row is gone, the mobile API re-surfaces leads whose gasJobNumber is no longer in GAS)
  await prisma.lead.updateMany({
    where: { gasJobNumber: id },
    data: { status: 'rejected', gasJobNumber: null },
  }).catch(() => {});

  return NextResponse.json(data);
}
