// app/api/leads/route.ts
// POST — receive a lead from the public quote form. FREE. No OpenSolar call.

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { sendNewLeadAlert } from "@/lib/email"

const Schema = z.object({
  firstName:     z.string().min(1).max(100),
  lastName:      z.string().min(1).max(100),
  email:         z.string().email(),
  phone:         z.string().min(8).max(20),
  address:       z.string().min(5).max(300),
  suburb:        z.string().min(2).max(100),
  state:         z.enum(["NSW", "VIC", "QLD", "SA", "WA", "TAS", "ACT", "NT"]),
  postcode:      z.string().regex(/^\d{4}$/),
  annualBillAud: z.number().min(0).max(50000).optional(),
  roofType:      z.enum(["tile", "metal", "flat", "other"]).optional(),
  storeys:       z.number().min(1).max(10).optional(),
  notes:         z.string().max(2000).optional(),
})

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    )
  }

  // Duplicate check: same email in last 7 days
  const recentDuplicate = await prisma.lead.findFirst({
    where: {
      email: parsed.data.email,
      createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    },
  })

  const lead = await prisma.lead.create({
    data: {
      ...parsed.data,
      status:     recentDuplicate ? "duplicate" : "pending_review",
      leadSource: "website",
      auditLog: {
        create: {
          action: "lead_received",
          actor:  "system",
          detail: JSON.stringify({
            ip:          req.headers.get("x-forwarded-for") ?? "unknown",
            isDuplicate: !!recentDuplicate,
          }),
        },
      },
    },
  })

  // Fire-and-forget — don't block the response if email fails
  sendNewLeadAlert(lead).catch(console.error)

  return NextResponse.json(
    { success: true, leadId: lead.id, proposalToken: lead.proposalToken },
    { status: 201 }
  )
}
