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
| GAS errors swallowed silently | `r.ok` always true (GAS returns HTTP 200 even on error) | Read raw `.text()`, parse JSON, check `data.error` field |
| OTA updates never delivered | `runtimeVersion: { policy: "appVersion" }` — OTA only reaches APKs built with the exact same version string. Any version bump silently breaks OTA. | Fixed to `"runtimeVersion": "1"` (static string). Never change back to a policy. Requires one APK rebuild after changing. |
| OTA GitHub Action fails: "owner must be specified" | `EXPO_TOKEN` is a robot/CI token; EAS requires `"owner"` field when authenticating via token instead of interactive login | Add `"owner": "jheffernan26"` to the `expo` object in `mobile/app.json` |
| All authenticated API calls return 401 after login | `BASE` URL was `https://hea-group.com.au` (apex). Vercel redirects apex → www with 301. Android `okhttp` drops `Authorization` header on cross-host redirects (HTTP spec). Login has no auth header so it worked; all other calls failed. | `BASE` in `mobile/lib/api.ts` must be `https://www.hea-group.com.au` (www directly). Never use the apex domain. |
| Login loop after successful PIN entry | `getToken()` was called async in the auth guard. During `(auth) → (tabs)` navigation transition, `segments` briefly passes through `[]`. The async callback captured stale segments, leaving the redirect guard armed and sending the user back to login. | Auth guard uses `getTokenSync()` (reads `global.__heaToken` synchronously). `saveAuth()` sets `global.__heaToken` synchronously before any SecureStore writes. Login calls `saveAuth()` without `await`, then navigates immediately. |
| Field note posts successfully but app shows error + white screen | Comments POST route returned the Prisma object without `replies`. App added the comment to state then crashed rendering `c.replies.map(...)` (undefined). White screen = React Native render crash in production. | Comments POST route returns `{ ...comment, replies: [] }`. App also uses `(c.replies ?? []).map(...)` as a defensive guard. |
| Photo/receipt upload fails with "Job not found" | GAS `uploadToJobFolder_` looks up the job by job number in the GAS sheet. Prisma-only leads have `LEAD-x` job numbers that don't exist in GAS and have no Drive folder. | Expected — uploads only work for real GAS jobs with Drive folders. Error message now propagates the actual GAS error so the reason is visible. |
