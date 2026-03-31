/**
 * DriveRepository.gs
 * All Google Drive I/O is isolated in this module.
 * Business logic modules must never call DriveApp directly.
 */

const DriveRepository = (() => {

  // ── Folder helpers ─────────────────────────────────────────────────────────

  /**
   * Searches for a folder by name inside a parent folder.
   * @param {Folder} parentFolder
   * @param {string} name
   * @returns {Folder|null}
   */
  const getFolderByName = (parentFolder, name) => {
    const iter = parentFolder.getFoldersByName(name);
    return iter.hasNext() ? iter.next() : null;
  };

  /**
   * Gets an existing subfolder by name, or creates it if missing.
   * @param {Folder} parentFolder
   * @param {string} name
   * @returns {Folder}
   */
  const getOrCreateFolder = (parentFolder, name) => {
    const existing = getFolderByName(parentFolder, name);
    if (existing) return existing;
    return parentFolder.createFolder(name);
  };

  /**
   * Returns the root folder of the current user's Drive.
   * @returns {Folder}
   */
  const getRootFolder = () => {
    return DriveApp.getRootFolder();
  };

  /**
   * Fetches a Drive folder by its ID.
   * @param {string} id
   * @returns {Folder}
   */
  const getFolderById = (id) => {
    return DriveApp.getFolderById(id);
  };

  /**
   * Fetches a Drive file by its ID.
   * @param {string} id
   * @returns {File}
   */
  const getFileById = (id) => {
    return DriveApp.getFileById(id);
  };

  // ── File helpers ───────────────────────────────────────────────────────────

  /**
   * Duplicates a file into a destination folder with a new name.
   * @param {string} sourceFileId
   * @param {string} newName
   * @param {Folder} destinationFolder
   * @returns {File}
   */
  const duplicateFile = (sourceFileId, newName, destinationFolder) => {
    const source = DriveApp.getFileById(sourceFileId);
    return source.makeCopy(newName, destinationFolder);
  };

  /**
   * Moves a file to a destination folder (removes from all current parents).
   * @param {string} fileId
   * @param {Folder} destinationFolder
   * @returns {File}
   */
  const moveFileToFolder = (fileId, destinationFolder) => {
    const file = DriveApp.getFileById(fileId);
    // Add to new parent first, then remove old parents
    file.moveTo(destinationFolder);
    return file;
  };

  /**
   * Returns the standard Google Drive view URL for a file.
   * @param {string} fileId
   * @returns {string}
   */
  const getFileLink = (fileId) => {
    return `https://drive.google.com/file/d/${fileId}/view`;
  };

  /**
   * Returns the Google Slides editor URL for a presentation file.
   * @param {string} fileId
   * @returns {string}
   */
  const getSlidesEditLink = (fileId) => {
    return `https://docs.google.com/presentation/d/${fileId}/edit`;
  };

  /**
   * Returns the Google Docs editor URL for a document file.
   * @param {string} fileId
   * @returns {string}
   */
  const getDocsEditLink = (fileId) => {
    return `https://docs.google.com/document/d/${fileId}/edit`;
  };

  // ── Job folder helpers ─────────────────────────────────────────────────────

  /**
   * Returns the 'HEA Jobs' root folder in Drive, creating it at root if absent.
   * @returns {Folder}
   */
  const getJobsRootFolder = () => {
    return getOrCreateFolder(getRootFolder(), CONFIG.FOLDERS.JOBS_ROOT);
  };

  /**
   * Creates a job folder under HEA Jobs with all standard subfolders.
   * Folder name pattern: {jobId}_{clientName}_{shortAddress}
   * @param {string} jobId
   * @param {string} clientName
   * @param {string} shortAddress
   * @returns {Folder}
   */
  const getOrCreateJobFolder = (jobId, clientName, shortAddress) => {
    const root    = getJobsRootFolder();
    const safeName = `${jobId}_${Utilities_.safeString(clientName)}_${Utilities_.safeString(shortAddress)}`;
    const folder   = getOrCreateFolder(root, safeName);
    // Ensure all standard subfolders exist
    CONFIG.JOB_SUBFOLDERS.forEach(sub => getOrCreateFolder(folder, sub));
    return folder;
  };

  /**
   * Returns a named subfolder within a job folder.
   * @param {Folder} jobFolder
   * @param {string} subFolderName
   * @returns {Folder}
   */
  const getJobSubFolder = (jobFolder, subFolderName) => {
    return getOrCreateFolder(jobFolder, subFolderName);
  };

  return {
    getFolderByName,
    getOrCreateFolder,
    getRootFolder,
    getFolderById,
    getFileById,
    duplicateFile,
    moveFileToFolder,
    getFileLink,
    getSlidesEditLink,
    getDocsEditLink,
    getJobsRootFolder,
    getOrCreateJobFolder,
    getJobSubFolder
  };

})();
