/**
 * ExportService.gs
 * Exports Google Slides and Docs files to PDF via the Drive export API.
 */

const ExportService = (() => {

  /**
   * Dispatches to the appropriate PDF export function based on runtime type.
   * @param {string} runtimeType - CONFIG.RUNTIME.SLIDES or CONFIG.RUNTIME.DOCS.
   * @param {string} fileId - Source file ID.
   * @param {string} pdfFileName - Name for the exported PDF file.
   * @param {Folder} destinationFolder - Drive folder for the PDF.
   * @returns {{ pdfFileId: string, pdfLink: string }}
   * @throws {Error} For unknown runtime types.
   */
  const exportFile = (runtimeType, fileId, pdfFileName, destinationFolder) => {
    if (runtimeType === CONFIG.RUNTIME.SLIDES) {
      return exportSlidesToPdf(fileId, pdfFileName, destinationFolder);
    }
    if (runtimeType === CONFIG.RUNTIME.DOCS) {
      return exportDocsToPdf(fileId, pdfFileName, destinationFolder);
    }
    throw new Error(
      `${CONFIG.ERROR_CLASS.PDF_EXPORT_ERROR}: Unknown runtime type "${runtimeType}"`
    );
  };

  /**
   * Exports a Google Slides presentation to PDF.
   * Uses the Drive export URL with Bearer token authorisation.
   * @param {string} fileId
   * @param {string} pdfFileName
   * @param {Folder} destinationFolder
   * @returns {{ pdfFileId: string, pdfLink: string }}
   */
  const exportSlidesToPdf = (fileId, pdfFileName, destinationFolder) => {
    const exportUrl = `https://docs.google.com/presentation/d/${fileId}/export/pdf`;
    return _fetchAndSavePdf(exportUrl, pdfFileName, destinationFolder);
  };

  /**
   * Exports a Google Docs document to PDF.
   * Uses the Drive export URL with Bearer token authorisation.
   * @param {string} fileId
   * @param {string} pdfFileName
   * @param {Folder} destinationFolder
   * @returns {{ pdfFileId: string, pdfLink: string }}
   */
  const exportDocsToPdf = (fileId, pdfFileName, destinationFolder) => {
    const exportUrl = `https://docs.google.com/document/d/${fileId}/export?format=pdf`;
    return _fetchAndSavePdf(exportUrl, pdfFileName, destinationFolder);
  };

  /**
   * Fetches a PDF from a Drive export URL and saves it to a folder.
   * @param {string} exportUrl
   * @param {string} pdfFileName
   * @param {Folder} destinationFolder
   * @returns {{ pdfFileId: string, pdfLink: string }}
   */
  const _fetchAndSavePdf = (exportUrl, pdfFileName, destinationFolder) => {
    const token = ScriptApp.getOAuthToken();
    const response = UrlFetchApp.fetch(exportUrl, {
      headers:            { Authorization: `Bearer ${token}` },
      muteHttpExceptions: true
    });

    if (response.getResponseCode() !== 200) {
      throw new Error(
        `${CONFIG.ERROR_CLASS.PDF_EXPORT_ERROR}: Export request failed with HTTP ${response.getResponseCode()}`
      );
    }

    const blob    = response.getBlob().setName(`${pdfFileName}.pdf`);
    const pdfFile = destinationFolder.createFile(blob);
    const pdfFileId = pdfFile.getId();

    return {
      pdfFileId,
      pdfLink: DriveRepository.getFileLink(pdfFileId)
    };
  };

  return { exportFile, exportSlidesToPdf, exportDocsToPdf };

})();
