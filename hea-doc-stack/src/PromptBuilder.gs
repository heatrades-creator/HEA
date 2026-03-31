/**
 * PromptBuilder.gs
 * Constructs Claude API prompt payloads from normalised job data.
 */

const PromptBuilder = (() => {

  /** Fallback system prompt used when PROMPT_CONFIG row is not found. */
  const SYSTEM_PROMPT_FALLBACK = `You are a structured document content engine for Home Energy Australia.
Your sole output is a single valid JSON object.
No markdown fences. No explanation. No preamble.
Map job intake data to document placeholder values.
Keep all text premium, restrained and client-safe.
Never invent technical specifications, prices or system sizes.
Separate SCOPE, ASSUMPTIONS, and EXCLUSIONS into their own fields — never merge them.
Keep all text fields within their character budgets.
Use null or empty string per null_policy for unknown values.`;

  /** The six writing rules injected into every prompt. */
  const WRITING_RULES = [
    'Text must be premium and restrained — no marketing clichés or filler phrases',
    'Separate ASSUMPTIONS, EXCLUSIONS, and SCOPE — never merge them',
    'Do not invent system sizes, prices or technical specs not present in job_data',
    'Keep long_text fields within their character budgets',
    'Use null or empty string for unknown optional fields per null_policy',
    'Numeric fields must remain as formatted strings (e.g. "6.6 kW", "$18,950")'
  ];

  /**
   * Formats the placeholder manifest into a human-readable constraints string.
   * @param {Array} placeholders - Array of manifest placeholder objects.
   * @returns {string}
   */
  const _formatConstraints = (placeholders) => {
    if (!placeholders || placeholders.length === 0) return 'No placeholder constraints specified.';
    return placeholders.map(p =>
      `${p.key} | type:${p.type} | required:${p.required} | max_chars:${p.max_chars} | null_policy:${p.null_policy}`
    ).join('\n');
  };

  /**
   * Loads the system prompt for a doc class from PROMPT_CONFIG, with fallback.
   * @param {string} docClass
   * @returns {string}
   */
  const _loadSystemPrompt = (docClass) => {
    try {
      const row = SheetRepository.getRowByColumnValue(
        CONFIG.TABS.PROMPT_CONFIG, 'doc_class', docClass
      );
      if (row && String(row['active'] || '').toUpperCase() === 'TRUE' && row['system_prompt']) {
        return String(row['system_prompt']).trim();
      }
    } catch (e) {
      Logger_.log('PromptBuilder', `PROMPT_CONFIG load failed, using fallback: ${e.message}`, 'WARN');
    }
    return SYSTEM_PROMPT_FALLBACK;
  };

  /**
   * Builds the Claude API prompt for a normalised job data object.
   * @param {Object} normalisedData - The normalised row from NORMALISED_DATA.
   * @param {string} templateId - The template ID to reference.
   * @returns {{ systemPrompt: string, userContent: string }}
   */
  const buildPrompt = (normalisedData, templateId) => {
    const docClass      = normalisedData['doc_class'] || CONFIG.DOC_CLASS.SOLAR_BATTERY_PROPOSAL;
    const systemPrompt  = _loadSystemPrompt(docClass);

    const manifest    = TemplateRegistry.getPlaceholderManifest(templateId);
    const constraints = _formatConstraints(manifest.placeholders || []);

    const jobData = {
      doc_class:             normalisedData['doc_class']             || '',
      job_id:                normalisedData['job_id']                || '',
      client_name:           normalisedData['client_name']           || '',
      site_address:          normalisedData['site_address']          || '',
      client_surname:        normalisedData['client_surname']        || '',
      short_address:         normalisedData['short_address']         || '',
      system_size_kw:        normalisedData['system_size_kw']        || null,
      battery_size_kwh:      normalisedData['battery_size_kwh']      || null,
      estimated_annual_bill: normalisedData['estimated_annual_bill'] || null,
      total_price:           normalisedData['total_price']           || null,
      est_annual_saving:     normalisedData['est_annual_saving']     || null,
      payback_years:         normalisedData['payback_years']         || null,
      finance_required:      normalisedData['finance_required']      || false,
      notes:                 normalisedData['notes']                 || ''
    };

    const payload = {
      instruction: 'Return a single valid JSON object matching the schema. No markdown. No explanation.',
      required_schema: {
        document_type: '<doc_class_string>',
        job_id:        '<JOB-YYYY-NNNN>',
        template_id:   '<HEA_TEMPLATE_..._vNNN>',
        file_name:     '<HEA_DOCTYPE_DATE_JOBID_SURNAME_ADDR_vNNN>',
        placeholders:  { '{{PLACEHOLDER_KEY}}': '<value_string>' },
        meta: {
          tone:               'premium_restrained',
          word_budget_profile:'visual_template_safe',
          source_confidence:  '<mixed_input_user_supplied_plus_derived|user_supplied|derived>',
          generated_at:       '<ISO8601>'
        }
      },
      placeholder_constraints: constraints,
      proposal_date:           Utilities_.formatDateLong(new Date()),
      job_data:                jobData,
      writing_rules:           WRITING_RULES
    };

    return {
      systemPrompt,
      userContent: JSON.stringify(payload)
    };
  };

  return { buildPrompt };

})();
