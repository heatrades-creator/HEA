/**
 * Logger.gs
 * Centralised logging to console and Google Sheets.
 * Named Logger_ (with underscore) to avoid conflict with Apps Script built-in Logger.
 */

const Logger_ = (() => {

  /**
   * Logs a message to the console with structured format.
   * @param {string} module - Name of the calling module.
   * @param {string} message - Log message.
   * @param {string} [severity] - INFO, WARN, or ERROR. Defaults to INFO.
   */
  const log = (module, message, severity) => {
    const level = severity || 'INFO';
    console.log(`[HEA|${level}|${module}] ${message}`);
  };

  /**
   * Appends a row to the EXPORT_LOG sheet recording pipeline run outcome.
   * @param {string} jobId
   * @param {string} docClass
   * @param {string} templateId
   * @param {string} outputFileId
   * @param {string} outputLink
   * @param {string} pdfFileId
   * @param {string} pdfLink
   * @param {string} status - SUCCESS or FAILED
   * @param {number} durationMs
   * @param {string} triggeredBy
   * @param {number} [tokenCount] - Total Gemini tokens consumed (from usageMetadata).
   */
  const writeExportLog = (jobId, docClass, templateId, outputFileId, outputLink,
                          pdfFileId, pdfLink, status, durationMs, triggeredBy, tokenCount) => {
    const row = {
      timestamp:       new Date().toISOString(),
      job_id:          jobId          || '',
      doc_class:       docClass       || '',
      template_id:     templateId     || '',
      output_file_id:  outputFileId   || '',
      output_file_link:outputLink     || '',
      pdf_file_id:     pdfFileId      || '',
      pdf_link:        pdfLink        || '',
      status:          status         || '',
      run_duration_ms: durationMs     || '',
      triggered_by:    triggeredBy    || '',
      total_tokens:    tokenCount     || 0
    };
    try {
      SheetRepository.appendRow(CONFIG.TABS.EXPORT_LOG, row);
    } catch (e) {
      // Fallback to console if sheet write fails — never swallow silently
      log('Logger_', `Failed to write export log: ${e.message}`, 'ERROR');
    }
  };

  /**
   * Appends a row to the ERROR_LOG sheet and echoes to console.
   * @param {string} jobId
   * @param {string} module
   * @param {string} errorClass - One of CONFIG.ERROR_CLASS values.
   * @param {string} errorMessage
   * @param {string} contextSummary
   * @param {string} severity
   * @param {boolean} rerunnable
   * @param {string} stackSnippet
   */
  const writeErrorLog = (jobId, module, errorClass, errorMessage,
                         contextSummary, severity, rerunnable, stackSnippet) => {
    const row = {
      timestamp:        new Date().toISOString(),
      job_id:           jobId          || '',
      module:           module         || '',
      error_class:      errorClass     || CONFIG.ERROR_CLASS.UNKNOWN_RUNTIME_ERROR,
      error_message:    errorMessage   || '',
      context_summary:  contextSummary || '',
      severity:         severity       || 'ERROR',
      rerunnable:       rerunnable === true ? 'TRUE' : 'FALSE',
      stacktrace_snippet: stackSnippet || '',
      resolved:         'FALSE'
    };
    // Echo to console first so it appears even if sheet write fails
    log(module, `${errorClass}: ${errorMessage}`, severity || 'ERROR');
    try {
      SheetRepository.appendRow(CONFIG.TABS.ERROR_LOG, row);
    } catch (e) {
      log('Logger_', `Failed to write error log: ${e.message}`, 'ERROR');
    }
  };

  return { log, writeExportLog, writeErrorLog };

})();
