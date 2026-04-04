// ============================================================
// Code.gs — HEA C2 Command & Control Web App
// doGet / doPost router
//
// Deploy as Web App:
//   Execute as: Me
//   Who has access: Anyone
//
// All GET requests: ?action=X&param=Y
// All POST requests: JSON body with { action: 'X', ...fields }
// ============================================================

function doGet(e) {
  var params = e.parameter || {};
  var action = params.action || '';

  try {
    switch (action) {

      // ── Bootstrap ───────────────────────────────────────────
      case 'bootstrap':
        return jsonResponse_(createAllSheets_());

      // ── Overview ────────────────────────────────────────────
      case 'getOverview':
        return jsonResponse_(getOverview_());

      // ── People ──────────────────────────────────────────────
      case 'listPeople':
        return jsonResponse_(personListAll_());

      case 'getPerson':
        if (!params.id) return jsonError_('id required');
        var person = personGetById_(params.id);
        if (!person) return jsonError_('Not found', 404);
        return jsonResponse_(person);

      // ── Units ───────────────────────────────────────────────
      case 'listUnits':
        return jsonResponse_(unitListAll_());

      case 'listRoles':
        return jsonResponse_(roleListAll_());

      case 'listRanks':
        return jsonResponse_(rankListAll_());

      // ── Candidates ──────────────────────────────────────────
      case 'listCandidates':
        return jsonResponse_(candidateListAll_());

      case 'getCandidate':
        if (!params.id) return jsonError_('id required');
        var cand = candidateGetById_(params.id);
        if (!cand) return jsonError_('Not found', 404);
        return jsonResponse_(cand);

      // ── Onboarding ──────────────────────────────────────────
      case 'listOnboarding':
        return jsonResponse_(onboardingListAll_());

      // ── Documents ───────────────────────────────────────────
      case 'listDocuments':
        return jsonResponse_(documentListAll_(params.person_id || null));

      case 'runDocumentExpiryCheck':
        return jsonResponse_(runDocumentExpiryCheck_());

      // ── Training / Capabilities ─────────────────────────────
      case 'listTraining':
        return jsonResponse_(trainingListAll_(params.person_id || null));

      case 'listCapabilities':
        return jsonResponse_(capabilityListAll_(params.person_id || null));

      // ── Discipline ──────────────────────────────────────────
      case 'listDiscipline':
        return jsonResponse_(disciplineListAll_());

      case 'listPips':
        return jsonResponse_(pipListAll_());

      // ── Offboarding ─────────────────────────────────────────
      case 'listOffboarding':
        return jsonResponse_(offboardingListAll_());

      // ── Assets ──────────────────────────────────────────────
      case 'listAssets':
        return jsonResponse_(assetListAll_());

      // ── Tasks ───────────────────────────────────────────────
      case 'listTasks': {
        var filters = {};
        if (params.assigned_to) filters.assigned_to = params.assigned_to;
        if (params.status) filters.status = params.status;
        if (params.entity_id) filters.entity_id = params.entity_id;
        return jsonResponse_(taskListAll_(filters));
      }

      // ── Audit ───────────────────────────────────────────────
      case 'listAudit':
        if (!params.entity_type || !params.entity_id) return jsonError_('entity_type and entity_id required');
        return jsonResponse_(auditListForEntity_(params.entity_type, params.entity_id));

      // ── Permissions ─────────────────────────────────────────
      case 'getPermission':
        if (!params.email) return jsonError_('email required');
        return jsonResponse_(permGetProfile_(params.email));

      default:
        return jsonError_('Unknown action: ' + action);
    }
  } catch (err) {
    if (String(err.message).indexOf('FORBIDDEN') === 0) {
      return jsonError_(err.message, 403);
    }
    return jsonError_(err.message, 500);
  }
}

function doPost(e) {
  var body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (parseErr) {
    return jsonError_('Invalid JSON body', 400);
  }

  var action = body.action || '';
  var actor = body.actor || 'UNKNOWN';

  try {
    switch (action) {

      // ── People ──────────────────────────────────────────────
      case 'createPerson':
        return jsonResponse_(personCreate_(body, actor));

      case 'updatePerson':
        if (!body.id) return jsonError_('id required');
        return jsonResponse_(personUpdate_(body.id, body, actor));

      case 'transitionPersonStatus':
        if (!body.id || !body.status) return jsonError_('id and status required');
        return jsonResponse_(personTransitionStatus_(body.id, body.status, actor));

      // ── Units / Roles / Ranks ───────────────────────────────
      case 'createUnit':
        return jsonResponse_(unitCreate_(body, actor));

      case 'updateUnit':
        if (!body.id) return jsonError_('id required');
        return jsonResponse_(unitUpdate_(body.id, body, actor));

      case 'createRole':
        return jsonResponse_(roleCreate_(body, actor));

      case 'createRank':
        return jsonResponse_(rankCreate_(body, actor));

      // ── Candidates ──────────────────────────────────────────
      case 'createCandidate':
        return jsonResponse_(candidateCreate_(body, actor));

      case 'updateCandidate':
        if (!body.id) return jsonError_('id required');
        return jsonResponse_(candidateUpdate_(body.id, body, actor));

      case 'transitionCandidateStatus':
        if (!body.id || !body.status) return jsonError_('id and status required');
        return jsonResponse_(candidateTransition_(body.id, body.status, actor));

      // ── Onboarding ──────────────────────────────────────────
      case 'createOnboardingCase':
        return jsonResponse_(onboardingCreate_(body, actor));

      case 'updateOnboardingCase':
        if (!body.id) return jsonError_('id required');
        return jsonResponse_(onboardingUpdate_(body.id, body, actor));

      // ── Documents ───────────────────────────────────────────
      case 'createDocument':
        return jsonResponse_(documentCreate_(body, actor));

      case 'updateDocument':
        if (!body.id) return jsonError_('id required');
        return jsonResponse_(documentUpdate_(body.id, body, actor));

      // ── Training / Capability ───────────────────────────────
      case 'createTraining':
        return jsonResponse_(trainingCreate_(body, actor));

      case 'updateTraining':
        if (!body.id) return jsonError_('id required');
        return jsonResponse_(trainingUpdate_(body.id, body, actor));

      case 'createCapability':
        return jsonResponse_(capabilityCreate_(body, actor));

      // ── Discipline ──────────────────────────────────────────
      case 'createDisciplineCase':
        return jsonResponse_(disciplineCreate_(body, actor));

      case 'updateDisciplineCase':
        if (!body.id) return jsonError_('id required');
        return jsonResponse_(disciplineUpdate_(body.id, body, actor));

      case 'createPip':
        return jsonResponse_(pipCreate_(body, actor));

      case 'updatePip':
        if (!body.id) return jsonError_('id required');
        return jsonResponse_(pipUpdate_(body.id, body, actor));

      // ── Offboarding ─────────────────────────────────────────
      case 'createOffboardingCase':
        return jsonResponse_(offboardingCreate_(body, actor));

      case 'updateOffboardingCase':
        if (!body.id) return jsonError_('id required');
        return jsonResponse_(offboardingUpdate_(body.id, body, actor));

      // ── Assets ──────────────────────────────────────────────
      case 'createAsset':
        return jsonResponse_(assetCreate_(body, actor));

      case 'assignAsset':
        if (!body.asset_id || !body.person_id) return jsonError_('asset_id and person_id required');
        return jsonResponse_(assetAssign_(body.asset_id, body.person_id, actor));

      case 'returnAsset':
        if (!body.assignment_id) return jsonError_('assignment_id required');
        return jsonResponse_(assetReturn_(body.assignment_id, body.condition_in, actor));

      // ── Tasks ───────────────────────────────────────────────
      case 'createTask':
        return jsonResponse_(taskCreate_(body, actor));

      case 'updateTask':
        if (!body.id) return jsonError_('id required');
        return jsonResponse_(taskUpdate_(body.id, body, actor));

      default:
        return jsonError_('Unknown action: ' + action);
    }
  } catch (err) {
    if (String(err.message).indexOf('FORBIDDEN') === 0) {
      return jsonError_(err.message, 403);
    }
    if (String(err.message).indexOf('Invalid status transition') === 0) {
      return jsonError_(err.message, 422);
    }
    return jsonError_(err.message, 500);
  }
}

// ── Overview aggregation ─────────────────────────────────────

function getOverview_() {
  var people = [];
  var candidates = [];
  var tasks = [];
  var expiringDocs = 0;
  var openTasks = 0;

  try { people = personListAll_(); } catch (e) {}
  try { candidates = candidateListAll_(); } catch (e) {}
  try { tasks = taskListAll_({}); } catch (e) {}

  var headcount = people.filter(function(p) {
    var s = String(p.status || '').toUpperCase();
    return ['ACTIVE','PROBATION','ONBOARDING','PIP','DISCIPLINARY','MEDICAL_LEAVE','PARENTAL_LEAVE','LEAVE'].indexOf(s) !== -1;
  }).length;

  var deployableFull = people.filter(function(p) { return p.deployability === 'FULL'; }).length;
  var deployableBlocked = people.filter(function(p) { return p.deployability === 'BLOCKED'; }).length;
  var deployableLimited = people.filter(function(p) { return p.deployability === 'LIMITED'; }).length;

  openTasks = tasks.filter(function(t) {
    return String(t.status || '').toUpperCase() === 'OPEN' || String(t.status || '').toUpperCase() === 'IN_PROGRESS';
  }).length;

  try {
    var docs = documentListAll_(null);
    expiringDocs = docs.filter(function(d) {
      var s = String(d.status || '').toUpperCase();
      return s === 'EXPIRED' || s === 'EXPIRING_SOON';
    }).length;
  } catch (e) {}

  var activeCandidates = candidates.filter(function(c) {
    var s = String(c.status || '').toUpperCase();
    return ['NEW','SCREENING','PHONE_SCREEN','INTERVIEW_SCHEDULED','INTERVIEWED',
            'REFERENCE_CHECK','OFFER_PENDING','OFFER_SENT'].indexOf(s) !== -1;
  }).length;

  return {
    headcount: headcount,
    total_people: people.length,
    deployable_full: deployableFull,
    deployable_limited: deployableLimited,
    deployable_blocked: deployableBlocked,
    open_tasks: openTasks,
    expiring_docs: expiringDocs,
    active_candidates: activeCandidates,
    recent_people: people.slice(-5).reverse()
  };
}
