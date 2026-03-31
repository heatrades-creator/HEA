/**
 * TestRunner.gs
 * Minimal test harness for running all HEA test suites.
 * Run runAllTests() from the Apps Script editor.
 */

// Module-level pass/fail counters
let _passCount = 0;
let _failCount = 0;

/**
 * Runs all test suites and logs a final summary.
 * Call this from the Apps Script editor to run all tests.
 */
function runAllTests() {
  _passCount = 0;
  _failCount = 0;

  console.log('=== HEA DOC STACK TEST SUITE ===');

  try { testNormalizer();    } catch (e) { console.log(`[SUITE ERROR] testNormalizer: ${e.message}`); }
  try { testJsonValidator(); } catch (e) { console.log(`[SUITE ERROR] testJsonValidator: ${e.message}`); }
  try { testPromptBuilder(); } catch (e) { console.log(`[SUITE ERROR] testPromptBuilder: ${e.message}`); }
  try { testJobService();    } catch (e) { console.log(`[SUITE ERROR] testJobService: ${e.message}`); }

  const total = _passCount + _failCount;
  console.log(`\n=== ${_passCount}/${total} TESTS PASSED ===`);
  if (_failCount > 0) {
    console.log(`${_failCount} test(s) FAILED — review logs above.`);
  }
}

/**
 * Asserts a condition and logs PASS or FAIL with a label.
 * Increments module-level pass/fail counters.
 * @param {boolean} condition - True for pass, false for fail.
 * @param {string} label - Descriptive name for this assertion.
 */
function _assert(condition, label) {
  if (condition) {
    _passCount++;
    console.log(`  [PASS] ${label}`);
  } else {
    _failCount++;
    console.log(`  [FAIL] ${label}`);
  }
}
