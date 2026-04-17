// app/api/admin/leads/[id]/confirm/route.ts
//
// POST — PAID ACTION. Human-confirmed project creation in OpenSolar.
//
// Safety gates (in order):
//   1. Auth: must have valid Google session
//   2. Admin check: email must be in ADMIN_EMAILS
//   3. Cost gate: isSafeToFire("create_project") must be true
//   4. Lead state: must be "pending_review"
//   5. createProject() call — only then does money move

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, isAdminEmail } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { createProject } from "@/lib/opensolar"
import { isSafeToFire, getCost } from "@/lib/cost"
import { sendJobConfirmedAlert } from "@/lib/email"
import { updateDealStage } from "@/lib/hubspot"

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 1 + 2. Auth & admin check
  const session = await getServerSession(authOptions)
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // 3. Cost gate — checked before loading the lead
  if (!isSafeToFire("create_project")) {
    const cost = getCost("create_project")
    return NextResponse.json(
      { error: cost.blockedReason, code: "COST_UNKNOWN" },
      { status: 503 }
    )
  }

  const { id } = await params

  // 4. Load & validate lead state
  const lead = await prisma.lead.findUnique({ where: { id } })
  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 })
  }
  if (lead.status !== "pending_review") {
    return NextResponse.json(
      {
        error: `Lead is "${lead.status}" — cannot confirm again.`,
        code: "INVALID_STATE",
      },
      { status: 409 }
    )
  }

  // 5. Fire paid API call
  let result: Awaited<ReturnType<typeof createProject>>
  try {
    result = await createProject(lead)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    await prisma.auditEntry.create({
      data: {
        leadId: lead.id,
        action: "opensolar_create_failed",
        actor:  session!.user!.email!,
        detail: JSON.stringify({ error: message }),
      },
    })
    return NextResponse.json(
      { error: message, code: "OPENSOLAR_ERROR" },
      { status: 502 }
    )
  }

  // 6. Update DB with success
  await prisma.lead.update({
    where: { id: lead.id },
    data: {
      status:              "opensolar_created",
      openSolarProjectId:  result.projectId,
      openSolarShareLink:  result.shareLink,
      openSolarCreatedAt:  new Date(),
      openSolarCreatedBy:  session!.user!.email!,
      apiCostAud:          result.costAud,
      apiCostSnapshot:     result.costSnapshot,
      auditLog: {
        create: {
          action:  "human_confirmed",
          actor:   session!.user!.email!,
          detail:  JSON.stringify({
            openSolarProjectId: result.projectId,
            shareLink:          result.shareLink,
          }),
          costAud: result.costAud,
        },
      },
    },
  })

  // 7. Notify staff + update HubSpot deal stage (both fire-and-forget)
  sendJobConfirmedAlert(lead, result.shareLink).catch(console.error)
  if (lead.hubSpotDealId) {
    updateDealStage(lead.hubSpotDealId, "design").catch(console.error)
  }

  return NextResponse.json({
    success:           true,
    openSolarProjectId: result.projectId,
    shareLink:          result.shareLink,
    costAud:            result.costAud,
  })
}
