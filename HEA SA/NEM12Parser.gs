// HEA Solar Analyser — https://hea-group.com.au
// REC 37307 — Jesse Heffernan, Bendigo VIC

// NEM12Parser.gs — NEM12 interval data parser

function parseNEM12(csvText) {
  const lines = csvText.replace(/\r/g, '').split('\n').filter(l => l.trim());
  const days  = [];
  let nmi = '', meter = '';
  let estimatedDays = 0, substitutedDays = 0;
  // Channel tracking — only accept explicit import channels
  // NEM12 200 record fields: NMI[1], NMISuffix[2], MSATSid[3], NMIConfig[4], RegisterID[5],
  //   SerialNumber[6], MeterSerial[6], UOM[7], IntervalLength[8]
  let currentChannel = '';
  let useCurrentChannel = false;
  const seenChannels = {};   // all 200-record channels encountered
  let malformedRows  = 0;
  // Only accept known import suffixes — NOT uom='KWH' which could be any channel
  const IMPORT_SUFFIXES = new Set(['E1','B1','IMPORT','NET_IMPORT']);

  for (const line of lines) {
    const parts = line.split(',');
    const rec   = parts[0].trim();

    if (rec === '200') {
      nmi            = (parts[1] || '').trim();
      currentChannel = (parts[2] || '').trim().toUpperCase();  // NMISuffix
      meter          = (parts[6] || '').trim();
      // Track all seen channels for the validation summary
      seenChannels[currentChannel || 'DEFAULT'] = (seenChannels[currentChannel || 'DEFAULT'] || 0) + 1;
      // Accept: explicit import suffix, or no suffix (single-channel file → always accept)
      // Reject: explicit export/generation suffixes (B2=generation, E2=net export, K1=reactive)
      const EXPORT_SUFFIXES = new Set(['B2','E2','K1','Q1','NET_EXPORT','EXPORT']);
      if (EXPORT_SUFFIXES.has(currentChannel)) {
        useCurrentChannel = false;
      } else if (currentChannel === '' || IMPORT_SUFFIXES.has(currentChannel)) {
        // Prefer E1 over B1 if E1 already accepted — but accept B1 if no E1 seen
        useCurrentChannel = true;
      } else {
        // Unknown suffix — reject it by default (explicit allowlist only)
        // If this rejects ALL data, the two-pass fallback below will accept everything with a warning
        useCurrentChannel = false;
      }
    }

    if (rec === '300') {
      // Skip channels that are not import consumption
      if (!useCurrentChannel) continue;

      const ds = (parts[1] || '').trim();
      if (ds.length !== 8) { malformedRows++; continue; }  // invalid date — skip and count

      const yr = parseInt(ds.substring(0,4));
      const mo = parseInt(ds.substring(4,6));
      const dy = parseInt(ds.substring(6,8));
      // Validate date ranges (not just format length)
      if (yr < 2000 || yr > 2040 || mo < 1 || mo > 12 || dy < 1 || dy > 31) { malformedRows++; continue; }
      const dt = new Date(yr, mo-1, dy);

      // NEM12 hardening: validate raw field count BEFORE parsing
      // A valid 300 record needs: rec_type[0] + date[1] + 48 intervals[2..49] + quality_flag[50] = 51 minimum
      // Previously this check was AFTER building vals, so short rows were silently zero-filled.
      if (parts.length < 51) { malformedRows++; continue; }

      // Parse intervals and detect non-numeric values (NaN-before-coercion)
      const vals = [];
      let hasNaN = false;
      for (let i = 2; i <= 49; i++) {
        const raw = parts[i];
        const v   = parseFloat(raw);
        if (isNaN(v)) hasNaN = true;
        vals.push(isNaN(v) ? 0 : v);
      }
      // Reject rows with any non-numeric interval value
      if (hasNaN) { malformedRows++; continue; }
      // vals.length is guaranteed 48 here — no silent zero-fill possible

      // Quality flag: field index 50 — A=actual, E=estimated, S=substituted
      // NEM12 spec: quality method flag is after the 48 interval values
      const qFlag = (parts[50] || parts[49] || 'A').trim().toUpperCase().charAt(0);
      const isEstimated   = qFlag === 'E';
      const isSubstituted = qFlag === 'S';
      if (isEstimated)   estimatedDays++;
      if (isSubstituted) substitutedDays++;

      days.push({
        date:dt, year:yr, month:mo, day:dy, values:vals,
        estimated: isEstimated || isSubstituted,
        channel: currentChannel
      });
    }
  }
  // Two-pass fallback: if strict channel filtering rejected ALL data, re-parse accepting everything
  // This handles non-standard NEM12 files while surfacing a clear warning
  let fallbackUsed = false;
  if (days.length === 0 && lines.some(l => l.trim().startsWith('300'))) {
    fallbackUsed = true;
    let currentCh2 = 'FALLBACK';
    for (const line of lines) {
      const parts2 = line.split(',');
      const rec2   = parts2[0].trim();
      if (rec2 === '200') { currentCh2 = (parts2[2] || '').trim() || 'FALLBACK'; }
      if (rec2 === '300') {
        const ds2 = (parts2[1] || '').trim();
        if (ds2.length !== 8) { malformedRows++; continue; }
        const yr2 = parseInt(ds2.substring(0,4)), mo2 = parseInt(ds2.substring(4,6)), dy2 = parseInt(ds2.substring(6,8));
        const vals2 = [];
        for (let i2 = 2; i2 <= 49; i2++) vals2.push(parseFloat(parts2[i2]) || 0);
        if (vals2.length !== 48) { malformedRows++; continue; }
        const qf2 = (parts2[50] || parts2[49] || 'A').trim().toUpperCase().charAt(0);
        days.push({ date: new Date(yr2, mo2-1, dy2), year: yr2, month: mo2, day: dy2,
          values: vals2, estimated: qf2 === 'E' || qf2 === 'S', channel: currentCh2 });
      }
    }
  }

  // Build validation summary for UI display
  const usedChannels = [...new Set(days.map(d => d.channel).filter(Boolean))];
  const allSeenChannels = Object.keys(seenChannels);
  const skippedChannels = allSeenChannels.filter(ch => !usedChannels.includes(ch) && ch !== 'DEFAULT');

  return {
    nmi, meter, days, estimatedDays, substitutedDays,
    validationSummary: {
      chosen_channel:   usedChannels.join(', ') || 'default (single-channel)',
      all_channels:     allSeenChannels.join(', ') || 'none',
      skipped_channels: skippedChannels.join(', ') || 'none',
      days_accepted:    days.length,
      days_estimated:   estimatedDays,
      days_substituted: substitutedDays,
      malformed_rows:   malformedRows,
      fallback_used:    fallbackUsed,  // true = strict filtering rejected all data, accepted everything
    }
  };
}

// ───────────────────────────────────────────
// POSTCODE → SOLAR ZONE
// ───────────────────────────────────────────