/**
 * HEA Client Photo Portal — Google Apps Script
 * ===============================================
 * Clients open this web app to upload site photos before installation.
 * Photos are saved to the job's existing Google Drive folder.
 * After uploading, an ASBUILTS document is generated for installers.
 *
 * Deploy as Web App:
 *   Execute as: Me (hea.trades@gmail.com)
 *   Who has access: Anyone (anonymous)
 *
 * URL: Set NEXT_PUBLIC_PHOTO_PORTAL_URL in Vercel to this web app's URL
 */

// ── Config ─────────────────────────────────────────────────────────────────
// Same spreadsheet and folder as HEAJobsAPI
const JOBS_SHEET_ID    = SpreadsheetApp.getActiveSpreadsheet().getId();
const JOBS_SHEET_NAME  = 'HEA Jobs';
const CLIENTS_FOLDER   = '12LCs9uDYh4Wynor0LdDelNbcQDe7c-C-';  // same as HEAJobsAPI

// Photo categories sent to clients
const PHOTO_CATEGORIES = [
  {
    id:          'switchboard_open',
    label:       'Main Switchboard — Open',
    instruction: 'Open the switchboard door and take a clear photo showing all circuit breakers and labels.',
    required:    true,
  },
  {
    id:          'switchboard_closed',
    label:       'Main Switchboard — Closed',
    instruction: 'Take a photo of the closed switchboard door, showing the full panel from front.',
    required:    true,
  },
  {
    id:          'meter_box',
    label:       'Meter Box',
    instruction: 'Full photo of the electricity meter — include the meter number if visible.',
    required:    true,
  },
  {
    id:          'roof_overview',
    label:       'Roof Overview',
    instruction: 'Stand back and photograph the whole roof. Take one photo per face (north, east, south, west).',
    required:    true,
  },
  {
    id:          'roof_detail',
    label:       'Roof Detail / Material',
    instruction: 'Close-up showing the roof material clearly (tiles, metal, tray deck, etc.).',
    required:    true,
  },
  {
    id:          'proposed_panel_area',
    label:       'Proposed Panel Area',
    instruction: 'Photo of the roof section where panels will go. Show any obstructions (pipes, vents, skylights).',
    required:    true,
  },
  {
    id:          'cable_run',
    label:       'Cable Run Path',
    instruction: 'Show the path from the roof edge down to the switchboard — inside roof/ceiling space if accessible, or external wall route.',
    required:    false,
  },
  {
    id:          'existing_inverter',
    label:       'Existing Inverter (if present)',
    instruction: 'If there is an existing solar inverter, photograph the full unit including the label/model plate.',
    required:    false,
  },
];

// ── Entry point ─────────────────────────────────────────────────────────────

function doGet(e) {
  const jobNumber = (e && e.parameter && e.parameter.jobNumber) ? e.parameter.jobNumber.trim() : '';

  const template = HtmlService.createTemplateFromFile('Index');
  template.jobNumber   = jobNumber;
  template.jobInfo     = jobNumber ? getJobInfo_(jobNumber) : null;
  template.categories  = JSON.stringify(PHOTO_CATEGORIES);

  return template.evaluate()
    .setTitle('HEA — Site Photos')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// ── Client-callable functions ────────────────────────────────────────────────

/**
 * Upload a single photo for a job.
 * Called via google.script.run from Index.html
 * Returns { success: true, fileId, fileUrl } or { success: false, error }
 */
function uploadPhoto(jobNumber, categoryId, base64Data, mimeType, originalName) {
  try {
    if (!jobNumber) throw new Error('Job number required');
    if (!base64Data) throw new Error('No image data received');

    // Decode base64
    const decoded = Utilities.base64Decode(base64Data.replace(/^data:[^;]+;base64,/, ''));
    const blob = Utilities.newBlob(decoded, mimeType || 'image/jpeg', originalName || (categoryId + '.jpg'));

    // Get or create Photos subfolder inside the job's Drive folder
    const photosFolder = getOrCreatePhotosFolder_(jobNumber);

    // Prefix filename with category for easy sorting
    const safeCategory = categoryId.replace(/_/g, '-');
    const timestamp    = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename     = safeCategory + '_' + timestamp + '_' + (originalName || 'photo.jpg');
    blob.setName(filename);

    const file = photosFolder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    return { success: true, fileId: file.getId(), fileUrl: file.getUrl(), filename: filename };
  } catch (err) {
    console.error('uploadPhoto error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Generate an ASBUILTS Google Doc for installers.
 * Called after all photos are uploaded.
 * Returns { success: true, docUrl } or { success: false, error }
 */
function generateAsBuilts(jobNumber) {
  try {
    if (!jobNumber) throw new Error('Job number required');

    const jobInfo      = getJobInfo_(jobNumber);
    const photosFolder = getOrCreatePhotosFolder_(jobNumber);
    const jobFolder    = getJobFolder_(jobNumber);

    // Create new Google Doc
    const docName = 'ASBUILTS — ' + jobNumber + (jobInfo ? ' — ' + jobInfo.clientName : '');
    const doc     = DocumentApp.create(docName);
    const body    = doc.getBody();

    // ── Header ──────────────────────────────────────────────────────────────
    const header = body.appendParagraph('HEA Group — Site As-Builts');
    header.setHeading(DocumentApp.ParagraphHeading.HEADING1);
    header.setAttributes({ [DocumentApp.Attribute.FOREGROUND_COLOR]: '#1a1a1a' });

    body.appendParagraph('Job: ' + jobNumber).setAttributes({
      [DocumentApp.Attribute.BOLD]: true,
      [DocumentApp.Attribute.FONT_SIZE]: 14,
    });

    if (jobInfo) {
      body.appendParagraph('Client: ' + jobInfo.clientName);
      body.appendParagraph('Address: ' + jobInfo.address);
      body.appendParagraph('Phone: '   + jobInfo.phone);
    }

    body.appendParagraph('Generated: ' + new Date().toLocaleString('en-AU', { timeZone: 'Australia/Melbourne' }));
    body.appendHorizontalRule();

    // ── Photo sections ───────────────────────────────────────────────────────
    const files = photosFolder.getFiles();
    const filesByCategory = {};

    while (files.hasNext()) {
      const f = files.next();
      const name = f.getName();
      // Parse category from filename prefix
      const parts  = name.split('_');
      const catId  = parts.slice(0, parts.length - 2).join('_');
      if (!filesByCategory[catId]) filesByCategory[catId] = [];
      filesByCategory[catId].push(f);
    }

    PHOTO_CATEGORIES.forEach(function(cat) {
      const catFiles = filesByCategory[cat.id] || [];

      const sectionHeading = body.appendParagraph(cat.label);
      sectionHeading.setHeading(DocumentApp.ParagraphHeading.HEADING2);

      body.appendParagraph(cat.instruction).setAttributes({
        [DocumentApp.Attribute.ITALIC]: true,
        [DocumentApp.Attribute.FOREGROUND_COLOR]: '#666666',
      });

      if (catFiles.length === 0) {
        body.appendParagraph('— No photo uploaded for this category —').setAttributes({
          [DocumentApp.Attribute.FOREGROUND_COLOR]: '#999999',
        });
      } else {
        catFiles.forEach(function(f) {
          try {
            const imgBlob = f.getBlob();
            const img = body.appendImage(imgBlob);
            // Cap width to 400px
            if (img.getWidth() > 400) {
              const ratio = 400 / img.getWidth();
              img.setWidth(400);
              img.setHeight(Math.round(img.getHeight() * ratio));
            }
            body.appendParagraph(f.getName()).setAttributes({
              [DocumentApp.Attribute.FONT_SIZE]: 9,
              [DocumentApp.Attribute.FOREGROUND_COLOR]: '#888888',
            });
          } catch (imgErr) {
            body.appendParagraph('[Image could not be embedded: ' + f.getName() + ']');
          }
        });
      }

      body.appendHorizontalRule();
    });

    // ── Installer Notes section ──────────────────────────────────────────────
    body.appendParagraph('Installer Notes').setHeading(DocumentApp.ParagraphHeading.HEADING2);
    body.appendParagraph('\n\n\n');  // Space for handwritten/typed notes
    body.appendParagraph('Surveyed by: ____________________   Date: ________________');

    doc.saveAndClose();

    // Move doc to job folder
    const docFile = DriveApp.getFileById(doc.getId());
    if (jobFolder) {
      jobFolder.addFile(docFile);
      DriveApp.getRootFolder().removeFile(docFile);
    }

    // Share with view access
    docFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    return { success: true, docUrl: docFile.getUrl(), docId: doc.getId() };
  } catch (err) {
    console.error('generateAsBuilts error:', err);
    return { success: false, error: err.message };
  }
}

// ── Internal helpers ─────────────────────────────────────────────────────────

function getJobInfo_(jobNumber) {
  try {
    const ss    = SpreadsheetApp.openById(JOBS_SHEET_ID);
    const sheet = ss.getSheetByName(JOBS_SHEET_NAME);
    if (!sheet) return null;

    const data  = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(jobNumber)) {
        return {
          jobNumber:  String(data[i][0]),
          clientName: String(data[i][1] || ''),
          phone:      String(data[i][2] || ''),
          email:      String(data[i][3] || ''),
          address:    String(data[i][4] || ''),
          driveUrl:   String(data[i][6] || ''),
        };
      }
    }
    return null;
  } catch (e) {
    console.error('getJobInfo_ error:', e);
    return null;
  }
}

function getJobFolder_(jobNumber) {
  try {
    const jobInfo = getJobInfo_(jobNumber);
    if (!jobInfo || !jobInfo.driveUrl) return null;

    // Extract folder ID from Drive URL
    const match = jobInfo.driveUrl.match(/[-\w]{25,}/);
    if (!match) return null;

    return DriveApp.getFolderById(match[0]);
  } catch (e) {
    console.error('getJobFolder_ error:', e);
    return null;
  }
}

function getOrCreatePhotosFolder_(jobNumber) {
  const jobFolder = getJobFolder_(jobNumber);

  if (jobFolder) {
    // Check for existing Photos subfolder
    const folders = jobFolder.getFoldersByName('Site Photos');
    if (folders.hasNext()) return folders.next();
    return jobFolder.createFolder('Site Photos');
  }

  // Fallback: create under CLIENTS_FOLDER root with job number prefix
  const root = DriveApp.getFolderById(CLIENTS_FOLDER);
  const name = jobNumber + ' — Site Photos';
  const existing = root.getFoldersByName(name);
  if (existing.hasNext()) return existing.next();
  return root.createFolder(name);
}
