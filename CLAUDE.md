# HEA Group — Claude Code Context

## The Golden Rule

**Always expand existing systems. Never build parallel ones.**

Before writing any new file, search the codebase for the existing implementation. HEA has mature, working systems for jobs (GAS), leads (Prisma), email (Resend), PDF (pdf-lib), auth (NextAuth), CMS (Sanity), and CRM (HubSpot). Every new feature is an extension of one of these — not a new system alongside them.

Signs you are about to make a mistake:
- Creating a new database table that duplicates GAS job data
- Building a new dashboard at a new route instead of adding a page to `/dashboard`
- Adding a new email utility instead of extending `lib/email.ts`
- Fetching GAS data in a new way instead of reusing the `JOBS_GAS_URL` fetch pattern

---

## Jesse's Engineering Philosophy — Automate Everything

**Jesse is an engineer, not a software engineer. He solves problems once.**

- **No manual steps, ever.** If something needs to happen after a deploy, automate it into the deploy.
- **One-time setup only.** Any step that needs repeating is a design failure — fix the automation.
- **If it can be triggered by a git push, it should be.**
- **Never write "run this command after deploying"** — wire it into `package.json` or a GitHub Action instead.

### What is already automated (never ask Jesse to do these manually)
- **DB migrations** — `scripts/db-setup.ts` runs on every Vercel deploy via the `build` script. Add new tables/columns there; they deploy themselves.
- **GAS scripts** — `deploy-gas.yml` GitHub Action runs on push to `main`. Never open Apps Script, never run clasp manually.
- **OTA app updates** — `eas-update.yml` fires on push to `main` for JS/UI changes to `mobile/`. Installers get it silently on next launch.
- **The only manual step that exists** — new APK builds (only when native deps change). Everything else is automatic.

---

## Stack

| Layer | Tech | Deploy trigger |
|---|---|---|
| Website + intake form | Next.js 16 App Router · Tailwind | Push to `main` → Vercel auto |
| CMS | Sanity (studio at `/studio`) | Sanity cloud |
| Email | Resend (`lib/email.ts`) | Via API key |
| PDF generation | `pdf-lib` in `lib/intake-pdf.ts` — NO puppeteer | Serverless-safe |
| Database | Prisma + Turso libSQL (`lib/db.ts`) | Auto on Vercel build |
| GAS scripts | clasp via GitHub Actions on push to `main` | Automatic |
| CRM | HubSpot (`lib/hubspot.ts`) | Via access token |

**Live:** `https://hea-group.com.au` · Studio: `/studio` · Intake: `/intake`

---

## The Two Dashboards — Know the Difference

**Do not mix these. They serve different users and use different data sources.**

### `/dashboard` — Alexis's Operational Dashboard (white theme)
- **Who:** Alexis (admin), Jesse (field work)
- **Data:** GAS Jobs API (`JOBS_GAS_URL`) — Google Sheets is the source of truth
- **Theme:** White background, `#111827` text, `#ffd100` accents, `border-[#e5e9f0]`
- **Nav:** `DashboardNav.tsx` (sidebar) + `DashboardMobileNav.tsx` (bottom tab bar)
- **Key pages:** `/dashboard`, `/dashboard/jobs`, `/dashboard/kanban`, `/dashboard/pipeline`, `/dashboard/documents`, `/dashboard/templates`, `/dashboard/c2/`, `/dashboard/settings`

**Adding a page Alexis uses → add to `/dashboard`, add nav item to both `DashboardNav.tsx` and `DashboardMobileNav.tsx`.**

### `/admin` — Jesse's Admin Dashboard (dark theme)
- **Who:** Jesse only
- **Data:** Prisma + Turso (marketing leads, audit log)
- **Auth:** NextAuth + `isAdminEmail()` check (`lib/auth.ts`)
- **Theme:** Dark `#111827` / `#202020` backgrounds, white text, `#ffd100` accents
- **Key pages:** `/admin`, `/admin/leads`, `/admin/pipeline`, `/admin/jobs`, `/admin/audit`

**Adding admin-only features → `/admin`. Adding operational features for Alexis → `/dashboard`.**

---

## GAS Jobs API — The Operational Source of Truth

All job data lives in Google Sheets via `GAS/HEAJobsAPI.gs`. Next.js is a read/write proxy.

### GASJob shape
```typescript
type GASJob = {
  jobNumber: string    // e.g. "HEA-2026-001"
  clientName: string
  phone: string
  email: string
  address: string
  status: string       // 'Lead' | 'Estimation' | 'Contract' | 'Booked' | 'In Progress' | 'Complete'
  driveUrl: string
  notes: string
  systemSize: string   // kW as string e.g. "6.6"
  totalPrice: string   // e.g. "$12,500"
  annualBill: string
}
```

### Valid GAS statuses (in order)
`Lead` → `Estimation` → `Contract` → `Booked` → `In Progress` → `Complete`

### Fetching jobs
```typescript
const res = await fetch(process.env.JOBS_GAS_URL!, { cache: 'no-store' })
const jobs: GASJob[] = await res.json()
```

### Updating status
POST to `/api/dashboard/pipeline/move-stage` with `{ jobNumber, status }`.

### GAS always returns HTTP 200 — even on errors
Never use `r.ok`. Always read raw `.text()`, parse JSON, check for `data.error` field.

---

## Prisma vs GAS — When to Use Each

- **GAS:** operational jobs, Drive folders, Telegram alerts, job status
- **Prisma:** marketing leads, admin audit trail, HubSpot sync, installer app data (claims, comments, timesheets)

---

## Branching & Deploy Rules

**⚠️ ALWAYS commit and push directly to `main`.** Vercel only auto-deploys from `main`. Feature branches are dead code until merged. There is no code review process — Jesse is the sole developer.

- Recover stranded branch work: `git checkout main && git merge <branch> && git push origin main`
- The only acceptable exception: a branch merged in the same session it was created

---

## Key Patterns & Rules

- **TypeScript strict** — no implicit any; explicit type annotations on conditional arrays
- **Zod v4** — use `error:` not `errorMap:` in `z.literal()`
- **`_achieved/`** — archived files, excluded from TS (`tsconfig.json` exclude array)
- **PDF on Vercel** — `pdf-lib` only (no puppeteer/playwright)
- **Async server components** — all data-fetching pages are `async` functions
- **No bare `<Footer />`** — always pass `data` prop
- **White theme in `/dashboard`** — bg-white, `#111827` text, `#ffd100` accents, `border-[#e5e9f0]`
- **Dark theme in `/admin`** — `bg-[#111827]` / `bg-[#202020]` backgrounds

---

## Environment Variables

**Vercel:** `RESEND_API_KEY` · `EMAIL_FROM` · `EMAIL_ALERT_TO` · `DATABASE_URL` · `NEXTAUTH_SECRET` · `NEXTAUTH_URL` · `JOBS_GAS_URL` · `NEXT_PUBLIC_SANITY_PROJECT_ID` · `NEXT_PUBLIC_SANITY_DATASET` · `SANITY_API_TOKEN` · `HUBSPOT_ACCESS_TOKEN` · `HUBSPOT_STAGE_INSTALLED`

**GitHub Secrets:** `CLASPRC_JSON` · `VERCEL_TOKEN` · `EXPO_TOKEN`

---

@.claude/rules/known-issues.md
@.claude/rules/folder-map.md
@.claude/rules/naming-conventions.md
