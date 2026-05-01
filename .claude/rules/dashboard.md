---
paths:
  - "app/dashboard/**"
  - "components/dashboard/**"
  - "app/api/dashboard/**"
---

## Sales Pipeline (`/dashboard/pipeline`)

Three stages backed entirely by GAS job statuses. No separate database.

| Stage | Column title | GAS statuses | Card component |
|-------|-------------|-------------|----------------|
| 1 | Build the Deal | `Lead` | `BuildTheDealCard.tsx` |
| 2 | Close the Deal | `Quoted`, `Contract`, `Booked`, `In Progress` | `CloseTheDealCard.tsx` |
| 3 | Post-Install | `Complete` | `PostInstallCard.tsx` |

### Component files
```
app/dashboard/pipeline/page.tsx                       ← Server: fetches GAS, splits into 3 arrays
components/dashboard/pipeline/SalesPipelineBoard.tsx  ← Client: 3-column layout, optimistic moves
components/dashboard/pipeline/BuildTheDealCard.tsx    ← Stage 1 (NMI auto-detect, polling)
components/dashboard/pipeline/CloseTheDealCard.tsx    ← Stage 2 (stock, date, deposit)
components/dashboard/pipeline/PostInstallCard.tsx     ← Stage 3 (review, thank you)
```

### Stage advance flow
1. Card calls `POST /api/dashboard/pipeline/move-stage` with new GAS status
2. `onAdvanced(jobNumber)` callback fires on success
3. `SalesPipelineBoard` removes card from current column, prepends to next — no page reload

### BuildTheDealCard NMI polling
When Alexis clicks "Get NMI Data":
- Opens PowerCor portal in new tab + client's Drive NMI subfolder in new tab
- Sets `polling = true` → `setInterval` calls `checkNMI` + `checkEst` every 30s
- Dot turns green automatically when file is detected

### Dashboard API proxy pattern
```typescript
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const gasUrl = process.env.JOBS_GAS_URL
  if (!gasUrl) return NextResponse.json({ error: 'GAS not configured' }, { status: 503 })
  const res = await fetch(`${gasUrl}?action=...`, { cache: 'no-store' })
  return NextResponse.json(await res.json())
}
```

### Existing dashboard pipeline API routes
- `GET /api/dashboard/pipeline/check-nmi?jobNumber=X`
- `GET /api/dashboard/pipeline/check-estimation?jobNumber=X`
- `POST /api/dashboard/pipeline/move-stage` — body: `{ jobNumber, status }`
