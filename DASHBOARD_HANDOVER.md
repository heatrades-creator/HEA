# HEA Dashboard — AI-to-AI Handover Document
**Prepared for:** Next Claude Code session
**Date:** April 2026
**Repo:** `heatrades-creator/HEA`
**Production URL:** https://www.hea-group.com.au
**Deployed on:** Vercel (Next.js App Router)

---

## 1. Who Is This Client

**Jesse Heffernan** — owner of **Heffernan Electrical Automation (HEA)**, a solar and battery installer based in **Bendigo, Victoria, Australia**. ABN holder, REC 37307. Non-technical operator. All work is done via Claude Code on the web. The system must be simple to use and self-maintaining.

**Business contact:** hea.trades@gmail.com
**Website:** hea-group.com.au

**Prime Directive (from Jesse, non-negotiable):**
> "you fit it rather than changing it to fit you"
> "do not change any colour schemes from the current"
> "we are adding capability not changing features that are out of your scope"
> "$0 budget — be crafty with free methods. Paid features = deliberate nuke."

---

## 2. The Two Systems in This Repo

There are **two separate admin systems** coexisting in the same Next.js app:

### System A — `/dashboard` (GAS Jobs CRM — EXISTING, LOCKED)
The original HEA staff dashboard. Uses Google Sheets as database via Google Apps Script. **Do not change anything in `app/dashboard/` or `components/dashboard/` without explicit instruction.**

### System B — `/admin` (OpenSolar Integration — NEW)
A new human-in-the-loop admin dashboard for managing solar quote leads from the website. Uses Turso (SQLite) as database via Prisma. This is the active development area.

---

## 3. Full Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.1.6 App Router, TypeScript, Tailwind CSS v4 |
| Auth | NextAuth v4 — Google OAuth only |
| Database (new system) | Turso (hosted libsql/SQLite) via Prisma 7 + `@prisma/adapter-libsql` |
| Database (old system) | Google Sheets via Google Apps Script |
| Email | Resend (domain: hea-group.com.au verified) |
| Solar CRM | OpenSolar OS 3.0 API (Bearer token auth via email/password) |
| Jobs CRM | Google Apps Script web app (`JOBS_GAS_URL`) |
| Solar Analyser | Google Apps Script embedded iframe |
| AI (old system) | Gemini 2.5 Flash (free tier, document generation) |
| Deploy | Vercel — auto-deploys from `main` branch |
| Build | `prisma generate && tsx scripts/db-setup.ts && next build --turbopack` |

---

## 4. All Environment Variables (set in Vercel)

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | `libsql://hea-production-heatrades.aws-ap-northeast-1.turso.io` |
| `TURSO_AUTH_TOKEN` | Turso database auth token (secret) |
| `NEXTAUTH_SECRET` | NextAuth session secret |
| `NEXTAUTH_URL` | `https://www.hea-group.com.au` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `ADMIN_EMAILS` | Comma-separated admin email addresses |
| `ALLOWED_EMAILS` | Legacy compat — also grants access |
| `OPENSOLAR_EMAIL` | OpenSolar login email |
| `OPENSOLAR_PASSWORD` | OpenSolar login password |
| `OPENSOLAR_ORG_ID` | `220067` (from OpenSolar URL) |
| `OPENSOLAR_BASE_URL` | `https://api.opensolar.com` |
| `OPENSOLAR_API_COST_PER_PROJECT` | AUD cost per project creation (disables confirm if unset) |
| `OPENSOLAR_WEBHOOK_SECRET` | HMAC secret for webhook verification |
| `RESEND_API_KEY` | Resend API key |
| `EMAIL_FROM` | `alerts@hea-group.com.au` |
| `EMAIL_ALERT_TO` | Staff email for alerts |
| `JOBS_GAS_URL` | Google Apps Script web app URL (Jobs CRM) |

---

## 5. Architecture — New Admin System (`/admin`)

```
Visitor fills /quote form
    → POST /api/leads
    → Lead saved to Turso (SQLite) via Prisma
    → sendNewLeadAlert() fires to staff (Resend, fire-and-forget)
    → AWAIT GAS createJob call (JOBS_GAS_URL)
         → Telegram notification fires automatically
         → Google Drive folder created: "ClientName - DD-MM-YYYY"
         → Returns { jobNumber, driveUrl }
    → Lead updated with gasJobNumber + gasDriveUrl
    → Response: { success, leadId, proposalToken }

Admin opens /admin/leads (Google OAuth required, ADMIN_EMAILS)
    → Sees pending lead cards with 5 action buttons:
         ☀️ Solar Analyser  — opens /solar-analyser with customer URL params
         📅 Book Meeting    — Calendly hardcoded link
         📁 Customer Files  — Google Drive folder (from gasDriveUrl)
         🔆 OpenSolar       — direct project link (if confirmed)
         ⭐ Request Review  — emails customer Google review request

Admin clicks "Confirm Lead →"
    → ConfirmModal opens, shows cost or BLOCKED
    → Admin types "CONFIRM" to enable button
    → POST /api/admin/leads/[id]/confirm
    → isSafeToFire() checked
    → createProject() called in lib/opensolar.ts
    → OpenSolar project created, projectId saved to Lead
    → AuditEntry created with costAud
    → Admin emailed share link (Resend)

OpenSolar fires webhook events
    → POST /api/webhooks/opensolar
    → HMAC verified
    → Lead milestones updated (free, no API calls back)
    → AuditEntry created (costAud = null always)
```

---

## 6. Database Schema (Prisma / Turso)

Three models: **Lead**, **AuditEntry**, **SystemConfig**

Key Lead fields:
```
id, createdAt, updatedAt
firstName, lastName, email, phone
address, suburb, state, postcode
annualBillAud?, roofType?, storeys?, notes?
leadSource, status
openSolarProjectId?, openSolarCreatedAt?, openSolarShareLink?
openSolarStage?, openSolarSystemKw?, openSolarPriceAud?
gasJobNumber?   ← GAS job number (e.g. "TS001-0042")
gasDriveUrl?    ← Google Drive folder URL for customer files
apiCostAud?, apiCostSnapshot?
proposalSentAt?, soldAt?, installedAt? (webhook milestones)
proposalToken   (unique, for /proposal/[token] page)
```

**Important:** `prisma db push` does NOT work with `libsql://` URLs. DB creation is handled by `scripts/db-setup.ts` using `@libsql/client` directly. This runs on every deploy — it's safe to re-run (CREATE TABLE IF NOT EXISTS + ALTER TABLE in try/catch).

---

## 7. File Structure — What Matters

### Public-facing
```
app/
  page.tsx                      ← Public homepage (LOCKED)
  quote/page.tsx                ← Public solar quote form
  proposal/[token]/page.tsx     ← Customer proposal view
  solar-analyser/page.tsx       ← Solar analyser (embedded GAS iframe + customer params)
  book/page.tsx                 ← Booking page (LOCKED)

components/
  Nav.tsx                       ← Main nav (has Staff Tools panel)
  Footer.tsx, Hero.tsx, etc.    ← Public site (LOCKED)
  public/
    QuoteForm.tsx               ← The quote form component
    AdaWidget.tsx               ← OpenSolar Ada widget (DISABLED, ADA_WIDGET_ENABLED=false)
```

### New Admin System (`/admin`)
```
app/admin/
  layout.tsx                    ← Dark sidebar nav + auth gate
  page.tsx                      ← Admin home / feature overview
  leads/page.tsx                ← Lead queue (pending_review)
  jobs/page.tsx                 ← Jobs pipeline (opensolar_created)
  audit/page.tsx                ← Full audit log

components/admin/
  LeadCard.tsx                  ← Lead card with 5 action buttons
  ConfirmModal.tsx              ← Cost confirmation modal (types CONFIRM)
  CostBadge.tsx                 ← Shows API cost
  JobPipeline.tsx               ← Jobs pipeline view
  AuditLog.tsx                  ← Audit log table
  FeaturePanel.tsx              ← Admin feature overview

app/api/
  leads/route.ts                ← POST: receive lead, call GAS, save to DB
  admin/leads/route.ts          ← GET: list leads (auth required)
  admin/leads/[id]/confirm/     ← POST: create OpenSolar project (PAID, auth)
  admin/leads/[id]/reject/      ← POST: reject lead (free, auth)
  admin/leads/[id]/review/      ← POST: email customer review request (free, auth)
  admin/cost/route.ts           ← GET: current API cost config
  admin/config/route.ts         ← GET: system config
  admin/setup/webhook/          ← POST: register OpenSolar webhook
  webhooks/opensolar/route.ts   ← POST: receive OpenSolar events
  auth/[...nextauth]/route.ts   ← NextAuth handler
```

### Library
```
lib/
  auth.ts             ← NextAuth config (ADMIN_EMAILS + ALLOWED_EMAILS)
  db.ts               ← Prisma client with Turso adapter
  email.ts            ← Resend helpers (staff alerts + customer review request)
  cost.ts             ← isSafeToFire(), cost config
  cost-client.ts      ← Client-side cost helpers
  opensolar-auth.ts   ← Bearer token auth (email/password → cached JWT)
  opensolar.ts        ← PAID OpenSolar calls ONLY (createProject, etc.)
  opensolar-free.ts   ← Free OpenSolar reads (getProject, updateStage, etc.)
  webhooks.ts         ← Webhook event processing
  sanity.ts           ← Sanity CMS client (public site only, NOT dashboard)
```

### Old Dashboard System (`/dashboard`)
```
app/dashboard/
  layout.tsx, page.tsx          ← Kanban board (LOCKED)
  jobs/[id]/page.tsx            ← Job detail (LOCKED)
  login/page.tsx                ← Login (LOCKED)

components/dashboard/
  KanbanBoard.tsx, NewJobModal.tsx, JobDocuments.tsx
  ProposalUsageBadge.tsx, JobListView.tsx

app/api/jobs/
  route.ts                      ← GET/POST jobs (proxies to JOBS_GAS_URL)
  [id]/route.ts                 ← GET/PATCH single job
  [id]/documents/route.ts       ← GET/POST documents (Gemini → Slides → PDF)
  [id]/templates/route.ts       ← GET available templates
```

---

## 8. Services Integrated

### OpenSolar OS 3.0
- **Auth:** Email/password → Bearer JWT token cached in SystemConfig DB (6-day TTL)
- **Auth file:** `lib/opensolar-auth.ts` → `getOpenSolarToken()`
- **Org ID:** `220067`
- **Webhook:** Registered at `/api/webhooks/opensolar` (HMAC verified)
- **PAID calls:** Only in `lib/opensolar.ts`, always behind `isSafeToFire()` + auth
- **Free calls:** `lib/opensolar-free.ts`

### GAS Jobs System (Google Apps Script)
- **Used for:** Jobs CRM (Google Sheets + Drive), Telegram alerts, document generation
- **Key action:** `createJob` POST → creates Drive folder + Sheets entry + Telegram alert → returns `{ jobNumber, driveUrl }`
- **Drive folder naming:** `{ClientName} - {DD-MM-YYYY}` inside unified client folder (`CLIENTS_FOLDER_ID`)
- **Auto-deploy:** Clasp + GitHub Actions pushes code changes automatically on every push to `main` — see Section 16

### Turso (SQLite)
- **URL:** `libsql://hea-production-heatrades.aws-ap-northeast-1.turso.io`
- **DB creation:** `scripts/db-setup.ts` (NOT prisma db push — doesn't work with libsql://)

### Resend (Email)
- **Domain:** hea-group.com.au (verified)
- **FROM:** `alerts@hea-group.com.au`
- **Staff alerts:** new lead, job confirmed
- **Customer emails:** Google review request (`sendReviewRequest()` in `lib/email.ts`)

### NextAuth (Google OAuth)
- **Access control:** `ADMIN_EMAILS` env var + `ALLOWED_EMAILS` for compat
- **isAdminEmail()** in `lib/auth.ts` is the gate for all admin routes

### Hardcoded External Links (do not change without user permission)
- **Calendly:** `https://calendly.com/hea-trades/free-solar-consultation-hea`
- **Google Review:** `https://g.page/r/CSOEwnVc3aFIEAE/review`
- **Powercor NMI lookup:** `https://myenergy.powercor.com.au/s/nmi-register`
- **Solar Analyser GAS app:** `https://script.google.com/macros/s/AKfycbwYbZHXmEguJJFmGT0hd94M5heR8TUJFVConEBwcEI5x-DTgLUibdN5dlLp-VKr5tQ/exec`

---

## 9. Design System (Dark Theme — Never Change)

```
Backgrounds:
  #181818  — page
  #202020  — cards, nav, modals
  #2a2a2a  — inputs, secondary surfaces
  #2e2e2e  — borders light
  #3a3a3a  — borders heavy

Text:
  #ffffff  — headings
  #aaa     — secondary
  #888     — labels
  #555     — dimmed
  #444     — placeholders

Accent:
  #ffd100  — HEA yellow (CTAs, active, job numbers)
  #e6bc00  — yellow hover

Status colours (bg-X/40 text-X):
  pending_review:     bg-[#3a3a3a] text-[#aaa]
  opensolar_created:  bg-blue-900/40 text-blue-300
  rejected:           bg-red-900/40 text-red-400
  duplicate:          bg-yellow-900/40 text-[#ffd100]

Standard input: "bg-[#2a2a2a] border border-[#333] rounded-lg px-3 py-2 text-white text-sm placeholder:text-[#444] focus:outline-none focus:border-[#ffd100]"
Primary button: "bg-[#ffd100] text-[#202020] font-semibold px-4 py-2 rounded-lg hover:bg-[#e6bc00] transition-colors"
Action button:  "text-xs px-3 py-2 rounded-lg bg-[#2a2a2a] border border-[#3a3a3a] text-[#aaa] hover:text-white hover:border-[#555] transition-colors"
```

---

## 10. Known Gotchas & TypeScript Rules

1. **Prisma 7 types:** Never `import { Lead, AuditEntry, Prisma } from "@prisma/client"` — these don't export in Prisma 7. Use TypeScript inference from query results (`entries.map(e => ...)` not typed explicitly).

2. **Zod v4:** `z.coerce.number()` returns `ZodPipe` with `unknown` output — breaks hookform resolver. Use `z.number()` + `setValueAs: v => v === "" ? undefined : Number(v)` on `register()` calls instead.

3. **Prisma config:** `prisma.config.ts` uses `defineConfig`. Valid top-level keys: `schema`, `migrations`, `datasource`, `experimental`. The key `migrate` does NOT exist and causes build failures.

4. **`libsql://` URLs:** `prisma db push` only supports `file:` SQLite. Never add it to build scripts. Use `scripts/db-setup.ts`.

5. **`"use client"` + `metadata`:** These cannot coexist in the same file. Move metadata to a `layout.tsx` or remove it.

6. **`useSearchParams()`:** Must be wrapped in `<Suspense>` in Next.js App Router. Always wrap the component that calls it.

7. **OpenSolar auth endpoint:** `POST https://api.opensolar.com/api-token-auth/` with `{ username: email, password }` → returns `{ token }`. NOT `/api/auth/`.

8. **Ada widget:** `ADA_WIDGET_ENABLED` defaults to `false`. Do NOT enable until OpenSolar confirms whether lead submission creates a paid project or free contact.

9. **No `lib/opensolar.ts` outside `/app/api/admin/`** — it's PAID calls only. Import `lib/opensolar-free.ts` for reads.

10. **Jesse is non-technical** — all instructions to him must be "copy this → paste here → click deploy". No CLI, no JSON editing.

---

## 11. Cost Protection Architecture

```
lib/cost.ts — isSafeToFire()
    ↓
app/api/admin/leads/[id]/confirm/route.ts
    ↓
lib/opensolar.ts — createProject() (only place paid calls are made)
```

- `OPENSOLAR_API_COST_PER_PROJECT` not set = confirm button DISABLED
- Admin must type `"CONFIRM"` (all caps) in modal before button enables
- Every paid action creates `AuditEntry` with `costAud` set
- Free actions always have `costAud = null`
- Webhook handler **never** calls any function in `lib/opensolar.ts`

---

## 12. What Has Been Successfully Completed

### Infrastructure
- [x] All Vercel build failures resolved (Prisma types, Zod coerce, prisma.config.ts, prisma db push)
- [x] Turso database live and connected
- [x] All 15+ Vercel environment variables configured
- [x] Resend domain verified (hea-group.com.au)
- [x] NextAuth Google OAuth working
- [x] OpenSolar webhook registered at `/api/webhooks/opensolar`

### Lead Flow
- [x] Public `/quote` form captures leads to Turso DB
- [x] `/api/leads` calls GAS `createJob` → Telegram fires → Drive folder created → `gasDriveUrl` saved
- [x] Staff email alert on new lead (Resend)
- [x] Duplicate detection (same email within 7 days → status: "duplicate")

### Admin Dashboard
- [x] `/admin/leads` — lead queue with confirm/reject
- [x] `/admin/jobs` — jobs pipeline (confirmed leads)
- [x] `/admin/audit` — full audit log
- [x] ConfirmModal with cost display and CONFIRM typing gate
- [x] OpenSolar project creation (human-in-the-loop)
- [x] 5 action buttons on each lead card:
  - ☀️ Solar Analyser (prefills customer data via URL params)
  - 📅 Book Meeting (Calendly)
  - 📁 Customer Files (Google Drive folder — from `gasDriveUrl`)
  - 🔆 OpenSolar (direct project link, dimmed until confirmed)
  - ⭐ Request Review (emails customer Google review link)

### Other Features
- [x] `/solar-analyser` — embedded GAS iframe with floating customer info card when opened from lead card
- [x] Customer review request email (`sendReviewRequest()` — emails customer, not staff)
- [x] `POST /api/admin/leads/[id]/review` — auth-gated review request route
- [x] Powercor NMI lookup link in `/quote` form and `/solar-analyser`
- [x] OpenSolar auth via email/password (dynamic JWT, cached in SystemConfig 6 days)
- [x] Webhook event processing for project milestones

### Old Dashboard (Untouched but Working)
- [x] `/dashboard` Kanban board (GAS → Google Sheets)
- [x] Job detail with document generation (Gemini → Slides → PDF)
- [x] Solar Analyser link in Staff Tools nav panel

---

## 13. What Is Still In Progress / Next Steps

### Immediate
1. **Test end-to-end flow** — submit a test `/quote` and verify:
   - Lead appears in `/admin/leads`
   - Telegram fires
   - Google Drive folder appears in lead card
   - All 5 action buttons work
2. **Verify GAS `driveUrl` field name** — confirm the GAS `createJob` response uses `driveUrl` (not `driveFolderUrl` or similar). Check GAS script if Drive folder not appearing.
3. **Merge `claude/opensolar-integration-hea-oQk6f` into `main`** for production deploy.

### Pending Features
4. **Dashboard jobs table view** — enterprise-style sortable/filterable table (Qualys-inspired) for `/dashboard/jobs`
5. **Dashboard metrics home** — stat cards (total jobs, active, this month revenue)
6. **Dashboard left sidebar** — upgrade from top nav to proper sidebar nav
7. **Job detail expanded fields** — add `system_size_kw`, `battery_size_kwh`, `total_price` to GAS job detail
8. **Ada widget** — HOLD until OpenSolar confirms whether it creates paid project or free contact
9. **`OPENSOLAR_MFA_TOKEN`** — spotted in code but not confirmed if required

---

## 14. Git Workflow

**Active branch:** `claude/opensolar-integration-hea-oQk6f`
**Production branch:** `main` (Vercel auto-deploys)

```bash
# Always develop on the feature branch
git add <specific files>
git commit -m "feat: description"
git push -u origin claude/opensolar-integration-hea-oQk6f
# Then merge to main when ready for production
```

**Build command (in Vercel + package.json):**
```
prisma generate && tsx scripts/db-setup.ts && next build --turbopack
```

---

## 16. Google Apps Script Ecosystem — Complete Reference

### How Code Changes Work (CRITICAL — READ FIRST)

Claude Code edits files in the GitHub repo. Clasp + GitHub Actions automatically pushes those changes to the correct Apps Script project on every merge to `main`. **Jesse no longer copy-pastes code.**

However, after every auto-push, Jesse must still create a **new deployment version** in Apps Script to make it live:
> Deploy → Manage Deployments → pencil icon → New version → Deploy

The web app URL **never changes** between versions — only the code behind it updates.

---

### All Apps Script Projects + Script IDs

| Project | Script ID | Web App URL |
|---------|-----------|-------------|
| HEA Solar Intake Form | `1HEU7U3D6a13rkW7vXykhnPqNCXYI5Bxt6Wa9CO1yn9RGTolFXa5M-MfR` | `https://script.google.com/macros/s/AKfycbxftHfxNKrWKR9rC0QqNz7cIxkjK6whCz-KXKxBoaQODmHmuP8GrCeO6PmE6s43KZ8/exec` |
| HEA Jobs API | `1w0iY9HgLKZBcfQW1tfxpzwutWdikuwvIavk1fvKCwB1AhMmgxW1cTPyM` | `https://script.google.com/macros/s/AKfycbxJqoUxjad6W6KWx2-NxPqIUafCJA7hrOK3jRfK8HGc9irZEVAA9khPF2tUpbQ05qjz/exec` |
| HEA Solar Analyser | `13uiUqOX_ko4Lliwccdi2S0x4KdKtZ5Q_MJYZGw08MvsBgXeXdBaMooM0` | (not yet clasp-connected) |
| HEA C2 | `1H-SRlwpYOTi4ervlMX0hkctZx0EalJVXJUaEOv8eytTjdYa17zGEeMFu` | (not yet clasp-connected) |
| HEA Document Stack | `1ZZ7_IxoKYPYHPzH4G8j34OsQzumHJxRE7mXgJqPbA8iLes6tTa-3SvmL` | (not yet clasp-connected) |

---

### Repo Folders → Apps Script Projects

| Repo folder | → | Apps Script project | Clasp status |
|-------------|---|---------------------|--------------|
| `HEA INTAKE/` | → | HEA Solar Intake Form | ✅ Auto-deploys on push to `main` |
| `GAS/` | → | HEA Jobs API | ✅ Auto-deploys on push to `main` |
| `HEA SA/` | → | HEA Solar Analyser | ⏳ Not yet wired |
| `hea-doc-stack/` | → | HEA Document Stack | ⏳ Not yet wired |

---

### How Clasp Auto-Deploy Works

**Workflow file:** `.github/workflows/deploy-gas.yml`

Triggers when files inside `HEA INTAKE/**` or `GAS/**` are pushed to `main`. Runs two jobs:
1. **Push HEA Solar Intake Form** — installs clasp, writes `CLASPRC_JSON` secret to `~/.clasprc.json`, runs `clasp push --force` in `HEA INTAKE/`
2. **Push HEA Jobs API** — same, but in `GAS/`

**Secret required:** `CLASPRC_JSON` — the full contents of Jesse's `~/.clasprc.json` after running `clasp login`. Stored in GitHub → Settings → Secrets → Actions. The token format is:
```json
{
  "tokens": {
    "default": {
      "client_id": "...",
      "client_secret": "...",
      "type": "authorized_user",
      "refresh_token": "...",
      "access_token": "..."
    }
  }
}
```

**Clasp config files:**
- `HEA INTAKE/.clasp.json` — links folder to HEA Solar Intake Form script ID
- `GAS/.clasp.json` — links folder to HEA Jobs API script ID

**File extension rules (clasp is strict):**
- Backend code must be `.gs` (not `.txt`)
- HTML templates must be `.html` (not `.txt`)
- Manifest must be `appsscript.json`

---

### Key Google Drive IDs

| Resource | ID |
|----------|----|
| Unified client folder (all intake docs, bills, job files) | `12LCs9uDYh4Wynor0LdDelNbcQDe7c-C-` |
| HEA Jobs Google Sheet | `1oXPSL4cZAuaAognet7NNfgaLPs3OgvGONvxZZNs5LRU` |

---

### Intake Form → Jobs API Chain

When a client submits the HEA Solar Intake Form, `processSubmission()` in `HEA INTAKE/Code.gs` runs 8 steps:
1. Creates client Drive folder
2. Saves electricity bill to Drive
3. Generates consent PDF
4. Generates job card PDF
5. Logs to intake Sheet
6. Emails client
7. Emails HEA staff
8. **Calls `createJobFromIntake(data)`** → `HEA INTAKE/IntakeFormJobCreation.gs` → POSTs to Jobs API → creates row in HEA Jobs Sheet + Drive subfolders

The `JOBS_API_URL` constant in `HEA INTAKE/IntakeFormJobCreation.gs` must match the deployed web app URL of HEA Jobs API.

---

### Adding a New Script to Clasp (for future Claude sessions)

To connect HEA Solar Analyser, HEA C2, or HEA Document Stack to auto-deploy:

1. Add a `.clasp.json` in the repo folder:
   ```json
   { "scriptId": "<SCRIPT_ID_FROM_TABLE_ABOVE>", "rootDir": "." }
   ```
2. Add an `appsscript.json` manifest with required oauth scopes
3. Add a new job to `.github/workflows/deploy-gas.yml` following the existing pattern
4. Add the folder path to the workflow `paths:` trigger list
5. Commit and push — clasp will start auto-deploying

---

## 17. GAS Jobs System Reference

**doPost actions:**
- `createJob` — `{ action, clientName, phone, email, address, notes, estAnnualBill }` → `{ jobNumber, driveUrl, ... }`
- `updateJob` — updates job fields
- `generateDocument` — triggers Gemini → Slides → PDF pipeline

**GAS deployment note:** Claude pushes code changes to the repo → clasp auto-deploys to Apps Script. Jesse then creates a new version: Deploy → Manage Deployments → pencil → New version → Deploy. The `JOBS_GAS_URL` does NOT change between deployments.

**Drive folder structure per job:**
```
1) Jobs/
  {ClientName} - {DD-MM-YYYY}/
    01_Quotes/
    02_Proposals/
    03_Signed/
    04_Installed/
    {Name} - Electricity Bill.pdf   (customer uploads)
    {Name} - Job Card - HEA.pdf
    {Name} - NMI Consent - HEA.pdf
```

---

*Last updated: April 2026. Production branch: `main`. Clasp auto-deploy active for HEA Solar Intake Form + HEA Jobs API.*
