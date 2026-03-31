/**
 * JobService.gs
 * Business logic for job lifecycle management.
 */

const JobService = (() => {

  /**
   * Generates a new unique job ID using the SETTINGS counter.
   * Format: JOB-{YYYY}-{NNNN}
   * @returns {string}
   */
  const createJobId = () => {
    const seq  = SheetRepository.incrementAndGetJobCounter();
    const year = new Date().getFullYear();
    const padded = String(seq).padStart(CONFIG.JOB.ID_SEQ_DIGITS, '0');
    return `${CONFIG.JOB.ID_PREFIX}-${year}-${padded}`;
  };

  /**
   * Registers a new job in JOBS_REGISTER, or returns the existing row if already present.
   * @param {{ job_id: string, client_name: string, site_address: string,
   *            doc_class: string, owner?: string }} jobData
   * @returns {Object} The job register row.
   */
  const registerJob = (jobData) => {
    const existing = SheetRepository.getRowByColumnValue(
      CONFIG.TABS.JOBS_REGISTER, 'job_id', jobData.job_id
    );
    if (existing) return existing;

    const row = {
      job_id:         jobData.job_id,
      created_at:     new Date().toISOString(),
      client_name:    jobData.client_name    || '',
      site_address:   jobData.site_address   || '',
      doc_class:      jobData.doc_class      || '',
      pipeline_stage: CONFIG.PIPELINE_STAGE.INTAKE,
      doc_status:     '',
      template_id:    '',
      output_file_id: '',
      output_file_link:'',
      pdf_file_id:    '',
      pdf_link:       '',
      job_folder_id:  '',
      last_run_at:    new Date().toISOString(),
      output_version: 'v001',
      owner:          jobData.owner || '',
      notes:          ''
    };
    SheetRepository.appendRow(CONFIG.TABS.JOBS_REGISTER, row);
    return row;
  };

  /**
   * Ensures a job folder exists in Drive and caches the folder ID in JOBS_REGISTER.
   * @param {string} jobId
   * @param {string} clientName
   * @param {string} shortAddress
   * @returns {Folder}
   */
  const getOrCreateJobFolder = (jobId, clientName, shortAddress) => {
    const job = SheetRepository.getRowByColumnValue(
      CONFIG.TABS.JOBS_REGISTER, 'job_id', jobId
    );
    // Try to use cached folder ID first
    if (job && job['job_folder_id']) {
      try {
        return DriveRepository.getFolderById(String(job['job_folder_id']));
      } catch (e) {
        // Folder may have been deleted — fall through to create
        Logger_.log('JobService', `Cached job folder not found, recreating: ${e.message}`, 'WARN');
      }
    }
    const folder = DriveRepository.getOrCreateJobFolder(jobId, clientName, shortAddress);
    SheetRepository.updateRowByColumnValue(
      CONFIG.TABS.JOBS_REGISTER, 'job_id', jobId,
      { job_folder_id: folder.getId(), last_run_at: new Date().toISOString() }
    );
    return folder;
  };

  /**
   * Updates a single field on the job register row.
   * Always writes last_run_at as well.
   * @param {string} jobId
   * @param {string} field
   * @param {*} value
   */
  const updateJobField = (jobId, field, value) => {
    SheetRepository.updateRowByColumnValue(
      CONFIG.TABS.JOBS_REGISTER, 'job_id', jobId,
      { [field]: value, last_run_at: new Date().toISOString() }
    );
  };

  /**
   * Updates the pipeline_stage for a job.
   * @param {string} jobId
   * @param {string} stage - One of CONFIG.PIPELINE_STAGE values.
   */
  const updateJobStage = (jobId, stage) => {
    updateJobField(jobId, 'pipeline_stage', stage);
  };

  /**
   * Writes all output file links to the job register row.
   * @param {string} jobId
   * @param {string} outputFileId
   * @param {string} outputLink
   * @param {string} pdfFileId
   * @param {string} pdfLink
   */
  const updateJobOutputLinks = (jobId, outputFileId, outputLink, pdfFileId, pdfLink) => {
    SheetRepository.updateRowByColumnValue(
      CONFIG.TABS.JOBS_REGISTER, 'job_id', jobId,
      {
        output_file_id:  outputFileId || '',
        output_file_link:outputLink   || '',
        pdf_file_id:     pdfFileId    || '',
        pdf_link:        pdfLink      || '',
        last_run_at:     new Date().toISOString()
      }
    );
  };

  /**
   * Marks a job as FAILED in the pipeline stage.
   * @param {string} jobId
   */
  const markJobFailed = (jobId) => {
    updateJobStage(jobId, CONFIG.PIPELINE_STAGE.FAILED);
  };

  /**
   * Returns the JOBS_REGISTER row for a given job ID, or null.
   * @param {string} jobId
   * @returns {Object|null}
   */
  const getJob = (jobId) => {
    return SheetRepository.getRowByColumnValue(CONFIG.TABS.JOBS_REGISTER, 'job_id', jobId);
  };

  /**
   * Constructs a Drive-safe output file name.
   * Pattern: HEA_{TAG}_{YYYY-MM-DD}_{JOB_ID}_{SURNAME}_{ADDR}_{vNNN}
   * @param {string} docClass
   * @param {string} jobId
   * @param {string} clientSurname
   * @param {string} shortAddress
   * @param {number} [version] - Defaults to 1.
   * @returns {string}
   */
  const buildOutputFileName = (docClass, jobId, clientSurname, shortAddress, version) => {
    const tag     = Utilities_.docClassToFileTag(docClass);
    const date    = Utilities_.formatDate(new Date());
    const surname = Utilities_.safeString(clientSurname  || 'Unknown');
    const addr    = Utilities_.safeString(shortAddress   || 'NoAddr');
    const ver     = `v${String(version || 1).padStart(3, '0')}`;
    return `HEA_${tag}_${date}_${jobId}_${surname}_${addr}_${ver}`;
  };

  return {
    createJobId,
    registerJob,
    getOrCreateJobFolder,
    updateJobField,
    updateJobStage,
    updateJobOutputLinks,
    markJobFailed,
    getJob,
    buildOutputFileName
  };

})();
