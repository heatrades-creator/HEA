// lib/hubspot.ts
// HubSpot Free CRM integration — contacts + deals mirror.
// All calls are fire-and-forget from intake/leads/webhook routes.
//
// ── SETUP ────────────────────────────────────────────────────────────────────
// 1. Create free HubSpot account → hubspot.com
// 2. Settings → Integrations → Private Apps → Create private app
//    Scopes required:
//      crm.objects.contacts.read + write
//      crm.objects.deals.read + write
//      crm.objects.associations.read + write
// 3. Copy the access token → add HUBSPOT_ACCESS_TOKEN to Vercel + .env.local
// 4. In HubSpot: Settings → CRM → Deals → Pipelines → create 7 stages:
//      New Lead | Design Requested | Proposal Sent | In Finance |
//      Contract Signed | Deposit Paid | Installed
// 5. Copy each stage's internal ID → set the optional env vars below
//    (if not set, defaults to HubSpot's built-in default pipeline stage IDs)
//
// Optional env vars:
//   HUBSPOT_PIPELINE_ID          — your deal pipeline ID (default: "default")
//   HUBSPOT_STAGE_NEW_LEAD       — default: "appointmentscheduled"
//   HUBSPOT_STAGE_DESIGN         — default: "qualifiedtobuy"
//   HUBSPOT_STAGE_PROPOSAL_SENT  — default: "presentationscheduled"
//   HUBSPOT_STAGE_IN_FINANCE     — default: "decisionmakerboughtin"
//   HUBSPOT_STAGE_CONTRACT       — default: "contractsent"
//   HUBSPOT_STAGE_DEPOSIT_PAID   — default: "closedwon"
//   HUBSPOT_STAGE_INSTALLED      — default: "closedwon"
// ─────────────────────────────────────────────────────────────────────────────

const BASE = "https://api.hubapi.com"

export type HubStage =
  | "new_lead"
  | "design"
  | "proposal_sent"
  | "in_finance"
  | "contract"
  | "deposit_paid"
  | "installed"

function stageId(s: HubStage): string {
  // IDs are specific to the HEA HubSpot pipeline (portal 443070630)
  const defaults: Record<HubStage, string> = {
    new_lead:      "2920893897",
    design:        "2920893898",
    proposal_sent: "2920893899",
    in_finance:    "2920893900",
    contract:      "closedwon",
    deposit_paid:  "2920893903",
    installed:     "2920893904",
  }
  const envKey: Record<HubStage, string> = {
    new_lead:      "HUBSPOT_STAGE_NEW_LEAD",
    design:        "HUBSPOT_STAGE_DESIGN",
    proposal_sent: "HUBSPOT_STAGE_PROPOSAL_SENT",
    in_finance:    "HUBSPOT_STAGE_IN_FINANCE",
    contract:      "HUBSPOT_STAGE_CONTRACT",
    deposit_paid:  "HUBSPOT_STAGE_DEPOSIT_PAID",
    installed:     "HUBSPOT_STAGE_INSTALLED",
  }
  return process.env[envKey[s]] ?? defaults[s]
}

function headers() {
  return {
    Authorization: `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}`,
    "Content-Type": "application/json",
  }
}

type LeadLike = {
  firstName: string
  lastName:  string
  email:     string
  phone:     string
  address:   string
  suburb:    string
  state:     string
  postcode:  string
  notes?:    string | null
  leadSource?: string
}

// Creates or updates a HubSpot contact by email. Returns the HubSpot contact ID.
export async function upsertContact(lead: LeadLike): Promise<string | null> {
  if (!process.env.HUBSPOT_ACCESS_TOKEN) return null
  try {
    const res = await fetch(`${BASE}/crm/v3/objects/contacts/batch/upsert`, {
      method:  "POST",
      headers: headers(),
      body: JSON.stringify({
        inputs: [{
          id: lead.email,
          idProperty: "email",
          properties: {
            email:      lead.email,
            firstname:  lead.firstName,
            lastname:   lead.lastName,
            phone:      lead.phone,
            address:    `${lead.address}, ${lead.suburb} ${lead.state} ${lead.postcode}`,
            hs_lead_status: "NEW",
          },
        }],
      }),
    })
    if (!res.ok) {
      console.error("HubSpot upsertContact failed:", res.status, await res.text())
      return null
    }
    const data = await res.json()
    return data.results?.[0]?.id ?? null
  } catch (err) {
    console.error("HubSpot upsertContact error:", err)
    return null
  }
}

// Creates a new deal linked to a contact. Returns the HubSpot deal ID.
export async function createDeal(lead: LeadLike, contactId: string): Promise<string | null> {
  if (!process.env.HUBSPOT_ACCESS_TOKEN) return null
  try {
    const dealName = `${lead.firstName} ${lead.lastName} — ${lead.address}`
    const res = await fetch(`${BASE}/crm/v3/objects/deals`, {
      method:  "POST",
      headers: headers(),
      body: JSON.stringify({
        properties: {
          dealname:   dealName,
          pipeline:   process.env.HUBSPOT_PIPELINE_ID ?? "default",
          dealstage:  stageId("new_lead"),
          lead_source: lead.leadSource ?? "website",
          description: lead.notes ?? "",
        },
        associations: [{
          to:   { id: contactId },
          types: [{ associationCategory: "HUBSPOT_DEFINED", associationTypeId: 3 }],
        }],
      }),
    })
    if (!res.ok) {
      console.error("HubSpot createDeal failed:", res.status, await res.text())
      return null
    }
    const data = await res.json()
    return data.id ?? null
  } catch (err) {
    console.error("HubSpot createDeal error:", err)
    return null
  }
}

// Updates the deal stage for a given deal ID.
export async function updateDealStage(dealId: string, s: HubStage): Promise<void> {
  if (!process.env.HUBSPOT_ACCESS_TOKEN || !dealId) return
  try {
    const res = await fetch(`${BASE}/crm/v3/objects/deals/${dealId}`, {
      method:  "PATCH",
      headers: headers(),
      body: JSON.stringify({
        properties: { dealstage: stageId(s) },
      }),
    })
    if (!res.ok) {
      console.error("HubSpot updateDealStage failed:", res.status, await res.text())
    }
  } catch (err) {
    console.error("HubSpot updateDealStage error:", err)
  }
}

// Convenience: upsert contact + create deal in one call.
// Returns { contactId, dealId } — both may be null if HubSpot is not configured or fails.
export async function syncLeadToHubSpot(lead: LeadLike): Promise<{ contactId: string | null; dealId: string | null }> {
  const contactId = await upsertContact(lead)
  if (!contactId) return { contactId: null, dealId: null }
  const dealId = await createDeal(lead, contactId)
  return { contactId, dealId }
}
