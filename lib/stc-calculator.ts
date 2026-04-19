/**
 * CER STC calculator — pure functions, no side-effects.
 *
 * Two calculation paths:
 *   1. Solar PV STCs  — floor(system_kW × zone_rating × deeming_years)
 *   2. Battery STCs   — tiered by usable-kWh bands; eligible capacity capped at 50 kWh
 *
 * Reference: CER Small-scale Technology Certificates scheme rules.
 * AS/NZS 5139:2019 is a battery installation/safety compliance standard referenced by
 * the scheme for eligibility; it is NOT the source of the STC quantity formula.
 *
 * All inputs are validated; warnings are returned alongside results so callers can
 * surface them without crashing.
 */

import { STC_CONFIG, type StcConfig } from "./stc-config";

// ── Public types ──────────────────────────────────────────────────────────────

export type StcInputs = {
  /** ISO date string (YYYY-MM-DD). Determines deeming period and battery factor. */
  installationDate: string;
  /** 4-digit Australian postcode string. Used for zone rating lookup. */
  postcode: string;
  /** Eligible solar PV array size in kW DC. Omit or 0 for battery-only jobs. */
  pvSystemKw?: number;
  /**
   * Usable (not nominal) battery capacity in kWh.
   * Only the first 50 kWh usable is eligible for STCs.
   * Must not be substituted with nominal capacity — warn callers if unsure.
   */
  batteryUsableKwh?: number;
};

export type PvStcDetail = {
  systemKw: number;
  zoneRating: number;
  deemingYears: number;
};

export type BatteryStcDetail = {
  usableKwh: number;
  eligibleUsableKwh: number;
  factor: number;
  band1: number;
  band2: number;
  band3: number;
};

export type StcResult = {
  pvStcs: number;
  batteryStcs: number;
  totalStcs: number;
  pvInputsUsed: PvStcDetail | null;
  batteryInputsUsed: BatteryStcDetail | null;
  warnings: string[];
};

// ── Primitive calculators ─────────────────────────────────────────────────────

/**
 * CER formula: floor(system_kW × zone_rating × deeming_years).
 * Inputs must already be validated and within range.
 */
export function calculatePvStcs(
  systemKw: number,
  zoneRating: number,
  deemingYears: number
): number {
  return Math.floor(systemKw * zoneRating * deemingYears);
}

/**
 * CER battery formula: single floor over all three capacity bands.
 *
 * Bands are always applied regardless of stcFactor value — the factor changes
 * over time via the CER schedule, but the tiered band structure is constant.
 *
 * Eligible capacity is capped at 50 kWh by the scheme; callers should pass
 * already-capped values or let calculateStcs() cap for them.
 */
export function calculateBatteryStcs(
  usableKwh: number,
  stcFactor: number
): number {
  const eligible = Math.min(Math.max(usableKwh, 0), 50);
  const band1 = Math.min(eligible, 14);
  const band2 = Math.min(Math.max(eligible - 14, 0), 14);
  const band3 = Math.min(Math.max(eligible - 28, 0), 22);

  return Math.floor(
    band1 * stcFactor * 1.0 +
    band2 * stcFactor * 0.6 +
    band3 * stcFactor * 0.15
  );
}

// ── Config helpers ────────────────────────────────────────────────────────────

function resolveZoneRating(postcode: string, config: StcConfig): number {
  return (
    config.pv.zoneRatingByPostcode[postcode] ??
    config.pv.zoneRatingByPostcode["DEFAULT"] ??
    1.382
  );
}

function resolveDeemingYears(
  installationDate: string,
  config: StcConfig
): number | null {
  const year = new Date(installationDate).getFullYear();
  return config.pv.deemingPeriodByYear[year] ?? null;
}

function resolveBatteryFactor(
  installationDate: string,
  config: StcConfig
): number | null {
  const d = installationDate; // already ISO string — compare lexicographically
  for (const period of config.battery.stcFactorSchedule) {
    if (d >= period.startDate && d <= period.endDate) return period.factor;
  }
  return null;
}

// ── Main entry point ──────────────────────────────────────────────────────────

/**
 * Calculate PV and battery STCs from raw inputs.
 *
 * Returns a rich result including all intermediate values and any warnings.
 * Never throws — validation failures produce warnings and zero STCs for that path.
 */
export function calculateStcs(
  inputs: StcInputs,
  config: StcConfig = STC_CONFIG
): StcResult {
  const warnings: string[] = [];
  let pvStcs = 0;
  let batteryStcs = 0;
  let pvDetail: PvStcDetail | null = null;
  let batDetail: BatteryStcDetail | null = null;

  // ── Validate installationDate ──
  const installDate = new Date(inputs.installationDate);
  if (isNaN(installDate.getTime())) {
    warnings.push(`Invalid installationDate "${inputs.installationDate}" — cannot determine deeming period or battery factor.`);
    return { pvStcs: 0, batteryStcs: 0, totalStcs: 0, pvInputsUsed: null, batteryInputsUsed: null, warnings };
  }

  // ── Solar PV path ──
  const pvKw = inputs.pvSystemKw ?? 0;
  if (pvKw > 0) {
    if (pvKw < 0) {
      warnings.push("pvSystemKw must not be negative — skipping PV STC calculation.");
    } else {
      const zoneRating = resolveZoneRating(inputs.postcode, config);
      const deemingYears = resolveDeemingYears(inputs.installationDate, config);

      if (!config.pv.zoneRatingByPostcode[inputs.postcode] &&
          !config.pv.zoneRatingByPostcode["DEFAULT"]) {
        warnings.push(`Postcode ${inputs.postcode} has no zone mapping — defaulting to 1.382 (Zone 3 VIC). Verify with CER postcode list.`);
      } else if (!config.pv.zoneRatingByPostcode[inputs.postcode]) {
        warnings.push(`Postcode ${inputs.postcode} not in zone table — using DEFAULT zone rating ${zoneRating}.`);
      }

      if (deemingYears === null) {
        warnings.push(`No deeming period configured for year ${installDate.getFullYear()} — skipping PV STC calculation.`);
      } else {
        pvStcs = calculatePvStcs(pvKw, zoneRating, deemingYears);
        pvDetail = { systemKw: pvKw, zoneRating, deemingYears };
      }
    }
  }

  // ── Battery path ──
  const batKwh = inputs.batteryUsableKwh ?? 0;
  if (batKwh > 0) {
    if (batKwh < 0) {
      warnings.push("batteryUsableKwh must not be negative — skipping battery STC calculation.");
    } else {
      warnings.push(
        "Reminder: battery STCs use USABLE capacity, not nominal. " +
        "Do not substitute nominal capacity — this overstates STCs and may trigger CER audit."
      );
      warnings.push(
        "Battery eligibility requires compliance with AS/NZS 5139:2019 (installation safety standard). " +
        "AS/NZS 5139 governs compliance, not the STC quantity formula."
      );

      let eligibleKwh = batKwh;
      if (batKwh > 50) {
        warnings.push(`Battery usable capacity ${batKwh} kWh exceeds 50 kWh scheme cap — capping eligible calculation at 50 kWh.`);
        eligibleKwh = 50;
      }

      const factor = resolveBatteryFactor(inputs.installationDate, config);
      if (factor === null) {
        warnings.push(`No battery STC factor found for installation date ${inputs.installationDate} — skipping battery STC calculation.`);
      } else {
        const band1 = Math.min(eligibleKwh, 14);
        const band2 = Math.min(Math.max(eligibleKwh - 14, 0), 14);
        const band3 = Math.min(Math.max(eligibleKwh - 28, 0), 22);
        batteryStcs = calculateBatteryStcs(eligibleKwh, factor);
        batDetail = { usableKwh: batKwh, eligibleUsableKwh: eligibleKwh, factor, band1, band2, band3 };
      }
    }
  }

  return {
    pvStcs,
    batteryStcs,
    totalStcs: pvStcs + batteryStcs,
    pvInputsUsed: pvDetail,
    batteryInputsUsed: batDetail,
    warnings,
  };
}

// ── Rebate dollar values (convenience) ───────────────────────────────────────

export function pvStcRebate(pvStcs: number, config: StcConfig = STC_CONFIG): number {
  return pvStcs * config.solar.pricePerStc;
}

export function batteryStcRebate(batteryStcs: number, config: StcConfig = STC_CONFIG): number {
  return batteryStcs * config.battery.pricePerStc;
}
