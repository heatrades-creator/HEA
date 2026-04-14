import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendReviewRequest } from '@/lib/email';

const GAS_URL = process.env.JOBS_GAS_URL!;

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  if (!GAS_URL) return NextResponse.json(null, { status: 404 });

  const res = await fetch(`${GAS_URL}?id=${encodeURIComponent(id)}`, { cache: 'no-store' });
  if (!res.ok) return NextResponse.json(null, { status: 404 });

  const data = await res.json();
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  if (!GAS_URL) return NextResponse.json({ error: 'GAS not configured' }, { status: 503 });

  const res = await fetch(GAS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'updateJob', jobNumber: id, ...body }),
  });

  if (!res.ok) return NextResponse.json({ error: 'GAS error' }, { status: 502 });

  const updated = await res.json();

  // Auto-send review request when job moves to Complete
  if (body.status === 'Complete') {
    try {
      const lead = await prisma.lead.findFirst({ where: { gasJobNumber: id } });
      if (lead) {
        await sendReviewRequest(lead);
        await prisma.auditEntry.create({
          data: {
            leadId: lead.id,
            action: 'review_requested',
            actor:  'system',
            detail: JSON.stringify({ trigger: 'status_complete', jobNumber: id }),
          },
        });
      }
    } catch (e) {
      console.error('Auto review email failed:', e);
    }
  }

  return NextResponse.json(updated);
}
