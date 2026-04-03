# OpenSolar OS 3.0 Integration Spec
## HEA Group — Human-in-the-Loop API Architecture

**Version:** 2.0.0  
**Date:** April 2026  
**System:** hea-group.com.au  

---

## Prime Directive

```
The owner of this business has limited capital.
Every dollar spent is deliberate.
Every automated action that could cost money is BLOCKED until a human approves it.

You will never write code that calls a paid OpenSolar endpoint automatically.
If you find yourself writing a cron job, background sync, or auto-trigger
that touches a paid endpoint — stop and restructure.
```

---

## What This Spec Covers

This document defines the architecture for integrating HEA Group's website and admin dashboard with OpenSolar OS 3.0. It is the authoritative reference for:

- Which OpenSolar API calls cost money and which are free
- How the human confirmation gate works
- What data flows where and when
- How costs are tracked and audited

---

## API Cost Classification

### PAID Actions (require human confirmation before firing)

| Action | Function | Env Key | Notes |
|--------|----------|---------|-------|
| Create project | `createProject()` in `lib/opensolar.ts` | `OPENSOLAR_API_COST_PER_PROJECT` | Fires when admin confirms a lead |
| Enable Premium Imagery | `enablePremiumImagery()` in `lib/opensolar.ts` | `OPENSOLAR_PREMIUM_IMAGERY_COST` | Per-project Nearmap fee |
| Order Permit Pack | `orderPermitPack()` in `lib/opensolar.ts` | `OPENSOLAR_PERMITTING_COST` | Per-package, AU compliance required |

**Rule:** If `OPENSOLAR_API_COST_PER_PROJECT` is not set or is `"0"`, the confirm button is disabled. The system will never fire a paid call with an unknown cost.

### FREE Actions (may be called without human confirmation)

| Action | Function | Notes |
|--------|----------|-------|
| Read project | `getProject()` in `lib/opensolar-free.ts` | No charge |
| List projects | `getProjects()` in `lib/opensolar-free.ts` | No charge |
| Update project stage | `updateProjectStage()` in `lib/opensolar-free.ts` | No charge |
| Register webhook | `registerWebhook()` in `lib/opensolar-free.ts` | Run once during setup |
| Verify token | `verifyToken()` in `lib/opensolar-free.ts` | No charge |
| Receive webhooks | `/api/webhooks/opensolar` | OpenSolar pushes events to you — no charge |

---

## Human Confirmation Gate — Full Flow

```
1. Visitor fills in quote form at /quote
   → POST /api/leads
   → Lead saved to SQLite (status: "pending_review")
   → Email alert sent to admin (free)
   → NO OpenSolar call

2. Admin opens /admin/leads
   → Lead card displayed with customer details
   → "Confirm Lead" button shown

3. Admin clicks "Confirm Lead"
   → ConfirmModal opens
   → System reads OPENSOLAR_API_COST_PER_PROJECT from env
   → If cost unknown: modal shows BLOCKED state, button disabled
   → If cost known: modal shows "$X.XX AUD — this will be charged"
   → Admin must type "CONFIRM" (all caps) to enable the button

4. Admin clicks the now-enabled confirm button
   → POST /api/admin/leads/[id]/confirm
   → Server checks: is user authenticated? (Google OAuth session)
   → Server checks: is email in ADMIN_EMAILS?
   → Server checks: isSafeToFire("create_project")? (throws 503 if not)
   → Server calls createProject(lead) in lib/opensolar.ts
   → OpenSolar creates project, returns projectId + shareLink
   → Lead updated: status → "opensolar_created", openSolarProjectId set
   → AuditEntry created: action="human_confirmed", actor=adminEmail, costAud=X
   → Share link emailed to admin (free)

5. If createProject fails:
   → AuditEntry created: action="opensolar_create_failed", actor=adminEmail
   → Lead status stays "pending_review"
   → Error displayed in UI
   → Admin can retry
```

---

## Webhook Flow (Always Free)

OpenSolar pushes events to your endpoint. You only update your local DB.

```
OpenSolar fires webhook event
→ POST /api/webhooks/opensolar
→ HMAC signature verified (rejects if invalid)
→ Lead looked up by openSolarProjectId
→ Milestone timestamps updated in DB (free)
→ AuditEntry created: costAud = null (always)
→ Email/SMS alert to staff if significant milestone
→ Response: { ok: true }

CRITICAL: The webhook handler NEVER calls any function in lib/opensolar.ts
          NEVER calls any paid endpoint in response to a webhook
```

---

## Cost Protection Architecture

### lib/cost.ts — Single Source of Truth

All cost logic lives here. No other file hardcodes dollar amounts.

```typescript
// The only safe way to check before firing a paid call:
if (!isSafeToFire("create_project")) {
  return 503 with COST_UNKNOWN error
}
```

### lib/opensolar.ts — PAID Calls Only

- This file is the **only** place paid OpenSolar calls are made
- Every function calls `isSafeToFire()` as its first line
- **Importing this file outside of `/app/api/admin/` is a bug**
- The file header comment says this explicitly

### lib/opensolar-free.ts — Free Reads Only

- All free OpenSolar reads and write operations
- May be imported from anywhere
- No cost checks needed

---

## Confirm Modal — UI Contract

The ConfirmModal component must satisfy all of these states:

### State 1: Cost Unknown (BLOCKED)
```
┌─────────────────────────────────────────────┐
│ ⚠️  Cannot Confirm Lead                      │
│                                             │
│ API cost is not configured.                 │
│                                             │
│ Set OPENSOLAR_API_COST_PER_PROJECT in       │
│ .env.local — check OpenSolar:               │
│ Control → Connect → API Access              │
│                                             │
│ [Cancel]  [Confirm — DISABLED]              │
└─────────────────────────────────────────────┘
```

### State 2: Cost Known, Awaiting Confirmation
```
┌─────────────────────────────────────────────┐
│ Confirm Lead: Jane Smith                    │
│                                             │
│ This will create a project in OpenSolar.   │
│ Cost: $5.00 AUD (charged to your wallet)   │
│                                             │
│ Type CONFIRM to proceed:                    │
│ [____________]                              │
│                                             │
│ [Cancel]  [Confirm — DISABLED until typed] │
└─────────────────────────────────────────────┘
```

### State 3: Ready to Fire
```
│ [Cancel]  [✓ Confirm — $5.00 AUD]          │
```

### State 4: Loading
```
│ [Cancel]  [Creating project…]               │
```

---

## Audit Log Contract

Every significant action must create an AuditEntry with:

| Field | Paid Action | Free Action |
|-------|------------|-------------|
| `action` | `"human_confirmed"` | `"lead_received"`, `"webhook_received"`, etc. |
| `actor` | admin email address | `"system"` or `"opensolar_webhook"` |
| `costAud` | actual dollar amount | `null` — always null for free actions |
| `detail` | JSON with projectId, error, etc. | JSON with relevant context |

**Rule:** costAud must never be `0` for paid actions. Use `null` for free, actual amount for paid.

---

## Ada Widget (AI Lead Gen) — HOLD

The Ada widget (OpenSolar's AI lead gen chat) is currently **disabled**.

**Do not enable until confirmed:**
- Ask OpenSolar support: "Does AI Lead Gen create a project (paid) or a contact (free) when a lead submits?"
- If it creates a project: the widget cannot be used until the human gate is wired to intercept it
- If it only creates a contact: widget may be enabled safely

Environment variable: `ADA_WIDGET_ENABLED` — defaults to `"false"`. Only set to `"true"` after confirmation.

---

## Environment Variables

```env
# Cost values — get exact AUD from OpenSolar: Control → Connect → API Access
OPENSOLAR_API_COST_PER_PROJECT="0"    # If 0 or unset, confirm button is DISABLED
OPENSOLAR_PREMIUM_IMAGERY_COST="0"    # Per-project Nearmap fee
OPENSOLAR_PERMITTING_COST="0"         # Per permit package

# Credentials
OPENSOLAR_BASE_URL="https://api.opensolar.com"
OPENSOLAR_TOKEN=""
OPENSOLAR_ORG_ID=""
OPENSOLAR_WEBHOOK_SECRET=""           # openssl rand -hex 32

# Admin access (comma-separated email addresses)
ADMIN_EMAILS="owner@hea-group.com.au"

# Ada widget — LEAVE FALSE until confirmed with OpenSolar
ADA_WIDGET_ENABLED="false"
ADA_WIDGET_EMBED_CODE=""
```

---

## Explicit Prohibition List

Do not build any of the following:

```
❌ Background job syncing leads to OpenSolar automatically
❌ Cron task that calls lib/opensolar.ts
❌ "Confirm all" or bulk confirm button
❌ Any route calling createProject() without isSafeToFire() check
❌ Any route calling createProject() without authenticated session
❌ OpenSolar SDK embed (@opensolar/ossdk-react)
❌ Xero/QuickBooks connector
❌ AI-based lead scoring that auto-promotes leads
❌ Sending customer data to any third party not in this spec
❌ localStorage or sessionStorage in any component
```

---

## Definition of Done

- [ ] Public quote form captures leads to SQLite
- [ ] Admin login (Google OAuth, email in ADMIN_EMAILS)
- [ ] Lead queue shows pending leads
- [ ] Confirm modal shows cost or BLOCKED state
- [ ] Typing "CONFIRM" enables the confirm button
- [ ] Confirmed lead creates OpenSolar project (or fails safely with audit log)
- [ ] Webhook receiver updates lead milestones
- [ ] Audit log shows all actions with cost column
- [ ] Dashboard shows monthly API spend total
- [ ] All env vars documented and checked on startup
- [ ] Test protocol passes with invalid credentials
- [ ] No import of `lib/opensolar.ts` outside `/app/api/admin/`
- [ ] `ADA_WIDGET_ENABLED` defaults to `"false"`
