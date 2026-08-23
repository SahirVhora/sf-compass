import {
  ASSURANCE_SCHEMA,
  buildEngagementPack,
  canonicalTool,
  validateAssuranceDocument,
} from "./engagement-pack.mjs";

const LEGACY_SCHEMA = "sf-compass-findings/v1";
const MAX_FILES = 100;
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const state = { assurance: [], legacy: [], pack: null, severity: "all", query: "" };
const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };

const byId = (id) => document.getElementById(id);

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

function showMessage(message, kind = "error") {
  const panel = byId("message");
  panel.textContent = message;
  panel.className = `message ${kind}`;
  panel.hidden = false;
}

function clearMessage() {
  byId("message").hidden = true;
}

function options() {
  return {
    scopeApproved: byId("scope-approved").checked,
    scopeApprovalRef: byId("scope-approval-ref").value.trim(),
    positionInScope: byId("position-scope").checked,
    digitalTwinInScope: byId("twin-scope").checked,
    hypercareApproved: byId("hypercare-approved").checked,
    hypercareApprovalRef: byId("hypercare-approval-ref").value.trim(),
  };
}

function runKey(document) {
  return `${canonicalTool(document.run.tool)}::${document.run.id}`;
}

function validateLegacy(document) {
  if (!document || document.schema !== LEGACY_SCHEMA || !Array.isArray(document.findings)) {
    throw new Error(`file must use ${ASSURANCE_SCHEMA} or ${LEGACY_SCHEMA}`);
  }
  if (typeof document.tool !== "string" || !document.tool.trim()) throw new Error("legacy document.tool is required");
  for (const [index, finding] of document.findings.entries()) {
    if (!finding || typeof finding !== "object") throw new Error(`legacy findings[${index}] must be an object`);
    if (!Object.hasOwn(severityOrder, finding.severity)) throw new Error(`legacy findings[${index}].severity is not canonical`);
  }
  return document;
}

async function readFile(file) {
  if (file.size > MAX_FILE_BYTES) throw new Error(`${file.name}: exceeds the 5 MB local safety limit`);
  let document;
  try {
    document = JSON.parse(await file.text());
  } catch {
    throw new Error(`${file.name}: invalid JSON`);
  }
  if (document.schema === ASSURANCE_SCHEMA) return { type: "assurance", document: validateAssuranceDocument(document) };
  return { type: "legacy", document: validateLegacy(document) };
}

async function loadFiles(fileList) {
  clearMessage();
  const files = [...fileList];
  if (!files.length) return;
  if (files.length > MAX_FILES) {
    showMessage(`Select at most ${MAX_FILES} files at once.`);
    return;
  }
  try {
    const loaded = await Promise.all(files.map(readFile));
    const assurance = [...state.assurance];
    const legacy = [...state.legacy];
    for (const item of loaded) {
      if (item.type === "assurance") {
        const key = runKey(item.document);
        const index = assurance.findIndex((document) => runKey(document) === key);
        if (index >= 0) assurance[index] = item.document;
        else assurance.push(item.document);
      } else {
        const key = `${item.document.tool}::${item.document.generated_at || "undated"}`;
        const index = legacy.findIndex((document) => `${document.tool}::${document.generated_at || "undated"}` === key);
        if (index >= 0) legacy[index] = item.document;
        else legacy.push(item.document);
      }
    }
    const pack = assurance.length ? buildEngagementPack(assurance, options()) : null;
    state.assurance = assurance;
    state.legacy = legacy;
    state.pack = pack;
    render();
    showMessage(`${loaded.length} file${loaded.length === 1 ? "" : "s"} loaded locally.`, "success");
  } catch (error) {
    state.pack = null;
    render();
    showMessage(error instanceof Error ? error.message : String(error));
  }
}

function currentFindings() {
  const assurance = (state.pack?.findings || []).filter((finding) => finding.current !== false).map((finding) => ({
    severity: finding.severity,
    status: finding.status,
    tool: finding.source_tool,
    object: finding.object_ref || finding.object_type,
    category: finding.category,
    title: finding.title,
    description: finding.description,
    owner: (state.pack?.actions || []).find((action) => finding.action_refs.includes(action.id))?.owner_role || "",
  }));
  const legacy = state.legacy.flatMap((document) => document.findings.map((finding) => ({
    severity: finding.severity,
    status: "legacy",
    tool: document.tool,
    object: finding.object_id || finding.object_type || "-",
    category: finding.category || "",
    title: finding.message || finding.id || "Legacy finding",
    description: finding.details?.recommendation || "Legacy findings-only document; excluded from gate decisions.",
    owner: "",
  })));
  return [...assurance, ...legacy];
}

function renderGates() {
  const container = byId("gates");
  if (!state.pack) {
    container.hidden = true;
    return;
  }
  container.hidden = false;
  container.innerHTML = state.pack.gates.map((gate) => {
    const missing = gate.missing_tools.length ? `<div class="gate-note">Missing: ${gate.missing_tools.map(escapeHtml).join(", ")}</div>` : "";
    const unverified = gate.unverified_tools?.length ? `<div class="gate-note">Unverified: ${gate.unverified_tools.map(escapeHtml).join(", ")}</div>` : "";
    return `<article class="gate ${escapeHtml(gate.status)}">
      <div class="gate-id">${escapeHtml(gate.id)}</div>
      <div class="gate-status">${escapeHtml(gate.status.replaceAll("_", " "))}</div>
      <div class="gate-note">${gate.open_critical} critical · ${gate.open_high} high</div>${missing}${unverified}
    </article>`;
  }).join("");
}

function renderSummary() {
  const cards = byId("cards");
  if (!state.pack && !state.legacy.length) {
    cards.hidden = true;
    byId("toolbar").hidden = true;
    byId("tbl").hidden = true;
    byId("meta").hidden = true;
    return;
  }
  const findings = currentFindings();
  const counts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
  findings.forEach((finding) => { counts[finding.severity] += 1; });
  cards.hidden = false;
  cards.innerHTML = `
    <div class="card"><div class="num">${state.pack ? escapeHtml(state.pack.recommendation.replaceAll("_", " ")) : "legacy only"}</div><div class="lbl">Recommendation</div></div>
    <div class="card critical"><div class="num">${counts.critical}</div><div class="lbl">Critical</div></div>
    <div class="card high"><div class="num">${counts.high}</div><div class="lbl">High</div></div>
    <div class="card"><div class="num">${state.assurance.length}</div><div class="lbl">Assurance runs</div></div>
    <div class="card"><div class="num">${state.pack?.summary.evidence || 0}</div><div class="lbl">Evidence refs</div></div>`;
  byId("toolbar").hidden = false;
  byId("tbl").hidden = false;
  byId("meta").hidden = false;
  const runLines = (state.pack?.runs || []).map((run) => `<b>${escapeHtml(run.tool)}</b> ${escapeHtml(run.tool_version)} · ${escapeHtml(run.status)} · ${escapeHtml(run.generated_at)}${run.current ? "" : " · superseded"}`);
  if (state.legacy.length) runLines.push(`<b>${state.legacy.length} legacy file(s)</b> · findings shown but excluded from gates`);
  byId("meta").innerHTML = runLines.join("<br>");
}

function renderRows() {
  const query = state.query.toLowerCase();
  const findings = currentFindings()
    .filter((finding) => state.severity === "all" || finding.severity === state.severity)
    .filter((finding) => !query || [finding.tool, finding.object, finding.category, finding.title, finding.description, finding.owner]
      .some((value) => String(value || "").toLowerCase().includes(query)))
    .sort((left, right) => severityOrder[left.severity] - severityOrder[right.severity]);
  byId("tbody").innerHTML = findings.map((finding) => `<tr>
    <td><span class="sev ${escapeHtml(finding.severity)}">${escapeHtml(finding.severity)}</span></td>
    <td><span class="tool-tag">${escapeHtml(finding.tool)}</span></td>
    <td>${escapeHtml(finding.object)}</td>
    <td>${escapeHtml(finding.owner || "-")}</td>
    <td class="msg"><b>${escapeHtml(finding.title)}</b><div class="rec">${escapeHtml(finding.description)}</div></td>
  </tr>`).join("");
  byId("empty").style.display = findings.length ? "none" : "block";
}

function render() {
  renderGates();
  renderSummary();
  renderRows();
  byId("export-pack").disabled = !state.pack;
  byId("print-pack").disabled = !state.pack;
}

function recompute() {
  clearMessage();
  try {
    state.pack = state.assurance.length ? buildEngagementPack(state.assurance, options()) : null;
    render();
  } catch (error) {
    state.pack = null;
    render();
    showMessage(error instanceof Error ? error.message : String(error));
  }
}

function reset() {
  state.assurance = [];
  state.legacy = [];
  state.pack = null;
  document.querySelectorAll(".scope-option input").forEach((input) => { input.checked = false; });
  document.querySelectorAll(".approval-ref").forEach((input) => { input.value = ""; });
  clearMessage();
  render();
}

function exportPack() {
  if (!state.pack) return;
  const blob = new Blob([`${JSON.stringify(state.pack, null, 2)}\n`], { type: "application/json" });
  const link = document.createElement("a");
  const safeId = state.pack.engagement.id.replace(/[^A-Za-z0-9._-]+/g, "_");
  link.href = URL.createObjectURL(blob);
  link.download = `${safeId}_engagement_pack.json`;
  link.click();
  URL.revokeObjectURL(link.href);
}

const drop = byId("drop");
const fileInput = byId("file-input");
drop.addEventListener("click", () => fileInput.click());
drop.addEventListener("dragover", (event) => { event.preventDefault(); drop.classList.add("over"); });
drop.addEventListener("dragleave", () => drop.classList.remove("over"));
drop.addEventListener("drop", (event) => {
  event.preventDefault();
  drop.classList.remove("over");
  loadFiles(event.dataTransfer.files);
});
fileInput.addEventListener("change", () => {
  loadFiles(fileInput.files);
  fileInput.value = "";
});
document.querySelectorAll(".scope-option input").forEach((input) => input.addEventListener("change", recompute));
document.querySelectorAll(".approval-ref").forEach((input) => input.addEventListener("input", recompute));
document.querySelectorAll(".chip").forEach((chip) => chip.addEventListener("click", () => {
  document.querySelectorAll(".chip").forEach((item) => item.classList.remove("active"));
  chip.classList.add("active");
  state.severity = chip.dataset.sev;
  renderRows();
}));
byId("search").addEventListener("input", (event) => { state.query = event.target.value; renderRows(); });
byId("export-pack").addEventListener("click", exportPack);
byId("print-pack").addEventListener("click", () => window.print());
byId("reset-pack").addEventListener("click", reset);
render();
