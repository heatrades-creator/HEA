/**
 * Normalizer.gs
 * Transforms raw form submission rows into canonical normalised data objects.
 */

const Normalizer = (() => {

  // ── Doc class normalisation map ────────────────────────────────────────────

  /** Maps user-facing strings (lowercased) to canonical CONFIG.DOC_CLASS values. */
  const DOC_CLASS_NORMALISATION_MAP = {
    'solar':                            CONFIG.DOC_CLASS.SOLAR_BATTERY_PROPOSAL,
    'solar battery':                    CONFIG.DOC_CLASS.SOLAR_BATTERY_PROPOSAL,
    'solar + battery':                  CONFIG.DOC_CLASS.SOLAR_BATTERY_PROPOSAL,
    'solar and battery':                CONFIG.DOC_CLASS.SOLAR_BATTERY_PROPOSAL,
    'solar & battery':                  CONFIG.DOC_CLASS.SOLAR_BATTERY_PROPOSAL,
    [CONFIG.DOC_CLASS.SOLAR_BATTERY_PROPOSAL]: CONFIG.DOC_CLASS.SOLAR_BATTERY_PROPOSAL,
    'smarthome':                        CONFIG.DOC_CLASS.SMARTHOME_PROPOSAL,
    'smart home':                       CONFIG.DOC_CLASS.SMARTHOME_PROPOSAL,
    'smart home automation':            CONFIG.DOC_CLASS.SMARTHOME_PROPOSAL,
    [CONFIG.DOC_CLASS.SMARTHOME_PROPOSAL]: CONFIG.DOC_CLASS.SMARTHOME_PROPOSAL,
    'energy audit':                     CONFIG.DOC_CLASS.ENERGY_AUDIT_REPORT,
    'audit':                            CONFIG.DOC_CLASS.ENERGY_AUDIT_REPORT,
    [CONFIG.DOC_CLASS.ENERGY_AUDIT_REPORT]: CONFIG.DOC_CLASS.ENERGY_AUDIT_REPORT
  };

  // ── Internal coercion functions ────────────────────────────────────────────

  /** Strips $, commas, whitespace and parses a monetary value to float. */
  const _coerceMoney = (raw) => {
    if (Utilities_.isNullOrEmpty(raw)) return null;
    const cleaned = String(raw).replace(/[$,\s]/g, '');
    const parsed  = parseFloat(cleaned);
    return isNaN(parsed) ? null : parsed;
  };

  /** Strips non-numeric characters (except decimal point) and parses to float. */
  const _coerceNumber = (raw) => {
    if (Utilities_.isNullOrEmpty(raw)) return null;
    const cleaned = String(raw).replace(/[^0-9.]/g, '');
    const parsed  = parseFloat(cleaned);
    return isNaN(parsed) ? null : parsed;
  };

  /** Interprets truthy strings (yes, true, 1, y) as true; everything else false. */
  const _coerceBoolean = (raw) => {
    if (Utilities_.isNullOrEmpty(raw)) return false;
    return /^(yes|true|1|y)$/i.test(String(raw).trim());
  };

  /** Strips all non-digit and non-plus characters from a phone number. */
  const _normalisePhone = (raw) => {
    if (Utilities_.isNullOrEmpty(raw)) return '';
    return String(raw).replace(/[^0-9+]/g, '');
  };

  /** Lowercases and trims an email address. */
  const _normaliseEmail = (raw) => {
    if (Utilities_.isNullOrEmpty(raw)) return '';
    return String(raw).trim().toLowerCase();
  };

  /** Returns the first comma-delimited segment of an address, safe for Drive names, max 30 chars. */
  const _buildShortAddress = (raw) => {
    if (Utilities_.isNullOrEmpty(raw)) return '';
    const first = String(raw).split(',')[0].trim();
    return Utilities_.safeString(first).substring(0, 30);
  };

  /** Combines first and last name into a single display name. */
  const _buildClientName = (first, last) => {
    const f = Utilities_.isNullOrEmpty(first) ? '' : String(first).trim();
    const l = Utilities_.isNullOrEmpty(last)  ? '' : String(last).trim();
    return [f, l].filter(Boolean).join(' ');
  };

  /** Resolves a raw doc class string to a canonical CONFIG.DOC_CLASS value. */
  const _resolveDocClass = (raw) => {
    if (Utilities_.isNullOrEmpty(raw)) return CONFIG.DOC_CLASS.SOLAR_BATTERY_PROPOSAL;
    const key = String(raw).trim().toLowerCase();
    return DOC_CLASS_NORMALISATION_MAP[key] || CONFIG.DOC_CLASS.SOLAR_BATTERY_PROPOSAL;
  };

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * Normalises a raw submission row to a canonical field object.
   * Does NOT write to a sheet or assign a job_id.
   * @param {Object} rawRow - Row object from RAW_SUBMISSIONS tab.
   * @returns {Object}
   */
  const normalise = (rawRow) => {
    const nulled = [];

    const clientName = _buildClientName(rawRow['client_first_name'], rawRow['client_last_name']);
    if (!clientName) nulled.push('client_name');

    const email = _normaliseEmail(rawRow['client_email']);
    if (!email) nulled.push('client_email');

    const docClass = _resolveDocClass(rawRow['doc_class_raw']);

    const siteAddress = Utilities_.isNullOrEmpty(rawRow['site_address_raw'])
      ? (nulled.push('site_address'), '')
      : String(rawRow['site_address_raw']).trim();

    const shortAddress = _buildShortAddress(rawRow['site_address_raw']);
    const clientSurname = Utilities_.isNullOrEmpty(rawRow['client_last_name'])
      ? '' : String(rawRow['client_last_name']).trim();

    const systemSizeKw     = _coerceNumber(rawRow['system_size_kw_raw']);
    const batterySizeKwh   = _coerceNumber(rawRow['battery_size_kwh_raw']);
    const estimatedAnnualBill = _coerceMoney(rawRow['estimated_annual_bill_raw']);
    const financeRequired  = _coerceBoolean(rawRow['finance_required_raw']);

    return {
      source_submission_id:   rawRow['form_submission_id']    || '',
      doc_class:              docClass,
      client_name:            clientName,
      client_email:           email,
      client_phone:           _normalisePhone(rawRow['client_phone']),
      site_address:           siteAddress,
      client_surname:         clientSurname,
      short_address:          shortAddress,
      system_size_kw:         systemSizeKw,
      battery_size_kwh:       batterySizeKwh,
      estimated_annual_bill:  estimatedAnnualBill,
      total_price:            null,
      est_annual_saving:      null,
      payback_years:          null,
      finance_required:       financeRequired,
      notes:                  Utilities_.isNullOrEmpty(rawRow['notes_raw']) ? '' : String(rawRow['notes_raw']).trim(),
      null_policy_applied:    nulled.join(','),
      pipeline_stage:         CONFIG.PIPELINE_STAGE.NORMALISED
    };
  };

  /**
   * Normalises a raw row, assigns job_id and timestamp, and appends to NORMALISED_DATA.
   * @param {Object} rawRow
   * @param {string} jobId
   * @returns {Object}
   */
  const normaliseAndWrite = (rawRow, jobId) => {
    const data = normalise(rawRow);
    data.job_id         = jobId;
    data.normalised_at  = new Date().toISOString();
    SheetRepository.appendRow(CONFIG.TABS.NORMALISED_DATA, data);
    return data;
  };

  return { normalise, normaliseAndWrite };

})();
