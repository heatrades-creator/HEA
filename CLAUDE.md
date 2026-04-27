# HEA Group — Claude Code Context

## The Golden Rule

**Always expand existing systems. Never build parallel ones.**

Before writing any new file, search the codebase for the existing implementation. HEA has mature, working systems for jobs (GAS), leads (Prisma), email (Resend), PDF (pdf-lib), auth (NextAuth), CMS (Sanity), and CRM (HubSpot). Every new feature is an extension of one of these — not a new system alongside them.

Signs you are about to make a mistake:
- Creating a new database table that duplicates GAS job data
- Building a new dashboard at a new route instead of adding a page to `/dashboard`
- Adding a new email utility instead of extending `lib/email.ts`
- Fetching GAS data in a new way instead of reusing the `JOBS_GAS_URL` fetch pattern
- Creating a `/admin/pipeline` when the pipeline belongs in `/dashboard`

---

## Stack

| Layer | Tech | Deploy trigger |
|---|---|---|
| Website + intake form | Next.js 16 App Router · Tailwind | Push to `main` → Vercel auto |
| CMS | Sanity (studio at `/studio`) | Sanity cloud |
| Email | Resend (`lib/email.ts`, `app/api/intake/route.ts`) | Via API key |
| PDF generation | `pdf-lib` in `lib/intake-pdf.ts` — NO puppeteer | Serverless-safe |
| Database | Prisma + Turso libSQL (`lib/db.ts`) | Turso cloud |
| GAS scripts | clasp via GitHub Actions on push to `main` | See GAS section |
| CRM | HubSpot (`lib/hubspot.ts`) | Via access token |

**Live:** `https://hea-group.com.au` · Studio: `/studio` · Intake: `/intake`

---

## The Two Dashboards — Know the Difference

There are two separate protected dashboards. They serve different users and use different data sources. **Do not mix them.**

### `/dashboard` — Alexis's Operational Dashboard (white theme)
- **Who:** Alexis (admin worker), Jesse (field work)
- **Data source:** GAS Jobs API (`JOBS_GAS_URL`) — Google Sheets as the source of truth
- **Auth:** NextAuth session (same as admin)
- **Theme:** White background, `#111827` text, `#ffd100` accents, `border-[#e5e9f0]`
- **Nav:** `DashboardNav.tsx` (sidebar) + `DashboardMobileNav.tsx` (bottom tab bar + slide-up drawer)
- **Layout:** `app/dashboard/layout.tsx`
- **Key pages:**
  - `/dashboard` — Overview with job stats + pipeline funnel
  - `/dashboard/jobs` — Full job list (GAS)
  - `/dashboard/jobs/[jobNumber]` — Job detail (GAS)
  - `/dashboard/kanban` — Kanban board (GAS statuses)
  - `/dashboard/pipeline` — Sales pipeline (3 stages, GAS-backed)
  - `/dashboard/documents` — Proposal documents
  - `/dashboard/templates` — Document templates
  - `/dashboard/c2/` — Command section (people, recruitment, onboarding, units, tasks)
  - `/dashboard/settings` — User settings

**When adding a new page Alexis uses → add it to `/dashboard`, add a nav item to both `DashboardNav.tsx` and `DashboardMobileNav.tsx`.**

### `/admin` — Jesse's Admin Dashboard (dark theme)
- **Who:** Jesse (admin ops only)
- **Data source:** Prisma + Turso (marketing leads, audit log)
- **Auth:** NextAuth + `isAdminEmail()` check (`lib/auth.ts`)
- **Theme:** Dark `#111827` background, white text, `#ffd100` accents
- **Nav:** `AdminNav.tsx`
- **Key pages:**
  - `/admin` — Overview
  - `/admin/leads` — Lead management (Prisma `Lead` model)
  - `/admin/pipeline` — Admin lead pipeline (Prisma stages)
  - `/admin/jobs` — Job overview
  - `/admin/audit` — Audit log

**When adding admin-only features → add to `/admin`. When adding operational features for Alexis → add to `/dashboard`.**

---

## GAS Jobs API — The Operational Source of Truth

All job data lives in Google Sheets, managed by `GAS/HEAJobsAPI.gs`. Next.js is a read/write proxy.

### GASJob shape (used across all `/dashboard` components)
```typescript
// Canonical type defined in: components/dashboard/pipeline/BuildTheDealCard.tsx
type GASJob = {
  jobNumber: string    // e.g. "HEA-2026-001"
  clientName: string
  phone: string
  email: string
  address: string
  status: string       // 'Lead' | 'Quoted' | 'Contract' | 'Booked' | 'In Progress' | 'Complete'
  driveUrl: string     // Google Drive folder URL for this client
  notes: string
  systemSize: string   // kW value as string, e.g. "6.6"
  totalPrice: string   // e.g. "$12,500"
  annualBill: string   // annual electricity bill
}
```

### Valid GAS statuses (in order)
`Lead` → `Quoted` → `Contract` → `Booked` → `In Progress` → `Complete`

### Fetching jobs in a server component
```typescript
const res = await fetch(process.env.JOBS_GAS_URL!, { cache: 'no-store' })
const jobs: GASJob[] = await res.json()
```

### Updating job status from Next.js
POST to `/api/dashboard/pipeline/move-stage` with `{ jobNumber, status }`.
This proxies to GAS `action: 'updateJob'`.

### GAS Drive folder structure per client
Each client gets a folder under the HEA Drive root:
```
ClientName - DD-MM-YYYY/
  00_NMI_Data/      ← PowerCor NMI files only (uploaded manually via portal)
  01_Quotes/        ← Quote PDFs
  02_Proposals/     ← Proposal documents
  03_Signed/        ← Signed estimation/contract
  04_Installed/     ← Post-install photos
  05_Photos/        ← Intake form photo uploads (roof, switchboard, battery, EV)
  06_Jobfiles/      ← Intake form documents (NMI consent PDF, job card PDF, electricity bill)
```
`driveUrl` on the job points to the root client folder.

### GAS Drive auto-detection
`GAS/HEAJobsAPI.gs` exposes two GET actions for file-presence checks:

| Action | Returns | Used by |
|--------|---------|---------|
| `?action=checkNMI&jobNumber=X` | `{ hasNMI, fileName, fileUrl, nmiSubfolderUrl }` | `/api/dashboard/pipeline/check-nmi` |
| `?action=checkEstimation&jobNumber=X` | `{ hasEstimation, fileName, fileUrl }` | `/api/dashboard/pipeline/check-estimation` |

These are called from `BuildTheDealCard.tsx` on mount and every 30s while polling.

---

## Sales Pipeline (`/dashboard/pipeline`)

Three stages backed entirely by GAS job statuses. No separate database.

| Stage | Column title | GAS statuses | Card component |
|-------|-------------|-------------|----------------|
| 1 | Build the Deal | `Lead` | `BuildTheDealCard.tsx` |
| 2 | Close the Deal | `Quoted`, `Contract`, `Booked`, `In Progress` | `CloseTheDealCard.tsx` |
| 3 | Post-Install | `Complete` | `PostInstallCard.tsx` |

### Component files
```
app/dashboard/pipeline/page.tsx                  ← Server: fetches GAS, splits into 3 arrays
components/dashboard/pipeline/SalesPipelineBoard.tsx  ← Client: 3-column layout, optimistic moves
components/dashboard/pipeline/BuildTheDealCard.tsx    ← Stage 1 card (NMI auto-detect, polling)
components/dashboard/pipeline/CloseTheDealCard.tsx    ← Stage 2 card (stock, date, deposit)
components/dashboard/pipeline/PostInstallCard.tsx     ← Stage 3 card (review, thank you)
```

### Stage advance flow
1. Card calls `POST /api/dashboard/pipeline/move-stage` with new GAS status
2. `onAdvanced(jobNumber)` callback fires on success
3. `SalesPipelineBoard` removes the card from current column, prepends to next — no page reload

### BuildTheDealCard NMI polling pattern
When Alexis clicks "Get NMI Data":
- Opens PowerCor portal in new tab
- Opens client's Drive NMI subfolder in new tab  
- Sets `polling = true` → `setInterval` calls `checkNMI` + `checkEst` every 30s
- Dot turns green automatically when file is detected

---

## API Routes — Proxy Pattern

All `/api/dashboard/pipeline/*` routes follow the same pattern:

```typescript
export async function GET/POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  // validate params
  const gasUrl = process.env.JOBS_GAS_URL
  if (!gasUrl) return NextResponse.json({ error: 'GAS not configured' }, { status: 503 })
  // proxy to GAS
  const res = await fetch(`${gasUrl}?action=...`, { cache: 'no-store' })
  return NextResponse.json(await res.json())
}
```

**Existing dashboard pipeline API routes:**
- `GET /api/dashboard/pipeline/check-nmi?jobNumber=X`
- `GET /api/dashboard/pipeline/check-estimation?jobNumber=X`
- `POST /api/dashboard/pipeline/move-stage` — body: `{ jobNumber, status }`

---

## Admin API Routes — Prisma Pattern

All `/api/admin/pipeline/[id]/*` routes follow this pattern:

```typescript
export async function POST(req, { params }) {
  const session = await getServerSession(authOptions)
  if (!session || !isAdminEmail(session.user?.email)) return 401
  const lead = await prisma.lead.findUnique({ where: { id: params.id } })
  if (!lead) return 404
  await prisma.lead.update({
    where: { id: params.id },
    data: {
      fieldName: value,
      auditEntries: { create: { action: 'action_name', performedBy: session.user.email } }
    }
  })
  // fire-and-forget HubSpot sync if needed
}
```

---

## GAS Scripts — Adding New Actions

To add a new action to `GAS/HEAJobsAPI.gs`:

1. Add a branch to `doGet(e)` or `doPost(e)`:
```javascript
if (e.parameter.action === 'myAction' && e.parameter.jobNumber) {
  return jsonResponse(myAction_(e.parameter.jobNumber));
}
```

2. Write the helper function `myAction_(jobNumber)` that returns a plain object.

3. Push to `main` — GAS auto-deploys via GitHub Actions. **No manual steps.**

The GAS script reads from `getSheet_()` (the jobs Google Sheet) and `DriveApp` for file operations.

---

## Auto-Deploy: GAS via Clasp

Push to `main` touching `HEA INTAKE/**`, `GAS/**`, or `HEA SA/**` → `.github/workflows/deploy-gas.yml` runs → clasp pushes **and** creates a new deployment version. **No manual GAS steps are ever needed — push to `main` = live immediately.**

The workflow does two things per script:
1. `clasp push --force` — syncs the code
2. `clasp deploy -i <DEPLOYMENT_ID>` — bumps the live deployment to a new version (same URL, new code)

For scripts without a hardcoded deployment ID (Jobs API, Intake Form), the workflow queries `clasp deployments`, grabs the latest non-HEAD ID, and updates it. If no deployment exists yet it creates the first one.

**Credentials:** GitHub secret `CLASPRC_JSON` is written to 4 locations in the workflow (all of them — clasp v3 is inconsistent about which it reads).

**If pushes silently fail** (GAS "Last modified" doesn't update):
1. `clasp login` on a machine signed in as `hea.trades@gmail.com`
2. Copy `~/.clasprc.json` → update `CLASPRC_JSON` in GitHub Secrets

### ⚠️ Critical GAS gotchas — do not break these

**`appsscript.json` access level must be `"ANYONE_ANONYMOUS"`** — never `"ANYONE"`.
`"ANYONE"` requires a Google login and redirects unauthenticated requests to the Google sign-in page (returns HTML, not JSON). `"ANYONE_ANONYMOUS"` is truly public. Every `clasp push` overwrites the GAS UI setting, so `appsscript.json` is the only source of truth.

**`GAS/.claspignore` must exclude `C2/**` and `PhotoPortal/**`** — these are separate GAS projects with their own `.clasp.json`. If either is omitted from `.claspignore`, their files (especially `Code.gs` with its own `doGet`) get pushed into the Jobs API script and override the Jobs API's `doGet`, causing `{"error":"Unknown action:","code":400}` for every request.

**`JOBS_GAS_URL` in Vercel must point to the Jobs API web app** — not any other GAS script. To verify: `GET <JOBS_GAS_URL>` should return a JSON array of job objects. A response of `{"error":"Unknown action:","code":400}` means the URL points to the wrong script. The correct script ID is in `GAS/.clasp.json`.

**Jobs API auto-updates `JOBS_GAS_URL` in Vercel on deploy** — the `deploy-jobs-api` workflow step calls the Vercel API to update the env var after each successful deploy. Requires `VERCEL_TOKEN` as a GitHub secret (add it if missing) and `VERCEL_PROJECT_ID: prj_4wvjTKCHlMjJtCZ5zFTRmZqU9IdK` (already hardcoded in the workflow).

**GAS always returns HTTP 200** — even on errors. Never use `r.ok` to detect GAS failures. Always read the raw response text, attempt JSON parse, and check for an `error` field. See the `createJob` call in `app/api/intake/route.ts` for the correct pattern.

**GAS scripts:**
| Folder | Purpose | Deployment ID |
|---|---|---|
| `HEA INTAKE/` | Intake form backend (PDFs, email, Drive, Sheets) | dynamic (queried at deploy time) |
| `GAS/` | Jobs API (Drive folders, Sheet entries, Telegram alerts) | dynamic (queried at deploy time) |
| `GAS/PhotoPortal/` | Client photo upload portal + AS/NZS 5139 compliance check | `AKfycbwERmJbdTrnpM_-ABgXGtRolMCzSG2nDWJNyJjhfDx-baSI1BJWiehTdCM9qW0VSWU` |
| `HEA SA/` | Solar analyser | `AKfycbzZuPvjN6yzPbXUk4OajTLFbDoTMjrxqPgAWqsqJuZAqXfqHhdEsAJ8v1_MOD931nc` |

---

## Intake Form (Next.js — replaced GAS for mobile)

GAS iframe = fixed ~750px CSS viewport on mobile → CSS @media useless → JS `window.innerWidth` also unreliable → moved form to Next.js.

| File | Purpose |
|---|---|
| `app/intake/page.tsx` | 5-step form, `?service=solar\|battery\|ev` pre-selects step 2 |
| `app/api/intake/route.ts` | Validates → fires background work via `after()` → returns 201 immediately |
| `lib/intake-pdf.ts` | `generateConsentPdf()` + `generateJobCardPdf()` via pdf-lib |

### Intake submission flow
1. Client submits form → `route.ts` validates with Zod, calls `after(async () => processIntake(d))`, returns `{ success: true }` (201) **immediately**
2. `processIntake` runs after the response: generates PDFs, calls GAS `createJob`, calls GAS `saveIntakeDocs`, writes Prisma `Lead`, sends emails via Resend
3. Client-side fetch in `page.tsx` is fire-and-forget — `setSubmitted(true)` is called immediately, no `await`
4. Success screen auto-redirects to Calendly after 4 seconds (pre-filled `name` + `email` query params)

**Never `await` the GAS or email calls inside the route handler** — all heavy work belongs inside `after()`. Vercel serverless will timeout on large photo payloads if you block the response.

### Image compression (client-side, before base64 upload)
`compressImage(file, maxPx = 800, quality = 0.45)` in `page.tsx` uses the Canvas API to resize + re-encode before upload. Keep these values low — mobile photos can be 8MB+.

Intake submissions create a Prisma `Lead` record AND notify the GAS Jobs API. Both systems receive the lead.

---

## Prisma Lead Model — Marketing/Admin Only

The Prisma `Lead` model tracks **marketing leads** (from `/intake`, `/api/leads`, web forms). It is NOT the operational job system — that's GAS.

Key fields:
- `estimationSignedAt` — Stage 1→2 gate in `/admin/pipeline`
- `installedAt` — Stage 2→3 gate
- `appointmentAt`, `buildDate`, `depositAmountAud` — sales milestone tracking
- `googleReviewReceivedAt`, `thankYouSentAt` — post-install tracking
- `hubspotContactId`, `hubspotDealId` — CRM sync

**When to use Prisma vs GAS:**
- Prisma: marketing leads, admin audit trail, HubSpot sync, per-lead notes
- GAS: operational jobs, Drive folders, Telegram alerts, job status

---

## Lead Links

`lib/constants.ts` defines:
```ts
GAS_INTAKE_URL     = "/intake"           // generic — used by 22 pages
INTAKE_URL_SOLAR   = "/intake?service=solar"
INTAKE_URL_BATTERY = "/intake?service=battery"
INTAKE_URL_EV      = "/intake?service=ev"
```
Service pages import their matching constant. Pricing page solar cards → `INTAKE_URL_SOLAR`, battery cards → `INTAKE_URL_BATTERY`.

---

## Email (`lib/email.ts`)

All transactional email goes through Resend via `lib/email.ts`. Do not create new email utilities — extend this file.

Key exports:
- `sendIntakeEmail()` — client confirmation + Jesse alert with PDFs attached
- `sendLeadNotification()` — simple lead alert
- `sendReviewRequest()` — Google review request email

**Google Review URL:** `https://g.page/r/CSOEwnVc3aFIEBE/review`
Use the URL in `lib/constants.ts` as the canonical source — do not hardcode it elsewhere.

---

## HubSpot CRM (`lib/hubspot.ts`)

HubSpot has a 7-stage pipeline. Sync happens fire-and-forget from API routes — never block the response on HubSpot.

Key function:
```typescript
updateHubSpotDeal(leadId: string, stage: string)
// stage values: 'appointmentscheduled' | 'qualifiedtobuy' | 'presentationscheduled' | 
//               'decisionmakerboughtin' | 'contractsent' | 'closedwon' | 'closedlost'
```

Env var: `HUBSPOT_ACCESS_TOKEN`, `HUBSPOT_STAGE_INSTALLED`

---

## Sanity CMS

`lib/sanity.ts` exports:
- `getSiteContent()` — full site data (footer, about, pricingPackages, caseStudies, faqs, reviews)
- `getFooterData()` — footer only (for pages that don't need full content)
- `urlFor(image)` — Sanity image URL builder

**All pages pass footer:** `<Footer data={content.footer} />` — never bare `<Footer />`.

**Adding a CMS field:** schema in `sanity/schemaTypes/` → update GROQ in `getSiteContent()` → use in page.

---

## Environment Variables

**Vercel (production):**
`RESEND_API_KEY` · `EMAIL_FROM` · `EMAIL_ALERT_TO` (HEA.Trades@gmail.com) · `DATABASE_URL` · `NEXTAUTH_SECRET` · `NEXTAUTH_URL` · `JOBS_GAS_URL` · `NEXT_PUBLIC_SANITY_PROJECT_ID` · `NEXT_PUBLIC_SANITY_DATASET` · `SANITY_API_TOKEN` · `HUBSPOT_ACCESS_TOKEN` · `HUBSPOT_STAGE_INSTALLED`

**GitHub Secrets:** `CLASPRC_JSON` · `VERCEL_TOKEN` (needed for auto-updating `JOBS_GAS_URL` after GAS deploy)

---

## Branching & Deploy Rules

**⚠️ ALWAYS commit and push directly to `main`.** Never leave work in a feature branch — Vercel only auto-deploys from `main`, so anything in a branch is dead code until merged. There is no code review process; Jesse is the sole developer. Branches cause silent failures where env vars are live but the matching code is not.

- Use `git checkout main && git merge <branch> && git push origin main` to recover stranded branch work
- If using worktree isolation, always merge back to main before ending the session
- The only acceptable exception is a branch that will be merged in the same session it was created

---

## Key Patterns & Rules

- **TypeScript strict** — no implicit any; explicit type annotations on conditional arrays
- **Zod v4** — use `error:` not `errorMap:` in `z.literal()`
- **`_achieved/`** — archived files, excluded from TS (`tsconfig.json` exclude array)
- **PDF on Vercel** — use `pdf-lib` only (no puppeteer/playwright — no native deps)
- **Async server components** — all pages that fetch data are `async` functions
- **No bare `<Footer />`** — always pass `data` prop
- **White theme in `/dashboard`** — bg-white cards, `#111827` text, `#ffd100` accents, `border-[#e5e9f0]`
- **Dark theme in `/admin`** — `bg-[#111827]` / `bg-[#202020]` backgrounds

---

## Known Fixed Issues (don't re-investigate)

| Issue | Root cause | Fix |
|---|---|---|
| GAS mobile form zoomed out | GAS iframe CSS viewport ~750px, media queries useless | Use Next.js `/intake` |
| Clasp push silently fails | Token format / credential location | Write raw token to 4 paths in workflow |
| Vercel build: `_achieved` TS errors | Archived files included in compilation | `exclude: ["_achieved"]` in tsconfig |
| Vercel build: pricing page `any` type | Missing explicit `PricingPkg[]` annotation | Add type annotation to SOLAR_PACKAGES / BATTERY_PACKAGES |
| Footer/Nav TS error: Logo_transparent.png | Image import path mismatch | Pre-existing, do not re-investigate |
| GAS returning `{"error":"Unknown action:"}` | `C2/**` not excluded in `GAS/.claspignore` — C2's `doGet` overrode Jobs API's `doGet` | Uncomment `C2/**` in `.claspignore` |
| GAS requiring Google login | `appsscript.json` had `"access": "ANYONE"` — reset on every deploy | Change to `"ANYONE_ANONYMOUS"` in `appsscript.json` |
| Drive folders not created, jobs not in dashboard | `JOBS_GAS_URL` in Vercel pointed to wrong GAS script (C2) | Update `JOBS_GAS_URL` to Jobs API web app URL from GAS console |
| Intake form timeout on large photo uploads | All processing awaited before returning 201; Vercel serverless timeout | Use `after()` from `next/server`; client fetch is fire-and-forget |
| GAS errors swallowed silently | `r.ok` always true (GAS returns HTTP 200 even on error); `.catch` only fires on network error | Read raw `.text()` first, then parse JSON, check `data.error` field |

---

## Folder Map

```
app/intake/               ← Public intake form (mobile-first, Next.js)
app/api/intake/           ← Intake API: PDFs + emails + GAS notification
app/api/leads/            ← Simpler lead capture (no PDFs)
app/api/admin/            ← Admin-only API routes (Prisma, NextAuth protected)
app/api/intake/           ← Intake API: PDFs + emails + GAS notification (uses after())
app/api/debug/gas/        ← Session-protected GAS diagnostics (URL, HTTP status, job count)
app/api/dashboard/        ← Dashboard API routes (GAS proxy, session protected)
  pipeline/
    check-nmi/            ← Proxies GAS checkNMI action
    check-estimation/     ← Proxies GAS checkEstimation action
    move-stage/           ← Proxies GAS updateJob action
app/dashboard/            ← Alexis's operational dashboard (white theme)
  page.tsx                ← Overview: stats + pipeline funnel
  jobs/                   ← Job list + job detail pages
  kanban/                 ← Kanban board (GAS statuses)
  pipeline/               ← 3-stage sales pipeline (GAS-backed)
  documents/              ← Proposal documents
  templates/              ← Document templates
  c2/                     ← Command: people, recruitment, onboarding, units, tasks
  settings/               ← User settings
app/admin/                ← Jesse's admin dashboard (dark theme)
  leads/                  ← Lead management (Prisma)
  pipeline/               ← Admin lead pipeline (Prisma stages)
  jobs/                   ← Job overview
  audit/                  ← Audit log
app/studio/               ← Sanity Studio (embedded)
app/proposal/[token]/     ← Customer proposal viewer
components/dashboard/     ← All /dashboard UI components
  DashboardNav.tsx        ← Sidebar nav (desktop)
  DashboardMobileNav.tsx  ← Bottom tab bar + slide-up drawer (mobile)
  pipeline/               ← Sales pipeline card components
    BuildTheDealCard.tsx  ← Stage 1: NMI detect, estimation, move to Quoted
    CloseTheDealCard.tsx  ← Stage 2: stock, build date, deposit, mark installed
    PostInstallCard.tsx   ← Stage 3: review request + thank you tracking
    SalesPipelineBoard.tsx ← Client wrapper: 3 columns + optimistic moves
components/admin/         ← All /admin UI components
  AdminNav.tsx
  pipeline/               ← Admin pipeline cards + modals
components/HEAAdvisor.tsx ← AI chat widget → /api/advisor/explain
components/HEAEstimator.tsx ← Interactive savings estimator
components/SocialProofBar.tsx ← Reviews + manufacturer brand strip
lib/email.ts              ← All transactional email (Resend)
lib/hubspot.ts            ← HubSpot CRM sync
lib/auth.ts               ← NextAuth config + isAdminEmail()
lib/db.ts                 ← Prisma client (Turso)
lib/constants.ts          ← Shared URLs + Google Review URL
lib/intake-pdf.ts         ← PDF generation (pdf-lib)
lib/sanity.ts             ← Sanity CMS client
GAS/                      ← Jobs API GAS script (clasp-managed)
  HEAJobsAPI.gs           ← Main: doGet/doPost, Drive folders, Sheets
HEA INTAKE/               ← Intake form GAS script (clasp-managed)
HEA SA/                   ← Solar analyser GAS script (clasp-managed)
GAS/PhotoPortal/          ← Photo upload portal GAS script
prisma/schema.prisma      ← Prisma schema (Turso SQLite)
scripts/db-setup.ts       ← Idempotent DB migrations (ALTER TABLE)
_achieved/                ← Archived/unused files (excluded from TS)
```
