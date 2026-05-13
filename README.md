# SF Compass

### Instant feasibility answers for SAP SuccessFactors Employee Central. Built for client sessions.

---

## What it does

Every SF consultant knows the moment — the client leans forward and asks *"Can we do this in Employee Central?"*

SF Compass answers that question instantly. Type your client's question, get a color-coded feasibility answer in plain English. Toggle one switch, and you see exactly how to build it — menu paths, field names, rule types, all sourced from the SAP SF Implementation Workbook.

**74 customization scenarios across 12 EC domains.** No dependencies. No server. One HTML file.

---

## Why this exists

Client sessions move fast. You can't say "let me get back to you" on every question. But you also can't dive into technical detail about MDF generic objects and event derivation rules while the project sponsor is in the room.

SF Compass gives you **two modes in one tool**:

| Mode | What the client sees | What you see |
|------|---------------------|--------------|
| **Client-ready** (default) | Plain-English feasibility + approach | Same — keeps everyone aligned |
| **Implementation Steps** (toggle ON) | Hidden | Numbered technical steps with exact Admin Center paths, field IDs, rule types, and SAP workbook references |

---

## Features

- 🔍 **Instant search** — press `/` and type. Searches questions, summaries, tags, and technical steps simultaneously
- 🟢🟡🟠🔴 **4-level feasibility** — Full / Partial / Workaround / Limited — color-coded throughout
- ⚙ **Implementation Steps toggle** — prominent purple pill with "PRO" badge; reveals exact configuration steps when you need them
- ☀☾ **Apple-inspired theme system** — dark mode by default, light mode with one click, auto-detects your OS preference
- 📱 **Responsive** — works on laptop during sessions, tablet on the go
- 🔖 **Filter by domain** — 12 EC categories in the sidebar with entry counts
- 🏷 **Feasibility filter** — narrow to "Full support only" when scoping what's achievable
- 💾 **Remembers preferences** — theme choice saved locally

---

## Coverage

| Domain | Scenarios |
|--------|-----------|
| Foundation Objects | 7 |
| Position Management | 6 |
| Employee Data Model | 9 |
| Business Rules | 7 |
| Workflows & Approvals | 6 |
| Event Reasons | 4 |
| UI & Self-Service | 5 |
| Reporting & Analytics | 6 |
| Integrations | 6 |
| Compliance & Localization | 7 |
| Time & Attendance | 6 |
| Data Import & Migration | 5 |
| **Total** | **74** |

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
| `Space` | Not used (reserved) |

---

## Screenshots

> Open `index.html` in your browser to see it live. Dark and light themes both included.

---

## Tech

- Single HTML file — CSS + JS inline
- Zero dependencies, zero build step, zero npm
- Runs offline, works in any modern browser
- CSS custom properties for theming — clean light/dark switch with smooth transitions
- No analytics, no tracking, no external requests

---

## Roadmap

- [ ] RCM (Recruiting) module
- [ ] ONB (Onboarding) module
- [ ] LMS (Learning) module
- [ ] Export as PDF for offline session packs
- [ ] Multi-select comparison mode (compare 2-3 scenarios side by side)

---

Built for SF consultants who need answers during the session, not after it.
