// ============================================================
// PermissionGuard.gs — HEA C2 permission enforcement
// Called at the top of every mutating service function.
// ============================================================

var PERMISSION_DEFAULTS_ = {
  role: 'READ_ONLY',
  can_write_people: false,
  can_write_discipline: false,
  can_write_finance: false,
  can_view_audit: false
};

/**
 * Get the permission profile for an email.
 * Admin email (from Script Properties) always gets full access.
 * Unknown emails default to READ_ONLY.
 * @param {string} email
 * @returns {Object}
 */
function permGetProfile_(email) {
  if (!email) return PERMISSION_DEFAULTS_;

  // Admin email from Script Properties always has full access
  var adminEmail = PropertiesService.getScriptProperties().getProperty('ADMIN_EMAIL') || '';
  if (email === adminEmail) {
    return {
      role: 'ADMIN',
      can_write_people: true,
      can_write_discipline: true,
      can_write_finance: true,
      can_view_audit: true
    };
  }

  try {
    var sheet = getSheet_('PERMISSION_PROFILE');
    var data = sheet.getDataRange().getValues();
    if (data.length < 2) return PERMISSION_DEFAULTS_;
    var headers = data[0];
    for (var i = 1; i < data.length; i++) {
      var row = rowToObj_(headers, data[i]);
      if (String(row.email).toLowerCase() === String(email).toLowerCase()) {
        return {
          role: row.role || 'READ_ONLY',
          can_write_people: row.can_write_people === true || row.can_write_people === 'TRUE',
          can_write_discipline: row.can_write_discipline === true || row.can_write_discipline === 'TRUE',
          can_write_finance: row.can_write_finance === true || row.can_write_finance === 'TRUE',
          can_view_audit: row.can_view_audit === true || row.can_view_audit === 'TRUE'
        };
      }
    }
  } catch (e) {
    // Sheet missing → default
  }

  return PERMISSION_DEFAULTS_;
}

/**
 * Assert that the actor has permission to perform an action.
 * Throws 'FORBIDDEN' if not permitted.
 * @param {string} actorEmail
 * @param {string} action  e.g. 'write_people', 'write_discipline', 'write_finance', 'view_audit'
 */
function permAssert_(actorEmail, action) {
  var profile = permGetProfile_(actorEmail);

  if (action === 'write_people' && !profile.can_write_people) {
    throw new Error('FORBIDDEN: insufficient permission for ' + action);
  }
  if (action === 'write_discipline' && !profile.can_write_discipline) {
    throw new Error('FORBIDDEN: insufficient permission for ' + action);
  }
  if (action === 'write_finance' && !profile.can_write_finance) {
    throw new Error('FORBIDDEN: insufficient permission for ' + action);
  }
  if (action === 'view_audit' && !profile.can_view_audit) {
    throw new Error('FORBIDDEN: insufficient permission for ' + action);
  }
}
