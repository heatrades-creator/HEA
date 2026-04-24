// app/admin/pipeline/page.tsx
// Sales pipeline — 3 stage kanban for Alexis

import { getServerSession } from "next-auth"
import { redirect }         from "next/navigation"
import { authOptions, isAdminEmail } from "@/lib/auth"
import { prisma }           from "@/lib/db"
import { PipelineBoard }    from "@/components/admin/pipeline/PipelineBoard"
import type { Stage1Lead }  from "@/components/admin/pipeline/Stage1Card"
import type { Stage2Lead }  from "@/components/admin/pipeline/Stage2Card"
import type { Stage3Lead }  from "@/components/admin/pipeline/Stage3Card"

export const dynamic = "force-dynamic"

function iso(d: Date | null | undefined): string | null {
  return d ? d.toISOString() : null
}

export default async function PipelinePage() {
  const session = await getServerSession(authOptions)
  if (!isAdminEmail(session?.user?.email)) redirect("/dashboard/login")

  const leads = await prisma.lead.findMany({
    where: { status: { notIn: ["rejected", "duplicate"] } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, firstName: true, lastName: true, email: true, phone: true,
      address: true, suburb: true, state: true, postcode: true, status: true,
      createdAt: true, nmiNumber: true, annualBillAud: true, roofType: true,
      openSolarProjectId: true, openSolarShareLink: true, openSolarStage: true,
      openSolarSystemKw: true, openSolarPriceAud: true,
      gasDriveUrl: true,
      // Stage 1
      appointmentAt: true, appointmentNotes: true,
      solarVicEligible: true, solarVicAppliedAt: true,
      financeRequired: true, financeProvider: true,
      estimationSignedAt: true,
      // Stage 2
      stockConfirmed: true, buildDate: true, quoteSignedAt: true,
      depositAmountAud: true, depositPaidAt: true,
      // Stage 3
      installedAt: true, googleReviewReceivedAt: true, thankYouSentAt: true,
    },
  })

  const stage1Leads: Stage1Lead[] = leads
    .filter(l => !l.estimationSignedAt && !l.installedAt)
    .map(l => ({
      id:                l.id,
      firstName:         l.firstName,
      lastName:          l.lastName,
      email:             l.email,
      phone:             l.phone,
      address:           l.address,
      suburb:            l.suburb,
      state:             l.state,
      postcode:          l.postcode,
      status:            l.status,
      createdAt:         l.createdAt.toISOString(),
      nmiNumber:         l.nmiNumber,
      annualBillAud:     l.annualBillAud,
      roofType:          l.roofType,
      gasDriveUrl:       l.gasDriveUrl,
      openSolarProjectId: l.openSolarProjectId,
      openSolarShareLink: l.openSolarShareLink,
      appointmentAt:     iso(l.appointmentAt),
      appointmentNotes:  l.appointmentNotes,
      solarVicEligible:  l.solarVicEligible,
      solarVicAppliedAt: iso(l.solarVicAppliedAt),
      financeRequired:   l.financeRequired,
      financeProvider:   l.financeProvider,
    }))

  const stage2Leads: Stage2Lead[] = leads
    .filter(l => l.estimationSignedAt && !l.installedAt)
    .map(l => ({
      id:                  l.id,
      firstName:           l.firstName,
      lastName:            l.lastName,
      email:               l.email,
      phone:               l.phone,
      address:             l.address,
      suburb:              l.suburb,
      state:               l.state,
      estimationSignedAt:  l.estimationSignedAt!.toISOString(),
      openSolarProjectId:  l.openSolarProjectId,
      openSolarShareLink:  l.openSolarShareLink,
      openSolarSystemKw:   l.openSolarSystemKw,
      openSolarPriceAud:   l.openSolarPriceAud,
      gasDriveUrl:         l.gasDriveUrl,
      stockConfirmed:      l.stockConfirmed,
      buildDate:           iso(l.buildDate),
      quoteSignedAt:       iso(l.quoteSignedAt),
      depositAmountAud:    l.depositAmountAud,
      depositPaidAt:       iso(l.depositPaidAt),
    }))

  const stage3Leads: Stage3Lead[] = leads
    .filter(l => !!l.installedAt)
    .map(l => ({
      id:                      l.id,
      firstName:               l.firstName,
      lastName:                l.lastName,
      email:                   l.email,
      phone:                   l.phone,
      address:                 l.address,
      suburb:                  l.suburb,
      installedAt:             l.installedAt!.toISOString(),
      openSolarSystemKw:       l.openSolarSystemKw,
      openSolarPriceAud:       l.openSolarPriceAud,
      openSolarShareLink:      l.openSolarShareLink,
      gasDriveUrl:             l.gasDriveUrl,
      googleReviewReceivedAt:  iso(l.googleReviewReceivedAt),
      thankYouSentAt:          iso(l.thankYouSentAt),
    }))

  const total = stage1Leads.length + stage2Leads.length + stage3Leads.length

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white font-bold text-2xl">Sales Pipeline</h1>
          <p className="text-[#555] text-sm mt-0.5">{total} active leads across 3 stages</p>
        </div>
        <a
          href="/admin/leads"
          className="text-xs text-[#555] hover:text-[#aaa] transition-colors"
        >
          Lead queue →
        </a>
      </div>

      <PipelineBoard
        stage1Leads={stage1Leads}
        stage2Leads={stage2Leads}
        stage3Leads={stage3Leads}
      />
    </div>
  )
}
