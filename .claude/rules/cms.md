---
paths:
  - "lib/email.ts"
  - "lib/hubspot.ts"
  - "lib/sanity.ts"
  - "sanity/**"
  - "app/api/leads/**"
---

## Email (`lib/email.ts`)

All transactional email goes through Resend via `lib/email.ts`. Do not create new email utilities — extend this file.

Key exports:
- `sendIntakeEmail()` — client confirmation + Jesse alert with PDFs attached
- `sendLeadNotification()` — simple lead alert
- `sendReviewRequest()` — Google review request

**Google Review URL:** stored in `lib/constants.ts` as the canonical source — do not hardcode it elsewhere.

## HubSpot CRM (`lib/hubspot.ts`)

HubSpot has a 7-stage pipeline. Sync is always fire-and-forget from API routes — never block the response on HubSpot.

```typescript
updateHubSpotDeal(leadId: string, stage: string)
// stage values: 'appointmentscheduled' | 'qualifiedtobuy' | 'presentationscheduled' |
//               'decisionmakerboughtin' | 'contractsent' | 'closedwon' | 'closedlost'
```

## Sanity CMS

`lib/sanity.ts` exports:
- `getSiteContent()` — full site data (footer, about, pricingPackages, caseStudies, faqs, reviews)
- `getFooterData()` — footer only
- `urlFor(image)` — Sanity image URL builder

**All pages pass footer:** `<Footer data={content.footer} />` — never bare `<Footer />`.

**Adding a CMS field:** schema in `sanity/schemaTypes/` → update GROQ in `getSiteContent()` → use in page.
