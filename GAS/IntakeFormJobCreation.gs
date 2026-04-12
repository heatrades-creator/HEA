/**
 * HEA INTAKE FORM — Job auto-creation snippet
 * =============================================
 * Add this to your existing HEA INTAKE GAS script.
 * Call createJobFromIntake(data) inside your form submit handler,
 * passing the parsed form data.
 *
 * Replace JOBS_API_URL with the deployed URL of HEAJobsAPI.gs
 */

const JOBS_API_URL = 'https://script.google.com/macros/s/AKfycbxJqoUxjad6W6KWx2-NxPqIUafCJA7hrOK3jRfK8HGc9irZEVAA9khPF2tUpbQ05qjz/exec';

function createJobFromIntake(formData) {
  try {
    UrlFetchApp.fetch(JOBS_API_URL, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({
        action: 'createJob',
        clientName: formData.name || formData.clientName || '',
        phone:      formData.phone || '',
        email:      formData.email || '',
        address:    formData.address || formData.siteAddress || '',
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

/**
 * Example: call this inside your existing onFormSubmit function:
 *
 * function onFormSubmit(e) {
 *   // ... existing intake form handling ...
 *
 *   createJobFromIntake({
 *     name:    e.namedValues['Full Name'][0],
 *     phone:   e.namedValues['Phone Number'][0],
 *     email:   e.namedValues['Email Address'][0],
 *     address: e.namedValues['Property Address'][0],
 *   });
 * }
 */
