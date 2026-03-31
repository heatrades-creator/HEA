/**
 * ClaudeClient.gs
 * AI API client — now powered by Google Gemini 1.5 Flash (free tier).
 * Module name kept as ClaudeClient so no other files need changing.
 * Free tier limits: 15 requests/min, 1,500 requests/day — sufficient for proposals.
 */

const ClaudeClient = (() => {

  /** Pauses execution for a given number of milliseconds. */
  const _sleep = (ms) => {
    Utilities.sleep(ms);
  };

  /**
   * Calls the Gemini API with a system prompt and user content string.
   * Retries on HTTP 429, 500, and 503 with exponential backoff.
   * @param {string} systemPrompt
   * @param {string} userContent
   * @param {number} [attempt] - Current attempt number (1-indexed). Defaults to 1.
   * @returns {string} The raw text response from Gemini.
   * @throws {Error} On non-retryable HTTP errors or exhausted retries.
   */
  const call = (systemPrompt, userContent, attempt) => {
    const currentAttempt = attempt || 1;

    const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error(
        `${CONFIG.ERROR_CLASS.CONFIG_ERROR}: GEMINI_API_KEY not set in Script Properties`
      );
    }

    // Gemini combines system + user content into a single user turn
    const combinedPrompt = `${systemPrompt}\n\n${userContent}`;

    const requestBody = {
      contents: [
        { role: 'user', parts: [{ text: combinedPrompt }] }
      ],
      generationConfig: {
        maxOutputTokens: CONFIG.GEMINI.MAX_TOKENS,
        temperature:     0.3
      }
    };

    const url = `${CONFIG.GEMINI.API_URL}?key=${apiKey}`;

    const options = {
      method:             'post',
      contentType:        'application/json',
      payload:            JSON.stringify(requestBody),
      muteHttpExceptions: true
    };

    Logger_.log('ClaudeClient', `Gemini API call attempt ${currentAttempt}/${CONFIG.RETRY.MAX_ATTEMPTS}`, 'INFO');

    const response = UrlFetchApp.fetch(url, options);
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

    // Gemini response: candidates[0].content.parts[0].text
    const parsed = JSON.parse(body);
    const text   = parsed.candidates &&
                   parsed.candidates[0] &&
                   parsed.candidates[0].content &&
                   parsed.candidates[0].content.parts &&
                   parsed.candidates[0].content.parts[0]
      ? parsed.candidates[0].content.parts[0].text.trim()
      : '';

    if (!text) {
      throw new Error(
        `${CONFIG.ERROR_CLASS.CLAUDE_API_ERROR}: Empty response from Gemini API`
      );
    }

    Logger_.log('ClaudeClient', `Gemini API call succeeded on attempt ${currentAttempt}`, 'INFO');
    return text;
  };

  /**
   * Convenience method: builds the prompt then calls Gemini.
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
