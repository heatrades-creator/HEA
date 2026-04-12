// HEA Solar Analyser — https://hea-group.com.au
// REC 37307 — Jesse Heffernan, Bendigo VIC

// AdminTools.gs — Drive browser (admin PIN required), job folder creation

function getDriveFiles(adminPin) {
  // Explicit PIN gate — Session.getActiveUser() is unreliable in anonymous deployment
  if (!adminPin || adminPin !== getAdminPin()) {
    logAdminEvent('BAD_PIN', 'getDriveFiles called with wrong PIN', 'blocked');
    return { error: 'auth' };
  }
  logAdminEvent('DRIVE_BROWSE', 'getDriveFiles accessed', 'ok');
  try {
    const parent = DriveApp.getFolderById(CFG.FOLDER_ID);
    const items  = [];
    const subs   = parent.getFolders();
    while (subs.hasNext()) {
      const sub = subs.next();
      const fn  = sub.getName();
      const fls = sub.getFiles();
      while (fls.hasNext()) {
        const f  = fls.next();
        const nm = f.getName().toLowerCase();
        if (nm.endsWith('.csv') || nm.includes('interval') || nm.includes('nem12'))
          items.push({ id:f.getId(), name:f.getName(), folder:fn });
      }
    }
    return items.sort((a,b) => b.folder.localeCompare(a.folder));
  } catch(e) { return []; }
}

function getDriveFile(id, adminPin) {
  // Explicit PIN gate
  if (!adminPin || adminPin !== getAdminPin()) return null;
  try { return DriveApp.getFileById(id).getBlob().getDataAsString(); }
  catch(e) { return null; }
}

// ───────────────────────────────────────────
// PDF GENERATOR
// ───────────────────────────────────────────
// =============================================================================
// PROFESSIONAL REPORT — HEA Solar Assessment
// Clean executive summary PDF + HTML email
// =============================================================================

// =============================================================================
// WORLD-CLASS REPORT v2 — HEA Solar Assessment
// Design principles: breathe, tell a story, answer "when am I out of pocket?"
// PDF uses table-only layout (Google Docs HTML constraint)
// =============================================================================

// =============================================================================
// HEA SOLAR — WORLD CLASS PROPOSAL v3
// Structure mirrors HEA Quote Template + Aurora/Proposify best practices:
// P1: Cover (client, system, investment hero)
// P2: Financial summary (before/after, payback timeline, KPIs)
// P3: Investment breakdown + equations
// P4: 25yr projection + monthly data
// P5+: Technical hourly data
// P6: Terms & client acceptance
// =============================================================================
