---
paths:
  - "app/dashboard/c2/**"
  - "components/dashboard/c2/**"
---

## Installers Page (`/dashboard/c2/installers`)

Three independent blocks (card sections). When changing a block, increment its version number in the header.

| Block | Component | Version | Purpose |
|---|---|---|---|
| Installers | `InstallerTable.tsx` | — | Installer accounts, activate/deactivate, + New Installer modal |
| App Distribution | `AppDistribution.tsx` | v9 | APK version history, publish new EAS build URL |
| Push Notification | `NotifyInstallers.tsx` | — | Send instant push alert to all active installer devices |

### Block versioning rule

`AppDistribution.tsx` has a version stamp hardcoded in its header:
```tsx
<span className="text-xs font-normal text-gray-400 ml-1">v9</span>
```
**Increment this number every time the component is modified.** This lets Jesse know which version is deployed without checking git.

### App Distribution flow

1. `eas build --platform android --profile preview` (run on Windows)
2. Copy the EAS artifact URL (e.g. `https://expo.dev/artifacts/eas/….apk`)
3. App Distribution block → **+ New Version** → paste URL + version → Save & Publish
4. Download page at `hea-group.com.au/installer-app` updates immediately

**EXPO_TOKEN** is stored as a GitHub repo secret (robot user token from `@heatrades-creator` on expo.dev).
