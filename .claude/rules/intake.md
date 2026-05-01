---
paths:
  - "app/intake/**"
  - "app/api/intake/**"
  - "lib/intake-pdf.ts"
---

## Intake Form

GAS iframe had a fixed ~750px CSS viewport on mobile — CSS @media useless, moved to Next.js.

| File | Purpose |
|---|---|
| `app/intake/page.tsx` | 5-step form, `?service=solar\|battery\|ev` pre-selects step 2 |
| `app/api/intake/route.ts` | Validates → fires background work via `after()` → returns 201 immediately |
| `lib/intake-pdf.ts` | `generateConsentPdf()` + `generateJobCardPdf()` via pdf-lib |

### Submission flow
1. Client submits → `route.ts` validates with Zod, calls `after(async () => processIntake(d))`, returns `{ success: true }` (201) **immediately**
2. `processIntake` runs after the response: generates PDFs, calls GAS `createJob`, calls GAS `saveIntakeDocs`, writes Prisma `Lead`, sends emails via Resend
3. Client-side fetch in `page.tsx` is fire-and-forget — `setSubmitted(true)` immediately, no `await`
4. Success screen auto-redirects to Calendly after 4 seconds (pre-filled `name` + `email`)

**Never `await` GAS or email calls inside the route handler** — all heavy work belongs in `after()`. Vercel will timeout on large photo payloads otherwise.

### Image compression (client-side, before base64 upload)

`compressImage(file, maxPx = 800, quality = 0.45)` in `page.tsx` uses Canvas API to resize + re-encode before upload. Keep these values low — mobile photos can be 8MB+.

### Lead links

`lib/constants.ts` defines:
```ts
GAS_INTAKE_URL     = "/intake"
INTAKE_URL_SOLAR   = "/intake?service=solar"
INTAKE_URL_BATTERY = "/intake?service=battery"
INTAKE_URL_EV      = "/intake?service=ev"
```
Service pages import their matching constant. Never hardcode intake URLs.
