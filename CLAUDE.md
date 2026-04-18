# HEA Group — Claude Code Context

## Stack
| Layer | Tech | Deploy trigger |
|---|---|---|
| Website + intake form | Next.js 16 App Router · Tailwind | Push to `main` → Vercel auto |
| CMS | Sanity (studio at `/studio`) | Sanity cloud |
| Email | Resend (`lib/email.ts`, `app/api/intake/route.ts`) | Via API key |
| PDF generation | `pdf-lib` in `lib/intake-pdf.ts` — NO puppeteer | Serverless-safe |
| Database | Prisma + Turso libSQL (`lib/db.ts`) | Turso cloud |
| GAS scripts | clasp via GitHub Actions on push to `main` | See GAS section |

**Live:** `https://hea-group.com.au` · Studio: `/studio` · Intake: `/intake`

---

## Auto-Deploy: GAS via Clasp

Push to `main` touching `HEA INTAKE/**`, `GAS/**`, or `HEA SA/**` → `.github/workflows/deploy-gas.yml` runs → clasp pushes to Google Apps Script.

**Credentials:** GitHub secret `CLASPRC_JSON` is written to 4 locations in the workflow (all of them — clasp v3 is inconsistent about which it reads).

**⚠️ After clasp push, GAS needs a new deployment version to go live:**
GAS project → Deploy → Manage Deployments → Edit → New version → Deploy.

**If pushes silently fail** (GAS "Last modified" doesn't update):
1. `clasp login` on a machine signed in as `hea.trades@gmail.com`
2. Copy `~/.clasprc.json` → update `CLASPRC_JSON` in GitHub Secrets

**GAS scripts:**
| Folder | Purpose |
|---|---|
| `HEA INTAKE/` | Intake form backend (PDFs, email, Drive, Sheets) — Code.gs + Index.html |
| `GAS/` | Jobs API (Drive folders, Sheet entries, Telegram alerts) |

---

## Intake Form (Next.js — replaced GAS for mobile)

GAS iframe = fixed ~750px CSS viewport on mobile → CSS @media useless → JS `window.innerWidth` also unreliable → moved form to Next.js.

| File | Purpose |
|---|---|
| `app/intake/page.tsx` | 5-step form, `?service=solar\|battery\|ev` pre-selects step 2 |
| `app/api/intake/route.ts` | Validates → generates PDFs → emails client + Jesse → notifies Jobs API |
| `lib/intake-pdf.ts` | `generateConsentPdf()` + `generateJobCardPdf()` via pdf-lib |

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

**GitHub Secrets:** `CLASPRC_JSON`

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

---

## Known Fixed Issues (don't re-investigate)

| Issue | Root cause | Fix |
|---|---|---|
| GAS mobile form zoomed out | GAS iframe CSS viewport ~750px, media queries useless | Use Next.js `/intake` |
| Clasp push silently fails | Token format / credential location | Write raw token to 4 paths in workflow |
| Vercel build: `_achieved` TS errors | Archived files included in compilation | `exclude: ["_achieved"]` in tsconfig |
| Vercel build: pricing page `any` type | Missing explicit `PricingPkg[]` annotation | Add type annotation to SOLAR_PACKAGES / BATTERY_PACKAGES |

---

## Folder Map (non-obvious)

```
app/intake/          ← Public intake form (new, mobile-first)
app/api/intake/      ← Intake API: PDFs + emails
app/api/leads/       ← Simpler lead capture (no PDFs)
app/admin/           ← Internal dashboard (NextAuth protected)
app/studio/          ← Sanity Studio (embedded)
app/proposal/[token] ← Customer proposal viewer
components/HEAAdvisor.tsx    ← AI chat widget → /api/advisor/explain
components/HEAEstimator.tsx  ← Interactive savings estimator
components/SocialProofBar.tsx← Reviews + manufacturer brand strip
HEA INTAKE/          ← GAS project (clasp-managed)
GAS/                 ← GAS Jobs API (clasp-managed)
_achieved/           ← Archived/unused files (excluded from TS)
```
