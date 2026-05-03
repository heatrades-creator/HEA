---
paths:
  - "GAS/**"
  - "HEA INTAKE/**"
  - "HEA SA/**"
  - "app/api/dashboard/**"
---

## GAS Scripts — Full Reference

### Adding a new action to HEAJobsAPI.gs

1. Add a branch to `doGet(e)` or `doPost(e)`:
```javascript
if (e.parameter.action === 'myAction' && e.parameter.jobNumber) {
  return jsonResponse(myAction_(e.parameter.jobNumber));
}
```
2. Write the helper `myAction_(jobNumber)` returning a plain object.
3. Push to `main` — GAS auto-deploys via GitHub Actions. No manual steps.

The GAS script reads from `getSheet_()` (the jobs Google Sheet) and `DriveApp` for file operations.

### Auto-Deploy: GAS via Clasp

Push to `main` touching `HEA INTAKE/**`, `GAS/**`, or `HEA SA/**` → `.github/workflows/deploy-gas.yml` runs → clasp pushes **and** creates a new deployment version. Same URL, new code.

The workflow: `clasp push --force` then `clasp deploy -i <DEPLOYMENT_ID>`. For scripts without a hardcoded deployment ID it queries `clasp deployments`, grabs the latest non-HEAD ID, and updates it.

**Credentials:** GitHub secret `CLASPRC_JSON` written to 4 locations in the workflow (clasp v3 is inconsistent about which it reads).

**If pushes silently fail:** `clasp login` on a machine signed in as `hea.trades@gmail.com`, copy `~/.clasprc.json` → update `CLASPRC_JSON` in GitHub Secrets.

### ⚠️ Critical GAS gotchas

**`appsscript.json` access must be `"ANYONE_ANONYMOUS"`** — never `"ANYONE"`. `"ANYONE"` requires a Google login and returns HTML instead of JSON. Every `clasp push` overwrites the GAS UI setting, so `appsscript.json` is the only source of truth.

**`GAS/.claspignore` must exclude `C2/**` and `PhotoPortal/**`** — these are separate GAS projects with their own `.clasp.json`. If omitted, their `doGet` overrides the Jobs API's `doGet`, causing `{"error":"Unknown action:"}` for every request.

**`JOBS_GAS_URL` must point to the Jobs API web app** — verify: `GET <JOBS_GAS_URL>` should return a JSON array of job objects. The correct script ID is in `GAS/.clasp.json`.

**Jobs API auto-updates `JOBS_GAS_URL` in Vercel on deploy** — `deploy-jobs-api` workflow step calls the Vercel API. Requires `VERCEL_TOKEN` secret and `VERCEL_PROJECT_ID: prj_4wvjTKCHlMjJtCZ5zFTRmZqU9IdK` (hardcoded in workflow).

**GAS always returns HTTP 200 — even on errors.** Never use `r.ok`. Read raw `.text()`, parse JSON, check `data.error`.

### GAS scripts table

| Folder | Purpose | Deployment ID |
|---|---|---|
| `HEA INTAKE/` | Intake form backend | dynamic (queried at deploy time) |
| `GAS/` | Jobs API | dynamic (queried at deploy time) |
| `GAS/PhotoPortal/` | Client photo upload portal | `AKfycbwERmJbdTrnpM_-ABgXGtRolMCzSG2nDWJNyJjhfDx-baSI1BJWiehTdCM9qW0VSWU` |
| `HEA SA/` | Solar analyser | `AKfycbzZuPvjN6yzPbXUk4OajTLFbDoTMjrxqPgAWqsqJuZAqXfqHhdEsAJ8v1_MOD931nc` |

### GAS Drive folder structure per client

```
TS00001-John-Smith-YYYY-MM-DD/
  00-nmi-data/      ← PowerCor NMI files
  01-quotes/        ← Quote PDFs
  02-proposals/     ← Proposal documents
  03-signed/        ← Signed estimation/contract
  04-installed/     ← Post-install photos
  05-photos/        ← All photo uploads (intake + installer app)
  06-jobfiles/      ← Intake form documents (job card PDF, electricity bill)
  07-receipts/      ← Job site receipts from installer app
```

`driveUrl` on the job points to the root client folder.

See `.claude/rules/naming-conventions.md` for the full file naming standard.

### GAS Drive auto-detection actions

| Action | Returns | Used by |
|--------|---------|---------|
| `?action=checkNMI&jobNumber=X` | `{ hasNMI, fileName, fileUrl, nmiSubfolderUrl }` | `/api/dashboard/pipeline/check-nmi` |
| `?action=checkEstimation&jobNumber=X` | `{ hasEstimation, fileName, fileUrl }` | `/api/dashboard/pipeline/check-estimation` |

Called from `BuildTheDealCard.tsx` on mount and every 30s while polling.
