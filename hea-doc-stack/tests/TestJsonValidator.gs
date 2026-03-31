/**
 * TestJsonValidator.gs
 * Unit tests for the JsonValidator module.
 * Depends on MockData.gs and TestRunner.gs.
 */

/**
 * Runs all JsonValidator unit tests.
 * Called by runAllTests() in TestRunner.gs.
 */
function testJsonValidator() {
  console.log('\n--- TestJsonValidator ---');

  const templateId   = 'HEA_TEMPLATE_SOLAR_BATTERY_PROPOSAL_MASTER_v001';
  const expectedJobId = 'JOB-2026-9999';

  // TEST_1: Valid MOCK_CLAUDE_JSON_RESPONSE parses and validates successfully
  let test1Passed = false;
  try {
    const parsed = JsonValidator.validate(MOCK_CLAUDE_JSON_RESPONSE, expectedJobId, templateId);
    test1Passed = parsed !== null && typeof parsed === 'object' && parsed['job_id'] === expectedJobId;
  } catch (e) {
    console.log(`  TEST_1 error: ${e.message}`);
  }
  _assert(test1Passed, 'TEST_1: Valid response parses and validates successfully');

  // TEST_2: MOCK_INVALID_JSON throws JSON_PARSE_ERROR
  let test2Passed = false;
  try {
    JsonValidator.validate(MOCK_INVALID_JSON, expectedJobId, templateId);
  } catch (e) {
    test2Passed = e.message.includes('JSON_PARSE_ERROR');
  }
  _assert(test2Passed, 'TEST_2: MOCK_INVALID_JSON throws JSON_PARSE_ERROR');

  // TEST_3: MOCK_WRONG_JOB_ID_JSON throws JSON_SCHEMA_ERROR on job_id mismatch
  let test3Passed = false;
  try {
    JsonValidator.validate(MOCK_WRONG_JOB_ID_JSON, expectedJobId, templateId);
  } catch (e) {
    test3Passed = e.message.includes('JSON_SCHEMA_ERROR');
  }
  _assert(test3Passed, 'TEST_3: MOCK_WRONG_JOB_ID_JSON throws JSON_SCHEMA_ERROR');

  // TEST_4: MOCK_MISSING_REQUIRED_PLACEHOLDER_JSON throws JSON_SCHEMA_ERROR
  let test4Passed = false;
  try {
    JsonValidator.validate(MOCK_MISSING_REQUIRED_PLACEHOLDER_JSON, expectedJobId, templateId);
  } catch (e) {
    test4Passed = e.message.includes('JSON_SCHEMA_ERROR');
  }
  _assert(test4Passed, 'TEST_4: Missing required placeholder throws JSON_SCHEMA_ERROR');

  // TEST_5: Response wrapped in ```json fences is still parsed correctly
  let test5Passed = false;
  try {
    const fenced = '```json\n' + MOCK_CLAUDE_JSON_RESPONSE + '\n```';
    const parsed = JsonValidator.parse(fenced);
    test5Passed = parsed !== null && typeof parsed === 'object';
  } catch (e) {
    console.log(`  TEST_5 error: ${e.message}`);
  }
  _assert(test5Passed, 'TEST_5: Response with ```json fences parsed correctly');

  // TEST_6: Missing top-level key throws JSON_SCHEMA_ERROR
  let test6Passed = false;
  const missingKey = JSON.parse(MOCK_CLAUDE_JSON_RESPONSE);
  delete missingKey['meta'];
  try {
    JsonValidator.validate(JSON.stringify(missingKey), expectedJobId, templateId);
  } catch (e) {
    test6Passed = e.message.includes('JSON_SCHEMA_ERROR');
  }
  _assert(test6Passed, 'TEST_6: Missing top-level key throws JSON_SCHEMA_ERROR');
}
