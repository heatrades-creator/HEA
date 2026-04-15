import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { Resend } from 'resend'
import { getServerSession } from 'next-auth'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-03-25.dahlia' })
const resend = new Resend(process.env.RESEND_API_KEY)
const FROM   = process.env.EMAIL_FROM ?? 'noreply@hea-group.com.au'

const MILESTONES = {
  deposit:    { label: '10% Deposit',         pct: 0.10, description: 'Components ordered and delivered to site' },
  completion: { label: '80% Completion',       pct: 0.80, description: 'Installation works complete' },
  esv:        { label: '10% ESV Certificate',  pct: 0.10, description: 'Energy Safe Victoria certificate returned' },
} as const

type Milestone = keyof typeof MILESTONES

export async function POST(req: NextRequest) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe not configured — add STRIPE_SECRET_KEY to Vercel env vars' }, { status: 503 })
  }

  const body = await req.json()
  const { jobNumber, milestone, totalPrice, clientEmail, clientName } = body as {
    jobNumber: string
    milestone: Milestone
    totalPrice: string | number
    clientEmail: string
    clientName?: string
  }

  if (!jobNumber || !milestone || !totalPrice || !clientEmail) {
    return NextResponse.json({ error: 'Missing required fields: jobNumber, milestone, totalPrice, clientEmail' }, { status: 400 })
  }

  const info = MILESTONES[milestone]
  if (!info) {
    return NextResponse.json({ error: 'Invalid milestone — must be deposit, completion, or esv' }, { status: 400 })
  }

  // Parse total — strip currency symbols, commas, spaces
  const total = parseFloat(String(totalPrice).replace(/[^0-9.]/g, ''))
  if (isNaN(total) || total <= 0) {
    return NextResponse.json({ error: 'Invalid Quote Value — save a job total first' }, { status: 400 })
  }

  const amountCents = Math.round(total * info.pct * 100)
  const amountDisplay = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(total * info.pct)

  const baseUrl      = process.env.NEXTAUTH_URL ?? 'https://hea-group.com.au'
  const successUrl   = `${baseUrl}/dashboard/jobs/${jobNumber}?payment=success&milestone=${milestone}`
  const cancelUrl    = `${baseUrl}/dashboard/jobs/${jobNumber}?payment=cancelled`

  // ── Create Stripe Checkout Session ──────────────────────────────────────────
  let checkoutUrl: string
  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'aud',
          product_data: {
            name:        `HEA Solar Installation — ${info.label}`,
            description: `${info.description} | Job ${jobNumber}`,
          },
          unit_amount: amountCents,
        },
        quantity: 1,
      }],
      customer_email:      clientEmail,
      client_reference_id: jobNumber,
      metadata:            { milestone, jobNumber },
      success_url:         successUrl,
      cancel_url:          cancelUrl,
      payment_intent_data: {
        description: `HEA ${info.label} — ${jobNumber}`,
      },
    })
    checkoutUrl = checkoutSession.url!
  } catch (err: any) {
    console.error('Stripe create-checkout failed:', err)
    return NextResponse.json({ error: `Stripe error: ${err.message}` }, { status: 500 })
  }

  // ── Email payment link to client ─────────────────────────────────────────────
  const firstName = clientName ? clientName.split(' ')[0] : 'there'
  let emailSent = false
  try {
    await resend.emails.send({
      from:    FROM,
      to:      clientEmail,
      subject: `Payment due — ${info.label} | HEA Group`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:580px;margin:0 auto;color:#1a1a1a;">
          <div style="background:#1a1a1a;padding:24px 28px;border-radius:8px 8px 0 0;text-align:center;">
            <p style="color:#fbbf24;font-size:10px;letter-spacing:2px;text-transform:uppercase;margin:0 0 8px;">
              Heffernan Electrical Automation
            </p>
            <h1 style="color:white;font-size:20px;margin:0;font-weight:700;">
              ${info.label} — ${amountDisplay}
            </h1>
          </div>
          <div style="background:white;padding:28px 32px;border:1px solid #e8e8e6;border-top:none;border-radius:0 0 8px 8px;">
            <p style="margin:0 0 16px;">Hi ${firstName},</p>
            <p style="margin:0 0 16px;">
              Your payment of <strong>${amountDisplay}</strong> is now due —
              <em>${info.description.toLowerCase()}</em>.
            </p>
            <div style="text-align:center;margin:28px 0;">
              <a href="${checkoutUrl}"
                 style="background:#ffd100;color:#111827;font-weight:bold;padding:14px 36px;
                        border-radius:10px;text-decoration:none;font-size:16px;display:inline-block;">
                Pay ${amountDisplay} securely →
              </a>
            </div>
            <p style="font-size:13px;color:#666;margin:0 0 8px;">
              Payments are processed securely by Stripe. We accept all major credit and debit cards.
            </p>
            <p style="font-size:12px;color:#999;margin:0;">Job reference: ${jobNumber}</p>
            <p style="font-size:12px;color:#888;border-top:1px solid #eee;padding-top:16px;margin-top:20px;">
              Heffernan Electrical Automation &nbsp;·&nbsp; 0481 267 812 &nbsp;·&nbsp; hea-group.com.au<br>
              REC 37307
            </p>
          </div>
        </div>
      `,
    })
    emailSent = true
  } catch (emailErr) {
    console.error('Payment link email failed:', emailErr)
    // Non-fatal — return the URL so Jesse can share it manually
  }

  // ── Save payment record to client's Drive folder via GAS ─────────────────────
  if (process.env.JOBS_GAS_URL) {
    try {
      await fetch(process.env.JOBS_GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action:      'savePaymentRecord',
          jobNumber,
          milestone,
          amount:      amountDisplay,
          clientEmail,
          checkoutUrl,
        }),
      })
    } catch (gasErr) {
      console.error('Failed to save payment record to Drive:', gasErr)
      // Non-fatal
    }
  }

  return NextResponse.json({ success: true, url: checkoutUrl, emailSent, amount: amountDisplay })
}
