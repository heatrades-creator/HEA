---
paths:
  - "app/admin/**"
  - "components/admin/**"
  - "app/api/admin/**"
---

## Admin API Routes — Prisma Pattern

All `/api/admin/pipeline/[id]/*` routes follow this pattern:

```typescript
export async function POST(req, { params }) {
  const session = await getServerSession(authOptions)
  if (!session || !isAdminEmail(session.user?.email)) return 401
  const lead = await prisma.lead.findUnique({ where: { id: params.id } })
  if (!lead) return 404
  await prisma.lead.update({
    where: { id: params.id },
    data: {
      fieldName: value,
      auditEntries: { create: { action: 'action_name', actor: session.user.email } }
    }
  })
  // fire-and-forget HubSpot sync if needed
}
```

## Prisma Lead Model — Marketing/Admin Only

The Prisma `Lead` model tracks marketing leads from `/intake` and web forms. It is NOT the operational job system — that's GAS.

Key fields:
- `estimationSignedAt` — Stage 1→2 gate in `/admin/pipeline`
- `installedAt` — Stage 2→3 gate
- `appointmentAt`, `buildDate`, `depositAmountAud` — sales milestone tracking
- `googleReviewReceivedAt`, `thankYouSentAt` — post-install tracking
- `hubSpotContactId`, `hubSpotDealId` — CRM sync
