export const ASSURANCE_SCHEMA = "sapsf-assurance/v1";
export const PACK_SCHEMA = "sapsf-engagement-pack/v1";

const SEVERITIES = new Set(["critical", "high", "medium", "low", "info"]);
const FINDING_STATUSES = new Set([
  "open",
  "accepted",
  "in_progress",
  "resolved",
  "false_positive",
]);
const ACTION_STATUSES = new Set(["open", "in_progress", "blocked", "completed", "cancelled"]);
const PRIORITIES = new Set(["critical", "high", "medium", "low"]);
const SUMMARY_STATUSES = new Set(["pass", "attention_required", "blocked", "incomplete"]);
const EVIDENCE_CLASSIFICATIONS = new Set(["public", "internal", "confidential", "restricted"]);
const SENSITIVE_KEYS = new Set([
  "password",
  "passwd",
  "secret",
  "client_secret",
  "token",
  "access_token",
  "refresh_token",
  "authorization",
  "employee_name",
  "person_name",
  "email",
  "phone",
  "national_id",
  "bank_account",
  "iban",
]);
const UNSAFE_KEYS = new Set(["__proto__", "prototype", "constructor"]);
const OPEN_FINDING_STATUSES = new Set(["open", "in_progress"]);
const ISO_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;
const EMAIL_VALUE = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
const CREDENTIAL_VALUE = /(?:\bBearer\s+[A-Za-z0-9._~-]{12,}|\bsk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{20,}|\bAKIA[0-9A-Z]{16}\b|\bgh[pousr]_[A-Za-z0-9_]{30,})/;

const TOOL_ALIASES = new Map([
  ["migration_tool", "migration-tool"],
  ["sapsf-migration-studio", "migration-tool"],
  ["sf-ec-hcm-validator-adp-gv-ec", "sf-ec-hcm-validator"],
  ["sf-ec-hcm-validator-parallel-payroll", "sf-ec-hcm-validator"],
]);

export const DEFAULT_GATE_REQUIREMENTS = Object.freeze({
  G1: ["migration-tool", "sf-config-compare-ec"],
  G2: ["sf-ec-hcm-validator"],
  G3: ["sf-change-ledger", "sf-cutover-planner"],
});

function fail(path, message) {
  throw new Error(`${path}: ${message}`);
}

function objectAt(value, path) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    fail(path, "must be an object");
  }
  return value;
}

function arrayAt(value, path) {
  if (!Array.isArray(value)) fail(path, "must be an array");
  return value;
}

function nonEmptyString(value, path) {
  if (typeof value !== "string" || !value.trim()) fail(path, "must be a non-empty string");
  return value;
}

function requireFields(value, fields, path) {
  for (const field of fields) {
    if (!Object.hasOwn(value, field)) fail(path, `missing required field ${field}`);
  }
}

function checkKeys(value, path = "document") {
  if (Array.isArray(value)) {
    value.forEach((child, index) => checkKeys(child, `${path}[${index}]`));
    return;
  }
  if (typeof value === "string") {
    if (EMAIL_VALUE.test(value)) fail(path, "personal email values are forbidden");
    if (CREDENTIAL_VALUE.test(value)) fail(path, "credential-shaped values are forbidden");
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    const normalized = key.trim().toLowerCase().replaceAll("-", "_");
    if (SENSITIVE_KEYS.has(normalized)) fail(`${path}.${key}`, "sensitive fields are forbidden");
    if (UNSAFE_KEYS.has(key)) fail(`${path}.${key}`, "unsafe object keys are forbidden");
    checkKeys(child, `${path}.${key}`);
  }
}

function uniqueIds(items, section) {
  const ids = new Set();
  items.forEach((raw, index) => {
    const item = objectAt(raw, `${section}[${index}]`);
    const id = nonEmptyString(item.id, `${section}[${index}].id`);
    if (ids.has(id)) fail(section, `duplicate id ${id}`);
    ids.add(id);
  });
  return ids;
}

function checkReferences(refs, known, path) {
  arrayAt(refs, path).forEach((reference) => {
    nonEmptyString(reference, path);
    if (!known.has(reference)) fail(path, `unknown reference ${reference}`);
  });
}

function stringArray(value, path) {
  return arrayAt(value, path).map((item, index) => nonEmptyString(item, `${path}[${index}]`));
}

function timestamp(value, path) {
  if (typeof value !== "string" || !ISO_TIMESTAMP.test(value) || Number.isNaN(Date.parse(value))) {
    fail(path, "must be an ISO 8601 timestamp with timezone");
  }
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));
  const hour = Number(value.slice(11, 13));
  const minute = Number(value.slice(14, 16));
  const second = Number(value.slice(17, 19));
  const daysInMonth = month >= 1 && month <= 12 ? new Date(Date.UTC(year, month, 0)).getUTCDate() : 0;
  const offset = value.endsWith("Z") ? null : value.slice(-6);
  if (
    day < 1 || day > daysInMonth || hour > 23 || minute > 59 || second > 59
    || (offset && (Number(offset.slice(1, 3)) > 23 || Number(offset.slice(4, 6)) > 59))
  ) {
    fail(path, "must contain a valid calendar date, time, and timezone offset");
  }
  return value;
}

function canonicalCounts(findings) {
  const counts = {};
  for (const finding of findings) counts[finding.severity] = (counts[finding.severity] || 0) + 1;
  return counts;
}

export function canonicalTool(tool) {
  const value = nonEmptyString(tool, "run.tool").trim().toLowerCase();
  return TOOL_ALIASES.get(value) || value;
}

export function validateAssuranceDocument(document) {
  const root = objectAt(document, "document");
  requireFields(root, ["schema", "engagement", "run", "summary", "findings", "actions", "evidence"], "document");
  if (root.schema !== ASSURANCE_SCHEMA) fail("document.schema", `must be ${ASSURANCE_SCHEMA}`);
  checkKeys(root);

  const engagement = objectAt(root.engagement, "engagement");
  requireFields(engagement, ["id", "name", "client_alias", "countries", "modules", "stage"], "engagement");
  nonEmptyString(engagement.id, "engagement.id");
  nonEmptyString(engagement.name, "engagement.name");
  const alias = nonEmptyString(engagement.client_alias, "engagement.client_alias");
  if (alias.includes("@")) fail("engagement.client_alias", "must be a non-personal alias");
  stringArray(engagement.countries, "engagement.countries");
  stringArray(engagement.modules, "engagement.modules");
  nonEmptyString(engagement.stage, "engagement.stage");

  const run = objectAt(root.run, "run");
  requireFields(run, ["id", "tool", "tool_version", "generated_at", "mode", "scope"], "run");
  nonEmptyString(run.id, "run.id");
  canonicalTool(run.tool);
  nonEmptyString(run.tool_version, "run.tool_version");
  timestamp(run.generated_at, "run.generated_at");
  nonEmptyString(run.mode, "run.mode");
  objectAt(run.scope, "run.scope");
  if (run.tenant !== undefined && !String(run.tenant).includes("***masked***")) {
    fail("run.tenant", "must be explicitly masked");
  }

  const summary = objectAt(root.summary, "summary");
  requireFields(summary, ["status", "records_assessed", "findings", "by_severity"], "summary");
  if (!SUMMARY_STATUSES.has(summary.status)) fail("summary.status", "is not canonical");
  if (!Number.isInteger(summary.records_assessed) || summary.records_assessed < 0) {
    fail("summary.records_assessed", "must be a non-negative integer");
  }
  if (!Number.isInteger(summary.findings) || summary.findings < 0) {
    fail("summary.findings", "must be a non-negative integer");
  }
  const bySeverity = objectAt(summary.by_severity, "summary.by_severity");
  for (const [severity, count] of Object.entries(bySeverity)) {
    if (!SEVERITIES.has(severity)) fail("summary.by_severity", `unknown severity ${severity}`);
    if (!Number.isInteger(count) || count < 0) fail(`summary.by_severity.${severity}`, "must be a non-negative integer");
  }

  const findings = arrayAt(root.findings, "findings");
  const actions = arrayAt(root.actions, "actions");
  const evidence = arrayAt(root.evidence, "evidence");
  const findingIds = uniqueIds(findings, "findings");
  const actionIds = uniqueIds(actions, "actions");
  const evidenceIds = uniqueIds(evidence, "evidence");
  if (summary.findings !== findings.length) fail("summary.findings", "does not match findings length");

  findings.forEach((raw, index) => {
    const item = objectAt(raw, `findings[${index}]`);
    requireFields(item, ["id", "rule_id", "severity", "status", "category", "title", "description", "object_type", "object_ref", "evidence_refs", "action_refs"], `findings[${index}]`);
    if (!SEVERITIES.has(item.severity)) fail(`findings[${index}].severity`, "is not canonical");
    if (!FINDING_STATUSES.has(item.status)) fail(`findings[${index}].status`, "is not canonical");
    for (const field of ["rule_id", "category", "title", "description", "object_type", "object_ref"]) {
      nonEmptyString(item[field], `findings[${index}].${field}`);
    }
    checkReferences(item.evidence_refs, evidenceIds, `findings[${index}].evidence_refs`);
    checkReferences(item.action_refs, actionIds, `findings[${index}].action_refs`);
  });

  actions.forEach((raw, index) => {
    const item = objectAt(raw, `actions[${index}]`);
    requireFields(item, ["id", "title", "owner_role", "priority", "status", "finding_refs"], `actions[${index}]`);
    if (!PRIORITIES.has(item.priority)) fail(`actions[${index}].priority`, "is not canonical");
    if (!ACTION_STATUSES.has(item.status)) fail(`actions[${index}].status`, "is not canonical");
    nonEmptyString(item.title, `actions[${index}].title`);
    nonEmptyString(item.owner_role, `actions[${index}].owner_role`);
    checkReferences(item.finding_refs, findingIds, `actions[${index}].finding_refs`);
  });

  evidence.forEach((raw, index) => {
    const item = objectAt(raw, `evidence[${index}]`);
    requireFields(item, ["id", "type", "description", "classification", "source", "generated_at"], `evidence[${index}]`);
    if (!EVIDENCE_CLASSIFICATIONS.has(item.classification)) fail(`evidence[${index}].classification`, "is not canonical");
    for (const field of ["type", "description", "source"]) nonEmptyString(item[field], `evidence[${index}].${field}`);
    timestamp(item.generated_at, `evidence[${index}].generated_at`);
    if (item.sha256 !== undefined && !/^[0-9a-f]{64}$/.test(String(item.sha256))) {
      fail(`evidence[${index}].sha256`, "must be a lowercase SHA-256 digest");
    }
  });

  const actualCounts = canonicalCounts(findings);
  for (const severity of SEVERITIES) {
    if ((bySeverity[severity] || 0) !== (actualCounts[severity] || 0)) {
      fail(`summary.by_severity.${severity}`, "does not match findings");
    }
  }
  return root;
}

function runKey(document) {
  return `${canonicalTool(document.run.tool)}::${document.run.id}`;
}

function openFindings(documents) {
  return documents.flatMap((document) =>
    document.findings
      .filter((finding) => OPEN_FINDING_STATUSES.has(finding.status))
      .map((finding) => ({ document, finding })),
  );
}

function latestDocumentsByTool(documents) {
  const latest = new Map();
  for (const document of documents) {
    const tool = canonicalTool(document.run.tool);
    const current = latest.get(tool);
    const generatedAt = Date.parse(document.run.generated_at);
    const currentAt = current ? Date.parse(current.run.generated_at) : Number.NEGATIVE_INFINITY;
    if (!current || generatedAt > currentAt || (generatedAt === currentAt && document.run.id > current.run.id)) {
      latest.set(tool, document);
    }
  }
  return latest;
}

function gateStatus(documents, missingTools, unverifiedTools) {
  if (missingTools.length || unverifiedTools.length) return "incomplete";
  const open = openFindings(documents);
  if (
    documents.some((document) => document.summary.status === "blocked")
    || documents.some((document) => document.actions.some((action) => action.status === "blocked"))
    || open.some(({ finding }) => finding.severity === "critical")
  ) {
    return "blocked";
  }
  if (documents.some((document) => document.summary.status === "incomplete")) return "incomplete";
  if (documents.some((document) => document.summary.status === "attention_required") || open.some(({ finding }) => finding.severity === "high")) {
    return "attention_required";
  }
  return "pass";
}

function gateSummary(id, documents, requiredTools) {
  const latest = latestDocumentsByTool(documents);
  const missingTools = requiredTools.filter((tool) => !latest.has(tool));
  const relevant = requiredTools.flatMap((tool) => latest.has(tool) ? [latest.get(tool)] : []);
  const unverifiedTools = relevant
    .filter((document) => !document.evidence.some((item) => typeof item.sha256 === "string"))
    .map((document) => canonicalTool(document.run.tool));
  const open = openFindings(relevant);
  return {
    id,
    status: gateStatus(relevant, missingTools, unverifiedTools),
    required_tools: [...requiredTools],
    received_tools: [...new Set(relevant.map((document) => canonicalTool(document.run.tool)))].sort(),
    missing_tools: missingTools,
    unverified_tools: unverifiedTools,
    open_critical: open.filter(({ finding }) => finding.severity === "critical").length,
    open_high: open.filter(({ finding }) => finding.severity === "high").length,
  };
}

function approvalReference(value, path) {
  if (value === undefined || value === null || value === "") return "";
  const reference = nonEmptyString(value, path).trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,127}$/.test(reference)) {
    fail(path, "must be a non-personal ticket or document reference");
  }
  return reference;
}

function sourcedItem(document, section, item) {
  const tool = canonicalTool(document.run.tool);
  const runId = document.run.id;
  return {
    ...item,
    id: `${tool}::${runId}::${item.id}`,
    source_tool: tool,
    source_run_id: runId,
    source_id: item.id,
    ...(section === "findings" && {
      evidence_refs: item.evidence_refs.map((id) => `${tool}::${runId}::${id}`),
      action_refs: item.action_refs.map((id) => `${tool}::${runId}::${id}`),
    }),
    ...(section === "actions" && {
      finding_refs: item.finding_refs.map((id) => `${tool}::${runId}::${id}`),
    }),
  };
}

export function buildEngagementPack(documents, options = {}) {
  if (!Array.isArray(documents) || !documents.length) fail("documents", "at least one assurance document is required");
  const validated = documents.map((document) => validateAssuranceDocument(document));
  const engagementId = validated[0].engagement.id;
  const clientAlias = validated[0].engagement.client_alias;
  for (const document of validated) {
    if (document.engagement.id !== engagementId) fail("engagement.id", "all documents must belong to the same engagement");
    if (document.engagement.client_alias !== clientAlias) fail("engagement.client_alias", "all documents must use the same client alias");
  }
  const scopeApprovalRef = approvalReference(options.scopeApprovalRef, "scopeApprovalRef");
  const hypercareApprovalRef = approvalReference(options.hypercareApprovalRef, "hypercareApprovalRef");
  const scopeApproved = options.scopeApproved === true && Boolean(scopeApprovalRef);
  const hypercareApproved = options.hypercareApproved === true && Boolean(hypercareApprovalRef);
  const keys = new Set();
  for (const document of validated) {
    const key = runKey(document);
    if (keys.has(key)) fail("run", `duplicate tool/run pair ${key}`);
    keys.add(key);
  }

  const requirements = {
    G1: [...DEFAULT_GATE_REQUIREMENTS.G1],
    G2: [...DEFAULT_GATE_REQUIREMENTS.G2],
    G3: [...DEFAULT_GATE_REQUIREMENTS.G3],
  };
  if (options.positionInScope) requirements.G2.push("sf-position-integrity-checker");
  if (options.digitalTwinInScope) requirements.G3.push("sf-cutover-digital-twin");
  for (const [gate, tools] of Object.entries(options.additionalRequirements || {})) {
    if (!Object.hasOwn(requirements, gate)) fail("additionalRequirements", `unknown gate ${gate}`);
    for (const tool of tools) requirements[gate].push(canonicalTool(tool));
  }
  for (const gate of Object.keys(requirements)) requirements[gate] = [...new Set(requirements[gate])];

  const gates = [
    {
      id: "G0",
      status: scopeApproved ? "pass" : "incomplete",
      required_tools: [],
      received_tools: [],
      missing_tools: scopeApproved ? [] : ["human scope approval reference"],
      unverified_tools: [],
      open_critical: 0,
      open_high: 0,
    },
    gateSummary("G1", validated, requirements.G1),
    gateSummary("G2", validated, requirements.G2),
    gateSummary("G3", validated, requirements.G3),
    {
      id: "G4",
      status: hypercareApproved ? "pass" : "incomplete",
      required_tools: [],
      received_tools: [],
      missing_tools: hypercareApproved ? [] : ["human hypercare closure reference"],
      unverified_tools: [],
      open_critical: 0,
      open_high: 0,
    },
  ];

  const recommendation = gates.some((gate) => gate.status === "blocked")
    ? "hold"
    : gates.every((gate) => gate.status === "pass")
      ? "proceed"
      : "proceed_with_conditions";
  const findings = validated.flatMap((document) => document.findings.map((item) => sourcedItem(document, "findings", item)));
  const actions = validated.flatMap((document) => document.actions.map((item) => sourcedItem(document, "actions", item)));
  const evidence = validated.flatMap((document) => document.evidence.map((item) => sourcedItem(document, "evidence", item)));
  const countries = [...new Set(validated.flatMap((document) => document.engagement.countries))].sort();
  const modules = [...new Set(validated.flatMap((document) => document.engagement.modules))].sort();
  const latest = latestDocumentsByTool(validated);
  const currentKeys = new Set([...latest.values()].map(runKey));
  for (const item of [...findings, ...actions, ...evidence]) {
    item.current = currentKeys.has(`${item.source_tool}::${item.source_run_id}`);
  }
  const currentDocuments = [...latest.values()];
  const currentFindings = findings.filter((item) => item.current);
  const recordsAssessedByTool = Object.fromEntries(
    [...latest.entries()].sort(([left], [right]) => left.localeCompare(right))
      .map(([tool, document]) => [tool, document.summary.records_assessed]),
  );
  const migrationRecords = latest.get("migration-tool")?.summary.records_assessed || 0;

  return {
    schema: PACK_SCHEMA,
    generated_at: options.generatedAt || new Date().toISOString(),
    engagement: {
      id: engagementId,
      name: validated[0].engagement.name,
      client_alias: clientAlias,
      countries,
      modules,
    },
    recommendation,
    approvals: {
      scope: { approved: scopeApproved, reference: scopeApprovalRef },
      hypercare_closure: { approved: hypercareApproved, reference: hypercareApprovalRef },
    },
    gates,
    summary: {
      runs: validated.length,
      current_runs: currentDocuments.length,
      historical_runs: validated.length - currentDocuments.length,
      records_assessed: migrationRecords,
      control_assessments: Object.values(recordsAssessedByTool).reduce((total, count) => total + count, 0),
      records_assessed_by_tool: recordsAssessedByTool,
      findings: currentFindings.length,
      historical_findings: findings.length - currentFindings.length,
      open_critical: currentFindings.filter((item) => item.severity === "critical" && OPEN_FINDING_STATUSES.has(item.status)).length,
      open_high: currentFindings.filter((item) => item.severity === "high" && OPEN_FINDING_STATUSES.has(item.status)).length,
      evidence: evidence.filter((item) => item.current).length,
    },
    runs: validated.map((document) => ({
      id: document.run.id,
      tool: canonicalTool(document.run.tool),
      tool_version: document.run.tool_version,
      generated_at: document.run.generated_at,
      status: document.summary.status,
      records_assessed: document.summary.records_assessed,
      current: currentKeys.has(runKey(document)),
    })),
    findings,
    actions,
    evidence,
  };
}
