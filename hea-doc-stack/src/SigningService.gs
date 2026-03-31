/**
 * SigningService.gs
 * Manages the document signing queue.
 * Full DocuSeal/OpenSign integration is Phase 7 — syncSigningStatus is a stub.
 */

const SigningService = (() => {

  /**
   * Adds a PDF to the SIGNING_QUEUE for later dispatch to a signing provider.
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
      job_id:           jobId           || '',
      doc_class:        docClass        || '',
      pdf_file_id:      pdfFileId       || '',
      pdf_link:         pdfLink         || '',
      recipient_name:   recipientName   || '',
      recipient_email:  recipientEmail  || '',
      provider:         provider,
      send_status:      'PENDING',
      sign_status:      'PENDING',
      signed_file_link: '',
      sign_request_id:  '',
      last_sync:        new Date().toISOString()
    };

    SheetRepository.appendRow(CONFIG.TABS.SIGNING_QUEUE, row);
    Logger_.log('SigningService', `Job ${jobId} queued for signing via ${provider}`, 'INFO');
  };

  /**
   * Syncs signing status with the configured provider.
   * STUB — Phase 7 implementation pending.
   */
  const syncSigningStatus = () => {
    Logger_.log('SigningService', 'syncSigningStatus: not yet implemented (Phase 7)', 'INFO');
  };

  return { queueForSigning, syncSigningStatus };

})();
