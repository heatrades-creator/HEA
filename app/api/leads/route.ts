// app/api/leads/route.ts
// POST — receive a lead from the public quote form. FREE. No OpenSolar call.

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { sendNewLeadAlert } from "@/lib/email"

const Schema = z.object({
  firstName:       z.string().min(1).max(100),
  lastName:        z.string().min(1).max(100),
  email:           z.string().email(),
  phone:           z.string().min(8).max(20),
  address:         z.string().min(5).max(300),
  suburb:          z.string().min(2).max(100),
  state:           z.enum(["NSW", "VIC", "QLD", "SA", "WA", "TAS", "ACT", "NT"]),
  postcode:        z.string().regex(/^\d{4}$/),
  annualBillAud:   z.number().min(0).max(50000).optional(),
  roofType:        z.enum(["tile", "metal", "flat", "other"]).optional(),
  storeys:         z.number().min(1).max(10).optional(),
  notes:           z.string().max(2000).optional(),
  nmiNumber:       z.string().regex(/^\d{10,11}$/).optional(),
  nmiConsentAt:    z.string().datetime().optional(),
  nmiSignatureB64: z.string().max(200_000).optional(),
  advisorAnswers:  z.string().max(5000).optional(),
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
      nmiConsentAt: parsed.data.nmiConsentAt ? new Date(parsed.data.nmiConsentAt) : undefined,
      status:       recentDuplicate ? "duplicate" : "pending_review",
      leadSource:   "website",
      auditLog: {
        create: {
          action: "lead_received",
          actor:  "system",
          detail: JSON.stringify({
            ip:          req.headers.get("x-forwarded-for") ?? "unknown",
            isDuplicate: !!recentDuplicate,
            hasNmiConsent: !!parsed.data.nmiConsentAt,
          }),
        },
      },
    },
  })

  // Fire-and-forget — don't block the response if email fails
  sendNewLeadAlert(lead).catch(console.error)

  // Call GAS createJob — creates Google Drive folder + Sheets entry + Telegram alert
  if (process.env.JOBS_GAS_URL) {
    try {
      const notesLines = [
        "📋 Solar Quote Lead (website)",
        lead.roofType ? `🏠 Roof: ${lead.roofType}${lead.storeys ? ` | ${lead.storeys} storey` : ""}` : null,
        lead.annualBillAud ? `💡 Annual bill: $${lead.annualBillAud}` : null,
        lead.nmiNumber ? `🔌 NMI: ${lead.nmiNumber} (consent: ${lead.nmiConsentAt ? "YES ✅" : "NO"})` : null,
        lead.advisorAnswers ? `🤖 Advisor: ${lead.advisorAnswers}` : null,
        lead.notes ? `📝 ${lead.notes}` : null,
      ].filter(Boolean).join("\n")

      const gasRes = await fetch(process.env.JOBS_GAS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action:        "createJob",
          clientName:    `${lead.firstName} ${lead.lastName}`,
          phone:         lead.phone,
          email:         lead.email,
          address:       `${lead.address}, ${lead.suburb} ${lead.state} ${lead.postcode}`,
          notes:         notesLines,
          estAnnualBill: lead.annualBillAud ?? "",
        }),
      })
      if (gasRes.ok) {
        const gasData = await gasRes.json()
        if (gasData.jobNumber || gasData.driveUrl) {
          await prisma.lead.update({
            where: { id: lead.id },
            data: {
              gasJobNumber: gasData.jobNumber ?? null,
              gasDriveUrl:  gasData.driveUrl  ?? null,
            },
          })
        }
      }
    } catch (err) {
      console.error("GAS createJob failed:", err)
      // Don't fail the request — lead is already saved in Prisma
    }
  }

  return NextResponse.json(
    { success: true, leadId: lead.id, proposalToken: lead.proposalToken },
    { status: 201 }
  )
}
