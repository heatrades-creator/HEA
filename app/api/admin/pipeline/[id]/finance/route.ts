import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, isAdminEmail } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { z } from "zod"

const schema = z.object({
  required: z.boolean(),
  provider: z.string().max(100).optional(),
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
      financeRequired: parsed.data.required,
      financeProvider: parsed.data.provider ?? null,
      auditLog: {
        create: {
          action: "finance_updated",
          actor:  session!.user!.email!,
          detail: JSON.stringify({
            required: parsed.data.required,
            provider: parsed.data.provider ?? null,
          }),
        },
      },
    },
  })

  return NextResponse.json({ success: true })
}
