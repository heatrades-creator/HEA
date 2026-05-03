# HEA Annex System — Complete Reference

## What Annexes Are

Annexes are modular PDF building blocks that attach to the 7 base documents (job card,
electrical works proposal, wholesale order, work order, completion report, finance pack,
grid connection). Each annex is generated independently and merged at document assembly time.

**9 annexes total.** 6 have generators. 3 are placeholders pending external data.

---

## Architecture — Two Generation Engines

### Engine A: Google Slides (via SlidesTemplateEngine in HEAJobsAPI.gs)
Used for: `site-assessment`, `financial-outcomes`, `system-spec`, `nmi-data`

Flow:
1. Master Slides template lives in Drive ("HEA Annex Master Templates" folder)
2. `generateAnnex_(jobNumber, slug)` in `GAS/AnnexEngine.gs` copies the master
3. Fills `{TOKEN_Name}` placeholders with job data via `replaceAllText`
4. Exports copy to PDF via Drive export URL
5. Saves PDF to correct job subfolder (e.g. `06-jobfiles/`, `02-proposals/`)
6. Returns `{ editUrl, pdfUrl, pdfFileName }` — editUrl opens the Slides copy
7. Logs to ANNEX_JOBS sheet in the GAS spreadsheet

**The edit link is per-job.** Each generation creates a new Slides copy. Jesse can open it,
tweak it, and re-export manually. The master template is the design source of truth.

**Master template IDs are stored in GAS Script Properties**, not in code:
- Key format: `ANNEX_TPL_{slug}` e.g. `ANNEX_TPL_site-assessment`
- Set by running `setupAnnexMasterTemplates_()` once in the GAS editor
- Retrieved by `getAnnexMasterTemplateId_(slug)` in AnnexEngine.gs

### Engine B: pdf-lib (via lib/annexes/*.ts in Next.js)
Used for: `client-photos-intake`, `client-photos-followup`, `installer-photos`

Photos cannot be templated in Slides (no way to inject live Drive photos). These use the
pdf-lib generators in `lib/annexes/photos.ts`. The "edit link" for photo annexes is the
Drive `05-photos/` subfolder URL — the source photos, not the PDF itself.

---

## The 9 Annexes

| Slug | Engine | Status | Drive | Token prefix |
|---|---|---|---|---|
| `site-assessment` | Slides | ✅ Available | `06-jobfiles/` | `{SA_*}` |
| `financial-outcomes` | Slides | ✅ Available | `02-proposals/` | `{FO_*}` |
| `system-spec` | Slides | ✅ Available | `01-quotes/` | `{SS_*}` |
| `client-photos-intake` | pdf-lib | ✅ Available | `05-photos/` | n/a |
| `client-photos-followup` | pdf-lib | ✅ Available | `05-photos/` | n/a |
| `installer-photos` | pdf-lib | ✅ Available | `05-photos/` | n/a |
| `hea-sa` | Drive fetch | 🔧 Planned | `01-quotes/` | n/a |
| `open-solar` | OpenSolar API | 🔧 Planned | `02-proposals/` | n/a |
| `nmi-data` | Slides | 🔧 Planned | `00-nmi-data/` | `{NMI_*}` |

---

## Slides Token Manifests

### Site Assessment (`{SA_*}`)
```
{SA_JobNumber}      {SA_ClientName}     {SA_Phone}          {SA_Email}
{SA_Address}        {SA_Postcode}       {SA_CreatedDate}    {SA_ServiceDesc}
{SA_SystemSizeKw}   {SA_BatterySizeKwh}
{SA_RoofMaterial}   {SA_RoofOrientation}  {SA_ShadingIssues}  {SA_Phases}
{SA_Occupants}      {SA_HomeDaytime}    {SA_HotWater}       {SA_GasAppliances}
{SA_Ev}             {SA_FinanceRequired}
{SA_WifiSsid}       {SA_WifiPassword}
{SA_EpsCircuit1}    {SA_EpsCircuit2}    {SA_EpsCircuit3}
{SA_Notes}          {SA_SatelliteUrl}   {SA_GeneratedDate}
```

### Financial Outcomes (`{FO_*}`)
```
{FO_JobNumber}      {FO_ClientName}     {FO_Address}        {FO_GeneratedDate}
{FO_SystemSizeKw}   {FO_BatterySizeKwh} {FO_AnnualBillAud}  {FO_SystemCostAud}
{FO_AnnualGenKwh}   {FO_ImportSavingsAud}  {FO_FitIncomeAud}
{FO_Year1BenefitAud}  {FO_BillReductionPct}  {FO_PaybackYears}
{FO_Total25YrAud}   {FO_CarbonTonnesPerYr}  {FO_CarsEquiv}
{FO_Yr1Savings}   {FO_Yr2Savings}   {FO_Yr3Savings}   {FO_Yr4Savings}   {FO_Yr5Savings}
{FO_Yr6Savings}   {FO_Yr7Savings}   {FO_Yr8Savings}   {FO_Yr9Savings}   {FO_Yr10Savings}
{FO_Yr1Cumul}     {FO_Yr2Cumul}     {FO_Yr3Cumul}     {FO_Yr4Cumul}     {FO_Yr5Cumul}
{FO_Yr6Cumul}     {FO_Yr7Cumul}     {FO_Yr8Cumul}     {FO_Yr9Cumul}     {FO_Yr10Cumul}
{FO_RetailTariff}   {FO_FeedInTariff}   {FO_SelfConsumptionPct}
{FO_TariffEscPct}   {FO_DegradationPct}
```

### System Specification (`{SS_*}`)
```
{SS_JobNumber}      {SS_ClientName}     {SS_Address}        {SS_Postcode}
{SS_Date}           {SS_Status}         {SS_SystemSizeKw}
{SS_PanelMake}      {SS_PanelModel}     {SS_PanelWatts}     {SS_PanelCount}
{SS_InverterType}   {SS_InverterMake}   {SS_InverterModel}  {SS_InverterKw}
{SS_BatterySizeKwh} {SS_BatteryMake}    {SS_BatteryModel}   {SS_BatteryUsableKwh}
{SS_EpsCircuit1}    {SS_EpsCircuit2}    {SS_EpsCircuit3}
{SS_WifiSsid}       {SS_WifiPassword}
{SS_EvStatus}       {SS_EvChargerMake}  {SS_EvChargerModel} {SS_EvChargerKw}
{SS_RoofType}       {SS_MountingType}   {SS_CableRunMetres}
{SS_Notes}
```

### NMI & Grid Data (`{NMI_*}`)
```
{NMI_JobNumber}     {NMI_ClientName}    {NMI_Address}       {NMI_GeneratedDate}
{NMI_NmiNumber}     {NMI_Dnsp}          {NMI_TariffName}
{NMI_ImportRateKwh} {NMI_FeedInRateKwh}
{NMI_AnnualKwh}     {NMI_AvgDailyKwh}
{NMI_PeakPct}       {NMI_OffpeakPct}
{NMI_DaysAccepted}  {NMI_ChosenChannel} {NMI_Phases}
```

---

## Code Locations

| File | Purpose |
|---|---|
| `GAS/AnnexEngine.gs` | Slides generation engine, setup script, payload builders |
| `GAS/HEAJobsAPI.gs` | `doPost` `generateAnnex` + `doGet` `getAnnexTemplateInfo` |
| `lib/annexes/_helpers.ts` | Shared pdf-lib primitives (colors, fonts, GASJob type) |
| `lib/annexes/site-assessment.ts` | pdf-lib generator (fallback / offline) |
| `lib/annexes/financial-outcomes.ts` | pdf-lib generator (fallback / offline) |
| `lib/annexes/system-spec.ts` | pdf-lib generator (fallback / offline) |
| `lib/annexes/photos.ts` | pdf-lib photo contact sheet (Drive photo bytes required) |
| `lib/annexes/hea-sa.ts` | Placeholder — see breadcrumb |
| `lib/annexes/open-solar.ts` | Placeholder — see breadcrumb |
| `lib/annexes/nmi-data.ts` | Placeholder — see breadcrumb |
| `lib/annexes/index.ts` | Generator registry + exports |
| `lib/document-config.ts` | ANNEX_REGISTRY (9 entries) + DOCUMENT_REGISTRY (7 entries) |
| `lib/document-merge.ts` | `mergePdfs(pdfs: Uint8Array[])` via pdf-lib |
| `app/api/dashboard/jobs/[jobNumber]/annex/route.ts` | POST → GAS generateAnnex |
| `app/dashboard/templates/page.tsx` | Templates management page |
| `app/dashboard/documents/page.tsx` | Document annex toggle UI |
| `components/dashboard/documents/DocumentBuilder.tsx` | Per-document annex toggle client component |

---

## First-Time Setup (run once)

1. Open the HEAJobsAPI GAS project
2. Run `setupAnnexMasterTemplates_()` in the editor
3. It creates 4 master Slides files in Drive → "HEA Annex Master Templates" folder
4. IDs are stored in Script Properties automatically (no code change needed)
5. Open each template in Drive and beautify the design
6. That's it — the system reads IDs from Properties at generation time

---

## Adding a New Annex Slide Template (future AI)

1. In `GAS/AnnexEngine.gs`, add a payload builder `build{Name}Payload_(job)` that returns
   a flat object mapping `{TOKEN_Name}` → string value
2. Add the slug to `ANNEX_SLIDES_SLUGS` array
3. Add the subfolder to `ANNEX_SUBFOLDERS` map
4. Add the slug to `setupAnnexMasterTemplates_()` setup loop with its title + placeholders
5. Run setup to create the master template, then design it in Google Slides
6. Update `ANNEX_REGISTRY` status in `lib/document-config.ts` to `'available'`

---

## Planned Annexes — Implementation Paths

### `hea-sa` (HEA Solar Analysis)
The HEA SA GAS app already generates its own PDF. Path of least resistance:
1. Add `?action=getSAReportPdf&jobNumber=X` to HEAJobsAPI.gs
2. Find the SA report in `01-quotes/` by filename pattern (`SA-Report` or `annex-hea-sa`)
3. Return base64-encoded PDF bytes
4. Next.js converts bytes → Uint8Array → passes to mergePdfs()
No Slides template needed — the SA PDF IS the annex.

### `open-solar` (OpenSolar Report)
1. Check OpenSolar API for a PDF export endpoint
2. Look up Lead by `gasJobNumber` in Prisma → get `openSolarProjectId`
3. Fetch PDF from OpenSolar API using project ID
4. Store in `02-proposals/`, return URL

### `nmi-data` (NMI & Grid Data)
The data lives in `00-nmi-data/` as JSON (put there by the HEA SA after NEM12 fetch).
1. Add `?action=getNMIData&jobNumber=X` to HEAJobsAPI.gs (reads JSON from 00-nmi-data/)
2. Pass data to `generateNMIDataAnnex()` in `lib/annexes/nmi-data.ts` (pdf-lib)
   OR fill the `nmi-data` Slides template (engine A) — both approaches work
3. Once NMI data is consistently available, flip status to `'available'`

---

## Document Stack Membership (which annexes attach to which documents)

Configured in `DOCUMENT_REGISTRY` in `lib/document-config.ts`.
Saved per-document overrides in Prisma `SystemConfig` key `"document_annex_config"`.

| Document | Default annexes ON |
|---|---|
| Job Card | hea-sa, system-spec, site-assessment, nmi-data, client-photos-intake |
| Electrical Works Proposal | hea-sa, open-solar, financial-outcomes, system-spec |
| Wholesale Order | system-spec |
| Work Order | system-spec, site-assessment, client-photos-intake |
| Completion Report | installer-photos, system-spec, financial-outcomes |
| Finance Pack | hea-sa, financial-outcomes, system-spec |
| Grid Connection | nmi-data, system-spec, site-assessment |
