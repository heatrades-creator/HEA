// lib/annexes/index.ts
// Annex generator registry — single import point for all annex generators.
//
// Status key:
//   available  — generator is implemented and ready (some may need Drive data)
//   planned    — stub only; see the file for the implementation breadcrumb
//
// Photo annexes (client-photos-intake, client-photos-followup, installer-photos)
// all use generatePhotosAnnex() with a different `type` param.
// See lib/annexes/photos.ts for the Drive wiring breadcrumb.

export type { GASJob } from './_helpers'

// ── Full generators ────────────────────────────────────────────────────────────

export { generateSiteAssessmentAnnex }          from './site-assessment'
export type { SiteAssessmentParams }            from './site-assessment'

export { generateFinancialOutcomesAnnex }       from './financial-outcomes'
export type { FinancialOutcomesParams, FinancialAssumptions } from './financial-outcomes'

export { generateSystemSpecAnnex }              from './system-spec'
export type { SystemSpecParams, SystemSpecDetail } from './system-spec'

// ── Scaffolded (structure complete, needs Drive photo fetch wired up) ──────────

export { generatePhotosAnnex }                  from './photos'
export type { PhotoAnnexParams, PhotoAnnexPhoto, PhotoAnnexType } from './photos'

// ── Placeholders (see each file for the implementation roadmap) ────────────────

export { generateHEASAAnnex }                   from './hea-sa'
export type { HEASAParams }                     from './hea-sa'

export { generateOpenSolarAnnex }               from './open-solar'
export type { OpenSolarParams }                 from './open-solar'

export { generateNMIDataAnnex }                 from './nmi-data'
export type { NMIData, NMIDataParams }          from './nmi-data'

// ── Status map ─────────────────────────────────────────────────────────────────
// Mirrors AnnexStatus in lib/document-config.ts.
// Update 'planned' → 'available' here AND in ANNEX_REGISTRY when a generator
// is implemented.

export const ANNEX_GENERATOR_STATUS = {
  'site-assessment':        'available',  // full generator — all data from GASJob
  'financial-outcomes':     'available',  // full generator — solar calcs from GASJob
  'system-spec':            'available',  // partial — equipment fields need detail obj
  'client-photos-intake':   'available',  // scaffolded — needs Drive photo fetch (photos.ts)
  'client-photos-followup': 'available',  // scaffolded — same as above, type='followup'
  'installer-photos':       'available',  // scaffolded — same as above, type='installer'
  'hea-sa':                 'planned',    // needs getSAReportPdf GAS action (hea-sa.ts)
  'open-solar':             'planned',    // needs OpenSolar PDF export endpoint (open-solar.ts)
  'nmi-data':               'planned',    // needs getNMIData GAS action (nmi-data.ts)
} as const
