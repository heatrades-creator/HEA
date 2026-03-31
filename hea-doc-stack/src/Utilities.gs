/**
 * Utilities.gs
 * Shared pure utility functions — no I/O, no side effects.
 */

const Utilities_ = (() => {

  /** Month names for Melbourne locale long-date formatting */
  const MONTH_NAMES = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
  ];

  /**
   * Returns a string safe for use in Drive file names.
   * Strips dangerous characters and collapses whitespace to hyphens.
   * @param {*} input - Any value; coerced to string.
   * @returns {string}
   */
  const safeString = (input) => {
    return String(input === null || input === undefined ? '' : input)
      .trim()
      .replace(/[/\\'"<>|*?:]/g, '')
      .replace(/\s+/g, '-');
  };

  /**
   * Formats a Date as YYYY-MM-DD.
   * @param {Date} [date] - Defaults to today.
   * @returns {string}
   */
  const formatDate = (date) => {
    const d = date || new Date();
    const yyyy = d.getFullYear();
    const mm   = String(d.getMonth() + 1).padStart(2, '0');
    const dd   = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  /**
   * Formats a Date as "31 March 2026" (Melbourne locale month names).
   * @param {Date} [date] - Defaults to today.
   * @returns {string}
   */
  const formatDateLong = (date) => {
    const d = date || new Date();
    return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
  };

  /**
   * Returns a short file-tag string derived from a doc class.
   * @param {string} docClass - One of CONFIG.DOC_CLASS values.
   * @returns {string}
   */
  const docClassToFileTag = (docClass) => {
    if (docClass === CONFIG.DOC_CLASS.SOLAR_BATTERY_PROPOSAL ||
        docClass === CONFIG.DOC_CLASS.SMARTHOME_PROPOSAL) {
      return 'PROPOSAL';
    }
    if (docClass === CONFIG.DOC_CLASS.ENERGY_AUDIT_REPORT) {
      return 'AUDIT';
    }
    return 'DOCUMENT';
  };

  /**
   * Returns true if value is null, undefined, or whitespace-only string.
   * @param {*} val
   * @returns {boolean}
   */
  const isNullOrEmpty = (val) => {
    if (val === null || val === undefined) return true;
    if (typeof val === 'string' && val.trim() === '') return true;
    return false;
  };

  /**
   * Coerces a value to string according to a null policy.
   * @param {*} val - Input value.
   * @param {string} nullPolicy - 'TBC', 'today', 'error', or 'empty'.
   * @returns {string}
   */
  const coerceToString = (val, nullPolicy) => {
    if (!isNullOrEmpty(val)) {
      return String(val).trim();
    }
    if (nullPolicy === 'TBC') return 'TBC';
    if (nullPolicy === 'today') return formatDateLong(new Date());
    return '';
  };

  /**
   * Converts milliseconds to a human-readable duration string.
   * Returns "1.2s" for >= 1000ms, otherwise "450ms".
   * @param {number} ms
   * @returns {string}
   */
  const msToReadableDuration = (ms) => {
    if (ms >= 1000) {
      return `${(ms / 1000).toFixed(1)}s`;
    }
    return `${Math.round(ms)}ms`;
  };

  return {
    safeString,
    formatDate,
    formatDateLong,
    docClassToFileTag,
    isNullOrEmpty,
    coerceToString,
    msToReadableDuration
  };

})();
