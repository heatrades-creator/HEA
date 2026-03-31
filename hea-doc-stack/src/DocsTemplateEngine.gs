/**
 * DocsTemplateEngine.gs
 * All Google Docs operations are isolated in this module.
 * Secondary runtime — triggered when TEMPLATE_CONFIG.runtime_type = DOCS.
 * Business logic must never call DocumentApp directly.
 */

const DocsTemplateEngine = (() => {

  /**
   * Escapes a placeholder string for use in DocumentApp.replaceText regex.
   * Curly braces and other regex metacharacters are escaped.
   * @param {string} key
   * @returns {string}
   */
  const _escapeForRegex = (key) => {
    return key.replace(/[{}[\]()*+?.\\^$|]/g, '\\$&');
  };

  /**
   * Replaces all occurrences of a placeholder in a document body element.
   * @param {Body} body
   * @param {string} escapedKey
   * @param {string} value
   */
  const _replaceInBody = (body, escapedKey, value) => {
    body.replaceText(escapedKey, value);
  };

  /**
   * Duplicates the master Docs file, fills all placeholders in body, headers and footers.
   * @param {string} masterFileId - Drive ID of the master template document.
   * @param {Object} placeholders - { '{{KEY}}': 'value' } map.
   * @param {string} outputFileName - Name for the new file.
   * @param {Folder} destinationFolder - Drive folder to place the copy in.
   * @returns {{ fileId: string, editLink: string }}
   */
  const fillTemplate = (masterFileId, placeholders, outputFileName, destinationFolder) => {
    const copy   = DriveRepository.duplicateFile(masterFileId, outputFileName, destinationFolder);
    const fileId = copy.getId();
    const doc    = DocumentApp.openById(fileId);
    const body   = doc.getBody();

    Object.keys(placeholders).forEach(key => {
      const escaped = _escapeForRegex(key);
      const value   = placeholders[key] !== null && placeholders[key] !== undefined
        ? String(placeholders[key])
        : '';
      // Replace in body
      _replaceInBody(body, escaped, value);

      // Replace in headers
      doc.getHeader() && doc.getHeader().replaceText(escaped, value);

      // Replace in footers
      doc.getFooter() && doc.getFooter().replaceText(escaped, value);
    });

    doc.saveAndClose();

    return {
      fileId,
      editLink: DriveRepository.getDocsEditLink(fileId)
    };
  };

  /**
   * Opens a filled document and returns any required placeholder keys still unresolved.
   * @param {string} fileId
   * @param {string[]} requiredKeys
   * @returns {string[]} Keys that remain unresolved in the body text.
   */
  const auditUnresolvedPlaceholders = (fileId, requiredKeys) => {
    const doc     = DocumentApp.openById(fileId);
    const allText = doc.getBody().getText();
    doc.saveAndClose();
    return requiredKeys.filter(key => allText.indexOf(key) !== -1);
  };

  return { fillTemplate, auditUnresolvedPlaceholders };

})();
