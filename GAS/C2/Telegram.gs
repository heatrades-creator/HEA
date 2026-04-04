// ============================================================
// Telegram.gs — HEA C2 notification layer
// Silent-fail pattern — never breaks the caller.
// Same bot/chat as HEA Jobs (shared Script Properties).
// ============================================================

/**
 * Send a Telegram alert. Silently fails on any error.
 * @param {string} message  HTML-formatted Telegram message
 */
function sendTelegramAlert_(message) {
  try {
    var props = PropertiesService.getScriptProperties();
    var token = props.getProperty('TELEGRAM_BOT_TOKEN');
    var chatId = props.getProperty('TELEGRAM_CHAT_ID');
    if (!token || !chatId) return;

    UrlFetchApp.fetch(
      'https://api.telegram.org/bot' + token + '/sendMessage',
      {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML'
        }),
        muteHttpExceptions: true
      }
    );
  } catch (e) {
    // Silent fail — never throw from alert
  }
}

// ── C2 alert builders ───────────────────────────────────────

function alertNewHire_(name, employmentType, role) {
  sendTelegramAlert_(
    '👤 <b>NEW HIRE</b>\n' +
    '🧑 ' + name + '\n' +
    '💼 ' + employmentType + (role ? ' — ' + role : '')
  );
}

function alertStatusChange_(name, oldStatus, newStatus) {
  sendTelegramAlert_(
    '🔄 <b>PERSONNEL STATUS</b>\n' +
    '🧑 ' + name + '\n' +
    oldStatus + ' → <b>' + newStatus + '</b>'
  );
}

function alertDocExpiry_(name, docType, expiryDate) {
  sendTelegramAlert_(
    '⚠️ <b>DOCUMENT EXPIRY</b>\n' +
    '🧑 ' + name + '\n' +
    '📄 ' + docType + ' expires <b>' + expiryDate + '</b>'
  );
}

function alertDisciplineRaised_(name, category, severity) {
  sendTelegramAlert_(
    '🚨 <b>DISCIPLINE RAISED</b>\n' +
    '🧑 ' + name + '\n' +
    '📋 ' + category + ' / ' + severity
  );
}

function alertOffboarding_(name, reason, lastDay) {
  sendTelegramAlert_(
    '📤 <b>OFFBOARDING</b>\n' +
    '🧑 ' + name + '\n' +
    '📋 ' + reason + '\n' +
    '📅 Last day: <b>' + lastDay + '</b>'
  );
}

function alertNewCandidate_(name, roleApplied) {
  sendTelegramAlert_(
    '🎯 <b>NEW CANDIDATE</b>\n' +
    '🧑 ' + name + '\n' +
    '💼 ' + (roleApplied || 'Role not specified')
  );
}

function alertOfferAccepted_(name, roleApplied) {
  sendTelegramAlert_(
    '✅ <b>OFFER ACCEPTED</b>\n' +
    '🧑 ' + name + '\n' +
    '💼 ' + (roleApplied || 'Role not specified') + '\n' +
    '➡️ Onboarding tasks auto-created'
  );
}
