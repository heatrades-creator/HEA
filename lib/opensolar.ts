// lib/opensolar.ts
//
// THIS FILE CONTAINS ONLY PAID OPENSOLAR API CALLS.
//
// These functions MUST ONLY be called from admin confirm endpoints.
// Any direct import of this file outside of /app/api/admin/ is a bug.
// Every function calls isSafeToFire() as its first operation.
//
// Paid actions in this file:
//   createProject()         — charges OPENSOLAR_API_COST_PER_PROJECT
//   enablePremiumImagery()  — charges OPENSOLAR_PREMIUM_IMAGERY_COST
//   orderPermitPack()       — charges OPENSOLAR_PERMITTING_COST (stub)

import { getCost, isSafeToFire, getCostSnapshot } from "./cost"
import { openSolarHeaders } from "./opensolar-auth"

const BASE = process.env.OPENSOLAR_BASE_URL ?? "https://api.opensolar.com"
const ORG  = process.env.OPENSOLAR_ORG_ID ?? ""

// Roof type ID map for AU (verify these IDs in your OpenSolar account)
const ROOF_TYPE_MAP: Record<string, number> = {
  tile:  1,
  metal: 2,
  flat:  3,
  other: 6,
}

// ─── PAID ACTION 1: Create Project ────────────────────────────────────────────

export async function createProject(lead: {
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  suburb: string
  state: string
  postcode: string
  annualBillAud?: number | null
  roofType?: string | null
  storeys?: number | null
  notes?: string | null
  leadSource: string
}): Promise<{
  projectId: number
  shareLink: string
  costAud: number
  costSnapshot: string
}> {
  if (!isSafeToFire("create_project")) {
    throw new Error(
      "create_project blocked: OPENSOLAR_API_COST_PER_PROJECT not configured."
    )
  }

  if (!ORG) {
    throw new Error("create_project blocked: OPENSOLAR_ORG_ID not configured.")
  }

  const cost = getCost("create_project")
  const headers = await openSolarHeaders()

  const roofTypeUrl = lead.roofType
    ? `${BASE}/api/roof_types/${ROOF_TYPE_MAP[lead.roofType] ?? 1}/`
    : undefined

  const body: Record<string, unknown> = {
    is_residential: "1",
    lead_source: lead.leadSource,
    address: lead.address,
    locality: lead.suburb,
    state: lead.state,
    zip: lead.postcode,
    country_iso2: "AU",
    notes: lead.notes ?? "",
    contacts_new: [
      {
        first_name: lead.firstName,
        family_name: lead.lastName,
        email: lead.email,
        phone: lead.phone,
      },
    ],
  }

  if (lead.storeys) body.number_of_storeys = String(lead.storeys)
  if (roofTypeUrl)  body.roof_type = roofTypeUrl
  if (lead.annualBillAud) {
    body.usage = { usage_data_source: "bill_annual", values: lead.annualBillAud }
  }

  const res = await fetch(`${BASE}/api/orgs/${ORG}/projects/`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`OpenSolar createProject failed (${res.status}): ${err}`)
  }

  const data = await res.json()

  return {
    projectId:    data.id,
    shareLink:    data.share_link ?? "",
    costAud:      cost.amountAud!,
    costSnapshot: getCostSnapshot("create_project"),
  }
}

// ─── PAID ACTION 2: Enable Premium Imagery ────────────────────────────────────

export async function enablePremiumImagery(
  projectId: number
): Promise<{ costAud: number; costSnapshot: string }> {
  if (!isSafeToFire("premium_imagery")) {
    throw new Error(
      "premium_imagery blocked: OPENSOLAR_PREMIUM_IMAGERY_COST not configured."
    )
  }

  if (!ORG) {
    throw new Error("premium_imagery blocked: OPENSOLAR_ORG_ID not configured.")
  }

  const cost = getCost("premium_imagery")
  const headers = await openSolarHeaders()

  const res = await fetch(`${BASE}/api/orgs/${ORG}/projects/${projectId}/`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ activate_premium_imagery: true }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`enablePremiumImagery failed (${res.status}): ${err}`)
  }

  return {
    costAud:      cost.amountAud!,
    costSnapshot: getCostSnapshot("premium_imagery"),
  }
}

// ─── PAID ACTION 3: Order Permit Pack ─────────────────────────────────────────
//
// STUB — implementation intentionally incomplete.
// Confirm the exact API endpoint with OpenSolar support before implementing.
// Do NOT guess the endpoint.

export async function orderPermitPack(
  _projectId: number
): Promise<{ costAud: number; costSnapshot: string }> {
  if (!isSafeToFire("permit_pack")) {
    throw new Error(
      "permit_pack blocked: OPENSOLAR_PERMITTING_COST not configured."
    )
  }

  // TODO: Confirm exact endpoint with OpenSolar support.
  // Endpoint likely: POST /api/orgs/:org_id/projects/:id/permitting/
  // Also confirm: is the AU permitting partner operational in Victoria?
  throw new Error(
    "orderPermitPack: Confirm exact permitting API endpoint with OpenSolar support " +
    "before implementing. Do not guess the endpoint."
  )
}
