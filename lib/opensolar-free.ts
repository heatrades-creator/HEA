// lib/opensolar-free.ts
//
// All FREE OpenSolar API interactions.
// Reads, webhook registration, stage updates.
// These may be called freely — they do not charge your wallet.

const BASE  = process.env.OPENSOLAR_BASE_URL ?? "https://api.opensolar.com"
const TOKEN = process.env.OPENSOLAR_TOKEN ?? ""
const ORG   = process.env.OPENSOLAR_ORG_ID ?? ""

function authHeaders() {
  return {
    Authorization: `Bearer ${TOKEN}`,
    "Content-Type": "application/json",
  }
}

export async function getProject(projectId: number) {
  const res = await fetch(`${BASE}/api/orgs/${ORG}/projects/${projectId}/`, {
    headers: authHeaders(),
    cache: "no-store",
  })
  if (!res.ok) throw new Error(`getProject ${projectId} failed: ${res.status}`)
  return res.json()
}

export async function getProjects(page = 1, limit = 50) {
  const res = await fetch(
    `${BASE}/api/orgs/${ORG}/projects/?page=${page}&limit=${limit}`,
    { headers: authHeaders() }
  )
  if (!res.ok) throw new Error(`getProjects failed: ${res.status}`)
  return res.json()
}

export async function updateProjectStage(
  projectId: number,
  stageId: number,
  workflowId: number
) {
  const res = await fetch(`${BASE}/api/orgs/${ORG}/projects/${projectId}/`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({
      workflow: { active_stage_id: stageId, workflow_id: workflowId },
      active_stage_id: stageId,
    }),
  })
  if (!res.ok) throw new Error(`updateProjectStage failed: ${res.status}`)
  return res.json()
}

/** Register the webhook endpoint with OpenSolar — run once during setup */
export async function registerWebhook(endpointUrl: string) {
  const res = await fetch(`${BASE}/api/orgs/${ORG}/webhooks/`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      endpoint: endpointUrl,
      headers: JSON.stringify({
        "x-opensolar-signature": process.env.OPENSOLAR_WEBHOOK_SECRET ?? "",
      }),
      enabled: true,
      debug: false,
      trigger_fields: [
        "project.system_sold",
        "project.installation_date",
        "project.stage",
        "project.customer_proposal_data",
        "project.payment_option_sold",
        "project.sold_date",
      ],
      payload_fields: ["project.*", "contact.*"],
    }),
  })
  if (!res.ok) throw new Error(`registerWebhook failed: ${res.status}`)
  return res.json()
}

/** Verify the OpenSolar API token is valid — use for health checks */
export async function verifyToken(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE}/api/orgs/${ORG}/`, {
      headers: authHeaders(),
    })
    return res.ok
  } catch {
    return false
  }
}
