import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { ASSURANCE_SCHEMA, PACK_SCHEMA } from "../engagement-pack.mjs";
import { buildPackFromPaths, loadAssuranceDocuments, parseArguments } from "./build-engagement-pack.mjs";

function documentFor(tool, runId) {
  return {
    schema: ASSURANCE_SCHEMA,
    engagement: {
      id: "ENG-SYNTHETIC",
      name: "Synthetic Migration Assurance",
      client_alias: "SYNTHETIC-CLIENT",
      countries: ["GBR"],
      modules: ["Employee Central"],
      stage: "rehearsal",
    },
    run: {
      id: runId,
      tool,
      tool_version: "1.0.0",
      generated_at: "2026-08-23T10:00:00Z",
      mode: "synthetic",
      scope: { country: "GBR" },
    },
    summary: { status: "pass", records_assessed: 10, findings: 0, by_severity: {} },
    findings: [],
    actions: [],
    evidence: [{
      id: "E-1",
      type: "synthetic_report",
      description: "Synthetic non-production evidence",
      classification: "internal",
      source: `${tool}.json`,
      sha256: "a".repeat(64),
      generated_at: "2026-08-23T10:00:00Z",
    }],
  };
}

async function writeDocuments(directory) {
  const documents = [
    documentFor("migration-tool", "MAP"),
    documentFor("sf-config-compare-ec", "CFG"),
    documentFor("sf-ec-hcm-validator", "VAL"),
    documentFor("sf-change-ledger", "LED"),
    documentFor("sf-cutover-planner", "CUT"),
  ];
  await mkdir(directory, { recursive: true });
  for (const document of documents) {
    await writeFile(path.join(directory, `${document.run.id}.json`), JSON.stringify(document));
  }
  await writeFile(path.join(directory, "unrelated.json"), JSON.stringify({ schema: "something-else/v1" }));
  return documents;
}

test("parses repeatable inputs and rejects incomplete invocations", () => {
  assert.deepEqual(parseArguments(["--input", "a", "--input", "b", "--output", "pack.json"]), {
    help: false,
    inputs: ["a", "b"],
    output: "pack.json",
    optionsPath: "",
  });
  assert.throws(() => parseArguments(["--output", "pack.json"]), /at least one --input/);
});

test("directory discovery ignores unrelated JSON but explicit files fail closed", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "sf-compass-pack-"));
  await writeDocuments(root);
  const loaded = await loadAssuranceDocuments([root]);
  assert.equal(loaded.documents.length, 5);
  await assert.rejects(() => loadAssuranceDocuments([path.join(root, "unrelated.json")]), /expected schema/);
});

test("builds a deterministic restricted G0-G4 pack from synthetic tool evidence", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "sf-compass-pack-"));
  const input = path.join(root, "evidence");
  const output = path.join(root, "out", "engagement-pack.json");
  const optionsPath = path.join(root, "options.json");
  await writeDocuments(input);
  await writeFile(optionsPath, JSON.stringify({ generatedAt: "2026-08-23T12:00:00Z" }));

  const { pack, sources } = await buildPackFromPaths({ inputs: [input], output, optionsPath });
  assert.equal(pack.schema, PACK_SCHEMA);
  assert.equal(pack.generated_at, "2026-08-23T12:00:00Z");
  assert.equal(pack.recommendation, "proceed_with_conditions");
  assert.deepEqual(pack.gates.map((gate) => gate.status), ["incomplete", "pass", "pass", "pass", "incomplete"]);
  assert.equal(sources.length, 5);
  assert.equal((await stat(output)).mode & 0o777, 0o600);
  assert.deepEqual(JSON.parse(await readFile(output, "utf8")), pack);
});
