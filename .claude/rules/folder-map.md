## Folder Map

```
app/intake/               ← Public intake form (mobile-first, Next.js)
app/api/intake/           ← Intake API: PDFs + emails + GAS notification (uses after())
app/api/leads/            ← Simpler lead capture (no PDFs)
app/api/admin/            ← Admin-only API routes (Prisma, NextAuth protected)
app/api/debug/gas/        ← Session-protected GAS diagnostics
app/api/dashboard/        ← Dashboard API routes (GAS proxy, session protected)
  pipeline/
    check-nmi/            ← Proxies GAS checkNMI action
    check-estimation/     ← Proxies GAS checkEstimation action
    move-stage/           ← Proxies GAS updateJob action
  documents/
    config/               ← GET/PUT annex toggle config per document (Prisma SystemConfig)
app/api/installer/        ← Installer app API (PIN token auth, not NextAuth)
app/dashboard/            ← Alexis's operational dashboard (white theme)
  page.tsx                ← Overview: stats + pipeline funnel
  jobs/                   ← Job list + job detail pages
  kanban/                 ← Kanban board (GAS statuses)
  pipeline/               ← 3-stage sales pipeline (GAS-backed)
  documents/              ← Proposal documents
  templates/              ← Document templates
  c2/                     ← Command: people, recruitment, onboarding, units, tasks, installers
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
  documents/
    DocumentBuilder.tsx   ← Client component: annex toggle UI per document type
components/admin/         ← All /admin UI components
lib/email.ts              ← All transactional email (Resend)
lib/hubspot.ts            ← HubSpot CRM sync
lib/auth.ts               ← NextAuth config + isAdminEmail()
lib/db.ts                 ← Prisma client (Turso)
lib/constants.ts          ← Shared URLs + Google Review URL
lib/intake-pdf.ts         ← PDF generation (pdf-lib)
lib/document-config.ts    ← Annex + document type registry (9 annexes, 7 documents)
lib/document-merge.ts     ← pdf-lib merge utility: mergePdfs(Uint8Array[]) → Uint8Array
lib/sanity.ts             ← Sanity CMS client
lib/installer-auth.ts     ← JWT auth for installer app
GAS/                      ← Jobs API GAS script (clasp-managed)
  HEAJobsAPI.gs           ← Main: doGet/doPost, Drive folders, Sheets
HEA INTAKE/               ← Intake form GAS script (clasp-managed)
HEA SA/                   ← Solar analyser GAS script (clasp-managed)
GAS/PhotoPortal/          ← Photo upload portal GAS script
mobile/                   ← React Native installer app (Expo)
prisma/schema.prisma      ← Prisma schema (Turso SQLite)
scripts/db-setup.ts       ← Idempotent DB migrations — runs on every Vercel build
_achieved/                ← Archived/unused files (excluded from TS)
```
