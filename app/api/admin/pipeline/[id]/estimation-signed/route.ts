import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, isAdminEmail } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { updateDealStage } from "@/lib/hubspot"
import { z } from "zod"

const schema = z.object({
  signedAt: z.string().datetime().optional(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }

  const { id } = await params
  const lead = await prisma.lead.findUnique({ where: { id } })
  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 })
  }

  const signedAt = parsed.data.signedAt ? new Date(parsed.data.signedAt) : new Date()

  await prisma.lead.update({
    where: { id },
    data: {
      estimationSignedAt: signedAt,
      auditLog: {
        create: {
          action: "estimation_signed",
          actor:  session!.user!.email!,
          detail: JSON.stringify({ signedAt: signedAt.toISOString() }),
        },
      },
    },
  })

  if (lead.hubSpotDealId) {
    updateDealStage(lead.hubSpotDealId, "contract").catch(console.error)
  }

  return NextResponse.json({ success: true })
}
