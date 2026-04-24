import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, isAdminEmail } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { z } from "zod"

const schema = z.object({
  appointmentAt:    z.string().datetime(),
  appointmentNotes: z.string().max(2000).optional(),
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
      appointmentAt:    new Date(parsed.data.appointmentAt),
      appointmentNotes: parsed.data.appointmentNotes ?? null,
      auditLog: {
        create: {
          action: "appointment_set",
          actor:  session!.user!.email!,
          detail: JSON.stringify({ appointmentAt: parsed.data.appointmentAt }),
        },
      },
    },
  })

  return NextResponse.json({ success: true })
}
