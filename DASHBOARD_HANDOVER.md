# HEA Dashboard — AI-to-AI Handover Document
**Prepared for:** Next Claude Code session  
**Date:** April 2026  
**Repo:** `heatrades-creator/HEA`  
**Active branch:** `claude/build-hea-doc-stack-GFIoP`  
**Deployed on:** Vercel (Next.js App Router)

---

## 1. Who Is This Client

**Jesse Heffernan** — owner of **Heffernan Electrical Automation (HEA)**, a solar and battery installer based in Bendigo, Victoria, Australia. ABN holder, REC 37307. Non-technical operator. All work is done via Claude Code. The system must be simple to use and self-maintaining.

**Business contact:** hea.trades@gmail.com  
**Website:** hea-group.com.au

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 App Router, TypeScript, Tailwind CSS v4 |
| Auth | NextAuth v4 (credentials, Google) |
| Backend | Google Apps Script (GAS) web app — acts as REST API |
| Database | Google Sheets (via GAS) |
| AI | Gemini 2.5 Flash (free tier, 500 req/day) |
| Document generation | Google Slides + Google Drive (via GAS) |
| CMS | Sanity (for public website — not dashboard) |
| Deploy | Vercel |

**Critical env vars (set in Vercel):**
- `JOBS_GAS_URL` — URL of the deployed GAS web app (handles all data read/write)
- `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

---

## 3. Architecture Overview

```
Dashboard (Next.js on Vercel)
    │
    ▼
/api/jobs/*  (Next.js API routes — thin proxy layer)
    │
    ▼
JOBS_GAS_URL  (Google Apps Script web app)
    │
    ├── Google Sheets (all data storage)
    │     ├── HEA Jobs (main CRM sheet: job records)
    │     ├── DOCUMENT_JOBS (bridge: TS001 job ↔ GAS doc pipeline)
    │     ├── EXPORT_LOG (document generation history + token usage)
    │     ├── TEMPLATE_CONFIG (available doc types — drives UI dynamically)
    │     ├── BRAND_CONFIG (company details)
    │     ├── SETTINGS (designer info, config)
    │     ├── NORMALISED_DATA, JOBS_REGISTER (pipeline internals)
    │     └── ERROR_LOG, SIGNING_QUEUE, PROMPT_CONFIG, RAW_SUBMISSIONS
    │
    └── Google Drive (generated PDF outputs in job folders)
```

**GAS doGet actions:** `proposalStats`, `getDocuments`, `getAvailableTemplates`  
**GAS doPost actions:** `createJob`, `updateJob`, `generateDocument`  
**GAS also handles:** form submissions from public site → document pipeline trigger

---

## 4. Current Dashboard File Structure

```
app/
  dashboard/
    layout.tsx          ← dark nav bar + ProposalUsageBadge + SignOut
    page.tsx            ← KanbanBoard (server component, fetches jobs)
    jobs/[id]/
      page.tsx          ← Job detail page (server, fetches single job)
      JobDetail.tsx     ← client component: edit status/notes/drive URL + JobDocuments
    login/
      page.tsx          ← login page
      LoginButton.tsx
    SignOutButton.tsx

components/dashboard/
  KanbanBoard.tsx       ← 5-column kanban: Lead→Quoted→Booked→In Progress→Complete
  NewJobModal.tsx       ← modal form to create a new job
  JobDocuments.tsx      ← client component: generate PDFs + list generated docs
  ProposalUsageBadge.tsx← server component: Gemini usage stats in nav bar

app/api/
  jobs/route.ts         ← GET (all jobs), POST (create job)
  jobs/[id]/route.ts    ← GET (single job), PATCH (update job)
  jobs/[id]/documents/route.ts  ← GET (list docs), POST (generate doc) maxDuration=60
  jobs/[id]/templates/route.ts  ← GET (available template types from GAS)
  auth/[...nextauth]/route.ts
  contact/route.js      ← public contact form
```

---

## 5. Job Data Model

```typescript
type Job = {
  jobNumber: string;      // e.g. "TS001-0042" — human-readable CRM ID
  clientName: string;
  phone?: string;
  email?: string;
  address?: string;
  status: 'Lead' | 'Quoted' | 'Booked' | 'In Progress' | 'Complete';
  driveUrl?: string;      // Google Drive folder URL for this job
  notes?: string;
  createdDate?: string;   // display string e.g. "3 Apr 2026"
};
```

Jobs are stored in Google Sheets ("HEA Jobs" tab), read/written via GAS. The `jobNumber` is the primary key used in all API calls.

---

## 6. Document Generation System

A full Gemini AI → Google Slides → PDF pipeline. When a user clicks "Generate Solar & Battery Proposal" on the job detail page:

1. Dashboard POSTs `{ jobNumber, docClass }` to `/api/jobs/[id]/documents`
2. Next.js proxies to GAS with `action=generateDocument`
3. GAS: looks up job in "HEA Jobs" sheet, builds normalised data
4. GAS: calls Gemini 2.5 Flash (free tier) with a structured prompt
5. Gemini returns JSON with all 20 template placeholder values
6. GAS: copies the Google Slides master template, fills all `{Variable_Name}` placeholders using `presentation.replaceAllText()`
7. GAS: exports as PDF, saves both to Drive
8. GAS: writes to DOCUMENT_JOBS + EXPORT_LOG (including real token count)
9. Response: `{ success, outputLink, pdfLink }`
10. Dashboard refreshes document list showing "Open Draft ↗" + "PDF ↗"

**Generation takes ~40 seconds.** The Vercel route has `export const maxDuration = 60` and `AbortSignal.timeout(58_000)`.

**Template variables (20 total) for the Solar Proposal template:**
`Customer_Name`, `Customer_Address`, `Solar_Size`, `Battery_Size`, `Net_Price`, `Yearly_Savings`, `25_Y_Value`, `Pay_BP`, `C02_S`, `Trees_Planted25`, `Generation_Date`, `Expiery_Date`, `Quote_Number`, `Hea_Mobile`, `Hea_Email`, `Hea_Address`, `Designers_Name`, `Designers_Mobile_Number`, `Designers_Email_Address`, `Page_Number`

**Template file ID:** `1INXF_5V9wrQMfqL51HKRuexJmVLM5Jf9puI6gKkN2W4` (Google Slides)

**Adding new document types:** Zero code changes needed. Just add a row to the TEMPLATE_CONFIG sheet with `active=TRUE` and it appears as a button in the dashboard automatically.

---

## 7. Existing Design System

Dark theme. Professional. Restrained. **Never** add emoji or light backgrounds to the dashboard.

```
Background layers:
  #181818  — page background
  #202020  — cards, nav, modals
  #2a2a2a  — inputs, secondary surfaces
  #2e2e2e  — borders (light)
  #333     — borders (medium)
  #3a3a3a  — borders (heavy) / badges

Text:
  #ffffff  — primary headings
  #d6d6d6  — nav links
  #aaa     — secondary text
  #888     — labels, metadata
  #666     — tertiary
  #555     — dimmed
  #444     — placeholders
  #333     — very dim

Accent:
  #ffd100  — HEA yellow (primary CTA, active states, job numbers)
  #e6bc00  — yellow hover

Status colours (badge style: bg-X/40 text-X):
  Lead:        bg-[#3a3a3a]    text-[#aaa]
  Quoted:      bg-blue-900/40  text-blue-300
  Booked:      bg-purple-900/40 text-purple-300
  In Progress: bg-yellow-900/40 text-[#ffd100]
  Complete:    bg-green-900/40  text-green-400

Border radius:
  rounded-lg  — inputs, buttons, small elements
  rounded-xl  — cards, modals, column containers

Typography:
  text-xs uppercase tracking-wider  — section labels
  font-mono                         — job numbers
  font-semibold                     — headings, buttons
  tabular-nums                      — numbers/stats

Standard input class:
  "bg-[#2a2a2a] border border-[#333] rounded-lg px-3 py-2 text-white text-sm 
   placeholder:text-[#444] focus:outline-none focus:border-[#ffd100]"

Primary button:
  "bg-[#ffd100] text-[#202020] font-semibold px-4 py-2 rounded-lg 
   hover:bg-[#e6bc00] transition-colors"

Secondary button:
  "border border-[#333] text-[#888] rounded-lg hover:border-[#555] hover:text-white"
```

---

## 8. What To Build — Dashboard Expansion

**Target GUI style:** Enterprise-grade data management UI inspired by **Qualys Patch Management** dashboard. Qualys uses a tri-pane layout with a fixed top bar, collapsible left sidebar TOC, and dense main content. Key UI patterns to adapt to HEA's dark theme:

### Qualys Design Patterns To Implement (adapted to HEA dark theme)

**Layout:**
- Fixed top bar (~56px) — logo left, search center, user/stats right
- Left sidebar (~260px) — collapsible, independent scroll, active item has left border accent
- Main content area — max-width ~1100px, padded, scrolls independently

**Sidebar navigation:**
- Section headers in uppercase tracking-wider (like current label style)
- Active item: `border-l-2 border-[#ffd100] bg-[#ffd100]/5 text-white`
- Inactive item: `text-[#666] hover:text-[#aaa] hover:bg-[#252525]`
- Expand/collapse chevrons for grouped sections
- Item height: ~36px, px-4, text-sm

**Data tables:**
- Header row: `bg-[#252525] border-b border-[#333]` — sticky, col labels text-[#888] text-xs uppercase tracking-wider
- Body rows: `border-b border-[#2a2a2a] hover:bg-[#252525]` — height ~48px
- Zebra striping optional (subtle: every other row `bg-[#1e1e1e]`)
- Checkbox column (16px) for bulk selection
- Sortable columns: up/down chevron icon next to header label, active sort highlights column header
- Row click → navigate to detail page
- Actions column: icon buttons (…) or inline text links

**Status badges (Qualys-style pills, adapted):**
- Rounded pill: `px-2.5 py-0.5 rounded-full text-xs font-medium`
- Same palette as current STAGE_STYLES but used inline in table cells

**Filter/search bar above tables:**
- Search input (left), filter dropdowns (status, date), results count (right)
- `bg-[#202020] border-b border-[#2e2e2e] px-4 py-3 flex items-center gap-3`

**Stat cards (metrics panels):**
- `bg-[#202020] border border-[#2e2e2e] rounded-xl p-5`
- Large number in white (text-3xl font-bold), label below in text-[#555] text-sm
- Subtle coloured left border accent per metric type
- 4 cards in a row: `grid grid-cols-2 lg:grid-cols-4 gap-4`

**Note/callout boxes:**
- Info: `bg-blue-950/30 border-l-4 border-blue-500 rounded-r-lg px-4 py-3`
- Warning: `bg-yellow-950/30 border-l-4 border-[#ffd100] rounded-r-lg px-4 py-3`

**General characteristics from Qualys:**
- Left **sidebar navigation** (not just top nav) with iconified menu items
- Dense **data table view** as the primary jobs view (with sortable columns, search, filters)
- **Stats/metrics panels** at the top of the main view
- **Inline row actions** on table rows (open, move stage, generate doc)
- **Filter bar** above tables (filter by status, date range, suburb)
- Professional **status pill badges** in table cells
- **Pagination** (25 per page)
- **Quick search** that filters the job table in real time

**Specific pages/features to add:**

### 8a. Sidebar Navigation (replace top nav links)
The nav currently has only "Jobs" as a link. Build a proper left sidebar:
- Dashboard (overview/metrics)
- Jobs (table view)  
- Kanban (existing board)
- Documents (generated PDFs across all jobs)
- Settings (brand config, designer info — reads/writes SETTINGS/BRAND_CONFIG sheets)

### 8b. Jobs Table View (`/dashboard/jobs`)
Replace or complement the Kanban with a proper data table:
- Columns: Job #, Client Name, Address, Status (badge), Created, System Size, Quote Value, Drive (icon link), Actions
- Client-side search/filter by name, address, status
- Click row → navigate to job detail
- Inline "Move Stage" dropdown per row
- Sortable columns (client side sort — data already loaded)
- Pagination (25 per page)

### 8c. Dashboard Home — Metrics Overview
Replace the Kanban as the home page, or add above it:
- Stat cards: Total Jobs, Active Jobs (not Complete), In Progress, Completed This Month
- Pipeline value if quote data available
- Recent activity feed (last 5 jobs updated)
- AI usage widget (expand ProposalUsageBadge into a proper card)

### 8d. Documents Page (`/dashboard/documents`)
A view across all jobs showing every generated document:
- Table: Job #, Client Name, Doc Type, Status, Generated At, Open Draft, PDF
- Filter by doc type, date range
- Fetches from GAS `action=getAllDocuments` (new GAS action needed)

### 8e. Job Detail Improvements
The current job detail (`JobDetail.tsx`) is minimal. Expand:
- Add fields: system_size_kw, battery_size_kwh, total_price, estimated_annual_bill, finance_required
- These map to the document generation data — more fields = better AI output
- The GAS `updateJob` action should accept and save these additional fields

---

## 9. GAS Backend Context

The GAS project is called **"HEA Document Stack"**. It's a separate Apps Script project from "HEA Solar Analyser" (which is a different older system).

**Important:** When the next Claude needs new GAS functionality, the code must be provided as a snippet for Jesse to paste into Code.gs in the Document Stack Apps Script editor and re-deploy. The GAS files in `/home/user/HEA/hea-doc-stack/src/*.gs` are the source of truth in the repo, but Jesse manually syncs them.

**GAS deployment:** Every time Code.gs or other GAS files change, Jesse must: Deploy → Manage Deployments → New version → Deploy. The JOBS_GAS_URL does not change between deployments (it's the permanent web app URL).

---

## 10. Git Workflow

All work goes on: **`claude/build-hea-doc-stack-GFIoP`**

```bash
git add <files>
git commit -m "feat: description"
git push -u origin claude/build-hea-doc-stack-GFIoP
```

Vercel auto-deploys from this branch (or from main — check Vercel project settings).

---

## 11. Important Constraints & Gotchas

1. **No breaking API changes** — the GAS web app URL is fixed and Jesse uses it. Never change the action parameter names in doGet/doPost without updating both sides.

2. **Google Slides placeholder format** — placeholders are `{Variable_Name}` (single curly brace, mixed case). Replacement uses `presentation.replaceAllText('{' + key + '}', value)`. The old `{{DOUBLE_CURLY}}` format is NOT used in this template.

3. **Gemini rate limits** — free tier: 500 requests/day, 10 requests/minute. Never add logic that batches or loops Gemini calls without a rate limit check.

4. **Vercel function timeout** — document generation takes ~40s. Routes that call GAS for generation must have `export const maxDuration = 60` and use `AbortSignal.timeout(58_000)`.

5. **No Sanity CMS in dashboard** — Sanity is used for the public website (hea-group.com.au). The dashboard reads/writes only from GAS/Sheets. Never import Sanity client in dashboard components.

6. **Design discipline** — Jesse is proud of the dark premium aesthetic. Don't add light backgrounds, rounded-2xl cards that look "app-like", or anything that looks like a consumer SaaS tool. Keep it professional/enterprise.

7. **Jesse is non-technical** — all instructions must be "copy this → paste here → click deploy". Never ask him to run CLI commands or edit JSON config files.

---

## 12. Immediate Next Steps (Priority Order)

1. **Expand JobDetail form fields** — add solar system size, battery size, quote value, annual bill fields to the edit form. These are the data inputs that make AI-generated proposals accurate.

2. **Jobs table view** — enterprise-style sortable/filterable table as primary view. Dense data layout like the Qualys reference screenshot.

3. **Left sidebar navigation** — upgrade layout from top-nav-only to proper sidebar.

4. **Metrics home page** — stat cards above the job list.

5. **Documents page** — cross-job view of all generated PDFs.

---

*End of handover. All code is committed and pushed on `claude/build-hea-doc-stack-GFIoP`.*
