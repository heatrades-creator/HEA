/**
 * SigningService.gs
 * Manages the e-signature queue.
 * Phase 7: Full DocuSeal/OpenSign integration is not yet implemented.
 * This module must exist and be callable without errors.
 */

const SigningService = (() => {

  /**
   * Appends a job to the SIGNING_QUEUE sheet with status PENDING.
   * @param {string} jobId
   * @param {string} docClass
   * @param {string} pdfFileId
   * @param {string} pdfLink
   * @param {string} recipientName
   * @param {string} recipientEmail
   */
  const queueForSigning = (jobId, docClass, pdfFileId, pdfLink, recipientName, recipientEmail) => {
    const provider = SheetRepository.getSettingValue(CONFIG.SETTINGS_KEYS.SIGNING_PROVIDER) || 'DOCUSEAL';

    const row = {
      job_id:            jobId           || '',
      doc_class:         docClass        || '',
      pdf_file_id:       pdfFileId       || '',
      pdf_link:          pdfLink         || '',
      recipient_name:    recipientName   || '',
      recipient_email:   recipientEmail  || '',
      provider:          provider,
      send_status:       'PENDING',
      sign_status:       'PENDING',
      signed_file_link:  '',
      sign_request_id:   '',
      last_sync:         new Date().toISOString()
    };

    SheetRepository.appendRow(CONFIG.TABS.SIGNING_QUEUE, row);
    Logger_.log('SigningService', `Queued ${jobId} for signing via ${provider}`, 'INFO');
  };

  /**
   * Stub — Phase 7 implementation will sync signing status from provider.
   * Currently logs a not-implemented message and returns immediately.
   */
  const syncSigningStatus = () => {
    Logger_.log('SigningService', 'syncSigningStatus: not implemented — Phase 7', 'INFO');
  };

  return { queueForSigning, syncSigningStatus };

})();
