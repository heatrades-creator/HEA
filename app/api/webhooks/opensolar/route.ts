// app/api/webhooks/opensolar/route.ts
//
// POST — receive all OpenSolar webhook events. ALWAYS FREE.
//
// CRITICAL: This handler NEVER calls any function from lib/opensolar.ts.
// It only updates local DB and sends staff notifications.
// Webhook receipt does not cost money — ever.

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { verifyWebhookSignature } from "@/lib/webhooks"
import { sendMilestoneAlert } from "@/lib/email"

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get("x-opensolar-signature") ?? ""

  if (!verifyWebhookSignature(body, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(body)
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const p = (payload?.project ?? {}) as Record<string, unknown>
  const osProjectId = typeof p?.id === "number" ? p.id : undefined
  if (!osProjectId) return NextResponse.json({ ok: true })

  const lead = await prisma.lead.findFirst({
    where: { openSolarProjectId: osProjectId },
  })
  if (!lead) return NextResponse.json({ ok: true })

  // Map OpenSolar fields to local milestone timestamps
  const updates: Record<string, unknown> = {}
  let action: string | null = null

  if (p?.stage !== undefined) {
    updates.openSolarStage = String(p.stage)
  }

  const systems = Array.isArray(p?.systems) ? p.systems as Record<string, unknown>[] : []
  const sys0 = systems[0]
  if (sys0?.kw_stc)               updates.openSolarSystemKw  = sys0.kw_stc
  if (sys0?.output_annual_kwh)    updates.openSolarOutputKwh = sys0.output_annual_kwh
  if (sys0?.price_including_tax)  updates.openSolarPriceAud  = sys0.price_including_tax

  if (p?.customer_proposal_data && !lead.proposalSentAt) {
    updates.proposalSentAt = new Date()
    action = "proposal_sent"
  }
  if (p?.system_sold && !lead.soldAt) {
    updates.soldAt = p.sold_date
      ? new Date(p.sold_date as string)
      : new Date()
    action = "job_sold"
  }
  if (p?.installation_date && !lead.installedAt) {
    updates.installedAt = new Date(p.installation_date as string)
    action = "job_installed"
  }

  if (Object.keys(updates).length > 0) {
    await prisma.lead.update({
      where: { id: lead.id },
      data: {
        ...updates,
        auditLog: {
          create: {
            action:  action ?? "webhook_received",
            actor:   "opensolar_webhook",
            detail:  JSON.stringify({ stage: p?.stage }),
            costAud: null, // webhooks are ALWAYS free
          },
        },
      },
    })
  }

  if (action) {
    sendMilestoneAlert(lead, action).catch(console.error)
  }

  return NextResponse.json({ ok: true })
}
