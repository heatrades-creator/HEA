/**
 * TestPromptBuilder.gs
 * Unit tests for the PromptBuilder module.
 * Depends on MockData.gs and TestRunner.gs.
 */

/**
 * Runs all PromptBuilder unit tests.
 * Called by runAllTests() in TestRunner.gs.
 */
function testPromptBuilder() {
  console.log('\n--- TestPromptBuilder ---');

  const templateId = 'HEA_TEMPLATE_SOLAR_BATTERY_PROPOSAL_MASTER_v001';
  let promptResult;

  try {
    promptResult = PromptBuilder.buildPrompt(MOCK_NORMALISED_DATA, templateId);
  } catch (e) {
    console.log(`  Setup error in testPromptBuilder: ${e.message}`);
    // Mark all tests as failed if setup throws
    for (let i = 1; i <= 5; i++) {
      _assert(false, `TEST_${i}: (setup failed — ${e.message})`);
    }
    return;
  }

  // TEST_1: buildPrompt returns object with systemPrompt and userContent keys
  _assert(
    promptResult !== null &&
    typeof promptResult === 'object' &&
    'systemPrompt' in promptResult &&
    'userContent'  in promptResult,
    'TEST_1: buildPrompt returns { systemPrompt, userContent }'
  );

  // TEST_2: userContent is a valid JSON-parseable string
  let parsedContent = null;
  let test2Passed = false;
  try {
    parsedContent = JSON.parse(promptResult.userContent);
    test2Passed = true;
  } catch (e) {
    console.log(`  TEST_2 parse error: ${e.message}`);
  }
  _assert(test2Passed, 'TEST_2: userContent is valid JSON-parseable string');

  // TEST_3: Parsed userContent contains job_data.job_id matching input
  _assert(
    parsedContent !== null &&
    parsedContent['job_data'] &&
    parsedContent['job_data']['job_id'] === 'JOB-2026-9999',
    'TEST_3: userContent.job_data.job_id matches input job_id'
  );

  // TEST_4: Parsed userContent contains writing_rules array with 6 items
  _assert(
    parsedContent !== null &&
    Array.isArray(parsedContent['writing_rules']) &&
    parsedContent['writing_rules'].length === 6,
    'TEST_4: userContent.writing_rules is array with 6 items'
  );

  // TEST_5: Parsed userContent does not have placeholder values in wrong fields
  // i.e. the instruction field should not contain a real placeholder value like a name
  _assert(
    parsedContent !== null &&
    typeof parsedContent['instruction'] === 'string' &&
    !parsedContent['instruction'].includes('Sarah Williams'),
    'TEST_5: userContent.instruction does not contain placeholder values'
  );
}
