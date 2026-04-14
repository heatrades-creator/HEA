import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/db'
import { sendMilestoneAlert } from '@/lib/email'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-03-25.dahlia' })

// Disable body parsing — Stripe needs the raw body for signature verification
export const config = { api: { bodyParser: false } }

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature')
  if (!sig) return NextResponse.json({ error: 'No signature' }, { status: 400 })

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not set')
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  let event: Stripe.Event
  try {
    const rawBody = await req.text()
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)
  } catch (err: any) {
    console.error('Stripe webhook signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const jobNumber = session.client_reference_id
    const customerEmail = session.customer_details?.email ?? session.customer_email

    if (!jobNumber && !customerEmail) {
      return NextResponse.json({ received: true })
    }

    try {
      // Find the lead by job number (preferred) or email
      const lead = jobNumber
        ? await prisma.lead.findFirst({ where: { gasJobNumber: jobNumber } })
        : customerEmail
        ? await prisma.lead.findFirst({ where: { email: customerEmail } })
        : null

      if (!lead) {
        console.warn('Stripe webhook: no matching lead for jobNumber:', jobNumber, 'email:', customerEmail)
        return NextResponse.json({ received: true })
      }

      // Determine which milestone based on Stripe metadata or payment link ID
      // Convention: set metadata.milestone = "deposit" | "completion" | "esv" on the Stripe payment link
      const milestone = (session.metadata?.milestone ?? 'deposit') as 'deposit' | 'completion' | 'esv'

      if (milestone === 'deposit') {
        await prisma.lead.update({ where: { id: lead.id }, data: { depositPaidAt: new Date() } })
        await prisma.auditEntry.create({
          data: { leadId: lead.id, action: 'deposit_paid', actor: 'stripe',
            detail: JSON.stringify({ sessionId: session.id, amount: session.amount_total }) },
        })
        await sendMilestoneAlert(lead, 'deposit_paid')
      } else if (milestone === 'completion') {
        await prisma.lead.update({ where: { id: lead.id }, data: { completionPaidAt: new Date() } })
        await prisma.auditEntry.create({
          data: { leadId: lead.id, action: 'completion_paid', actor: 'stripe',
            detail: JSON.stringify({ sessionId: session.id, amount: session.amount_total }) },
        })
        await sendMilestoneAlert(lead, 'job_installed')
      } else if (milestone === 'esv') {
        await prisma.lead.update({ where: { id: lead.id }, data: { esvPaidAt: new Date() } })
        await prisma.auditEntry.create({
          data: { leadId: lead.id, action: 'esv_paid', actor: 'stripe',
            detail: JSON.stringify({ sessionId: session.id, amount: session.amount_total }) },
        })
      }
    } catch (err) {
      console.error('Stripe webhook DB update failed:', err)
    }
  }

  return NextResponse.json({ received: true })
}
