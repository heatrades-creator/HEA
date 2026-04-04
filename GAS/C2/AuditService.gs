// ============================================================
// AuditService.gs — HEA C2 audit log writer
// Every state-changing operation must call log_() before return.
// ============================================================

/**
 * Write an audit log entry.
 * @param {Object} params
 * @param {string} params.entity_type   e.g. 'PERSON', 'CANDIDATE'
 * @param {string} params.entity_id
 * @param {string} params.action        e.g. 'CREATED', 'STATUS_CHANGED', 'FIELD_UPDATED'
 * @param {string} [params.field_name]
 * @param {string} [params.old_value]
 * @param {string} [params.new_value]
 * @param {string} params.actor         email of operator, or 'SYSTEM'
 * @param {string} [params.notes]
 */
function auditLog_(params) {
  try {
    var sheet = getSheet_('AUDIT_LOG');
    sheet.appendRow([
      uuid_(),
      now_(),
      params.entity_type || '',
      params.entity_id || '',
      params.action || '',
      params.field_name || '',
      params.old_value !== undefined ? String(params.old_value) : '',
      params.new_value !== undefined ? String(params.new_value) : '',
      params.actor || '',
      params.notes || ''
    ]);
  } catch (e) {
    // Audit failures must not break the caller — log to console only
    console.error('AuditLog write failed:', e.message);
  }
}

/**
 * Get all audit entries for a specific entity.
 * @param {string} entityType
 * @param {string} entityId
 * @returns {Object[]}
 */
function auditListForEntity_(entityType, entityId) {
  var sheet = getSheet_('AUDIT_LOG');
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  var headers = data[0];
  return data.slice(1)
    .filter(function(row) {
      return String(row[2]) === String(entityType) &&
             String(row[3]) === String(entityId);
    })
    .map(function(row) { return rowToObj_(headers, row); })
    .reverse(); // most recent first
}
