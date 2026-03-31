/**
 * SheetRepository.gs
 * All Google Sheets I/O is isolated in this module.
 * Business logic modules must never call SpreadsheetApp directly.
 */

const SheetRepository = (() => {

  // ── Internal helpers ───────────────────────────────────────────────────────

  /** Gets a sheet by tab name; throws if not found. */
  const _getSheet = (tabName) => {
    const ss    = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(tabName);
    if (!sheet) {
      throw new Error(`${CONFIG.ERROR_CLASS.CONFIG_ERROR}: Sheet tab not found: ${tabName}`);
    }
    return sheet;
  };

  /** Returns the header row of a sheet as an array of strings. */
  const _getHeaders = (sheet) => {
    const lastCol = sheet.getLastColumn();
    if (lastCol === 0) return [];
    return sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(String);
  };

  /** Converts a flat array of cell values to a keyed object using headers. */
  const _rowToObject = (headers, row) => {
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = row[i] !== undefined ? row[i] : '';
    });
    return obj;
  };

  /** Converts a keyed object to an ordered array matching headers; missing keys become ''. */
  const _objectToRow = (headers, obj) => {
    return headers.map(h => (obj[h] !== undefined && obj[h] !== null ? obj[h] : ''));
  };

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * Returns all data rows from a tab as an array of objects.
   * Row 1 is treated as headers; rows 2+ are data.
   * @param {string} tabName
   * @returns {Array<Object>}
   */
  const getAllRows = (tabName) => {
    const sheet   = _getSheet(tabName);
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) return [];
    const headers = _getHeaders(sheet);
    if (headers.length === 0) return [];
    const data = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
    return data.map(row => _rowToObject(headers, row));
  };

  /**
   * Returns the first row where columnName === value (string-trimmed), or null.
   * @param {string} tabName
   * @param {string} columnName
   * @param {string} value
   * @returns {Object|null}
   */
  const getRowByColumnValue = (tabName, columnName, value) => {
    const rows = getAllRows(tabName);
    const target = String(value).trim();
    return rows.find(r => String(r[columnName] || '').trim() === target) || null;
  };

  /**
   * Reads a single value from the SETTINGS tab by key.
   * @param {string} key
   * @returns {string|null}
   */
  const getSettingValue = (key) => {
    const row = getRowByColumnValue(CONFIG.TABS.SETTINGS, 'key', key);
    return row ? String(row['value'] || '') : null;
  };

  /**
   * Returns all BRAND_CONFIG rows as a flat { key: value } object.
   * @returns {Object}
   */
  const getBrandConfig = () => {
    const rows = getAllRows(CONFIG.TABS.BRAND_CONFIG);
    const result = {};
    rows.forEach(r => {
      if (r['key']) result[String(r['key'])] = String(r['value'] || '');
    });
    return result;
  };

  /**
   * Appends one row to a tab. Columns absent in obj are written as empty string.
   * @param {string} tabName
   * @param {Object} obj
   */
  const appendRow = (tabName, obj) => {
    const sheet   = _getSheet(tabName);
    const headers = _getHeaders(sheet);
    const row     = _objectToRow(headers, obj);
    sheet.appendRow(row);
  };

  /**
   * Finds the first row where columnName === matchValue and updates fields.
   * @param {string} tabName
   * @param {string} columnName
   * @param {string} matchValue
   * @param {Object} updatedFields
   * @returns {boolean} true if found and updated, false if not found.
   */
  const updateRowByColumnValue = (tabName, columnName, matchValue, updatedFields) => {
    const sheet   = _getSheet(tabName);
    const headers = _getHeaders(sheet);
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) return false;

    const colIdx = headers.indexOf(columnName);
    if (colIdx === -1) return false;

    const matchStr = String(matchValue).trim();
    // Read all data rows at once for performance
    const data = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();

    for (let i = 0; i < data.length; i++) {
      if (String(data[i][colIdx] || '').trim() === matchStr) {
        // Apply each updated field to the row
        Object.keys(updatedFields).forEach(field => {
          const fIdx = headers.indexOf(field);
          if (fIdx !== -1) {
            data[i][fIdx] = updatedFields[field];
          }
        });
        // Write back the updated row (row index is i+2 because row 1 is headers)
        sheet.getRange(i + 2, 1, 1, headers.length).setValues([data[i]]);
        return true;
      }
    }
    return false;
  };

  /**
   * Updates a single key in the SETTINGS tab.
   * @param {string} key
   * @param {string} value
   */
  const updateSettingValue = (key, value) => {
    updateRowByColumnValue(CONFIG.TABS.SETTINGS, 'key', key, { value });
  };

  /**
   * Atomically increments the JOB_COUNTER setting and returns the new integer value.
   * Uses integer arithmetic exclusively.
   * @returns {number}
   */
  const incrementAndGetJobCounter = () => {
    const raw     = getSettingValue(CONFIG.JOB.COUNTER_KEY);
    const current = parseInt(raw, 10) || 0;
    const next    = current + 1;
    updateSettingValue(CONFIG.JOB.COUNTER_KEY, String(next));
    return next;
  };

  return {
    getAllRows,
    getRowByColumnValue,
    getSettingValue,
    getBrandConfig,
    appendRow,
    updateRowByColumnValue,
    updateSettingValue,
    incrementAndGetJobCounter
  };

})();
