/**
 * HEA INTAKE FORM — Job auto-creation
 * =====================================
 * Called inside processSubmission() after the intake form is submitted.
 * Creates a job record in the HEA Jobs API (Google Sheet + Drive folder).
 */

const JOBS_API_URL = 'https://script.google.com/macros/s/AKfycbxJqoUxjad6W6KWx2-NxPqIUafCJA7hrOK3jRfK8HGc9irZEVAA9khPF2tUpbQ05qjz/exec';

function createJobFromIntake(formData) {
  try {
    UrlFetchApp.fetch(JOBS_API_URL, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({
        action:     'createJob',
        clientName: formData.name    || '',
        phone:      formData.phone   || '',
        email:      formData.email   || '',
        address:    formData.address || '',
        status:     'Lead',
        notes:      'Auto-created from intake form submission.',
      }),
      muteHttpExceptions: true,
    });
  } catch (err) {
    Logger.log('Job creation failed: ' + err.message);
    // Don't throw — intake form submission should succeed even if job creation fails
  }
}
