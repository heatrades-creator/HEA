---
paths:
  - "mobile/**"
  - "app/api/installer/**"
---

## Mobile App (`mobile/`)

React Native + Expo app for field installers. Located in `mobile/` at the repo root.

| File | Purpose |
|---|---|
| `mobile/app.json` | Expo config — app name, version, OTA update URL, EAS project ID |
| `mobile/eas.json` | EAS build + update channel config (`preview` / `production`) |
| `mobile/app/_layout.tsx` | Root layout — auth redirect, OTA update check on launch, push notification tap handler |
| `mobile/app/(auth)/login.tsx` | PIN login screen |
| `mobile/app/(tabs)/jobs/index.tsx` | Job list — grouped by postcode, claim status chips |
| `mobile/app/(tabs)/jobs/[id].tsx` | Job detail — claim section, job pack modal, field notes |
| `mobile/app/(tabs)/receipts.tsx` | Receipts tab |
| `mobile/app/(tabs)/clock.tsx` | Time tracking |
| `mobile/app/(tabs)/contacts.tsx` | Contacts |
| `mobile/app/(tabs)/card.tsx` | Digital business card |
| `mobile/lib/api.ts` | API client — all calls to `/api/installer/*` |
| `mobile/lib/auth.ts` | Token storage (SecureStore) |
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
| `/api/installer/jobs/[id]/photos` | GET/POST | Site photo upload |
| `/api/installer/jobs/[id]/receipts` | POST | Receipt upload |
| `/api/installer/timesheets` | POST | Clock in/out |
| `/api/installer/comments` | GET/POST | Field notes |
| `/api/installer/contacts` | GET | Contact list |
| `/api/installer/push-token` | POST | Register Expo push token |

### Job claiming

`JobClaim` is stored in Prisma (not GAS). One claim per job (`jobNumber` unique). Only the owning installer can update the date or delete the claim. The jobs API fetches all claims in parallel with GAS and attaches them to each job response.

### OTA updates (automatic on every push to `main`)

`_layout.tsx` calls `Updates.checkForUpdateAsync()` before showing UI. If an update exists it fetches and reloads silently. Skipped in dev (`__DEV__`).

`eas-update.yml` GitHub Action fires on push to `main` when `mobile/**` changes → runs `eas update --branch preview`.

### Runtime version policy

`app.json` uses `"policy": "appVersion"` — runtime version equals `expo.version`. OTA updates only apply to apps built with the same version. Bumping `expo.version` for a native build stops OTA delivery to the old version.

### When a new APK IS required

Only needed when native dependencies change, `app.json` plugins change, or `expo` version bumps:
1. `eas build --platform android --profile preview` (run on Windows)
2. Publish the new EAS artifact URL via the App Distribution block at `/dashboard/c2/installers`
3. Notify installers via the Push Notification block

### Installer roles

Two roles: `installer` (field worker) and `lead` (lead installer). Set at creation in Prisma `Installer` model. Role controls what the mobile app shows.
