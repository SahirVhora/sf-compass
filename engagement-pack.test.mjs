import assert from "node:assert/strict";
import test from "node:test";

import {
  ASSURANCE_SCHEMA,
  PACK_SCHEMA,
  buildEngagementPack,
  canonicalTool,
  validateAssuranceDocument,
} from "./engagement-pack.mjs";

function documentFor(tool, { runId = "RUN-1", status = "pass", findings = [], engagementId = "ENG-1", alias = "CLIENT-A" } = {}) {
  const actions = findings.map((finding, index) => ({
    id: `A-${index + 1}`,
    title: "Review the finding",
    owner_role: "Data Lead",
    priority: finding.severity === "critical" ? "critical" : finding.severity === "high" ? "high" : "medium",
    status: "open",
    finding_refs: [finding.id],
  }));
  const evidence = [{
    id: "E-1",
    type: "report",
    description: "Synthetic test evidence",
    classification: "internal",
    source: "local-test",
    sha256: "a".repeat(64),
    generated_at: "2026-08-12T10:00:00Z",
  }];
  const normalizedFindings = findings.map((finding, index) => ({
    rule_id: "TEST-001",
    status: "open",
    category: "test",
    title: "Synthetic finding",
    description: "Synthetic test finding",
    object_type: "test_object",
    object_ref: "MASKED-1",
    evidence_refs: ["E-1"],
    action_refs: [`A-${index + 1}`],
    ...finding,
  }));
  const bySeverity = {};
  normalizedFindings.forEach((finding) => { bySeverity[finding.severity] = (bySeverity[finding.severity] || 0) + 1; });
  return {
    schema: ASSURANCE_SCHEMA,
    engagement: { id: engagementId, name: "Migration Assurance", client_alias: alias, countries: ["GBR"], modules: ["Employee Central"], stage: "rehearsal" },
    run: { id: runId, tool, tool_version: "1.0.0", generated_at: "2026-08-12T10:00:00Z", mode: "local", scope: {} },
    summary: { status, records_assessed: 10, findings: normalizedFindings.length, by_severity: bySeverity },
    findings: normalizedFindings,
    actions,
    evidence,
  };
}

test("validates a complete assurance document", () => {
  assert.equal(validateAssuranceDocument(documentFor("migration-tool")).schema, ASSURANCE_SCHEMA);
});

test("normalizes known tool aliases", () => {
  assert.equal(canonicalTool("migration_tool"), "migration-tool");
  assert.equal(canonicalTool("sf-ec-hcm-validator-adp-gv-ec"), "sf-ec-hcm-validator");
});

test("builds a complete pack without auto-approving human gates", () => {
  const docs = [
    documentFor("migration-tool", { runId: "MAP" }),
    documentFor("sf-config-compare-ec", { runId: "CFG" }),
    documentFor("sf-ec-hcm-validator", { runId: "VAL" }),
    documentFor("sf-change-ledger", { runId: "LED" }),
    documentFor("sf-cutover-planner", { runId: "CUT" }),
  ];
  const pack = buildEngagementPack(docs, { generatedAt: "2026-08-12T11:00:00Z" });
  assert.equal(pack.schema, PACK_SCHEMA);
  assert.equal(pack.recommendation, "proceed_with_conditions");
  assert.deepEqual(pack.gates.map((gate) => gate.status), ["incomplete", "pass", "pass", "pass", "incomplete"]);
});

test("can reach proceed only with all evidence and explicit human approvals", () => {
  const docs = [
    documentFor("migration-tool", { runId: "MAP" }),
    documentFor("sf-config-compare-ec", { runId: "CFG" }),
    documentFor("sf-ec-hcm-validator", { runId: "VAL" }),
    documentFor("sf-position-integrity-checker", { runId: "POS" }),
    documentFor("sf-change-ledger", { runId: "LED" }),
    documentFor("sf-cutover-planner", { runId: "CUT" }),
    documentFor("sf-cutover-digital-twin", { runId: "TWIN" }),
  ];
  const pack = buildEngagementPack(docs, {
    scopeApproved: true,
    scopeApprovalRef: "CAB-1042",
    hypercareApproved: true,
    hypercareApprovalRef: "HYP-208",
    positionInScope: true,
    digitalTwinInScope: true,
  });
  assert.equal(pack.recommendation, "proceed");
  assert.ok(pack.gates.every((gate) => gate.status === "pass"));
});

test("human gates require non-personal approval references", () => {
  const pack = buildEngagementPack([documentFor("migration-tool")], { scopeApproved: true });
  assert.equal(pack.gates[0].status, "incomplete");
  assert.throws(() => buildEngagementPack([documentFor("migration-tool")], {
    scopeApproved: true,
    scopeApprovalRef: "approver@example.com",
  }), /non-personal ticket or document reference/);
});

test("latest run supersedes older findings for gates but remains in history", () => {
  const docs = [
    documentFor("migration-tool", { runId: "OLD", findings: [{ id: "F-1", severity: "critical" }] }),
    documentFor("migration-tool", { runId: "NEW" }),
    documentFor("sf-config-compare-ec", { runId: "CFG" }),
  ];
  docs[0].run.generated_at = "2026-08-11T10:00:00Z";
  const pack = buildEngagementPack(docs);
  assert.equal(pack.gates.find((gate) => gate.id === "G1").status, "pass");
  assert.equal(pack.summary.historical_runs, 1);
  assert.equal(pack.summary.historical_findings, 1);
  assert.equal(pack.findings[0].current, false);
});

test("blocked actions block and unhashed evidence fails closed", () => {
  const blocked = documentFor("migration-tool");
  blocked.actions.push({ id: "A-B", title: "Decision needed", owner_role: "Programme Lead", priority: "high", status: "blocked", finding_refs: [] });
  let pack = buildEngagementPack([blocked, documentFor("sf-config-compare-ec", { runId: "CFG" })]);
  assert.equal(pack.gates.find((gate) => gate.id === "G1").status, "blocked");

  const unhashed = documentFor("migration-tool");
  delete unhashed.evidence[0].sha256;
  pack = buildEngagementPack([unhashed, documentFor("sf-config-compare-ec", { runId: "CFG" })]);
  assert.equal(pack.gates.find((gate) => gate.id === "G1").status, "incomplete");
  assert.deepEqual(pack.gates.find((gate) => gate.id === "G1").unverified_tools, ["migration-tool"]);
});

test("record totals distinguish migration population from cross-control assessments", () => {
  const pack = buildEngagementPack([
    documentFor("migration-tool", { runId: "MAP" }),
    documentFor("sf-config-compare-ec", { runId: "CFG" }),
  ]);
  assert.equal(pack.summary.records_assessed, 10);
  assert.equal(pack.summary.control_assessments, 20);
  assert.deepEqual(pack.summary.records_assessed_by_tool, {
    "migration-tool": 10,
    "sf-config-compare-ec": 10,
  });
});

test("fails closed when required evidence is missing", () => {
  const pack = buildEngagementPack([documentFor("migration-tool")]);
  assert.equal(pack.gates.find((gate) => gate.id === "G1").status, "incomplete");
  assert.deepEqual(pack.gates.find((gate) => gate.id === "G1").missing_tools, ["sf-config-compare-ec"]);
});

test("an open critical finding blocks its gate and the recommendation", () => {
  const docs = [
    documentFor("migration-tool", { runId: "MAP", findings: [{ id: "F-1", severity: "critical" }] }),
    documentFor("sf-config-compare-ec", { runId: "CFG" }),
  ];
  const pack = buildEngagementPack(docs);
  assert.equal(pack.gates.find((gate) => gate.id === "G1").status, "blocked");
  assert.equal(pack.recommendation, "hold");
});

test("accepted critical findings do not block the gate", () => {
  const doc = documentFor("migration-tool", { findings: [{ id: "F-1", severity: "critical", status: "accepted" }] });
  const pack = buildEngagementPack([doc, documentFor("sf-config-compare-ec", { runId: "CFG" })]);
  assert.equal(pack.gates.find((gate) => gate.id === "G1").status, "pass");
});

test("rejects mixed engagements and client aliases", () => {
  assert.throws(() => buildEngagementPack([
    documentFor("migration-tool"),
    documentFor("sf-config-compare-ec", { runId: "CFG", engagementId: "ENG-2" }),
  ]), /same engagement/);
  assert.throws(() => buildEngagementPack([
    documentFor("migration-tool"),
    documentFor("sf-config-compare-ec", { runId: "CFG", alias: "CLIENT-B" }),
  ]), /same client alias/);
});

test("rejects duplicate tool and run pairs", () => {
  assert.throws(() => buildEngagementPack([
    documentFor("migration-tool"),
    documentFor("migration_tool"),
  ]), /duplicate tool\/run pair/);
});

test("rejects broken references, count mismatches, unsafe keys, and unmasked tenants", () => {
  const brokenRef = documentFor("migration-tool", { findings: [{ id: "F-1", severity: "high" }] });
  brokenRef.findings[0].evidence_refs = ["MISSING"];
  assert.throws(() => validateAssuranceDocument(brokenRef), /unknown reference/);

  const badCount = documentFor("migration-tool", { findings: [{ id: "F-1", severity: "high" }] });
  badCount.summary.by_severity.high = 0;
  assert.throws(() => validateAssuranceDocument(badCount), /does not match findings/);

  const sensitive = documentFor("migration-tool");
  sensitive.run.scope.client_secret = "never";
  assert.throws(() => validateAssuranceDocument(sensitive), /sensitive fields/);

  const tenant = documentFor("migration-tool");
  tenant.run.tenant = "https://real-tenant.example";
  assert.throws(() => validateAssuranceDocument(tenant), /explicitly masked/);
});

test("rejects loose timestamps, invalid field types, and sensitive string values", () => {
  const timestampDocument = documentFor("migration-tool");
  timestampDocument.run.generated_at = "tomorrow";
  assert.throws(() => validateAssuranceDocument(timestampDocument), /ISO 8601 timestamp/);
  timestampDocument.run.generated_at = "2026-02-30T12:00:00Z";
  assert.throws(() => validateAssuranceDocument(timestampDocument), /valid calendar date/);

  const invalidTitle = documentFor("migration-tool", { findings: [{ id: "F-1", severity: "high" }] });
  invalidTitle.findings[0].title = { nested: true };
  assert.throws(() => validateAssuranceDocument(invalidTitle), /must be a non-empty string/);

  const emailValue = documentFor("migration-tool");
  emailValue.run.scope.note = "Contact person@example.com";
  assert.throws(() => validateAssuranceDocument(emailValue), /personal email values/);

  const credentialValue = documentFor("migration-tool");
  credentialValue.run.scope.note = `Bearer ${"x".repeat(24)}`;
  assert.throws(() => validateAssuranceDocument(credentialValue), /credential-shaped values/);
});

test("namespaces cross-tool IDs and rewrites references", () => {
  const docs = [
    documentFor("migration-tool", { runId: "A", findings: [{ id: "F-1", severity: "high" }] }),
    documentFor("sf-config-compare-ec", { runId: "B", findings: [{ id: "F-1", severity: "high" }] }),
  ];
  const pack = buildEngagementPack(docs);
  assert.equal(new Set(pack.findings.map((item) => item.id)).size, 2);
  assert.equal(pack.findings[0].action_refs[0], "migration-tool::A::A-1");
  assert.equal(pack.actions[0].finding_refs[0], "migration-tool::A::F-1");
});

test("requires optional position and digital twin controls only when in scope", () => {
  const docs = [
    documentFor("migration-tool", { runId: "MAP" }),
    documentFor("sf-config-compare-ec", { runId: "CFG" }),
    documentFor("sf-ec-hcm-validator", { runId: "VAL" }),
    documentFor("sf-change-ledger", { runId: "LED" }),
    documentFor("sf-cutover-planner", { runId: "CUT" }),
  ];
  const pack = buildEngagementPack(docs, { positionInScope: true, digitalTwinInScope: true });
  assert.deepEqual(pack.gates.find((gate) => gate.id === "G2").missing_tools, ["sf-position-integrity-checker"]);
  assert.deepEqual(pack.gates.find((gate) => gate.id === "G3").missing_tools, ["sf-cutover-digital-twin"]);
});
