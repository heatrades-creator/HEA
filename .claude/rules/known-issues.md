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
