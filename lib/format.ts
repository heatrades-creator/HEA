// Shared date formatting for the HEA ecosystem.
// Target display format: dd/mm/yyyy - hh:mm am/pm  e.g. 04/05/2026 - 01:36 am

function _parseAny(raw: string | Date | null | undefined): Date | null {
  if (!raw) return null;
  if (raw instanceof Date) return isNaN(raw.getTime()) ? null : raw;
  const s = String(raw).trim();
  if (!s) return null;

  // Already in HEA format: dd/mm/yyyy - hh:mm am/pm
  const heaRe = /^(\d{2})\/(\d{2})\/(\d{4}) - (\d{2}):(\d{2}) ([ap]m)$/i;
  const hea = s.match(heaRe);
  if (hea) {
    let h = parseInt(hea[4]);
    if (hea[6].toLowerCase() === 'pm' && h !== 12) h += 12;
    if (hea[6].toLowerCase() === 'am' && h === 12) h = 0;
    return new Date(parseInt(hea[3]), parseInt(hea[2]) - 1, parseInt(hea[1]), h, parseInt(hea[5]));
  }

  // Old GAS format: dd/MM/yyyy HH:mm (24-hour, no dash)
  const gas = s.match(/^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})$/);
  if (gas) {
    return new Date(parseInt(gas[3]), parseInt(gas[2]) - 1, parseInt(gas[1]), parseInt(gas[4]), parseInt(gas[5]));
  }

  // Date-only: dd/mm/yyyy
  const dateOnly = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (dateOnly) {
    return new Date(parseInt(dateOnly[3]), parseInt(dateOnly[2]) - 1, parseInt(dateOnly[1]));
  }

  // ISO, JS toString, and anything else — try native parse
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function _to12h(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const rawH = d.getHours();
  const min = String(d.getMinutes()).padStart(2, '0');
  const ampm = rawH >= 12 ? 'pm' : 'am';
  const h12 = String(rawH % 12 || 12).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()} - ${h12}:${min} ${ampm}`;
}

/** Full datetime: 04/05/2026 - 01:36 am */
export function formatHEADate(raw: string | Date | null | undefined): string {
  const d = _parseAny(raw);
  if (!d) return typeof raw === 'string' ? raw : '';
  return _to12h(d);
}

/** Date only: 04/05/2026 */
export function formatHEADateOnly(raw: string | Date | null | undefined): string {
  const d = _parseAny(raw);
  if (!d) return typeof raw === 'string' ? raw : '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}
