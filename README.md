# SF Compass

SAP SuccessFactors consulting reference for fast feasibility answers and implementation guidance during client sessions.

Live site: https://sahirvhora.github.io/sf-compass/

## What it does

SF Compass helps SAP SuccessFactors consultants answer client questions during workshops and design sessions.

Type a client question, search across 94 scenarios, and get:

- 94 SAP SuccessFactors feasibility scenarios across 8 modules
- Client-safe plain-English answers
- Technical implementation steps on demand
- Search, feasibility filters, copy summary, and workshop export
- Zero employee data extraction positioning
- No login, no server, no tracking, single HTML file


## Modules covered

| Module | Coverage |
|---|---:|
| Employee Central | 57 scenarios |
| Recruiting | 4 scenarios |
| Onboarding | 3 scenarios |
| Performance | 4 scenarios |
| Compensation | 3 scenarios |
| Learning | 3 scenarios |
| Succession | 3 scenarios |
| Platform | 17 scenarios |
| Total | 94 scenarios |

## Feature summary

| Feature | Purpose |
|---|---|
| Client Query panel | Paste a client question and match across all scenarios |
| Collapsible module sidebar | Browse by SF module and category |
| Feasibility filter | Narrow to Full, Partial, Workaround, or Limited support |
| Implementation Steps toggle | Reveal technical build guidance only when needed |
| Export Pack | Download the currently filtered scenario set as a workshop pack |
| Copy Summary | Copy visible scenarios into notes, proposal drafts, or follow-up emails |
| Dual theme | Dark and light mode for workshop/projector use |
| Offline single-file app | Works locally without backend dependencies |

## Local use

```bash
# Open directly
open index.html

# Or serve locally
python3 -m http.server 8899
# http://localhost:8899
```

## Keyboard shortcuts

| Key | Action |
|---|---|
| / | Focus search bar |
| Esc | Clear or close |
| Click card | Expand full detail |
| Enter in query | Jump to results |

## Tech

| Area | Detail |
|---|---|
| Frontend | Single HTML file with inline CSS and JavaScript |
| Hosting | GitHub Pages |
| Dependencies | None |
| Data handling | Static reference content only |
| Tracking | None |

Built for SAP SuccessFactors consultants who need useful answers during the session, not after it.

## The SF Compass Suite

SF Compass is the front door to a suite of 7 free, open tools for SAP SuccessFactors consultants.

**New to the suite? Start here:** validate position data with the [Position Integrity Checker](https://github.com/SahirVhora/sf-position-integrity-checker), then move clean configuration between tenants with [ObjectSync](https://github.com/SahirVhora/sf-object-sync), then compare configuration across tenants with [Config Compare](https://github.com/SahirVhora/sf-config-compare).

| Tool | What it does | Live |
|---|---|---|
| [Position Integrity Checker](https://github.com/SahirVhora/sf-position-integrity-checker) | Validate position data integrity - HTML and Excel reports | [Site](https://sahirvhora.github.io/sf-position-integrity-checker/) |
| [ObjectSync](https://github.com/SahirVhora/sf-object-sync) | Sync OM foundation objects PRD to Dev - CLI, library, web UI | [Site](https://sahirvhora.github.io/sf-object-sync/) |
| [Config Compare](https://github.com/SahirVhora/sf-config-compare) | Compare metadata and picklists across tenants | [Site](https://sahirvhora.github.io/sf-config-compare/) |
| [Release Tracker](https://github.com/SahirVhora/sf-release-update) | Live tracker for 1H/2H release changes | [Site](https://sahirvhora.github.io/sf-release-update/) |
| [Impact Brief](https://github.com/SahirVhora/sf-impact-brief) | Personalised release impact briefs with tiered action plans | [Site](https://sahirvhora.github.io/sf-impact-brief/) |
| [Pay Transparency](https://github.com/SahirVhora/sf-pay-transparency) | EU Pay Transparency Directive readiness check | [Site](https://sahirvhora.github.io/sf-pay-transparency/) |
| [Value Navigator](https://github.com/SahirVhora/sf-value-navigator) | Value realisation consulting framework | [Site](https://sahirvhora.github.io/sf-value-navigator/) |
