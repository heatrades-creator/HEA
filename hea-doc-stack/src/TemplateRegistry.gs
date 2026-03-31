/**
 * TemplateRegistry.gs
 * Reads template configuration from the TEMPLATE_CONFIG sheet.
 */

const TemplateRegistry = (() => {

  /**
   * Returns the active TEMPLATE_CONFIG row for a given doc class.
   * @param {string} docClass - One of CONFIG.DOC_CLASS values.
   * @returns {Object}
   * @throws {string} CONFIG.ERROR_CLASS.TEMPLATE_NOT_FOUND if no active template found.
   */
  const getTemplateConfig = (docClass) => {
    const rows = SheetRepository.getAllRows(CONFIG.TABS.TEMPLATE_CONFIG);
    const match = rows.find(r =>
      String(r['doc_class'] || '').trim() === docClass &&
      String(r['active'] || '').trim().toUpperCase() === 'TRUE'
    );
    if (!match) {
      throw new Error(
        `${CONFIG.ERROR_CLASS.TEMPLATE_NOT_FOUND}: No active template for doc_class="${docClass}"`
      );
    }
    return match;
  };

  /**
   * Returns a TEMPLATE_CONFIG row by its template_id.
   * @param {string} templateId
   * @returns {Object}
   * @throws {string} CONFIG.ERROR_CLASS.TEMPLATE_NOT_FOUND if not found.
   */
  const getTemplateById = (templateId) => {
    const row = SheetRepository.getRowByColumnValue(
      CONFIG.TABS.TEMPLATE_CONFIG, 'template_id', templateId
    );
    if (!row) {
      throw new Error(
        `${CONFIG.ERROR_CLASS.TEMPLATE_NOT_FOUND}: Template not found for template_id="${templateId}"`
      );
    }
    return row;
  };

  /**
   * Returns the parsed placeholder manifest for a template.
   * Returns { placeholders: [] } if manifest JSON is absent or empty.
   * @param {string} templateId
   * @returns {{ placeholders: Array }}
   */
  const getPlaceholderManifest = (templateId) => {
    const row = getTemplateById(templateId);
    const raw = String(row['placeholder_manifest_json'] || '').trim();
    if (!raw) return { placeholders: [] };
    try {
      return JSON.parse(raw);
    } catch (e) {
      Logger_.log(
        'TemplateRegistry',
        `Failed to parse manifest for ${templateId}: ${e.message}`,
        'WARN'
      );
      return { placeholders: [] };
    }
  };

  /**
   * Returns the runtime type (SLIDES or DOCS) for a given template.
   * @param {string} templateId
   * @returns {string}
   */
  const getRuntimeType = (templateId) => {
    const row = getTemplateById(templateId);
    const rt  = String(row['runtime_type'] || '').trim().toUpperCase();
    return rt === CONFIG.RUNTIME.DOCS ? CONFIG.RUNTIME.DOCS : CONFIG.RUNTIME.SLIDES;
  };

  return {
    getTemplateConfig,
    getTemplateById,
    getPlaceholderManifest,
    getRuntimeType
  };

})();
