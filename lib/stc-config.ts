// CER STC configuration — update here when policy changes; no redeploy needed for CER updates.
// Sources: CER postcode zone list, CER deeming-period schedule, CHBP battery factor schedule.

export type BatteryStcFactorPeriod = {
  startDate: string; // ISO date, inclusive
  endDate: string;   // ISO date, inclusive
  factor: number;    // STCs per kWh of usable capacity (tier-1 rate)
};

export type StcConfig = {
  pv: {
    /** Deeming period in years, keyed by installation calendar year. */
    deemingPeriodByYear: Record<number, number>;
    /**
     * CER postcode-to-zone-rating table.
     * Zone ratings (multiplier applied to system kW × deeming years):
     *   Zone 1: 1.536 — NT far north, QLD tropical
     *   Zone 2: 1.382 — QLD, NSW, VIC, SA most areas (see CER postcode list)
     *   Zone 3: 1.382 — VIC, NSW, ACT, SA temperate (same as Zone 2 for most VIC)
     *   Zone 4: 1.022 — TAS, alpine, far-SW VIC
     * HEA operates in VIC — all known VIC postcodes are Zone 3 (1.382).
     * The special key "DEFAULT" is the fallback when a postcode is not found.
     */
    zoneRatingByPostcode: Record<string, number>;
  };
  battery: {
    /** CER battery STC factor schedule — factor is the per-kWh STC rate for band 1 (0–14 kWh). */
    stcFactorSchedule: BatteryStcFactorPeriod[];
    /** $/STC paid by STC agents for battery STCs. */
    pricePerStc: number;
  };
  solar: {
    /** $/STC paid by STC agents for solar PV STCs. */
    pricePerStc: number;
  };
};

export const STC_CONFIG: StcConfig = {
  pv: {
    // CER deeming period falls by 1 year each calendar year until scheme ends 2030.
    deemingPeriodByYear: {
      2024: 7,
      2025: 6,
      2026: 5,
      2027: 4,
      2028: 3,
      2029: 2,
      2030: 1,
    },
    zoneRatingByPostcode: {
      // All VIC postcodes → Zone 3 (1.382). Add specific overrides below if needed.
      // Source: CER "Zones for solar water heaters and small generation units" postcode list.
      DEFAULT: 1.382,
      // Example overrides (alpine / far-south areas if CER assigns Zone 4):
      // "3699": 1.022, // Falls Creek area
      // "3726": 1.022, // Mt Beauty
    },
  },
  battery: {
    stcFactorSchedule: [
      // Pre-May 2026: factor 8.4 (CHBP full rate)
      { startDate: "2023-01-01", endDate: "2026-04-30", factor: 8.4 },
      // From 1 May 2026: factor drops to 6.8 (CHBP reduced rate, tiered bands apply)
      { startDate: "2026-05-01", endDate: "2027-12-31", factor: 6.8 },
      // Add future CER periods here when announced.
    ],
    pricePerStc: 37.0, // Greenbank-verified battery STC price
  },
  solar: {
    pricePerStc: 37.2,
  },
};
