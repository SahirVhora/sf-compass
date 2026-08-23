#!/usr/bin/env node

import { chmod, mkdir, open, readFile, readdir, rename, rm } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { ASSURANCE_SCHEMA, buildEngagementPack } from "../engagement-pack.mjs";

function fail(message) {
  throw new Error(message);
}

export function parseArguments(argv) {
  const inputs = [];
  let output = "";
  let optionsPath = "";
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--input") inputs.push(argv[++index] || fail("--input requires a path"));
    else if (argument === "--output") output = argv[++index] || fail("--output requires a path");
    else if (argument === "--options") optionsPath = argv[++index] || fail("--options requires a path");
    else if (argument === "--help" || argument === "-h") return { help: true, inputs: [], output: "", optionsPath: "" };
    else fail(`unknown argument: ${argument}`);
  }
  if (!inputs.length) fail("at least one --input file or directory is required");
  if (!output) fail("--output is required");
  return { help: false, inputs, output, optionsPath };
}

async function jsonFiles(input) {
  const resolved = path.resolve(input);
  const entry = await open(resolved, "r");
  try {
    const stat = await entry.stat();
    if (stat.isFile()) return [{ path: resolved, explicit: true }];
    if (!stat.isDirectory()) fail(`input is neither a file nor directory: ${resolved}`);
  } finally {
    await entry.close();
  }
  const found = [];
  async function walk(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    for (const child of entries.sort((left, right) => left.name.localeCompare(right.name))) {
      if (child.name.startsWith(".")) continue;
      const childPath = path.join(directory, child.name);
      if (child.isDirectory()) await walk(childPath);
      else if (child.isFile() && child.name.endsWith(".json")) found.push({ path: childPath, explicit: false });
    }
  }
  await walk(resolved);
  return found;
}

export async function loadAssuranceDocuments(inputs) {
  const candidates = (await Promise.all(inputs.map(jsonFiles))).flat();
  const unique = new Map(candidates.map((candidate) => [candidate.path, candidate]));
  const documents = [];
  const sources = [];
  for (const candidate of [...unique.values()].sort((left, right) => left.path.localeCompare(right.path))) {
    let value;
    try {
      value = JSON.parse(await readFile(candidate.path, "utf8"));
    } catch (error) {
      if (candidate.explicit) fail(`${candidate.path}: invalid JSON (${error.message})`);
      continue;
    }
    if (value?.schema !== ASSURANCE_SCHEMA) {
      if (candidate.explicit) fail(`${candidate.path}: expected schema ${ASSURANCE_SCHEMA}`);
      continue;
    }
    documents.push(value);
    sources.push(candidate.path);
  }
  if (!documents.length) fail(`no ${ASSURANCE_SCHEMA} documents found`);
  return { documents, sources };
}

async function loadOptions(optionsPath) {
  if (!optionsPath) return {};
  const value = JSON.parse(await readFile(path.resolve(optionsPath), "utf8"));
  if (!value || typeof value !== "object" || Array.isArray(value)) fail("options must be a JSON object");
  return value;
}

async function atomicRestrictedWrite(outputPath, value) {
  const resolved = path.resolve(outputPath);
  await mkdir(path.dirname(resolved), { recursive: true });
  const temporary = `${resolved}.tmp-${process.pid}`;
  try {
    const handle = await open(temporary, "wx", 0o600);
    try {
      await handle.writeFile(`${JSON.stringify(value, null, 2)}\n`, "utf8");
    } finally {
      await handle.close();
    }
    await rename(temporary, resolved);
    await chmod(resolved, 0o600);
  } catch (error) {
    await rm(temporary, { force: true });
    throw error;
  }
  return resolved;
}

export async function buildPackFromPaths({ inputs, output, optionsPath = "" }) {
  const { documents, sources } = await loadAssuranceDocuments(inputs);
  const options = await loadOptions(optionsPath);
  const pack = buildEngagementPack(documents, options);
  const outputPath = await atomicRestrictedWrite(output, pack);
  return { pack, outputPath, sources };
}

function usage() {
  return `Usage:
  node scripts/build-engagement-pack.mjs --input <file-or-directory> [--input ...] \\
    --output <engagement-pack.json> [--options <options.json>]

Directory inputs are scanned recursively for sapsf-assurance/v1 JSON. Other
JSON files are ignored. Explicit file inputs must be valid assurance documents.
The optional JSON object maps directly to buildEngagementPack options, including
scopeApproved, scopeApprovalRef, hypercareApproved, hypercareApprovalRef,
positionInScope, digitalTwinInScope, additionalRequirements, and generatedAt.
Human approvals are never inferred.`;
}

export async function main(argv = process.argv.slice(2)) {
  const args = parseArguments(argv);
  if (args.help) {
    process.stdout.write(`${usage()}\n`);
    return 0;
  }
  const result = await buildPackFromPaths(args);
  process.stdout.write(`validated ${result.sources.length} assurance document(s)\n`);
  process.stdout.write(`recommendation: ${result.pack.recommendation}\n`);
  process.stdout.write(`output: ${result.outputPath}\n`);
  return 0;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    process.stderr.write(`engagement pack failed: ${error.message}\n`);
    process.exitCode = 1;
  });
}
