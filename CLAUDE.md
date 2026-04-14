# HEA Group — Claude Code Context

This file is read by Claude at the start of every session. It captures the project's
architecture, pipelines, conventions, and known history so work can resume immediately
without re-discovery.

---

## Project Overview

**HEA Group** (Heffernan Electrical Automation) is a Bendigo-based solar/battery/EV
installer. This repo contains:

| Layer | Stack | Deploy |
|---|---|---|
| **Public website** | Next.js 16 App Router + Tailwind + Sanity CMS | Vercel (auto on push to `main`) |
| **Intake form** | Next.js `/intake` page + `/api/intake` route | Vercel (same as above) |
| **Intake PDF generation** | `pdf-lib` (serverless-safe, no puppeteer) | Vercel edge/serverless |
| **Email** | Resend (`lib/email.ts`, `lib/intake-email` in `api/intake`) | Resend API |
| **GAS — Intake backend** | Google Apps Script in `HEA INTAKE/` | Auto-deployed via clasp (GitHub Actions) |
| **GAS — Jobs API** | Google Apps Script in `GAS/` | Auto-deployed via clasp (GitHub Actions) |
| **CMS** | Sanity Studio at `/studio` | Sanity cloud |
| **Database** | Prisma + Turso (libSQL) | Turso cloud |

**Live URLs:**
- Website: `https://hea-group.com.au`
- Intake form: `https://hea-group.com.au/intake`
- Sanity Studio: `https://hea-group.com.au/studio`
- GAS Intake (legacy, still live): `https://script.google.com/macros/s/AKfycbxftHfxNKrWKR9rC0QqNz7cIxkjK6whCz-KXKxBoaQODmHmuP8GrCeO6PmE6s43KZ8/exec`
- GAS Jobs API: `https://script.google.com/macros/s/AKfycbxJqoUxjad6W6KWx2-NxPqIUafCJA7hrOK3jRfK8HGc9irZEVAA9khPF2tUpbQ05qjz/exec`

---

## Auto-Deploy Pipeline

### Next.js → Vercel
Push any commit to `main` → Vercel automatically builds and deploys.
- Build command: `prisma generate && tsx scripts/db-setup.ts && next build --turbopack`
- No manual steps required.

### GAS → Google Apps Script (via clasp)
Push a commit to `main` that touches `HEA INTAKE/**` or `GAS/**` →
GitHub Actions runs `.github/workflows/deploy-gas.yml` → clasp pushes the code.

**How the credentials work:**
- The secret `CLASPRC_JSON` in GitHub repo settings holds the full clasp auth token.
- The workflow writes this token to **all** locations clasp may check:
  - `~/.clasprc.json`
  - `~/.config/clasp/default.json`
  - `~/.config/@google/clasp/credentials.json`
  - `${XDG_CONFIG_HOME:-$HOME/.config}/clasp/credentials.json`
- Uses `clasp push --force` (no version bump — see note below).

**⚠️ IMPORTANT — After a clasp push, the GAS deployment needs a new version:**
Clasp push updates the *code* but does NOT make it live on the deployed URL.
After the GitHub Action completes, go to the GAS project → Deploy → Manage Deployments
→ Edit (pencil icon) → Version: "New version" → Deploy.
This is a one-click step in the Apps Script UI.

**Refreshing `CLASPRC_JSON`:**
If the token expires or pushes silently fail (GAS "Last modified" doesn't update),
refresh the secret:
1. Run `clasp login` on a local machine logged in as `hea.trades@gmail.com`
2. Copy the contents of `~/.clasprc.json`
3. Go to GitHub repo → Settings → Secrets → Actions → update `CLASPRC_JSON`

---

## Key Source Files

### Intake Form (NEW — replaces GAS form on mobile)
| File | Purpose |
|---|---|
| `app/intake/page.tsx` | 5-step multi-step form (client component) |
| `app/api/intake/route.ts` | API handler — validates, generates PDFs, sends emails |
| `lib/intake-pdf.ts` | pdf-lib helpers: `generateConsentPdf()`, `generateJobCardPdf()` |

**URL params:** `?service=solar\|battery\|ev` pre-selects the service on step 2.

**On submission:**
1. Generates NMI Consent PDF + Job Card PDF (`pdf-lib`)
2. Emails client with consent PDF attached (Resend)
3. Emails Jesse with both PDFs + electricity bill (Resend)
4. Calls GAS Jobs API to create a Google Drive folder + Sheet entry

### Lead Links (all 25 files used to point to GAS — now point to `/intake`)
```
lib/constants.ts          GAS_INTAKE_URL = "/intake"
                          INTAKE_URL_SOLAR = "/intake?service=solar"
                          INTAKE_URL_BATTERY = "/intake?service=battery"
                          INTAKE_URL_EV = "/intake?service=ev"
```
Service pages import the matching constant:
- `app/bendigo-solar-installer/page.tsx` → `INTAKE_URL_SOLAR`
- `app/bendigo-battery-installer/page.tsx` → `INTAKE_URL_BATTERY`
- `app/bendigo-ev-charger/page.tsx` → `INTAKE_URL_EV`
- All other pages → `GAS_INTAKE_URL` (`/intake`)

### Sanity CMS
| File | Purpose |
|---|---|
| `lib/sanity.ts` | `getSiteContent()` fetches all CMS data; `getFooterData()` for footer only |
| `sanity/schemaTypes/` | All content schemas |

`getSiteContent()` returns: `footer`, `about` (with `teamPhotoUrl`), `pricingPackages`, `caseStudies`, `faqs`, `reviews`, `siteSettings`.

**To add CMS-driven content:** add field to the relevant schema in `sanity/schemaTypes/`,
update the GROQ query in `lib/sanity.ts`, use in page component.

### Footer
All pages pass footer data: `<Footer data={content.footer} />` or `<Footer data={footer} />`
where `footer` comes from `getSiteContent()` or `getFooterData()`.
The component falls back to hardcoded defaults if no data passed.

### GAS Scripts
| Folder | Script | What it does |
|---|---|---|
| `HEA INTAKE/` | Solar Intake Form | Serves intake HTML, generates PDFs, emails, logs to Sheets |
| `GAS/` | HEA Jobs API | Job CRUD — Google Drive folders, Sheet entries, Telegram alerts |

**Note:** The GAS intake form (`HEA INTAKE/Index.html`) is still live and functional.
It was replaced by the Next.js `/intake` page for mobile compatibility only.
The GAS backend (`Code.gs`) still runs — the Jobs API calls it.

---

## Environment Variables

### Vercel (production)
| Variable | Purpose |
|---|---|
| `RESEND_API_KEY` | Email sending (intake form PDFs + alerts) |
| `EMAIL_FROM` | From address for outbound emails |
| `EMAIL_ALERT_TO` | Jesse's email for new lead alerts (HEA.Trades@gmail.com) |
| `DATABASE_URL` | Turso libSQL connection string |
| `NEXTAUTH_SECRET` | NextAuth session signing |
| `NEXTAUTH_URL` | Full site URL (https://hea-group.com.au) |
| `JOBS_GAS_URL` | GAS Jobs API endpoint URL |
| `SANITY_API_TOKEN` | Sanity write token (for Studio mutations) |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Sanity project ID |
| `NEXT_PUBLIC_SANITY_DATASET` | Sanity dataset (usually `production`) |

### GitHub Secrets (for GAS deploy)
| Secret | Purpose |
|---|---|
| `CLASPRC_JSON` | Full clasp auth token JSON (see Refreshing above) |

---

## Development Workflow

```bash
npm run dev          # Start local dev server (Turbopack)
npm run build        # Full production build (includes prisma generate)
npx tsc --noEmit     # Type-check without building
```

**Branch strategy:**
- `main` → production (auto-deploys to Vercel + triggers GAS clasp push if GAS files changed)
- Feature branches → merge to `main` when ready

**TypeScript:**
- `strict: true` — no implicit any
- `_achieved/` is excluded from TS compilation (archived files)
- When adding new Sanity fields, update both the schema AND the GROQ query in `lib/sanity.ts`

---

## Known Issues & History

### GAS Mobile Rendering (resolved by moving to Next.js)
GAS web apps wrap HTML in an iframe with a fixed CSS viewport width (~750px) on mobile.
CSS `@media` queries inside GAS read this iframe width, not the device width.
`window.innerWidth` in JS *also* returns the iframe width on some devices.
**Resolution:** All public lead links now point to `/intake` (Next.js, real viewport).
The GAS intake form is kept live but no longer linked from the site.

### Clasp Silent Push Failures (resolved)
Clasp v3 uses a different token format than v2. Writing the raw `CLASPRC_JSON` token
to multiple credential locations (without format conversion) fixed silent push failures.
See `.github/workflows/deploy-gas.yml` for the credential write approach.

### Vercel TypeScript Build Errors (resolved)
- `_achieved/` files: excluded via `tsconfig.json` `exclude` array
- Zod v4 uses `error:` not `errorMap:` for custom error messages in `z.literal()`
- Explicit type annotations required for conditional array assignments (e.g. `PricingPkg[]`)

### PDF Generation
`pdf-lib` is used (not puppeteer/playwright) — it's a pure JS library that works on
Vercel serverless functions without native dependencies or bundling issues.

---

## Folder Structure (non-obvious)

```
app/
  intake/           ← Public intake form (new, mobile-first)
  api/intake/       ← Intake API — PDFs + emails
  api/leads/        ← Existing lead capture (simpler, no PDFs)
  admin/            ← Internal dashboard (NextAuth protected)
  studio/           ← Sanity Studio (embedded)
  proposal/[token]/ ← Customer proposal viewer

components/
  HEAAdvisor.tsx    ← AI chat widget (uses /api/advisor/explain)
  HEAEstimator.tsx  ← Interactive savings estimator
  SocialProofBar.tsx← Reviews + manufacturer brand strip

lib/
  sanity.ts         ← All CMS queries + urlFor helper
  email.ts          ← Staff alert emails (Resend)
  intake-pdf.ts     ← PDF generation for intake form
  db.ts             ← Prisma client singleton
  constants.ts      ← Shared URLs and contact info

HEA INTAKE/         ← GAS project: intake form (clasp-managed)
GAS/                ← GAS project: Jobs API (clasp-managed)
_achieved/          ← Archived/unused files (excluded from TS)
```
