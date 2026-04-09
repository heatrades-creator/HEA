import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM   = process.env.EMAIL_FROM ?? 'alerts@hea-group.com.au';
const CC     = process.env.EMAIL_ALERT_TO ?? '';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { clientName, email, phone, address, jobNumber, followupCount } = await req.json();

  if (!email) {
    return NextResponse.json({ error: 'No client email on file' }, { status: 400 });
  }

  const ordinal = followupCount === 1 ? '1st' : followupCount === 2 ? '2nd' : followupCount === 3 ? '3rd' : `${followupCount}th`;

  try {
    await resend.emails.send({
      from: FROM,
      to:   email,
      cc:   CC || undefined,
      subject: `Your Solar Quote — ${clientName} (follow-up)`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#111827">
          <img src="https://hea-group.com.au/Logo_transparent.png" alt="HEA" style="height:40px;margin-bottom:24px" />
          <h2 style="margin:0 0 8px">Hi ${clientName.split(' ')[0]},</h2>
          <p style="color:#6b7280;margin:0 0 16px">
            This is a friendly follow-up regarding your solar quote from Heffernan Electrical Automation.
          </p>
          <p style="margin:0 0 16px">
            We'd love to answer any questions you have and help you take the next step.
            There's no obligation — just an honest conversation about what's right for your home.
          </p>
          <table style="width:100%;background:#f5f7fa;border-radius:8px;padding:16px;margin-bottom:24px">
            <tr><td style="color:#6b7280;font-size:12px;padding:4px 0">Job #</td><td style="font-weight:600">${jobNumber}</td></tr>
            <tr><td style="color:#6b7280;font-size:12px;padding:4px 0">Address</td><td>${address ?? '—'}</td></tr>
          </table>
          <a href="tel:${phone ?? ''}" style="display:inline-block;background:#ffd100;color:#111827;font-weight:700;padding:12px 24px;border-radius:8px;text-decoration:none;margin-bottom:24px">
            Call Jesse — ${phone ?? '0481 267 812'}
          </a>
          <p style="color:#9ca3af;font-size:12px;margin:0">
            Heffernan Electrical Automation · Bendigo, VIC<br>
            This is follow-up #${followupCount} (${ordinal} contact)
          </p>
        </div>
      `,
    });

    return NextResponse.json({ success: true, sentAt: new Date().toISOString() });
  } catch (err) {
    console.error('Follow-up email failed:', err);
    return NextResponse.json({ error: 'Email send failed' }, { status: 500 });
  }
}
