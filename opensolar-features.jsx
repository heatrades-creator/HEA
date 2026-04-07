/**
 * opensolar-features.jsx
 *
 * Research artifact: All 14 OpenSolar OS 3.0 features mapped to HEA Group's
 * system with phase, priority, cost classification, and implementation notes.
 *
 * PHASES:
 *   1 = Foundation (build now — core CRM + paid project creation)
 *   2 = Growth (enable when business is running — free features)
 *   3 = Scale (enable when volume justifies per-use cost)
 *
 * COST TYPES:
 *   free             = no charge to OpenSolar wallet
 *   paid_per_project = charged once per project creation
 *   paid_per_order   = charged per order/package
 *   transaction_fee  = percentage fee per payment collected
 *   subscription     = monthly platform fee (not applicable — HEA on pay-per-use)
 */

export const OPENSOLAR_FEATURES = [
  // ─── PHASE 1: FOUNDATION ────────────────────────────────────────────────────

  {
    id: "project_creation",
    name: "Project Creation via API",
    phase: 1,
    priority: "critical",
    costType: "paid_per_project",
    envKey: "OPENSOLAR_API_COST_PER_PROJECT",
    status: "implemented",
    humanGateRequired: true,
    description:
      "Creates a new project in OpenSolar from a qualified lead. " +
      "This is the core paid action — every project created charges the wallet. " +
      "Requires human confirmation with cost display before firing.",
    heaMapping: {
      trigger: "Admin clicks Confirm on a pending lead",
      function: "createProject() in lib/opensolar.ts",
      dataFlow: "Lead (Prisma) → OpenSolar project → openSolarProjectId stored on Lead",
      auditAction: "human_confirmed",
    },
    implementationNotes:
      "Fully implemented with isSafeToFire() guard. " +
      "Cost unknown → button disabled. Admin must type CONFIRM.",
  },

  {
    id: "webhook_receiver",
    name: "Webhooks (Event Receiver)",
    phase: 1,
    priority: "critical",
    costType: "free",
    envKey: null,
    status: "implemented",
    humanGateRequired: false,
    description:
      "OpenSolar pushes project events to your endpoint. " +
      "Used to update milestone timestamps (sold, installed, stage changes). " +
      "Always free — you receive, never pay for webhooks.",
    heaMapping: {
      trigger: "OpenSolar fires event",
      function: "POST /api/webhooks/opensolar",
      dataFlow: "OS event → Lead milestone timestamps updated in Prisma",
      auditAction: "webhook_received / job_sold / job_installed / etc.",
    },
    implementationNotes:
      "HMAC signature verified on every request. " +
      "Webhook handler NEVER calls lib/opensolar.ts (no paid calls on webhook receipt).",
  },

  {
    id: "proposal_share_link",
    name: "Customer Proposal Share Link",
    phase: 1,
    priority: "critical",
    costType: "free",
    envKey: null,
    status: "implemented",
    humanGateRequired: false,
    description:
      "OpenSolar returns a share link when a project is created. " +
      "Customer can view the proposal, financing options, and sign online. " +
      "Link stored on Lead and can be emailed to customer.",
    heaMapping: {
      trigger: "Returned from createProject() — no separate API call needed",
      function: "shareLink field on Lead model",
      dataFlow: "createProject response → Lead.openSolarShareLink",
      auditAction: "proposal_sent (when email delivered)",
    },
    implementationNotes:
      "Customer proposal status page at /proposal/[token] shows milestones " +
      "fed by webhooks. Never exposes OpenSolar internals to customer.",
  },

  // ─── PHASE 2: GROWTH ────────────────────────────────────────────────────────

  {
    id: "ada_ai_lead_gen",
    name: "AI Lead Gen (Ada Widget)",
    phase: 2,
    priority: "high",
    costType: "free",
    envKey: null,
    status: "disabled",
    humanGateRequired: false,
    description:
      "OpenSolar's AI chat widget for lead capture on your website. " +
      "Customers interact with an AI that qualifies them and captures their details. " +
      "IMPORTANT: Confirm with OpenSolar whether the widget auto-creates a billable " +
      "project (paid) or only a contact record (free) before enabling.",
    heaMapping: {
      trigger: "ADA_WIDGET_ENABLED=true in .env",
      function: "AdaWidget component in components/public/AdaWidget.tsx",
      dataFlow: "Widget embed → OpenSolar captures lead → webhook fires to /api/webhooks/opensolar",
      auditAction: "lead_received (if webhook-based)",
    },
    implementationNotes:
      "Currently DISABLED. Set ADA_WIDGET_ENABLED=false in .env. " +
      "Do not enable until OpenSolar support confirms: " +
      "'Does AI Lead Gen create a project (charged) or a contact (free)?'",
    warningMessage:
      "DO NOT enable until you confirm with OpenSolar support whether the Ada widget " +
      "auto-creates a billable project. Ask: 'Does AI Lead Gen create a project or a contact?'",
  },

  {
    id: "auto_design",
    name: "Auto Design (Ada AI)",
    phase: 2,
    priority: "high",
    costType: "free",
    envKey: null,
    status: "available",
    humanGateRequired: false,
    description:
      "AI-powered automatic system design within OpenSolar. " +
      "Once a project exists, OpenSolar's Ada AI can auto-generate a system design " +
      "using satellite imagery and consumption data. Used internally by staff.",
    heaMapping: {
      trigger: "Staff action within OpenSolar UI (not triggered via API by HEA system)",
      function: "N/A — OpenSolar internal feature",
      dataFlow: "Staff opens project in OpenSolar → clicks Auto Design",
      auditAction: "N/A",
    },
    implementationNotes:
      "Enable in OpenSolar account settings. No API cost. " +
      "Not triggered by HEA's system — staff use it directly in OpenSolar UI.",
  },

  {
    id: "cashflow_payments",
    name: "CashFlow Payments",
    phase: 2,
    priority: "medium",
    costType: "transaction_fee",
    envKey: null,
    status: "available",
    humanGateRequired: false,
    description:
      "OpenSolar's payment collection system. Customers pay deposits and final " +
      "payments through OpenSolar's payment portal. HEA pays a transaction fee " +
      "per payment collected (not a per-project fee).",
    heaMapping: {
      trigger: "Customer clicks 'Pay' in their proposal",
      function: "OpenSolar handles payment UI",
      dataFlow: "Payment confirmed → webhook fires → Lead.depositPaidAt updated",
      auditAction: "deposit_paid",
    },
    implementationNotes:
      "Activate in OpenSolar settings. Transaction fee percentage — " +
      "confirm rate with OpenSolar. No API integration needed from HEA side. " +
      "Webhook handles payment confirmation.",
  },

  {
    id: "integrated_finance",
    name: "Integrated Finance (Brighte / HandyPay)",
    phase: 2,
    priority: "medium",
    costType: "free",
    envKey: null,
    status: "available",
    humanGateRequired: false,
    description:
      "Embed Brighte and HandyPay finance options directly in OpenSolar proposals. " +
      "Customers can apply for finance within the proposal. No cost to HEA to embed. " +
      "Finance provider handles the application.",
    heaMapping: {
      trigger: "Customer views proposal and selects finance option",
      function: "OpenSolar handles finance embed",
      dataFlow: "Finance approved → webhook → Lead.financeApprovedAt updated",
      auditAction: "finance_approved",
    },
    implementationNotes:
      "Activate each lender separately in OpenSolar → Control → Finance. " +
      "No API integration needed. Webhook fires on approval.",
  },

  {
    id: "esignature",
    name: "E-signature & Contract Signing",
    phase: 2,
    priority: "high",
    costType: "free",
    envKey: null,
    status: "available",
    humanGateRequired: false,
    description:
      "Customers e-sign the contract directly within the OpenSolar proposal. " +
      "Free feature — no per-signature cost. " +
      "Note: Confirm AU electronic signature law applies to your contract type.",
    heaMapping: {
      trigger: "Customer signs in proposal",
      function: "OpenSolar handles signature UI",
      dataFlow: "Signature captured → webhook → Lead.contractSignedAt updated",
      auditAction: "contract_signed",
    },
    implementationNotes:
      "Enable in OpenSolar proposal settings. Free. " +
      "Confirm Electronic Transactions Act (Cth) 1999 covers your contract type.",
  },

  // ─── PHASE 3: SCALE ─────────────────────────────────────────────────────────

  {
    id: "premium_imagery",
    name: "Premium Imagery (Nearmap)",
    phase: 3,
    priority: "medium",
    costType: "paid_per_project",
    envKey: "OPENSOLAR_PREMIUM_IMAGERY_COST",
    status: "available",
    humanGateRequired: true,
    description:
      "High-resolution Nearmap satellite imagery for accurate roof mapping. " +
      "Per-project fee charged to OpenSolar wallet. Requires human confirmation " +
      "before each activation. Only justified for complex roofs or large systems.",
    heaMapping: {
      trigger: "Admin explicitly requests premium imagery for a specific project",
      function: "enablePremiumImagery() in lib/opensolar.ts",
      dataFlow: "Admin confirms → Nearmap activated on project → design accuracy improves",
      auditAction: "premium_imagery_requested",
    },
    implementationNotes:
      "Implement human confirmation gate identical to project creation. " +
      "Only available from /admin/jobs/[id] detail page. " +
      "Set OPENSOLAR_PREMIUM_IMAGERY_COST in .env before enabling.",
    warningMessage:
      "REQUIRES human confirmation gate. Per-project cost — ensure OPENSOLAR_PREMIUM_IMAGERY_COST is set.",
  },

  {
    id: "on_demand_permitting",
    name: "On-demand Permitting",
    phase: 3,
    priority: "low",
    costType: "paid_per_order",
    envKey: "OPENSOLAR_PERMITTING_COST",
    status: "stub_only",
    humanGateRequired: true,
    description:
      "OpenSolar's permitting partner handles permit applications and engineering " +
      "packages. Per-package fee. Requires explicit order from admin. " +
      "Confirm AU compliance and partner availability in your state.",
    heaMapping: {
      trigger: "Admin orders permit package for a specific project",
      function: "orderPermitPack() in lib/opensolar.ts (stub — needs API endpoint confirmation)",
      dataFlow: "Admin confirms → permit order placed → engineering package delivered",
      auditAction: "permit_pack_requested",
    },
    implementationNotes:
      "Function is a stub — confirm exact API endpoint with OpenSolar support " +
      "before implementing. Likely: POST /api/orgs/:org_id/projects/:id/permitting/ " +
      "Must confirm AU permitting partner availability. Set OPENSOLAR_PERMITTING_COST in .env.",
    warningMessage:
      "STUB ONLY. Confirm exact permitting API endpoint with OpenSolar support. " +
      "Also confirm AU permitting partner covers Victoria (VIC).",
  },

  {
    id: "supplier_assist",
    name: "Supplier Assist",
    phase: 3,
    priority: "low",
    costType: "free",
    envKey: null,
    status: "available",
    humanGateRequired: false,
    description:
      "Connects OpenSolar to AU solar distributors for real-time pricing and " +
      "availability. Very new feature. Confirm your AU distributor is onboarded " +
      "with OpenSolar before enabling.",
    heaMapping: {
      trigger: "Staff uses supplier pricing in system design",
      function: "OpenSolar internal feature",
      dataFlow: "Staff designs system → supplier pricing displayed in UI",
      auditAction: "N/A",
    },
    implementationNotes:
      "Confirm distributor onboarding with OpenSolar. Free to enable. " +
      "No API integration needed from HEA side.",
    warningMessage:
      "Very new feature. Confirm your AU distributor is onboarded with OpenSolar before enabling.",
  },

  // ─── REFERENCE: FEATURES NOT APPLICABLE ────────────────────────────────────

  {
    id: "opensolar_sdk",
    name: "OpenSolar SDK Embed (@opensolar/ossdk-react)",
    phase: null,
    priority: "excluded",
    costType: "subscription",
    envKey: null,
    status: "excluded",
    humanGateRequired: false,
    description:
      "Full OpenSolar UI embed into HEA's website. Requires commercial contract. " +
      "Not appropriate for this integration — HEA uses the API directly.",
    heaMapping: null,
    implementationNotes: "EXCLUDED. Do not implement.",
  },

  {
    id: "xero_connector",
    name: "Xero/QuickBooks Connector",
    phase: null,
    priority: "excluded",
    costType: "subscription",
    envKey: null,
    status: "excluded",
    humanGateRequired: false,
    description: "Now a paid monthly connector. Not cost-effective at current volume.",
    heaMapping: null,
    implementationNotes: "EXCLUDED. Do not implement.",
  },

  {
    id: "bulk_operations",
    name: "Bulk Operations / Auto-Confirm",
    phase: null,
    priority: "excluded",
    costType: "paid_per_project",
    envKey: null,
    status: "excluded",
    humanGateRequired: false,
    description:
      "Bulk confirming or auto-confirming multiple leads at once. " +
      "Prohibited by the prime directive — every project creation requires " +
      "individual human confirmation.",
    heaMapping: null,
    implementationNotes:
      "EXPLICITLY PROHIBITED. The architecture must make this structurally impossible. " +
      "No bulk confirm button. No auto-confirm. Ever.",
  },
]

// ─── HELPERS ──────────────────────────────────────────────────────────────────

/** Features that are currently active and relevant */
export const ACTIVE_FEATURES = OPENSOLAR_FEATURES.filter(
  f => f.status !== "excluded"
)

/** Features that require human confirmation before use */
export const GATED_FEATURES = OPENSOLAR_FEATURES.filter(
  f => f.humanGateRequired
)

/** Features by phase */
export const FEATURES_BY_PHASE = {
  1: OPENSOLAR_FEATURES.filter(f => f.phase === 1),
  2: OPENSOLAR_FEATURES.filter(f => f.phase === 2),
  3: OPENSOLAR_FEATURES.filter(f => f.phase === 3),
}

export default OPENSOLAR_FEATURES
