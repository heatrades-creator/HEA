/**
 * TestNormalizer.gs
 * Unit tests for the Normalizer module.
 * Depends on MockData.gs and TestRunner.gs (_assert function).
 */

/**
 * Runs all Normalizer unit tests.
 * Called by runAllTests() in TestRunner.gs.
 */
function testNormalizer() {
  console.log('\n--- TestNormalizer ---');

  const result = Normalizer.normalise(MOCK_RAW_ROW);

  // TEST_1: Standard input produces correct merged client_name
  _assert(
    result['client_name'] === 'Sarah Williams',
    'TEST_1: client_name merged correctly from first + last'
  );

  // TEST_2: Email is lowercased and trimmed
  _assert(
    result['client_email'] === 'sarah.williams@example.com',
    'TEST_2: Email lowercased and trimmed'
  );

  // TEST_3: Phone strips non-numeric characters (spaces)
  _assert(
    result['client_phone'] === '0412345678',
    'TEST_3: Phone strips non-numeric characters'
  );

  // TEST_4: system_size_kw coerced from "10kW" to 10
  _assert(
    result['system_size_kw'] === 10,
    'TEST_4: system_size_kw coerced from "10kW" to 10'
  );

  // TEST_5: battery_size_kwh coerced from "$20kWh" to 20
  _assert(
    result['battery_size_kwh'] === 20,
    'TEST_5: battery_size_kwh coerced from "$20kWh" to 20'
  );

  // TEST_6: estimated_annual_bill coerced from "$4,200" to 4200
  _assert(
    result['estimated_annual_bill'] === 4200,
    'TEST_6: estimated_annual_bill coerced from "$4,200" to 4200'
  );

  // TEST_7: finance_required is true for "Yes"
  _assert(
    result['finance_required'] === true,
    'TEST_7: finance_required is true for "Yes"'
  );

  // TEST_8: doc_class resolved from "Solar + Battery" to solar_battery_proposal
  _assert(
    result['doc_class'] === 'solar_battery_proposal',
    'TEST_8: doc_class resolved from "Solar + Battery" to solar_battery_proposal'
  );

  // TEST_9: short_address derived as "42-Oak-Ave" from full address
  _assert(
    result['short_address'] === '42-Oak-Ave',
    'TEST_9: short_address derived as "42-Oak-Ave"'
  );

  // TEST_10: Null raw inputs produce empty string or null, not undefined
  const emptyRow = {
    form_submission_id:       '',
    doc_class_raw:            '',
    client_first_name:        null,
    client_last_name:         null,
    client_email:             null,
    client_phone:             null,
    site_address_raw:         null,
    system_size_kw_raw:       null,
    battery_size_kwh_raw:     null,
    estimated_annual_bill_raw:null,
    finance_required_raw:     null,
    notes_raw:                null
  };
  const emptyResult = Normalizer.normalise(emptyRow);
  const noUndefined = Object.values(emptyResult).every(v => v !== undefined);
  _assert(noUndefined, 'TEST_10: Null raw inputs produce empty string or null, not undefined');
}
