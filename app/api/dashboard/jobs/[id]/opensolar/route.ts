import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getProject } from '@/lib/opensolar-free'

type Params = { params: Promise<{ id: string }> }

// GET — returns linked OpenSolar project data for a GAS job
export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: jobNumber } = await params

  // 1. Check Lead record first
  const lead = await prisma.lead.findFirst({ where: { gasJobNumber: jobNumber } })

  // 2. Fall back to SystemConfig for jobs without a Lead
  let projectId: number | null = lead?.openSolarProjectId ?? null
  let shareLink: string | null = lead?.openSolarShareLink ?? null
  let systemKw: number | null  = lead?.openSolarSystemKw ?? null
  let outputKwh: number | null = lead?.openSolarOutputKwh ?? null

  if (!projectId) {
    const config = await prisma.systemConfig.findUnique({
      where: { key: `opensolar_link_${jobNumber}` },
    })
    if (config?.value) {
      try {
        const stored = JSON.parse(config.value) as {
          projectId?: number; shareLink?: string; systemKw?: number; outputKwh?: number
        }
        projectId  = stored.projectId  ?? null
        shareLink  = stored.shareLink  ?? null
        systemKw   = stored.systemKw   ?? null
        outputKwh  = stored.outputKwh  ?? null
      } catch {}
    }
  }

  // 3. If we have a project ID, fetch live data from the free OpenSolar API
  let liveProject: Record<string, unknown> | null = null
  if (projectId) {
    try {
      liveProject = await getProject(projectId)
    } catch {
      // Non-fatal — return cached data if live fetch fails
    }
  }

  return NextResponse.json({
    projectId,
    shareLink,
    systemKw,
    outputKwh,
    // Lead-sourced site data (helps fill the Ada packet)
    suburb:          lead?.suburb          ?? null,
    state:           lead?.state           ?? null,
    postcode:        lead?.postcode        ?? null,
    roofType:        lead?.roofType        ?? null,
    storeys:         lead?.storeys         ?? null,
    occupants:       lead?.occupants       ?? null,
    ev:              lead?.ev              ?? null,
    financeRequired: lead?.financeRequired ?? null,
    phases:          null, // not stored yet — user fills manually
    liveProject,
  })
}

// POST — links an OpenSolar project ID to a GAS job
export async function POST(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: jobNumber } = await params
  const body = await req.json() as { projectId?: unknown; shareLink?: unknown }

  const projectId = typeof body.projectId === 'number' ? body.projectId
    : typeof body.projectId === 'string'  ? parseInt(body.projectId, 10)
    : null

  if (!projectId || isNaN(projectId)) {
    return NextResponse.json({ error: 'projectId (number) required' }, { status: 400 })
  }

  const shareLink = typeof body.shareLink === 'string' ? body.shareLink : null

  // Fetch live data from OpenSolar to cache system size + output
  let systemKw: number | null  = null
  let outputKwh: number | null = null
  let liveProject: Record<string, unknown> | null = null

  try {
    liveProject = await getProject(projectId)
    // OpenSolar returns system_size in kW at project level when a system exists
    const kw = (liveProject as any)?.system_size ?? (liveProject as any)?.systems?.[0]?.size
    if (typeof kw === 'number') systemKw = kw
    const kwh = (liveProject as any)?.output_annual_kwh ?? (liveProject as any)?.systems?.[0]?.output_annual_kwh
    if (typeof kwh === 'number') outputKwh = kwh
  } catch {
    // Non-fatal — we still save the project ID even if live fetch fails
  }

  const resolvedShareLink = shareLink
    ?? (typeof (liveProject as any)?.share_link === 'string' ? (liveProject as any).share_link : null)

  // Update Lead if one exists for this job
  const lead = await prisma.lead.findFirst({ where: { gasJobNumber: jobNumber } })
  if (lead) {
    await prisma.lead.update({
      where: { id: lead.id },
      data: {
        openSolarProjectId: projectId,
        openSolarShareLink: resolvedShareLink,
        openSolarSystemKw:  systemKw,
        openSolarOutputKwh: outputKwh,
        openSolarCreatedBy: session.user?.email ?? 'dashboard',
        openSolarCreatedAt: new Date(),
        status: lead.status === 'pending_review' ? 'opensolar_created' : lead.status,
      },
    })
  } else {
    // No Lead — persist in SystemConfig
    await prisma.systemConfig.upsert({
      where:  { key: `opensolar_link_${jobNumber}` },
      update: { value: JSON.stringify({ projectId, shareLink: resolvedShareLink, systemKw, outputKwh }) },
      create: { key: `opensolar_link_${jobNumber}`, value: JSON.stringify({ projectId, shareLink: resolvedShareLink, systemKw, outputKwh }) },
    })
  }

  return NextResponse.json({ projectId, shareLink: resolvedShareLink, systemKw, outputKwh, liveProject })
}
