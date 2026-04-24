import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, isAdminEmail } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { z } from "zod"

const schema = z.object({
  confirmed: z.boolean(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }

  const { id } = await params
  const lead = await prisma.lead.findUnique({ where: { id } })
  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 })
  }

  await prisma.lead.update({
    where: { id },
    data: {
      stockConfirmed: parsed.data.confirmed,
      auditLog: {
        create: {
          action: "stock_confirmed",
          actor:  session!.user!.email!,
          detail: JSON.stringify({ confirmed: parsed.data.confirmed }),
        },
      },
    },
  })

  return NextResponse.json({ success: true })
}
