// ============================================================
// TaskEngine.gs — HEA C2 automated task creation
// Called by service files after specific state transitions.
// ============================================================

var TASK_TRIGGERS_ = {
  OFFER_ACCEPTED:     'OFFER_ACCEPTED',
  ONBOARDING_CREATED: 'ONBOARDING_CREATED',
  PROBATION_WARNING:  'PROBATION_WARNING',
  DOCUMENT_EXPIRY:    'DOCUMENT_EXPIRY',
  DISCIPLINE_CREATED: 'DISCIPLINE_CREATED',
  OFFBOARDING_CREATED:'OFFBOARDING_CREATED'
};

/**
 * Create tasks based on a trigger event.
 * @param {string} trigger        One of TASK_TRIGGERS_
 * @param {string} entityType     e.g. 'CANDIDATE', 'PERSON'
 * @param {string} entityId       ID of the triggering entity
 * @param {Object} context        Additional data (name, lastDay, docType, etc.)
 */
function createTasksForTrigger_(trigger, entityType, entityId, context) {
  try {
    var ctx = context || {};
    var tasks = [];
    var dueBase = today_();

    switch (trigger) {

      case TASK_TRIGGERS_.OFFER_ACCEPTED:
        tasks = [
          { title: 'Create person record for ' + ctx.name, days: 1 },
          { title: 'Send employment contract to ' + ctx.name, days: 2 },
          { title: 'Schedule induction for ' + ctx.name, days: 3 },
          { title: 'Order PPE & tools for ' + ctx.name, days: 4 },
          { title: 'Set up payroll for ' + ctx.name, days: 5 }
        ];
        tasks.forEach(function(t) {
          taskCreate_({
            title: t.title,
            description: 'Auto-created: OFFER_ACCEPTED trigger',
            assigned_to: ctx.adminEmail || 'ADMIN',
            entity_type: entityType,
            entity_id: entityId,
            due_date: addDays_(dueBase, t.days),
            priority: 'HIGH',
            trigger_key: TASK_TRIGGERS_.OFFER_ACCEPTED
          }, 'SYSTEM');
        });
        break;

      case TASK_TRIGGERS_.ONBOARDING_CREATED:
        tasks = [
          { title: 'Send welcome email to ' + ctx.name, days: 1 },
          { title: 'Prepare workstation / kit for ' + ctx.name, days: 2 },
          { title: 'Assign buddy / supervisor to ' + ctx.name, days: 2 }
        ];
        tasks.forEach(function(t) {
          taskCreate_({
            title: t.title,
            description: 'Auto-created: ONBOARDING_CREATED trigger',
            assigned_to: ctx.adminEmail || 'ADMIN',
            entity_type: entityType,
            entity_id: entityId,
            due_date: addDays_(dueBase, t.days),
            priority: 'HIGH',
            trigger_key: TASK_TRIGGERS_.ONBOARDING_CREATED
          }, 'SYSTEM');
        });
        break;

      case TASK_TRIGGERS_.PROBATION_WARNING:
        taskCreate_({
          title: 'Schedule probation review for ' + ctx.name,
          description: 'Probation end date is ' + ctx.probationEndDate + '. Review due within 14 days.',
          assigned_to: ctx.supervisorId || ctx.adminEmail || 'ADMIN',
          entity_type: entityType,
          entity_id: entityId,
          due_date: ctx.probationEndDate || addDays_(dueBase, 7),
          priority: 'HIGH',
          trigger_key: TASK_TRIGGERS_.PROBATION_WARNING
        }, 'SYSTEM');
        break;

      case TASK_TRIGGERS_.DOCUMENT_EXPIRY:
        taskCreate_({
          title: 'Renew ' + (ctx.docType || 'document') + ' for ' + ctx.name,
          description: 'Document expires ' + ctx.expiryDate + '. Renew before expiry to avoid deployability BLOCKED.',
          assigned_to: ctx.supervisorId || ctx.adminEmail || 'ADMIN',
          entity_type: entityType,
          entity_id: entityId,
          due_date: ctx.expiryDate || addDays_(dueBase, 14),
          priority: 'MEDIUM',
          trigger_key: TASK_TRIGGERS_.DOCUMENT_EXPIRY
        }, 'SYSTEM');
        break;

      case TASK_TRIGGERS_.DISCIPLINE_CREATED:
        tasks = [
          { title: 'Arrange investigation meeting re: ' + ctx.name, days: 2 },
          { title: 'Notify relevant parties re: ' + ctx.name + ' (' + (ctx.category || 'Conduct') + ')', days: 3 }
        ];
        tasks.forEach(function(t) {
          taskCreate_({
            title: t.title,
            description: 'Auto-created: DISCIPLINE_CREATED trigger',
            assigned_to: ctx.adminEmail || 'ADMIN',
            entity_type: entityType,
            entity_id: entityId,
            due_date: addDays_(dueBase, t.days),
            priority: 'URGENT',
            trigger_key: TASK_TRIGGERS_.DISCIPLINE_CREATED
          }, 'SYSTEM');
        });
        break;

      case TASK_TRIGGERS_.OFFBOARDING_CREATED:
        var lastDay = ctx.lastDay || addDays_(dueBase, 14);
        tasks = [
          { title: 'Collect assets from ' + ctx.name, days: -1 },   // day before last day
          { title: 'Revoke system access for ' + ctx.name, days: 0 }, // on last day
          { title: 'Process final pay for ' + ctx.name, days: 7 },
          { title: 'Conduct exit interview with ' + ctx.name, days: -3 },
          { title: 'Issue reference letter for ' + ctx.name + ' (if eligible)', days: 14 }
        ];
        tasks.forEach(function(t) {
          taskCreate_({
            title: t.title,
            description: 'Auto-created: OFFBOARDING_CREATED trigger',
            assigned_to: ctx.adminEmail || 'ADMIN',
            entity_type: entityType,
            entity_id: entityId,
            due_date: addDays_(lastDay, t.days),
            priority: t.days <= 0 ? 'HIGH' : 'MEDIUM',
            trigger_key: TASK_TRIGGERS_.OFFBOARDING_CREATED
          }, 'SYSTEM');
        });
        break;
    }
  } catch (e) {
    console.error('TaskEngine error:', e.message, trigger);
  }
}
