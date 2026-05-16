# SF Compass

### Instant feasibility answers for SAP SuccessFactors. All 8 modules. Built for client sessions.

---

## What it does

Every SF consultant knows the moment — the client leans forward and asks *"Can we do this in SuccessFactors?"*

SF Compass answers that question instantly. Type your client's question, get a color-coded feasibility answer in plain English. Toggle one switch, and you see exactly how to build it — menu paths, field names, rule types, all sourced from SF implementation workbooks.

**94 customization scenarios across 8 SF modules.** No dependencies. No server. One HTML file.

---

## Why this exists

Client sessions move fast. You can't say "let me get back to you" on every question. But you also can't dive into technical detail about MDF generic objects and event derivation rules while the project sponsor is in the room.

SF Compass gives you **two modes in one tool**:

| Mode | What the client sees | What you see |
|------|---------------------|--------------|
| **Client-ready** (default) | Plain-English feasibility + approach | Same — keeps everyone aligned |
| **Implementation Steps** (toggle ON) | Hidden | Numbered technical steps with exact Admin Center paths, field IDs, rule types, and workbook references |

---

## Modules covered (94 scenarios)

### Employee Central (67)
Foundation Objects (7) · Position Management (6) · Employee Data Model (9) · Business Rules (7) · Workflows & Approvals (6) · Event Reasons (4) · UI & Self-Service (5) · Time & Attendance (6) · Compliance & Localization (7)

### Recruiting (4)
Requisitions · Candidate Management · Offer Letters · Career Site

### Onboarding (3)
Onboarding Processes · Document Collection · Compliance Forms

### Performance & Goals (4)
Performance Forms · Goal Management · Calibration · 360 Reviews

### Compensation (3)
Base Salary · Variable Pay · Equity / Long-Term Incentives

### Learning (3)
Course Catalog · Assignments · External Content Integration

### Succession (3)
Talent Nominations · Talent Pools · Development Plans

### Platform (17)
Integrations · Reporting & Analytics · Data Import & Migration

---

## Features

- 🎯 **Client Query panel** — paste a client's full question, matches across all 94 scenarios as you type
- 🏗 **Collapsible sidebar** — 8 modules as top-level accordion items, click to expand and see categories
- 🟢🟡🟠🔴 **4-level feasibility** — Full / Partial / Workaround / Limited — color-coded throughout
- ⚙ **Implementation Steps toggle** — prominent pill button reveals exact configuration steps
- ☀☾ **Premium dual theme** — dark mode (Linear-inspired navy + gold), light mode (warm parchment tones)
- 📱 **Responsive** — works on laptop during sessions, tablet on the go
- 🔖 **Filter by module/category** — sidebar with entry counts, click to narrow
- 🏷 **Feasibility filter** — narrow to "Full support only" when scoping
- 💾 **Remembers preferences** — theme choice saved locally

---

## How to use

```bash
# Open directly — no server, no build, no install
open index.html

# Or serve for local network access
python3 -m http.server 8899
# → http://localhost:8899
```

**Keyboard shortcuts:**

| Key | Action |
|-----|--------|
| `/` | Focus search bar |
| `Esc` | Clear / close |
| Click card | Expand full detail |
| `Enter` (in query) | Jump to results |

---

## Tech

- Single HTML file — CSS + JS inline
- Zero dependencies, zero build step, zero npm
- Runs offline, works in any modern browser
- CSS custom properties for theming — premium light/dark switch with smooth transitions
- No analytics, no tracking, no external requests

---

Built for SF consultants who need answers during the session, not after it.

## Latest Enhancement

- **Scenario Pack export** — consultants can now export the currently filtered feasibility scenarios as a plain-text workshop pack.
- **Copy Summary** — copies the visible scenario set for quick paste into client notes, proposals, or follow-up emails.
- **Implementation-aware output** — when Implementation Steps are toggled on, exported packs include technical notes as well as client-ready summaries.
