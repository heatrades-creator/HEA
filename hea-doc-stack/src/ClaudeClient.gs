/**
 * ClaudeClient.gs
 * HTTP client for the Anthropic Claude Messages API.
 * All external API calls are isolated in this module.
 */

const ClaudeClient = (() => {

  /**
   * Pauses execution for a given number of milliseconds.
   * @param {number} ms
   */
  const _sleep = (ms) => {
    Utilities.sleep(ms);
  };

  /**
   * Calls the Claude API with a system prompt and user content string.
   * Retries on HTTP 429, 500, and 503 with exponential backoff.
   * @param {string} systemPrompt
   * @param {string} userContent
   * @param {number} [attempt] - Current attempt number (1-indexed). Defaults to 1.
   * @returns {string} The raw text response from Claude.
   * @throws {Error} On non-retryable HTTP errors or exhausted retries.
   */
  const call = (systemPrompt, userContent, attempt) => {
    const currentAttempt = attempt || 1;

    const apiKey = PropertiesService.getScriptProperties().getProperty('CLAUDE_API_KEY');
    if (!apiKey) {
      throw new Error(
        `${CONFIG.ERROR_CLASS.CONFIG_ERROR}: CLAUDE_API_KEY not set in Script Properties`
      );
    }

    const requestBody = {
      model:      CONFIG.CLAUDE.MODEL,
      max_tokens: CONFIG.CLAUDE.MAX_TOKENS,
      system:     systemPrompt,
      messages:   [{ role: 'user', content: userContent }]
    };

    const options = {
      method:             'post',
      contentType:        'application/json',
      headers: {
        'x-api-key':          apiKey,
        'anthropic-version':  CONFIG.CLAUDE.ANTHROPIC_VERSION
      },
      payload:            JSON.stringify(requestBody),
      muteHttpExceptions: true
    };

    Logger_.log('ClaudeClient', `API call attempt ${currentAttempt}/${CONFIG.RETRY.MAX_ATTEMPTS}`, 'INFO');

    const response = UrlFetchApp.fetch(CONFIG.CLAUDE.API_URL, options);
    const status   = response.getResponseCode();
    const body     = response.getContentText();

    // Transient errors — retry with exponential backoff
    if (status === 429 || status === 500 || status === 503) {
      if (currentAttempt < CONFIG.RETRY.MAX_ATTEMPTS) {
        const delay = CONFIG.RETRY.DELAY_MS * Math.pow(2, currentAttempt - 1);
        Logger_.log('ClaudeClient', `HTTP ${status} — retrying in ${delay}ms`, 'WARN');
        _sleep(delay);
        return call(systemPrompt, userContent, currentAttempt + 1);
      }
      throw new Error(
        `${CONFIG.ERROR_CLASS.CLAUDE_API_ERROR}: HTTP ${status} after ${CONFIG.RETRY.MAX_ATTEMPTS} attempts. Body: ${body.substring(0, 200)}`
      );
    }

    if (status !== 200) {
      throw new Error(
        `${CONFIG.ERROR_CLASS.CLAUDE_API_ERROR}: HTTP ${status}. Body: ${body.substring(0, 200)}`
      );
    }

    const parsed = JSON.parse(body);
    const text   = parsed.content && parsed.content[0] && parsed.content[0].text
      ? parsed.content[0].text.trim()
      : '';

    if (!text) {
      throw new Error(
        `${CONFIG.ERROR_CLASS.CLAUDE_API_ERROR}: Empty response content from Claude`
      );
    }

    Logger_.log('ClaudeClient', `API call succeeded on attempt ${currentAttempt}`, 'INFO');
    return text;
  };

  /**
   * Convenience method: builds the prompt then calls Claude.
   * @param {Object} normalisedData
   * @param {string} templateId
   * @returns {string}
   */
  const callWithPrompt = (normalisedData, templateId) => {
    const { systemPrompt, userContent } = PromptBuilder.buildPrompt(normalisedData, templateId);
    return call(systemPrompt, userContent);
  };

  return { call, callWithPrompt };

})();
