/**
 * HEA Battery Install Photo Portal — Google Apps Script
 * ======================================================
 * Clients upload photos of their switchboard and 3 proposed battery/inverter
 * locations. Each battery location photo is analysed by Claude (claude-opus-4-6)
 * for AS/NZS 5139:2019+A1:2025 location compliance before the install team visits.
 *
 * Deploy as Web App:
 *   Execute as: Me (hea.trades@gmail.com)
 *   Who has access: Anyone (anonymous)
 *
 * Script Properties required:
 *   ANTHROPIC_API_KEY  — Anthropic Claude API key
 */

// ── Config ──────────────────────────────────────────────────────────────────
// Standalone web app — cannot use getActiveSpreadsheet(). Set JOBS_SHEET_ID
// in Project Settings → Script properties (value = the HEA Jobs spreadsheet ID).
const JOBS_SHEET_ID   = PropertiesService.getScriptProperties().getProperty('JOBS_SHEET_ID') || '';
const JOBS_SHEET_NAME = 'HEA Jobs';
const CLIENTS_FOLDER  = '12LCs9uDYh4Wynor0LdDelNbcQDe7c-C-';

// ── Entry point ──────────────────────────────────────────────────────────────

function doGet(e) {
  const jobNumber = (e && e.parameter && e.parameter.jobNumber)
    ? e.parameter.jobNumber.trim()
    : '';
  const service = (e && e.parameter && e.parameter.service)
    ? e.parameter.service.trim()
    : '';

  const template = HtmlService.createTemplateFromFile('Index');
  template.jobNumber  = jobNumber;
  template.service    = service;
  template.jobInfo    = jobNumber ? getJobInfo_(jobNumber) : null;
  template.categories = JSON.stringify(getCategoriesForService_(service));

  return template.evaluate()
    .setTitle('HEA — Site Photos')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// ── Service-specific photo categories ────────────────────────────────────────

function getCategoriesForService_(service) {
  var s = (service || '').toLowerCase();
  var isBattery = s.includes('battery');
  var isSolar   = s.includes('solar');
  var isEV      = s.includes('ev') || s.includes('charger');

  var cats = [];

  // Switchboard — always first, always required
  cats.push({
    id:              'switchboard',
    label:           'Main Switchboard',
    instruction:     'Open the switchboard door and photograph all circuit breakers and labels. Then take a photo of the closed door.',
    required:        true,
    checkCompliance: false,
    section:         'switchboard',
  });

  // Solar roof photos — only if solar was requested
  if (isSolar) {
    cats.push({
      id:              'roof_overview',
      label:           'Full Roof View',
      instruction:     'Step back and photograph the full face of the roof where panels would go. If there are multiple roof faces, take one photo of each.',
      required:        true,
      checkCompliance: false,
      section:         'roof',
    });
    cats.push({
      id:              'roof_detail',
      label:           'Roof Material Close-Up',
      instruction:     'A close-up of your roof surface — tiles, Colorbond, metal sheeting, etc. We need this to confirm the right mounting method.',
      required:        true,
      checkCompliance: false,
      section:         'roof',
    });
    cats.push({
      id:              'proposed_panel_area',
      label:           'Where You Want the Panels',
      instruction:     'Show the section of roof you are thinking of for the panels. Step back enough to show any vents, pipes, or skylights nearby.',
      required:        true,
      checkCompliance: false,
      section:         'roof',
    });
    cats.push({
      id:              'existing_inverter',
      label:           'Existing Solar (If You Have It)',
      instruction:     'If you already have solar panels, photograph the inverter box on the wall and the panels on the roof. Skip this one if you don\'t have any yet.',
      required:        false,
      checkCompliance: false,
      section:         'roof',
    });
  }

  // Battery location photos (with AS/NZS 5139 compliance check)
  if (isBattery) {
    cats.push({
      id:              'battery_location_1',
      label:           'Proposed Location 1',
      instruction:     'Step back so the full wall is in frame. Include anything nearby — windows, doors, hot water system, and the ceiling above.',
      required:        true,
      checkCompliance: true,
      section:         'battery',
    });
    cats.push({
      id:              'battery_location_2',
      label:           'Proposed Location 2',
      instruction:     'Step back so the full wall is in frame. Include anything nearby — windows, doors, hot water system, and the ceiling above.',
      required:        false,
      checkCompliance: true,
      section:         'battery',
    });
    cats.push({
      id:              'battery_location_3',
      label:           'Proposed Location 3',
      instruction:     'Step back so the full wall is in frame. Include anything nearby — windows, doors, hot water system, and the ceiling above.',
      required:        false,
      checkCompliance: true,
      section:         'battery',
    });
    // Additional site photos for battery installs
    cats.push({
      id:              'meter_box',
      label:           'Your Electricity Meter',
      instruction:     'Photo of the electricity meter box — usually on an outside wall. Include the meter number label if you can see it.',
      required:        false,
      checkCompliance: false,
      section:         'site',
    });
    cats.push({
      id:              'outside_wall',
      label:           'Outside Wall Near Battery Location',
      instruction:     'Step outside and photograph the exterior wall closest to where the battery would sit.',
      required:        false,
      checkCompliance: false,
      section:         'site',
    });
  }

  // EV charger photos — only if EV was requested
  if (isEV) {
    cats.push({
      id:              'ev_charger_location',
      label:           'Where You Want the Charger',
      instruction:     'Photo of the wall or area where you\'d like the EV charger installed — garage wall, carport, outside wall, etc. Step back to show the full space.',
      required:        true,
      checkCompliance: false,
      section:         'ev',
    });
    cats.push({
      id:              'ev_second_angle',
      label:           'Second View (Optional)',
      instruction:     'Another angle of the same area — useful if the space is tight or you want to show what\'s nearby.',
      required:        false,
      checkCompliance: false,
      section:         'ev',
    });
  }

  // Fallback if service not recognised
  if (!isSolar && !isBattery && !isEV) {
    cats.push({
      id:              'proposed_location_1',
      label:           'Proposed Installation Area',
      instruction:     'Photo of where the equipment will be installed. Step back to show the full area and what\'s nearby.',
      required:        true,
      checkCompliance: false,
      section:         'general',
    });
    cats.push({
      id:              'proposed_location_2',
      label:           'Second Angle',
      instruction:     'Another view of the same area from a different direction.',
      required:        false,
      checkCompliance: false,
      section:         'general',
    });
  }

  return cats;
}
      checkCompliance: false,
      section:         'roof',
    });
    cats.push({
      id:              'existing_inverter',
      label:           'Existing Inverter (if present)',
      instruction:     'If there is an existing solar inverter, photograph the full unit including the model/label plate.',
      required:        false,
      checkCompliance: false,
      section:         'roof',
    });
  }

  // Battery location photos (with AS/NZS 5139 compliance check)
  if (isBattery) {
    cats.push({
      id:              'battery_location_1',
      label:           'Proposed Location 1',
      instruction:     'Stand back so the full wall and surrounding area is visible. Include any nearby windows, doors, hot water unit, and the ceiling above.',
      required:        true,
      checkCompliance: true,
      section:         'battery',
    });
    cats.push({
      id:              'battery_location_2',
      label:           'Proposed Location 2',
      instruction:     'Stand back so the full wall and surrounding area is visible. Include any nearby windows, doors, hot water unit, and the ceiling above.',
      required:        false,
      checkCompliance: true,
      section:         'battery',
    });
    cats.push({
      id:              'battery_location_3',
      label:           'Proposed Location 3',
      instruction:     'Stand back so the full wall and surrounding area is visible. Include any nearby windows, doors, hot water unit, and the ceiling above.',
      required:        false,
      checkCompliance: true,
      section:         'battery',
    });
  }

  // EV charger photos
  if (isEV) {
    cats.push({
      id:              'ev_charger_location',
      label:           'Proposed EV Charger Location',
      instruction:     'Photo of where you want the charger installed — garage wall, outside wall, etc. Step back to show the full area around it.',
      required:        true,
      checkCompliance: false,
      section:         'ev',
    });
    cats.push({
      id:              'ev_cable_path',
      label:           'Cable Path to Switchboard',
      instruction:     'Show the route from the proposed charger location back to the switchboard.',
      required:        false,
      checkCompliance: false,
      section:         'ev',
    });
  }

  // Fallback if service not recognised
  if (!isSolar && !isBattery && !isEV) {
    cats.push({
      id:              'proposed_location',
      label:           'Proposed Installation Area',
      instruction:     'Photo of where the equipment will be installed. Step back to show the full area.',
      required:        true,
      checkCompliance: false,
      section:         'general',
    });
  }

  return cats;
}

// ── Client-callable functions ────────────────────────────────────────────────

/**
 * Upload a photo and, for battery location slots, run AS/NZS 5139 compliance check.
 * Called via google.script.run from Index.html.
 * Returns { success, fileId, fileUrl, filename, compliance? } or { success: false, error }
 */
function uploadPhotoWithCheck(jobNumber, categoryId, base64Data, mimeType, originalName) {
  try {
    if (!jobNumber)  throw new Error('Job number required');
    if (!base64Data) throw new Error('No image data received');

    // Strip data-URL prefix (data:image/jpeg;base64,...)
    const cleanBase64 = base64Data.replace(/^data:[^;]+;base64,/, '');

    // Decode and save to Drive
    const decoded = Utilities.base64Decode(cleanBase64);
    const blob    = Utilities.newBlob(
      decoded,
      mimeType || 'image/jpeg',
      originalName || (categoryId + '.jpg')
    );

    const photosFolder = getOrCreatePhotosFolder_(jobNumber);
    const timestamp    = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename     = categoryId.replace(/_/g, '-') + '_' + timestamp + '_' + (originalName || 'photo.jpg');
    blob.setName(filename);

    const file = photosFolder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    const result = {
      success:  true,
      fileId:   file.getId(),
      fileUrl:  file.getUrl(),
      filename: filename,
    };

    // Run compliance check for battery location photos (identified by ID prefix)
    if (categoryId.startsWith('battery_location')) {
      const compliance = checkBatteryCompliance_(cleanBase64, mimeType || 'image/jpeg');
      result.compliance = compliance;
      saveComplianceResult_(photosFolder, categoryId, compliance);
    }

    return result;
  } catch (err) {
    console.error('uploadPhotoWithCheck error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Generate an installer Google Doc with all photos and compliance results.
 * Called via google.script.run after all photos are uploaded.
 * Returns { success: true, docUrl } or { success: false, error }
 */
function generateAsBuilts(jobNumber) {
  try {
    if (!jobNumber) throw new Error('Job number required');

    const jobInfo      = getJobInfo_(jobNumber);
    const photosFolder = getOrCreatePhotosFolder_(jobNumber);
    const jobFolder    = getJobFolder_(jobNumber);

    const docName = 'Site Photos — ' + jobNumber +
                    (jobInfo ? ' — ' + jobInfo.clientName : '');
    const doc  = DocumentApp.create(docName);
    const body = doc.getBody();

    // ── Header ───────────────────────────────────────────────────────────────
    const h1 = body.appendParagraph('HEA Group — Site Photos');
    h1.setHeading(DocumentApp.ParagraphHeading.HEADING1);

    body.appendParagraph('Job: ' + jobNumber).setAttributes({
      [DocumentApp.Attribute.BOLD]:      true,
      [DocumentApp.Attribute.FONT_SIZE]: 14,
    });

    if (jobInfo) {
      body.appendParagraph('Client: '  + jobInfo.clientName);
      body.appendParagraph('Address: ' + jobInfo.address);
      body.appendParagraph('Phone: '   + jobInfo.phone);
    }

    body.appendParagraph(
      'Generated: ' + new Date().toLocaleString('en-AU', { timeZone: 'Australia/Melbourne' })
    );
    body.appendHorizontalRule();

    // ── Load photos and compliance results ───────────────────────────────────
    const filesByCategory  = loadPhotosByCategory_(photosFolder);
    const complianceByCategory = loadComplianceResults_(photosFolder);

    // ── Switchboard section ──────────────────────────────────────────────────
    body.appendParagraph('Switchboard').setHeading(DocumentApp.ParagraphHeading.HEADING2);
    const swFiles = filesByCategory['switchboard'] || [];
    if (swFiles.length === 0) {
      body.appendParagraph('— No switchboard photo uploaded —').setAttributes({
        [DocumentApp.Attribute.FOREGROUND_COLOR]: '#999999',
      });
    } else {
      embedPhotos_(body, swFiles);
    }
    body.appendHorizontalRule();

    // ── All non-switchboard categories (dynamic based on what was uploaded) ──
    // Build an ordered list of section headings + category IDs from what's in Drive
    var SECTION_LABELS = {
      roof:     'Roof',
      battery:  'Proposed Battery / Inverter Locations',
      site:     'Site Overview',
      ev:       'EV Charger Location',
      general:  'Installation Area',
    };
    var CAT_LABELS = {
      roof_overview:        'Full Roof View',
      roof_detail:          'Roof Material Close-Up',
      proposed_panel_area:  'Where You Want the Panels',
      existing_inverter:    'Existing Solar',
      battery_location_1:   'Proposed Location 1',
      battery_location_2:   'Proposed Location 2',
      battery_location_3:   'Proposed Location 3',
      meter_box:            'Electricity Meter',
      outside_wall:         'Outside Wall Near Battery',
      ev_charger_location:  'Where You Want the Charger',
      ev_second_angle:      'Second View',
      proposed_location_1:  'Proposed Installation Area',
      proposed_location_2:  'Second Angle',
    };

    // Determine which non-switchboard categories have content
    var allCatIds = Object.keys(filesByCategory).concat(Object.keys(complianceByCategory));
    var seen = {};
    var orderedCats = [];
    allCatIds.forEach(function(id) {
      if (id !== 'switchboard' && !seen[id]) {
        seen[id] = true;
        orderedCats.push(id);
      }
    });
    orderedCats.sort();

    if (orderedCats.length > 0) {
      orderedCats.forEach(function(catId) {
        var catLabel = CAT_LABELS[catId] || catId;
        body.appendParagraph(catLabel).setHeading(DocumentApp.ParagraphHeading.HEADING2);

        // Compliance result (battery locations only)
        if (catId.startsWith('battery_location')) {
          var cr = complianceByCategory[catId];
          if (cr && !cr.error) {
            var overall = cr.overall_result || 'needs_manual_review';
            var icon    = overall === 'pass' ? '✅' : overall === 'fail' ? '❌' : '⚠️';
            var verdict = overall === 'pass' ? 'COMPLIANT' : overall === 'fail' ? 'NON-COMPLIANT' : 'NEEDS REVIEW';
            var colour  = overall === 'pass' ? '#16a34a' : overall === 'fail' ? '#dc2626' : '#d97706';

            body.appendParagraph(icon + '  AS/NZS 5139 Result: ' + verdict).setAttributes({
              [DocumentApp.Attribute.BOLD]:             true,
              [DocumentApp.Attribute.FOREGROUND_COLOR]: colour,
            });
            if (cr.location_description) {
              body.appendParagraph(cr.location_description).setAttributes({
                [DocumentApp.Attribute.ITALIC]:           true,
                [DocumentApp.Attribute.FOREGROUND_COLOR]: '#555555',
              });
            }
            var s = cr.summary || {};
            body.appendParagraph(
              'Fails: ' + (s.hard_fail_count || 0) +
              '   Needs review: ' + (s.manual_review_count || 0) +
              '   Pass: ' + (s.pass_count || 0)
            ).setAttributes({ [DocumentApp.Attribute.FONT_SIZE]: 10 });
            (cr.checks || []).forEach(function(check) {
              if (check.result === 'fail' || check.result === 'needs_manual_review') {
                var prefix = check.result === 'fail' ? '❌  ' : '⚠️  ';
                var clr    = check.result === 'fail' ? '#dc2626' : '#d97706';
                body.appendParagraph(prefix + check.rule_id + ': ' + check.reason).setAttributes({
                  [DocumentApp.Attribute.FONT_SIZE]:        10,
                  [DocumentApp.Attribute.FOREGROUND_COLOR]: clr,
                });
              }
            });
          } else if (cr && cr.error) {
            body.appendParagraph('⚠️  Compliance check unavailable: ' + cr.error).setAttributes({
              [DocumentApp.Attribute.FOREGROUND_COLOR]: '#d97706',
            });
          }
        }

        // Photos for this category
        var locFiles = filesByCategory[catId] || [];
        if (locFiles.length === 0) {
          body.appendParagraph('— No photo uploaded —').setAttributes({
            [DocumentApp.Attribute.FOREGROUND_COLOR]: '#999999',
          });
        } else {
          embedPhotos_(body, locFiles);
        }
        body.appendHorizontalRule();
      });
    }

    // ── Installer notes ──────────────────────────────────────────────────────
    body.appendParagraph('Installer Notes').setHeading(DocumentApp.ParagraphHeading.HEADING2);
    body.appendParagraph('Preferred location: ____________________');
    body.appendParagraph('');
    body.appendParagraph('Site notes:');
    body.appendParagraph('\n\n\n');
    body.appendParagraph('Surveyed by: ____________________   Date: ________________');

    doc.saveAndClose();

    // Move doc to job folder
    const docFile = DriveApp.getFileById(doc.getId());
    if (jobFolder) {
      jobFolder.addFile(docFile);
      DriveApp.getRootFolder().removeFile(docFile);
    }
    docFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    return { success: true, docUrl: docFile.getUrl(), docId: doc.getId() };
  } catch (err) {
    console.error('generateAsBuilts error:', err);
    return { success: false, error: err.message };
  }
}

// ── AS/NZS 5139 compliance check ────────────────────────────────────────────

function checkBatteryCompliance_(base64, mimeType) {
  try {
    const apiKey = PropertiesService.getScriptProperties().getProperty('ANTHROPIC_API_KEY');
    if (!apiKey) {
      return {
        error:          'ANTHROPIC_API_KEY not configured in Script Properties',
        overall_result: 'needs_manual_review',
        asset_type:     'integrated_bess',
        checks:         [],
        summary:        { hard_fail_count: 0, manual_review_count: 1, pass_count: 0 },
        location_description: 'Compliance check not available — API key not configured.',
      };
    }

    const payload = {
      model:      'claude-opus-4-6',
      max_tokens: 2000,
      system:     buildCompliancePrompt_(),
      messages: [{
        role:    'user',
        content: [
          {
            type:   'image',
            source: { type: 'base64', media_type: mimeType, data: base64 },
          },
          {
            type: 'text',
            text: 'Assess this proposed battery/inverter installation location for AS/NZS 5139 compliance. Output strict JSON only.',
          },
        ],
      }],
    };

    const response = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
      method:             'post',
      headers: {
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
        'content-type':      'application/json',
      },
      payload:             JSON.stringify(payload),
      muteHttpExceptions:  true,
    });

    const code     = response.getResponseCode();
    const bodyText = response.getContentText();

    if (code !== 200) {
      console.error('Anthropic API error ' + code + ':', bodyText);
      return {
        error:          'api_error_' + code,
        overall_result: 'needs_manual_review',
        asset_type:     'integrated_bess',
        checks:         [],
        summary:        { hard_fail_count: 0, manual_review_count: 1, pass_count: 0 },
        location_description: 'Compliance check could not be completed (API error ' + code + ').',
      };
    }

    const data    = JSON.parse(bodyText);
    const content = data.content && data.content[0] && data.content[0].text;
    if (!content) {
      return {
        error:          'empty_response',
        overall_result: 'needs_manual_review',
        asset_type:     'integrated_bess',
        checks:         [],
        summary:        { hard_fail_count: 0, manual_review_count: 1, pass_count: 0 },
        location_description: 'Compliance check returned no content.',
      };
    }

    // Strip accidental markdown fences
    const jsonText = content.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
    return JSON.parse(jsonText);

  } catch (err) {
    console.error('checkBatteryCompliance_ error:', err);
    return {
      error:          err.message,
      overall_result: 'needs_manual_review',
      asset_type:     'integrated_bess',
      checks:         [],
      summary:        { hard_fail_count: 0, manual_review_count: 1, pass_count: 0 },
      location_description: 'Compliance check failed: ' + err.message,
    };
  }
}

function buildCompliancePrompt_() {
  return [
    'You are a compliance assessor reviewing a photo of a proposed home battery/inverter installation location.',
    'You are checking eligibility under AS/NZS 5139:2019+A1:2025.',
    '',
    'Asset type for all checks: integrated_bess',
    '(This covers integrated battery + inverter units such as Tesla Powerwall, Alpha-ESS, Sungrow SBH, etc.)',
    '',
    'OUTPUT: Strict JSON only. No markdown. No text before or after the JSON object.',
    '',
    'DECISION VALUES: "pass" | "fail" | "needs_manual_review"',
    '',
    '── HARD FAIL — return "fail" if clearly visible in the photo ──',
    '',
    'BAT-001  Location is a habitable room.',
    '         Habitable rooms include: bedroom, living room, lounge, kitchen, dining room,',
    '         study, family room, home theatre, sunroom.',
    '',
    'BAT-002  Location is in a ceiling space.',
    '',
    'BAT-003  Location is in a wall cavity.',
    '         Exception: pass if the recess is clearly fully sealed from the cavity with',
    '         non-combustible material.',
    '',
    'BAT-005  Under a stairway.',
    '',
    'BAT-006  Under an access walkway.',
    '',
    'BAT-007  In an evacuation or escape route.',
    '',
    'BAT-009  Clearly within 600 mm of an exit/door.',
    '         Exception → needs_manual_review (not fail) if the opening is visibly wider',
    '         than 900 mm AND there appears to be at least 1 m clearance from where the',
    '         unit front/side would sit.',
    '',
    'BAT-010  Clearly within 600 mm of a window or ventilation opening that serves a habitable room.',
    '',
    'BAT-011  Clearly within 600 mm of a hot water unit, air conditioner, or other appliance',
    '         not associated with the battery system.',
    '         IMPORTANT EXCEPTION: a solar inverter or PCE that charges the BESS is an',
    '         associated appliance — proximity to it does NOT trigger BAT-011.',
    '',
    'BAT-012  Clearly within 900 mm below an exit, habitable-room window/vent, or',
    '         non-associated appliance (hot water unit, AC, etc.).',
    '',
    'BAT-015  Obvious vehicle impact risk — e.g. the wall is directly in the car parking',
    '         path inside a garage with no visible protection barrier.',
    '',
    'BAT-016  Visible hazardous area indicators (petrol/chemical storage, explosive-atmosphere signage).',
    '',
    'BAT-017  Near a heavier-than-air gas cylinder (LPG, CO2) or gas relief vent terminal.',
    '',
    '── NEEDS_MANUAL_REVIEW — return "needs_manual_review" where the photo cannot confirm ──',
    '',
    'BAT-013  Installation appears to be in a corridor, hallway or lobby — cannot confirm',
    '         1 m front/side clearance from photo alone.',
    '',
    'BAT-014  Cannot confirm adequate service and maintenance access from photo.',
    '',
    'BAT-018  Outdoor or semi-outdoor location — cannot confirm IP23 minimum enclosure rating.',
    '',
    'BAT-019  Cannot confirm IP2X minimum enclosure rating from photo.',
    '',
    'BAT-020  Location appears to receive direct sunlight or weather exposure.',
    '',
    'BAT-021  Visible signs of moisture, high humidity, dust accumulation, or vermin risk.',
    '',
    'BAT-022  Possible localised heat source nearby (uninsulated pipes, generator, HWS exhaust, etc.).',
    '',
    'BAT-023  Cannot confirm whether the wall behind has a habitable room on the other side',
    '         (non-combustible barrier may be required).',
    '',
    'BAT-024  Barrier extent dimensions (600 mm sides, 900 mm above) cannot be confirmed.',
    '',
    'BAT-025  Structural adequacy of wall or floor for the unit weight cannot be confirmed.',
    '',
    '── PASS — return "pass" if the rule is clearly satisfied or clearly not applicable ──',
    '',
    'SUITABLE LOCATIONS per AS/NZS 5139 (for context):',
    'Garage (with vehicle impact protection if car parks nearby), storage room, veranda,',
    'dedicated battery/utility room.',
    '',
    '── REQUIRED JSON OUTPUT FORMAT ──',
    '',
    '{',
    '  "overall_result": "pass | fail | needs_manual_review",',
    '  "asset_type": "integrated_bess",',
    '  "checks": [',
    '    {',
    '      "rule_id": "BAT-001",',
    '      "result": "pass | fail | needs_manual_review",',
    '      "observed_data": {',
    '        "visible_evidence": "brief description of what you can see",',
    '        "estimated_measurement": "e.g. approx 800 mm  or  unknown",',
    '        "confidence": "low | medium | high"',
    '      },',
    '      "reason": "one sentence explanation",',
    '      "clause_refs": ["5.2.2"]',
    '    }',
    '  ],',
    '  "summary": {',
    '    "hard_fail_count": 0,',
    '    "manual_review_count": 0,',
    '    "pass_count": 0',
    '  },',
    '  "location_description": "1-2 sentences describing what the photo shows."',
    '}',
    '',
    'Include ALL applicable rules BAT-001 through BAT-025.',
    'Overall result logic:',
    '  "fail"               if any check result is "fail"',
    '  "needs_manual_review" if no fails but any check result is "needs_manual_review"',
    '  "pass"               only if every check result is "pass"',
    '',
    'Only assess what is visible or reasonably inferable.',
    'Do not invent measurements — use "unknown" if a distance cannot be estimated.',
    'Output JSON only.',
  ].join('\n');
}

// ── Drive helpers ────────────────────────────────────────────────────────────

function saveComplianceResult_(photosFolder, categoryId, compliance) {
  try {
    const resultName = categoryId + '-compliance.json';
    const existing   = photosFolder.getFilesByName(resultName);
    while (existing.hasNext()) existing.next().setTrashed(true);

    const blob = Utilities.newBlob(
      JSON.stringify(compliance, null, 2),
      'application/json',
      resultName
    );
    const file = photosFolder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (err) {
    console.error('saveComplianceResult_ error:', err);
  }
}

function loadComplianceResults_(photosFolder) {
  const results = {};
  try {
    const files = photosFolder.getFiles();
    while (files.hasNext()) {
      const f    = files.next();
      const name = f.getName();
      if (!name.endsWith('-compliance.json')) continue;
      const catId = name.replace('-compliance.json', '');
      try {
        results[catId] = JSON.parse(f.getBlob().getDataAsString());
      } catch (e) {
        console.error('Failed to parse compliance JSON:', name, e);
      }
    }
  } catch (err) {
    console.error('loadComplianceResults_ error:', err);
  }
  return results;
}

function loadPhotosByCategory_(photosFolder) {
  var map = {};
  try {
    var files = photosFolder.getFiles();
    while (files.hasNext()) {
      var f    = files.next();
      var name = f.getName();
      if (name.endsWith('.json')) continue;
      // Filename format: {catId-with-dashes}_{timestamp}_{original}
      // e.g. battery-location-1_2024-01-15T12-30-00_photo.jpg
      var firstUnderscore = name.indexOf('_');
      if (firstUnderscore > 0) {
        var catIdDashed = name.substring(0, firstUnderscore);
        var catId = catIdDashed.replace(/-/g, '_');
        if (!map[catId]) map[catId] = [];
        map[catId].push(f);
      }
    }
  } catch (err) {
    console.error('loadPhotosByCategory_ error:', err);
  }
  return map;
}

function embedPhotos_(body, files) {
  files.forEach(function(f) {
    try {
      const img = body.appendImage(f.getBlob());
      if (img.getWidth() > 400) {
        const ratio = 400 / img.getWidth();
        img.setWidth(400);
        img.setHeight(Math.round(img.getHeight() * ratio));
      }
      body.appendParagraph(f.getName()).setAttributes({
        [DocumentApp.Attribute.FONT_SIZE]:        9,
        [DocumentApp.Attribute.FOREGROUND_COLOR]: '#888888',
      });
    } catch (imgErr) {
      body.appendParagraph('[Image could not be embedded: ' + f.getName() + ']');
    }
  });
}

// ── Job helpers ──────────────────────────────────────────────────────────────

function getJobInfo_(jobNumber) {
  try {
    const ss    = SpreadsheetApp.openById(JOBS_SHEET_ID);
    const sheet = ss.getSheetByName(JOBS_SHEET_NAME);
    if (!sheet) return null;

    const data = sheet.getDataRange().getValues();
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
    const folders = jobFolder.getFoldersByName('Site Photos');
    if (folders.hasNext()) return folders.next();
    return jobFolder.createFolder('Site Photos');
  }

  // Fallback: create under CLIENTS_FOLDER root
  const root     = DriveApp.getFolderById(CLIENTS_FOLDER);
  const name     = jobNumber + ' — Site Photos';
  const existing = root.getFoldersByName(name);
  if (existing.hasNext()) return existing.next();
  return root.createFolder(name);
}
