// app/api/admin/leads/route.ts
// GET — list leads for the admin dashboard. Requires authentication.

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, isAdminEmail } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status") // optional filter

  const where = status ? { status } : {}

  const leads = await prisma.lead.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { auditLog: { orderBy: { createdAt: "desc" }, take: 5 } },
  })

  return NextResponse.json(leads)
}
