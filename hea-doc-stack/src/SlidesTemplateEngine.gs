/**
 * SlidesTemplateEngine.gs
 * All Google Slides operations are isolated in this module.
 * Business logic must never call SlidesApp directly.
 */

const SlidesTemplateEngine = (() => {

  /**
   * Replaces placeholder text in all TextRun objects within a shape.
   * Skips non-text shapes silently.
   * @param {Shape} shape
   * @param {Object} placeholders - Key/value map of placeholder tokens to values.
   */
  const _replaceInShape = (shape, placeholders) => {
    try {
      const textRange = shape.getText();
      if (!textRange) return;
      const runs = textRange.getRuns();
      runs.forEach(run => {
        let text = run.getText();
        Object.keys(placeholders).forEach(key => {
          if (text.indexOf(key) !== -1) {
            const value = placeholders[key] !== null && placeholders[key] !== undefined
              ? String(placeholders[key])
              : '';
            text = text.split(key).join(value);
          }
        });
        run.setText(text);
      });
    } catch (e) {
      // Non-text shapes (images, lines, etc.) throw — skip silently
    }
  };

  /**
   * Replaces placeholder text in all cells of a table shape.
   * @param {Table} table
   * @param {Object} placeholders
   */
  const _replaceInTable = (table, placeholders) => {
    const numRows = table.getNumRows();
    const numCols = table.getNumColumns();
    for (let r = 0; r < numRows; r++) {
      for (let c = 0; c < numCols; c++) {
        try {
          const cell  = table.getCell(r, c);
          const runs  = cell.getText().getRuns();
          runs.forEach(run => {
            let text = run.getText();
            Object.keys(placeholders).forEach(key => {
              if (text.indexOf(key) !== -1) {
                const value = placeholders[key] !== null && placeholders[key] !== undefined
                  ? String(placeholders[key])
                  : '';
                text = text.split(key).join(value);
              }
            });
            run.setText(text);
          });
        } catch (e) {
          // Skip cells that cannot be read
        }
      }
    }
  };

  /**
   * Processes all shapes and tables on a single slide.
   * @param {Slide} slide
   * @param {Object} placeholders
   */
  const _processSlide = (slide, placeholders) => {
    // Process shapes
    slide.getShapes().forEach(shape => _replaceInShape(shape, placeholders));
    // Process tables
    slide.getTables().forEach(table => _replaceInTable(table, placeholders));
  };

  /**
   * Duplicates the master Slides file, fills all placeholders, saves and closes.
   * @param {string} masterFileId - Drive ID of the master template presentation.
   * @param {Object} placeholders - { '{{KEY}}': 'value' } map.
   * @param {string} outputFileName - Name for the new file.
   * @param {Folder} destinationFolder - Drive folder to place the copy in.
   * @returns {{ fileId: string, editLink: string }}
   */
  const fillTemplate = (masterFileId, placeholders, outputFileName, destinationFolder) => {
    const copy = DriveRepository.duplicateFile(masterFileId, outputFileName, destinationFolder);
    const fileId = copy.getId();

    const presentation = SlidesApp.openById(fileId);

    // Use presentation-level replaceAllText which handles split text runs correctly.
    // Per-run replacement fails when Slides splits a placeholder across multiple runs.
    // Manifest keys are stored WITHOUT braces (e.g. "Customer_Name").
    // We wrap them here to match the template format {Variable_Name}.
    Object.keys(placeholders).forEach(key => {
      const value = placeholders[key] !== null && placeholders[key] !== undefined
        ? String(placeholders[key])
        : '';
      presentation.replaceAllText('{' + key + '}', value);
    });

    presentation.saveAndClose();

    return {
      fileId,
      editLink: DriveRepository.getSlidesEditLink(fileId)
    };
  };

  /**
   * Opens a filled presentation and returns any required placeholder keys still unresolved.
   * @param {string} fileId
   * @param {string[]} requiredKeys - Array of placeholder key strings to check.
   * @returns {string[]} Keys that remain unresolved in the file.
   */
  const auditUnresolvedPlaceholders = (fileId, requiredKeys) => {
    const presentation = SlidesApp.openById(fileId);
    const allText = presentation.getSlides().map(slide => {
      const parts = [];
      slide.getShapes().forEach(shape => {
        try { parts.push(shape.getText().asString()); } catch (e) {}
      });
      slide.getTables().forEach(table => {
        for (let r = 0; r < table.getNumRows(); r++) {
          for (let c = 0; c < table.getNumColumns(); c++) {
            try { parts.push(table.getCell(r, c).getText().asString()); } catch (e) {}
          }
        }
      });
      return parts.join(' ');
    }).join(' ');

    presentation.saveAndClose();
    // Manifest keys have no braces; check for the brace-wrapped form still present in the doc.
    return requiredKeys.filter(key => allText.indexOf('{' + key + '}') !== -1);
  };

  return { fillTemplate, auditUnresolvedPlaceholders };

})();
