/**
 * TestJobService.gs
 * Unit tests for pure functions in the JobService module.
 * These tests do not require sheet or Drive access.
 * Depends on TestRunner.gs.
 */

/**
 * Runs all JobService unit tests.
 * Called by runAllTests() in TestRunner.gs.
 */
function testJobService() {
  console.log('\n--- TestJobService ---');

  // TEST_1: buildOutputFileName returns a correctly formatted string
  const name = JobService.buildOutputFileName(
    'solar_battery_proposal',
    'JOB-2026-0042',
    'Williams',
    '42-Oak-Ave',
    1
  );
  _assert(
    typeof name === 'string' && name.startsWith('HEA_PROPOSAL_'),
    'TEST_1: buildOutputFileName returns string starting with HEA_PROPOSAL_'
  );

  // TEST_2: buildOutputFileName contains no spaces or invalid chars
  const invalidChars = /[\s/\\'"<>|*?:]/;
  _assert(
    !invalidChars.test(name),
    'TEST_2: buildOutputFileName contains no spaces or invalid Drive characters'
  );

  // TEST_3: buildOutputFileName pads version to 3 digits (v001)
  _assert(
    name.endsWith('_v001'),
    'TEST_3: buildOutputFileName version is padded to 3 digits (v001)'
  );

  // TEST_4: Short address is filesystem-safe in output filename
  const nameWithSpecial = JobService.buildOutputFileName(
    'solar_battery_proposal',
    'JOB-2026-0043',
    "O'Brien",
    '10 Smith St/Unit 2',
    1
  );
  _assert(
    !invalidChars.test(nameWithSpecial),
    'TEST_4: Short address with special chars is filesystem-safe in output filename'
  );
}
