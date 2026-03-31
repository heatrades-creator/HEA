/**
 * TriggerHandlers.gs — Apps Script entry points (not IIFE).
 * Invoked by Google triggers and manual runs.
 */

/**
 * Triggered by a Google Form submit event.
 * @param {Object} e
 */
function onFormSubmit(e) {
  const startTime = Date.now();
  let jobId;
  try {
    const rawRow = _extractRawRow(e);
    SheetRepository.appendRow(CONFIG.TABS.RAW_SUBMISSIONS, rawRow);
    jobId = JobService.createJobId();
    const normalisedData = Normalizer.normaliseAndWrite(rawRow, jobId);
    JobService.registerJob({
      job_id:       jobId,
      client_name:  normalisedData['client_name'],
      site_address: normalisedData['site_address'],
      doc_class:    normalisedData['doc_class']
    });
    _runPipeline(normalisedData, 'FORM', startTime);
  } catch (err) {
    Logger_.writeErrorLog(
      jobId || 'UNKNOWN', 'TriggerHandlers.onFormSubmit',
      _classifyError(err.message), err.message,
      'onFormSubmit failed', 'ERROR', true,
      err.stack ? err.stack.substring(0, 300) : ''
    );
    if (jobId) JobService.markJobFailed(jobId);
  }
}

/** Manually re-runs the pipeline for an existing job. @param {string} jobId */
function manualRunByJobId(jobId) {
  const startTime = Date.now();
  try {
    const normalisedData = SheetRepository.getRowByColumnValue(
      CONFIG.TABS.NORMALISED_DATA, 'job_id', jobId
    );
    if (!normalisedData) {
      throw new Error(`${CONFIG.ERROR_CLASS.JOB_REGISTRATION_ERROR}: No normalised data found for ${jobId}`);
    }
    _runPipeline(normalisedData, 'MANUAL', startTime);
  } catch (err) {
    Logger_.writeErrorLog(
      jobId, 'TriggerHandlers.manualRunByJobId',
      _classifyError(err.message), err.message,
      `Manual run failed for ${jobId}`, 'ERROR', true,
      err.stack ? err.stack.substring(0, 300) : ''
    );
    JobService.markJobFailed(jobId);
  }
}

/** Dry-run: builds prompt from mock data, logs output. No API calls. No Drive writes. */
function testDryRun() {
  const mockData = {
    job_id: 'JOB-2026-9999', doc_class: CONFIG.DOC_CLASS.SOLAR_BATTERY_PROPOSAL,
    client_name: 'Sarah Williams', client_email: 'sarah.williams@example.com',
    client_phone: '0412345678', site_address: '42 Oak Ave, Ballarat VIC 3350',
    client_surname: 'Williams', short_address: '42-Oak-Ave',
    system_size_kw: 10, battery_size_kwh: 20, estimated_annual_bill: 4200,
    total_price: null, est_annual_saving: null, payback_years: null,
    finance_required: true, notes: 'Pool pump runs 8hrs/day'
  };
  const templateId = 'HEA_TEMPLATE_SOLAR_BATTERY_PROPOSAL_MASTER_v001';
  try {
    const { systemPrompt, userContent } = PromptBuilder.buildPrompt(mockData, templateId);
    Logger_.log('testDryRun', '=== SYSTEM PROMPT ===', 'INFO');
    Logger_.log('testDryRun', systemPrompt, 'INFO');
    Logger_.log('testDryRun', '=== USER CONTENT ===', 'INFO');
    Logger_.log('testDryRun', userContent, 'INFO');
    Logger_.log('testDryRun', 'Dry run complete — no API calls or Drive writes made.', 'INFO');
  } catch (err) {
    Logger_.log('testDryRun', `Error during dry run: ${err.message}`, 'ERROR');
  }
}

/**
 * Executes the full 17-step document generation pipeline.
 * @param {Object} nd - Normalised data row. @param {string} triggeredBy @param {number} startTime
 * @returns {{ success: boolean, jobId: string, outputLink: string, pdfLink: string }}
 */
function _runPipeline(nd, triggeredBy, startTime) {
  const jobId    = nd['job_id'];
  const docClass = nd['doc_class'];
  let outputFileId = '', outputLink = '', pdfFileId = '', pdfLink = '', templateId = '';
  try {
    // S1-S3: Stage, template config, write template_id
    JobService.updateJobStage(jobId, CONFIG.PIPELINE_STAGE.CLAUDE_PENDING);
    const tc   = TemplateRegistry.getTemplateConfig(docClass);
    templateId = tc['template_id'];
    JobService.updateJobField(jobId, 'template_id', templateId);

    // S4-S5: Call Claude, update stage
    const rawResponse = ClaudeClient.callWithPrompt(nd, templateId);
    JobService.updateJobStage(jobId, CONFIG.PIPELINE_STAGE.CLAUDE_COMPLETE);

    // S6: Validate JSON
    const validated    = JsonValidator.validate(rawResponse, jobId, templateId);
    const placeholders = validated.placeholders;

    // S7-S9: Job folder, output subfolder, set FILLING stage
    const jobFolder      = JobService.getOrCreateJobFolder(jobId, nd['client_name'], nd['short_address']);
    const subFolderName  = CONFIG.OUTPUT_FOLDER_RULES[String(tc['output_folder_rule'] || 'proposal').toLowerCase()]
                           || CONFIG.OUTPUT_FOLDER_RULES.proposal;
    const outputSubFolder = DriveRepository.getJobSubFolder(jobFolder, subFolderName);
    JobService.updateJobStage(jobId, CONFIG.PIPELINE_STAGE.FILLING);

    // S10-S11: Fill template, audit placeholders
    const fillResult = _fillAndAudit(tc, templateId, placeholders, nd, outputSubFolder);
    outputFileId = fillResult.fileId;
    outputLink   = fillResult.editLink;

    // S12: Export PDF
    if (String(tc['export_pdf'] || '').toUpperCase() === 'TRUE') {
      const runtimeType = TemplateRegistry.getRuntimeType(templateId);
      const pdfResult   = ExportService.exportFile(
        runtimeType, outputFileId,
        `${JobService.buildOutputFileName(docClass, jobId, nd['client_surname'], nd['short_address'], 1)}_PDF`,
        outputSubFolder
      );
      pdfFileId = pdfResult.pdfFileId;
      pdfLink   = pdfResult.pdfLink;
    }

    // S13-S15: Write links, stage, export log
    JobService.updateJobOutputLinks(jobId, outputFileId, outputLink, pdfFileId, pdfLink);
    JobService.updateJobStage(jobId, CONFIG.PIPELINE_STAGE.EXPORT_COMPLETE);
    Logger_.writeExportLog(jobId, docClass, templateId, outputFileId, outputLink,
                           pdfFileId, pdfLink, 'SUCCESS', Date.now() - startTime, triggeredBy);

    // S16: Signing queue
    if (String(tc['require_signing'] || '').toUpperCase() === 'TRUE') {
      SigningService.queueForSigning(jobId, docClass, pdfFileId, pdfLink, nd['client_name'], nd['client_email']);
      JobService.updateJobStage(jobId, CONFIG.PIPELINE_STAGE.SIGNING_QUEUED);
    }

    // S17: Return success
    return { success: true, jobId, outputLink, pdfLink };

  } catch (err) {
    Logger_.writeErrorLog(jobId, 'TriggerHandlers._runPipeline',
      _classifyError(err.message), err.message, `Pipeline failed for ${jobId}`,
      'ERROR', true, err.stack ? err.stack.substring(0, 300) : '');
    JobService.markJobFailed(jobId);
    Logger_.writeExportLog(jobId, docClass, templateId, outputFileId, outputLink,
                           pdfFileId, pdfLink, 'FAILED', Date.now() - startTime, triggeredBy);
    throw err;
  }
}

/**
 * Fills the template with placeholders and audits for unresolved required keys.
 * Dispatches to Slides or Docs engine based on runtime type.
 * @param {Object} tc - Template config row.
 * @param {string} templateId
 * @param {Object} placeholders
 * @param {Object} nd - Normalised data.
 * @param {Folder} outputSubFolder
 * @returns {{ fileId: string, editLink: string }}
 */
function _fillAndAudit(tc, templateId, placeholders, nd, outputSubFolder) {
  const runtimeType    = TemplateRegistry.getRuntimeType(templateId);
  const outputFileName = JobService.buildOutputFileName(
    nd['doc_class'], nd['job_id'], nd['client_surname'], nd['short_address'], 1
  );
  const masterFileId = tc['master_file_id'];
  let result;
  if (runtimeType === CONFIG.RUNTIME.DOCS) {
    result = DocsTemplateEngine.fillTemplate(masterFileId, placeholders, outputFileName, outputSubFolder);
  } else {
    result = SlidesTemplateEngine.fillTemplate(masterFileId, placeholders, outputFileName, outputSubFolder);
  }
  // Audit unresolved required placeholders
  const manifest     = TemplateRegistry.getPlaceholderManifest(templateId);
  const requiredKeys = (manifest.placeholders || []).filter(p => p.required).map(p => p.key);
  const unresolved   = runtimeType === CONFIG.RUNTIME.DOCS
    ? DocsTemplateEngine.auditUnresolvedPlaceholders(result.fileId, requiredKeys)
    : SlidesTemplateEngine.auditUnresolvedPlaceholders(result.fileId, requiredKeys);
  if (unresolved.length > 0) {
    throw new Error(
      `${CONFIG.ERROR_CLASS.PLACEHOLDER_REPLACEMENT_ERROR}: Unresolved required placeholders: ${unresolved.join(', ')}`
    );
  }
  return result;
}

/**
 * Maps a Google Form submit event to a RAW_SUBMISSIONS row object.
 * @param {Object} e - Form submit event.
 * @returns {Object}
 */
function _extractRawRow(e) {
  const raw = {
    timestamp: new Date().toISOString(),
    form_submission_id: e && e.response ? e.response.getId() : '',
    doc_class_raw: '', client_first_name: '', client_last_name: '',
    client_email: '', client_phone: '', site_address_raw: '',
    system_type_raw: '', system_size_kw_raw: '', battery_size_kwh_raw: '',
    estimated_annual_bill_raw: '', finance_required_raw: '',
    notes_raw: '', normalised_flag: 'FALSE'
  };
  if (!e || !e.response) return raw;
  const items = e.response.getItemResponses();
  items.forEach(item => {
    const t = item.getItem().getTitle().toLowerCase();
    const v = String(item.getResponse() || '');
    if (t.includes('doc class') || t.includes('document type')) { raw.doc_class_raw = v; }
    else if (t.includes('first name'))                          { raw.client_first_name = v; }
    else if (t.includes('last name') || t.includes('surname'))  { raw.client_last_name = v; }
    else if (t.includes('email'))                               { raw.client_email = v; }
    else if (t.includes('phone'))                               { raw.client_phone = v; }
    else if (t.includes('address'))                             { raw.site_address_raw = v; }
    else if (t.includes('system size'))                         { raw.system_size_kw_raw = v; }
    else if (t.includes('battery'))                             { raw.battery_size_kwh_raw = v; }
    else if (t.includes('bill'))                                { raw.estimated_annual_bill_raw = v; }
    else if (t.includes('finance'))                             { raw.finance_required_raw = v; }
    else if (t.includes('note'))                                { raw.notes_raw = v; }
  });
  return raw;
}

/**
 * Classifies an error message string into a CONFIG.ERROR_CLASS value.
 * @param {string} message
 * @returns {string}
 */
function _classifyError(message) {
  if (!message) return CONFIG.ERROR_CLASS.UNKNOWN_RUNTIME_ERROR;
  const m = message.toLowerCase();
  if (m.includes('json_parse') || m.includes('unexpected token')) return CONFIG.ERROR_CLASS.JSON_PARSE_ERROR;
  if (m.includes('json_schema'))        return CONFIG.ERROR_CLASS.JSON_SCHEMA_ERROR;
  if (m.includes('template_not_found') || m.includes('template not found')) return CONFIG.ERROR_CLASS.TEMPLATE_NOT_FOUND;
  if (m.includes('placeholder'))        return CONFIG.ERROR_CLASS.PLACEHOLDER_REPLACEMENT_ERROR;
  if (m.includes('pdf_export') || m.includes('pdf export')) return CONFIG.ERROR_CLASS.PDF_EXPORT_ERROR;
  if (m.includes('claude') || m.includes('claude_api') || m.includes('http 429')) return CONFIG.ERROR_CLASS.CLAUDE_API_ERROR;
  if (m.includes('config_error') || m.includes('script properties')) return CONFIG.ERROR_CLASS.CONFIG_ERROR;
  if (m.includes('drive'))              return CONFIG.ERROR_CLASS.DRIVE_PERMISSION_ERROR;
  return CONFIG.ERROR_CLASS.UNKNOWN_RUNTIME_ERROR;
}
