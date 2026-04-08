// app/api/admin/leads/[id]/review/route.ts
// POST — send a Google review request email to the customer. FREE.

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, isAdminEmail } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { sendReviewRequest } from "@/lib/email"

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  const lead = await prisma.lead.findUnique({ where: { id } })
  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 })
  }

  await sendReviewRequest(lead)

  await prisma.auditEntry.create({
    data: {
      leadId: id,
      action: "review_requested",
      actor:  session!.user!.email!,
    },
  })

  return NextResponse.json({ success: true })
}
