// app/api/admin/leads/[id]/reject/route.ts
// POST — reject a lead. FREE. No OpenSolar call.

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, isAdminEmail } from "@/lib/auth"
import { prisma } from "@/lib/db"

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
  if (lead.status !== "pending_review") {
    return NextResponse.json(
      { error: `Lead is "${lead.status}" — cannot reject.`, code: "INVALID_STATE" },
      { status: 409 }
    )
  }

  await prisma.lead.update({
    where: { id },
    data: {
      status: "rejected",
      auditLog: {
        create: {
          action: "rejected",
          actor:  session!.user!.email!,
        },
      },
    },
  })

  return NextResponse.json({ success: true })
}
