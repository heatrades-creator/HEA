# HEA C2 — One-Time Manual Setup Report

**Date:** April 2026  
**Prepared by:** Claude Code  
**For:** Jesse Heffernan / HEA Admin

This document contains every manual step required to activate the HEA C2 Command & Control system. The code is all written and in the repo. You just need to connect it to Google.

---

## Overview of What You're Setting Up

| Component | What it is |
|---|---|
| Google Spreadsheet | `HEA C2 — Command & Control` — 18 sheet tabs, all data lives here |
| Google Apps Script project | `HEA C2` — the backend REST API, bound to the spreadsheet |
| 20 `.gs` files | All the backend logic (pasted from `GAS/C2/` in the repo) |
| Web App deployment | Makes the GAS project accessible as a URL |
| Vercel env var | `C2_GAS_URL` — tells the Next.js app where the GAS backend is |

---

## STEP 1 — Create the Google Spreadsheet

1. Go to [sheets.google.com](https://sheets.google.com) signed in as `hea.trades@gmail.com`
2. Click **Blank spreadsheet**
3. Rename it to: **`HEA C2 — Command & Control`**
4. Copy the **Spreadsheet ID** from the URL bar:
   ```
   https://docs.google.com/spreadsheets/d/SPREADSHEET_ID_IS_HERE/edit
   ```
5. Save this ID — you'll need it in Step 2

---

## STEP 2 — Create the GAS Project

1. Go to [script.google.com](https://script.google.com) signed in as `hea.trades@gmail.com`
2. Click **New project**
3. Rename the project: **`HEA C2`**  
   _(Click "Untitled project" at the top to rename)_
4. In the left sidebar, click the **gear icon** (Project Settings)
5. Scroll down to **Google Apps Script** section
6. Under "Script ID", note this value — you may need it later
7. **IMPORTANT**: Click **Change project** under "Script Properties" or under "Google Cloud Platform" and bind to the Spreadsheet:
   - Alternatively, open the Code.gs file and run `createAllSheets_()` after Step 5 — the spreadsheet binding happens via `SpreadsheetApp.getActiveSpreadsheet()` which works automatically when the script is bound
   - **Actual binding step**: In the GAS editor, go to **Resources → Advanced Google Services** or in the new editor: click the **+ beside Services** in the left panel. Add **Google Sheets API** if prompted.

> **Note on binding:** Because we use `SpreadsheetApp.getActiveSpreadsheet()`, the GAS project must be a **container-bound script** attached to the spreadsheet, OR you need to change the code to use `SpreadsheetApp.openById('YOUR_SHEET_ID')`. The easiest approach is:
>
> In the spreadsheet (Step 1), go to **Extensions → Apps Script**. This creates a container-bound script. Rename that project to `HEA C2`. This is the recommended approach.

### Recommended approach (simpler):
1. Open the **HEA C2 spreadsheet** you created in Step 1
2. Click **Extensions → Apps Script**
3. The Apps Script editor opens — this script is already bound to the spreadsheet
4. Rename the project to `HEA C2` (click "Untitled project" at top)
5. Proceed to Step 3

---

## STEP 3 — Create All GAS Files

In the Apps Script editor, create the following files. For each:
- Click the **+** button next to "Files" in the left panel
- Select **Script**
- Name it exactly as shown (without `.gs` — GAS adds it automatically)

### Files to create (20 total):

| Filename | Source in repo |
|---|---|
| `Code` | `GAS/C2/Code.gs` |
| `Utils` | `GAS/C2/Utils.gs` |
| `SheetBootstrap` | `GAS/C2/SheetBootstrap.gs` |
| `Telegram` | `GAS/C2/Telegram.gs` |
| `AuditService` | `GAS/C2/AuditService.gs` |
| `PermissionGuard` | `GAS/C2/PermissionGuard.gs` |
| `DeployabilityEngine` | `GAS/C2/DeployabilityEngine.gs` |
| `TaskEngine` | `GAS/C2/TaskEngine.gs` |
| `PersonService` | `GAS/C2/PersonService.gs` |
| `UnitService` | `GAS/C2/UnitService.gs` |
| `RoleService` | `GAS/C2/RoleService.gs` |
| `CandidateService` | `GAS/C2/CandidateService.gs` |
| `OnboardingService` | `GAS/C2/OnboardingService.gs` |
| `DocumentService` | `GAS/C2/DocumentService.gs` |
| `TrainingService` | `GAS/C2/TrainingService.gs` |
| `DisciplineService` | `GAS/C2/DisciplineService.gs` |
| `OffboardingService` | `GAS/C2/OffboardingService.gs` |
| `AssetService` | `GAS/C2/AssetService.gs` |

> The default `Code.gs` already exists — paste the content of `GAS/C2/Code.gs` into it and replace all existing content.

### How to paste each file:
1. Create the file in GAS editor (or click the existing `Code.gs`)
2. Select all existing content (Ctrl+A / Cmd+A)
3. Delete it
4. Open the corresponding file from the repo (`GAS/C2/FileName.gs`)
5. Copy all content
6. Paste into the GAS editor
7. **Do not click Save yet** — paste all files first, then save and deploy

---

## STEP 4 — Set Script Properties

1. In the GAS editor, click the **gear icon** (Project Settings) in the left panel
2. Scroll down to **Script Properties**
3. Click **Add script property** for each of the following:

| Property | Value |
|---|---|
| `TELEGRAM_BOT_TOKEN` | `8640252520:AAFoDKyuPe2sXq5M7HEEQO_XS-nC3CwkJLg` _(same as HEA Jobs)_ |
| `TELEGRAM_CHAT_ID` | `6083518387` _(same as HEA Jobs)_ |
| `ADMIN_EMAIL` | `hea.trades@gmail.com` |

4. Click **Save script properties**

> The `ADMIN_EMAIL` property means `hea.trades@gmail.com` always has full C2 access without needing a row in the `PERMISSION_PROFILE` sheet.

---

## STEP 5 — Deploy as Web App

1. In the GAS editor, click **Deploy → New deployment**
2. Click the **gear icon** next to "Select type" → choose **Web app**
3. Configure:
   - **Description**: `HEA C2 v1`
   - **Execute as**: `Me (hea.trades@gmail.com)`
   - **Who has access**: `Anyone`
4. Click **Deploy**
5. If prompted, click **Authorize access** → sign in as `hea.trades@gmail.com` → Allow all permissions
6. Copy the **Web app URL** — it looks like:
   ```
   https://script.google.com/macros/s/AKfycb.../exec
   ```
7. **Save this URL** — this is your `C2_GAS_URL`

---

## STEP 6 — Add Environment Variable to Vercel

1. Go to [vercel.com](https://vercel.com) → your HEA project → **Settings → Environment Variables**
2. Click **Add New**
3. Fill in:
   - **Key**: `C2_GAS_URL`
   - **Value**: _(paste the Web App URL from Step 5)_
   - **Environments**: check Production, Preview, and Development
4. Click **Save**
5. Go to **Deployments** → click **...** on the latest deployment → **Redeploy**

---

## STEP 7 — Bootstrap the Spreadsheet Tabs

After deploying, you need to create all 18 sheet tabs. Do this once:

1. Open your browser and go to:
   ```
   YOUR_C2_GAS_URL?action=bootstrap
   ```
   _(Replace `YOUR_C2_GAS_URL` with the URL from Step 5)_

2. You should see a JSON response like:
   ```json
   {
     "created": ["PERSON","UNIT","ROLE",...],
     "skipped": [],
     "total": 18
   }
   ```

3. Go back to the spreadsheet — all 18 tabs should now be visible:
   - `PERSON`, `UNIT`, `ROLE`, `RANK`, `APPOINTMENT`
   - `CANDIDATE`, `ONBOARDING_CASE`
   - `DOCUMENT`, `TRAINING_RECORD`, `CAPABILITY`
   - `DISCIPLINE_CASE`, `PIP`, `OFFBOARDING_CASE`
   - `ASSET`, `ASSET_ASSIGNMENT`
   - `TASK`, `AUDIT_LOG`, `PERMISSION_PROFILE`

> This is idempotent — safe to run again if anything looks wrong.

---

## STEP 8 — Add Your First Permission Profile Row

The `PERMISSION_PROFILE` sheet controls who can do what in the C2 system. The `ADMIN_EMAIL` Script Property already gives `hea.trades@gmail.com` full access without needing a row. But for other staff:

1. Open the `PERMISSION_PROFILE` tab in the spreadsheet
2. Add rows for each staff member:

| email | role | can_write_people | can_write_discipline | can_write_finance | can_view_audit | created_at |
|---|---|---|---|---|---|---|
| `hea.trades@gmail.com` | ADMIN | TRUE | TRUE | TRUE | TRUE | _(today)_ |
| `jdmheff@gmail.com` | HR_MANAGER | TRUE | TRUE | FALSE | TRUE | _(today)_ |
| `sbjma.alexisflores@gmail.com` | SUPERVISOR | TRUE | FALSE | FALSE | FALSE | _(today)_ |

---

## STEP 9 — Set Up the Daily Expiry Check Trigger

This runs `runDocumentExpiryCheck_()` every day to check for expiring documents and probation warnings.

1. In the GAS editor, click the **clock icon** (Triggers) in the left panel
2. Click **+ Add Trigger**
3. Configure:
   - **Function to run**: `runDocumentExpiryCheck_`  
     _(Note: In GAS, you call this via a wrapper — add this function to Code.gs or DocumentService.gs):_
     ```javascript
     function dailyExpiryCheck() {
       runDocumentExpiryCheck_();
     }
     ```
   - **Event source**: Time-driven
   - **Type of time based trigger**: Day timer
   - **Time of day**: 7am to 8am (or your preference)
4. Click **Save**
5. Authorize if prompted

---

## STEP 10 — Verify Everything Works

Run these checks in order:

### ✅ Check 1: Spreadsheet
- Open the `HEA C2 — Command & Control` spreadsheet
- Confirm all 18 tabs are present with yellow headers

### ✅ Check 2: Overview endpoint
Visit in browser:
```
YOUR_C2_GAS_URL?action=getOverview
```
Should return:
```json
{"headcount":0,"total_people":0,"deployable_full":0,...}
```

### ✅ Check 3: Dashboard loads
- Go to `https://hea-group.com.au/dashboard/c2`
- You should see the Command overview page with 4 stat cards
- All show `—` or `0` until data is added — that's expected

### ✅ Check 4: Nav shows COMMAND section
- Open any dashboard page
- Sidebar should show: WORKSPACE, **COMMAND** (Command, People, Recruit, Onboarding, Units, Tasks), PROPOSALS, TOOLS, Settings

### ✅ Check 5: Add a test person
- Go to `/dashboard/c2/people`
- Click **+ Add Person**
- Fill in a test name → Submit
- Should appear in the table with `FULL` deployability

### ✅ Check 6: Telegram alert
- After adding a test person, check @HEAJobsJesse_Bot
- Should receive: `👤 NEW HIRE: [name] — FULL_TIME —`

### ✅ Check 7: Add a test candidate, accept offer
- Go to `/dashboard/c2/recruitment`
- Add a candidate → move through stages to `OFFER_ACCEPTED`
- Check:
  - New person created automatically in PERSON sheet
  - New onboarding case created in ONBOARDING_CASE sheet
  - 5 tasks created in TASK sheet
  - Telegram alert fires

---

## Summary of What Was Built

### GAS Files (18, in `GAS/C2/`)
| File | Purpose |
|---|---|
| `Code.gs` | doGet/doPost router — all action strings |
| `Utils.gs` | uuid_(), now_(), getSheet_(), findRow_(), etc. |
| `SheetBootstrap.gs` | createAllSheets_() — one-time tab creator |
| `Telegram.gs` | sendTelegramAlert_() — silent-fail pattern |
| `AuditService.gs` | auditLog_() — writes to AUDIT_LOG on every state change |
| `PermissionGuard.gs` | permAssert_() — enforces write permissions |
| `DeployabilityEngine.gs` | computeDeployability_() — computed on every person read |
| `TaskEngine.gs` | createTasksForTrigger_() — automated task creation |
| `PersonService.gs` | Person CRUD + status transitions (no hard delete) |
| `UnitService.gs` | Org unit CRUD |
| `RoleService.gs` | Role + Rank CRUD |
| `CandidateService.gs` | Recruitment pipeline + OFFER_ACCEPTED automation |
| `OnboardingService.gs` | Onboarding flow + COMPLETE→PROBATION transition |
| `DocumentService.gs` | Compliance docs + daily expiry check |
| `TrainingService.gs` | Training records + capability records |
| `DisciplineService.gs` | Discipline cases + PIPs |
| `OffboardingService.gs` | Offboarding flow + task automation |
| `AssetService.gs` | Asset management + task CRUD |

### Next.js API Routes (14, in `app/api/c2/`)
`overview`, `people`, `people/[id]`, `candidates`, `candidates/[id]`, `onboarding`, `onboarding/[id]`, `units`, `tasks`, `tasks/[id]`, `discipline`, `discipline/[id]`, `offboarding`, `documents`

### Dashboard Pages (10, in `app/dashboard/c2/`)
`/c2` (Command overview), `/c2/people`, `/c2/people/[id]`, `/c2/recruitment`, `/c2/onboarding`, `/c2/units`, `/c2/tasks`, `/c2/discipline`, `/c2/offboarding`

### Dashboard Components (10, in `components/dashboard/c2/`)
`DeployabilityBadge`, `PersonStatusBadge`, `PeopleTable`, `NewPersonModal`, `CandidatePipeline`, `NewCandidateModal`, `OnboardingTracker`, `UnitTree`, `TaskList`, `DisciplineTable`

### Modified Files (1)
`components/dashboard/DashboardNav.tsx` — COMMAND section added between WORKSPACE and PROPOSALS

---

## Non-Negotiables Enforced in the Code

| Rule | How it's enforced |
|---|---|
| No hard delete of PERSON | `PersonService.gs` has no delete function. Status transitions only. |
| Deployability is computed, never manual | `computeDeployability_()` runs inside `rowToPerson_()` on every read. Stored value is ignored. |
| All state transitions are logged | `auditLog_()` called in every mutating function before return. |
| Permissions not bypassable | `permAssert_()` at top of every write function. Throws FORBIDDEN. |
| Apprentice must have supervisor | `DeployabilityEngine.gs` returns LIMITED if `employment_type=APPRENTICE` and `supervisor_id` is empty. |
| Command chain resolves or flags | Status transitions are validated — invalid ones throw and return 422. |

---

*This document is the complete one-time setup guide. Keep it somewhere safe. If the GAS URL ever changes (re-deployed), update `C2_GAS_URL` in Vercel and redeploy.*
