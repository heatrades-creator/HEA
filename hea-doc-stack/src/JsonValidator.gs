/**
 * JsonValidator.gs
 * Parses and validates Claude API responses against the authoritative JSON contract.
 */

const JsonValidator = (() => {

  /** Required top-level keys in every Claude response object. */
  const REQUIRED_TOP_LEVEL_KEYS = [
    'document_type',
    'job_id',
    'template_id',
    'file_name',
    'placeholders',
    'meta'
  ];

  /**
   * Strips optional ```json / ``` markdown fences and parses JSON text.
   * @param {string} rawText - Raw string from Claude.
   * @returns {Object} Parsed JSON object.
   * @throws {Error} CONFIG.ERROR_CLASS.JSON_PARSE_ERROR on parse failure.
   */
  const parse = (rawText) => {
    if (!rawText || typeof rawText !== 'string') {
      throw new Error(
        `${CONFIG.ERROR_CLASS.JSON_PARSE_ERROR}: Input is not a string`
      );
    }
    // Strip markdown fences if present
    let cleaned = rawText.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    }
    try {
      return JSON.parse(cleaned);
    } catch (e) {
      throw new Error(
        `${CONFIG.ERROR_CLASS.JSON_PARSE_ERROR}: ${e.message}. Raw start: ${rawText.substring(0, 200)}`
      );
    }
  };

  /**
   * Validates a parsed Claude response object against all 7 contract rules.
   * R1: Must be parseable JSON (handled by parse())
   * R2: All REQUIRED_TOP_LEVEL_KEYS present
   * R3: placeholders is a plain object (not array, not null)
   * R4: job_id in root matches placeholders["{{JOB_ID}}"]
   * R5: job_id matches expectedJobId
   * R6: All manifest required=true placeholders present in placeholders object
   * R7: No placeholder value may be undefined
   * @param {string} rawText - Raw Claude response string.
   * @param {string} expectedJobId - The job ID this response must match.
   * @param {string} templateId - Template ID used to load the manifest.
   * @returns {Object} The validated parsed object.
   * @throws {Error} CONFIG.ERROR_CLASS.JSON_SCHEMA_ERROR on any validation failure.
   */
  const validate = (rawText, expectedJobId, templateId) => {
    const parsed = parse(rawText);

    // R2: Required top-level keys
    REQUIRED_TOP_LEVEL_KEYS.forEach(key => {
      if (!(key in parsed)) {
        throw new Error(
          `${CONFIG.ERROR_CLASS.JSON_SCHEMA_ERROR}: Missing required top-level key: "${key}"`
        );
      }
    });

    // R3: placeholders must be a plain object
    const ph = parsed.placeholders;
    if (ph === null || typeof ph !== 'object' || Array.isArray(ph)) {
      throw new Error(
        `${CONFIG.ERROR_CLASS.JSON_SCHEMA_ERROR}: "placeholders" must be a plain object`
      );
    }

    // R5: job_id must match expectedJobId
    if (String(parsed.job_id).trim() !== String(expectedJobId).trim()) {
      throw new Error(
        `${CONFIG.ERROR_CLASS.JSON_SCHEMA_ERROR}: job_id mismatch — expected "${expectedJobId}", got "${parsed.job_id}"`
      );
    }

    // R4: {{JOB_ID}} placeholder must match root job_id
    const jobIdPlaceholder = ph['{{JOB_ID}}'];
    if (jobIdPlaceholder !== undefined &&
        String(jobIdPlaceholder).trim() !== String(parsed.job_id).trim()) {
      throw new Error(
        `${CONFIG.ERROR_CLASS.JSON_SCHEMA_ERROR}: placeholders["{{JOB_ID}}"] "${jobIdPlaceholder}" does not match root job_id "${parsed.job_id}"`
      );
    }

    // R6: All manifest required=true keys must be present
    const manifest = TemplateRegistry.getPlaceholderManifest(templateId);
    const requiredKeys = (manifest.placeholders || [])
      .filter(p => p.required === true)
      .map(p => p.key);

    requiredKeys.forEach(key => {
      if (!(key in ph)) {
        throw new Error(
          `${CONFIG.ERROR_CLASS.JSON_SCHEMA_ERROR}: Required placeholder missing from response: "${key}"`
        );
      }
    });

    // R7: No placeholder value may be undefined
    Object.keys(ph).forEach(key => {
      if (ph[key] === undefined) {
        throw new Error(
          `${CONFIG.ERROR_CLASS.JSON_SCHEMA_ERROR}: Placeholder "${key}" has undefined value — use "" or null`
        );
      }
    });

    return parsed;
  };

  return { parse, validate };

})();
