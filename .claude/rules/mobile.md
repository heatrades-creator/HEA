---
paths:
  - "mobile/**"
  - "app/api/installer/**"
---

## Mobile App (`mobile/`)

React Native + Expo app for field installers. Located in `mobile/` at the repo root.

| File | Purpose |
|---|---|
| `mobile/app.json` | Expo config — app name, version, OTA update URL, EAS project ID, owner |
| `mobile/eas.json` | EAS build + update channel config (`preview` / `production`) |
| `mobile/app/_layout.tsx` | Root layout — auth redirect (synchronous), OTA update check on launch, push notification tap handler |
| `mobile/app/(auth)/login.tsx` | PIN login screen |
| `mobile/app/(tabs)/jobs/index.tsx` | Job list — grouped by postcode, claim status chips |
| `mobile/app/(tabs)/jobs/_layout.tsx` | Jobs Stack — hides header on index (index has its own custom header) |
| `mobile/app/(tabs)/jobs/[id].tsx` | Job detail — claim section with month calendar picker, job pack modal, field notes |
| `mobile/app/(tabs)/receipts.tsx` | Receipts tab |
| `mobile/app/(tabs)/clock.tsx` | Time tracking |
| `mobile/app/(tabs)/contacts.tsx` | Contacts |
| `mobile/app/(tabs)/card.tsx` | Digital business card |
| `mobile/lib/api.ts` | API client — all calls to `/api/installer/*` |
| `mobile/lib/auth.ts` | Token storage (SecureStore + `global.__heaToken` in-memory cache) |
| `mobile/lib/types.ts` | GASJob, Comment, JobClaim, InstallerProfile interfaces |
| `mobile/lib/notifications.ts` | Expo push token registration |

### API routes the mobile app calls

All under `/api/installer/` — JWT token auth via `lib/installer-auth.ts`, not NextAuth.

| Route | Method | Purpose |
|---|---|---|
| `/api/installer/auth` | POST | PIN login → returns JWT |
| `/api/installer/jobs` | GET | Active job list (Booked + In Progress), enriched with claim data |
| `/api/installer/jobs/[id]` | GET | Job detail, enriched with claim data |
| `/api/installer/jobs/[id]/claim` | GET/POST/DELETE | Claim management |
| `/api/installer/jobs/[id]/photos` | GET/POST | Site photo upload → GAS `uploadJobPhoto` → Drive `05_Photos/` |
| `/api/installer/jobs/[id]/receipts` | POST | Receipt upload → GAS `uploadJobReceipt` → Drive `07_Receipts/` |
| `/api/installer/timesheets` | POST | Clock in/out |
| `/api/installer/comments` | GET/POST | Field notes (Prisma `JobComment`) |
| `/api/installer/claims` | GET | All active claims — used by calendar availability view |
| `/api/installer/contacts` | GET | Contact list |
| `/api/installer/push-token` | POST | Register Expo push token |
| `/api/installer/version` | GET | Current JS bundle version (unauthenticated) |

### Job claiming

`JobClaim` is stored in Prisma (not GAS). One claim per job (`jobNumber` unique). Only the owning installer can update the date or delete the claim. The jobs API fetches all claims in parallel with GAS and attaches them to each job response.

The claim modal shows a **month calendar** (not a text input) with team availability: green dots = your jobs, yellow = teammate's, red = full (max 5 per day). Past dates are disabled. "Add to Google Calendar" button opens a pre-filled Google Calendar event URL after claiming.

### Auth token flow

- Login API call has no `Authorization` header → works regardless of redirects
- All other calls use `Authorization: Bearer <token>` via `authFetch()` in `api.ts`
- `global.__heaToken` is the in-memory cache — set synchronously at the start of `saveAuth()`, read by `getTokenSync()` in the auth guard
- **Never read the token async in the auth guard** — async races cause spurious login redirects during navigation transitions
- After login, `saveAuth()` is called without `await` (fire-and-forget for SecureStore), then `router.replace('/(tabs)/jobs')` fires immediately. The token is already in `global.__heaToken` at that point.
- On app launch, `init()` in `_layout.tsx` calls `await getToken()` to warm the global cache from SecureStore before `setReady(true)`

### API base URL — use www, never apex

`BASE` in `api.ts` must be `https://www.hea-group.com.au` (www subdomain directly).

**Never use `https://hea-group.com.au` (apex).** Vercel redirects apex → www with a 301. Android's `okhttp` (React Native's fetch) follows cross-host redirects but drops the `Authorization` header per HTTP spec. Login works (no auth header) but every other call returns 401.

### OTA updates — how they work

**Every push to `main` that touches `mobile/**`** triggers `eas-update.yml` → `eas update --branch preview` → bundle published to Expo's update server.

On app launch, `_layout.tsx` calls `Updates.checkForUpdateAsync()`. If an update is available it downloads and reloads silently (skipped in dev). Installers get updates automatically on next open — no reinstall needed.

**Requirements for OTA to work:**
1. `"runtimeVersion": "1"` in `app.json` — static string, never a policy object. All APKs built with runtime version `"1"` receive updates forever.
2. `"owner": "jheffernan26"` in `app.json` — required when `EXPO_TOKEN` is a robot/CI token. Without it, `eas update` fails with "owner must be specified".
3. `EXPO_TOKEN` secret set in GitHub → Settings → Secrets.

**OTA is JS-only.** Any change to native code, `app.json` plugins, or Expo SDK version requires a new APK build.

### When a new APK IS required

Only needed when native dependencies change, `app.json` plugins change, or `expo` SDK version bumps:
1. `git pull origin main` on Windows
2. `cd mobile && eas build --platform android --profile preview`
3. Publish the new EAS artifact URL via the App Distribution block at `/dashboard/c2/installers`
4. Notify installers via the Push Notification block

---

## Deployment Decision Guide — OTA vs APK

When Claude makes a mobile change, the commit message will include one of these tags:

- **`[OTA]`** — JS/UI only. Pushed automatically via `eas-update.yml` on merge to `main`. Installers get it silently on next app open. No action needed.
- **`[APK REQUIRED]`** — Native change. OTA cannot deliver this. Run the commands below in `cmd`.

### APK build commands (copy-paste into cmd)

```
cd C:\Users\JDMHe\HEA
git pull origin main
cd mobile
eas build --platform android --profile preview
```

After the build completes (~10–15 min on EAS servers):
1. EAS will print a URL like `https://expo.dev/artifacts/eas/...apk` — copy it
2. Go to `/dashboard/c2/installers` → App Distribution → paste the URL → Save
3. Use the Push Notification block to notify installers to reinstall
4. Installers must manually install the new APK — OTA does not deliver native changes

### What triggers each

| Change type | Delivery | Action required |
|---|---|---|
| Screen UI, styles, text | OTA | None — auto |
| New screen or tab | OTA | None — auto |
| API calls, business logic | OTA | None — auto |
| New npm package (JS-only, e.g. a UI lib) | OTA | None — auto |
| New npm package with native code (e.g. camera, BLE) | **APK** | Run build commands |
| `app.json` plugin added/changed | **APK** | Run build commands |
| Expo SDK version bump | **APK** | Run build commands |
| `android/` or `ios/` native files changed | **APK** | Run build commands |

### Installer roles

Two roles: `installer` (field worker) and `lead` (lead installer). Set at creation in Prisma `Installer` model. Role controls what the mobile app shows.

