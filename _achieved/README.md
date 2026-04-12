# _achieved — Archived / Unused Code

This folder holds files that were moved out of the active codebase during a repo audit.
Nothing has been deleted — everything here can be restored by moving it back to its original path.

---

## Why files land here

| Reason | Meaning |
|--------|---------|
| **Unused component** | Built and complete, but never imported anywhere in the app |
| **Duplicate** | A second copy of a file that already exists in the correct location |
| **Pre-archived** | Was already stored as `.txt` backups in the repo (HEA SA folder) |

---

## Contents

### `components/About.tsx`
- **Original path:** `components/About.tsx`
- **Reason:** Unused — never imported in any page or layout
- **Notes:** May have been an early About page concept. Public site uses `Services.tsx` and `WhyChooseUs.tsx` instead.

### `components/Form.tsx`
- **Original path:** `components/Form.tsx`
- **Reason:** Unused — never imported anywhere
- **Notes:** A contact form component. The active contact UI is `components/Contact.tsx`.

### `components/GoogleReviews.tsx`
- **Original path:** `components/GoogleReviews.tsx`
- **Reason:** Unused — fully built but never imported
- **Notes:** A static Google reviews display component. Not wired to any page. If real review data is needed, consider connecting to the Sanity reviews endpoint (`/api/reviews`).

### `components/Testimonials.tsx`
- **Original path:** `components/Testimonials.tsx`
- **Reason:** Unused — fully built but never imported
- **Notes:** A testimonials section component. May have been replaced by or superseded by CaseStudies or another approach.

### `components/public/QuoteForm.tsx`
- **Original path:** `components/public/QuoteForm.tsx`
- **Reason:** Unused — fully built multi-step quote form, never imported
- **Notes:** The public `/quote` page now redirects directly to the GAS Solar Intake Form instead of using this React form. This component could be revived if the intake form is ever brought back into the Next.js app.

### `components/admin/FeaturePanel.tsx`
- **Original path:** `components/admin/FeaturePanel.tsx`
- **Reason:** Unused — fully built admin feature toggle panel, never imported in any admin page
- **Notes:** Reads `SystemConfig` feature flags and displays them. Could be wired into `/admin` layout or a settings page when needed.

### `GAS/IntakeFormJobCreation.gs`
- **Original path:** `GAS/IntakeFormJobCreation.gs`
- **Reason:** Duplicate — the live version is `HEA INTAKE/IntakeFormJobCreation.gs`
- **Notes:** The GAS/ folder copy had extra example comments at the bottom but was functionally identical. The `HEA INTAKE/` version is the source of truth and is auto-deployed via Clasp.

### `HEA SA/` (folder)
- **Original path:** `HEA SA/`
- **Reason:** Pre-archived — all 18 files were already saved as `.txt` backups (not active `.gs` scripts)
- **Notes:** This is the old Solar Analyser GAS project. The active Solar Analyser script lives at script ID `13uiUqOX_ko4Lliwccdi2S0x4KdKtZ5Q_MJYZGw08MvsBgXeXdBaMooM0`. These `.txt` files are reference copies only.

---

## Still in the live codebase (intentionally kept, but worth knowing about)

| File | Status | Why it stays |
|------|--------|-------------|
| `components/public/AdaWidget.tsx` | Disabled by env var | Intentionally off until OpenSolar confirms Ada widget billing. Leave in place. |
| `app/api/admin/setup/webhook/route.ts` | No frontend call | One-time setup endpoint — run manually or via Postman to register the OpenSolar webhook |
| `app/api/webhooks/opensolar/route.ts` | External only | Called by OpenSolar, not the frontend. Correct as-is. |
| `app/api/c2/documents/route.ts` | Legacy C2 route | Part of locked `/dashboard` C2 system. Leave untouched. |

---

## TODO items still in active code

These are in the live codebase and need real data from Jesse:

- `components/Footer.tsx` — Facebook URL (currently `#`)
- `components/Footer.tsx` — Instagram URL (currently `#`)
- `components/SocialProofBar.tsx` — Manufacturer logos (waiting on brand list)
- `components/CaseStudies.tsx` — Real install photos + actual bill reduction figures
- `lib/opensolar.ts` — `orderPermitPack()` endpoint needs confirmation from OpenSolar support
