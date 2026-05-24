# SF Compass

SAP SuccessFactors consulting hub for fast feasibility answers, implementation guidance, and links to supplementary SF tools.

Live site: https://sahirvhora.github.io/sf-compass/

## What it does

SF Compass helps SAP SuccessFactors consultants answer client questions during workshops and design sessions.

Type a client question, search across 94 scenarios, and get:

- Plain-English feasibility answer
- Support level: Full, Partial, Workaround, Limited
- Relevant SF module and category
- Suggested approach
- Optional implementation steps with Admin Center paths, field/rule hints, and technical notes
- Exportable workshop pack or copy-ready summary

No server. No login. No tracking. Single HTML file.

## Who it is for

| Audience | Problem it solves | How SF Compass helps |
|---|---|---|
| SF functional consultants | Client asks “can SuccessFactors do this?” during a live session | Gives fast feasibility guidance in client-ready language |
| EC leads | Need to explain configuration choices without overloading sponsors | Separates plain-English answer from technical implementation steps |
| Solution architects | Need quick cross-module scoping reference | Groups scenarios by module, category, and feasibility level |
| Delivery teams | Need follow-up notes after workshops | Export Pack and Copy Summary create reusable workshop output |
| HR transformation sponsors | Need to understand what is standard, partial, workaround, or limited | Uses colour-coded support levels and practical descriptions |

## Tool suite links

SF Compass is the front door for a wider SAP SuccessFactors supplementary toolkit.

| Tool | Who it is for | Problem it solves | Link |
|---|---|---|---|
| SF Compass | SF consultants and architects | Feasibility answers and implementation guidance during client sessions | https://sahirvhora.github.io/sf-compass/ |
| SF Release Update | Release leads and test managers | Converts SAP release updates into impact categories and testing focus | https://sahirvhora.github.io/sf-release-update/ |
| SF Pay Transparency | Reward, HRIS, and compliance teams | Frames EU Pay Transparency readiness across data, ranges, reporting, and evidence | https://sahirvhora.github.io/sf-pay-transparency/ |
| SF Value Navigator | Sponsors and consulting teams | Maps SF capabilities to adoption, value realisation, and measurable outcomes | https://sahirvhora.github.io/sf-value-navigator/ |
| SF Position Integrity Checker | EC data and migration teams | Validates position hierarchy, incumbency, mandatory fields, and data-quality risks | https://github.com/SahirVhora/sf-position-integrity-checker |
| SAPSF ObjectSync | SF technical and environment teams | Supports controlled foundation-object synchronisation between SF environments | https://github.com/SahirVhora/SAPSF_ObjectSync |

## Modules covered

| Module | Coverage |
|---|---:|
| Employee Central | 67 scenarios |
| Recruiting | 4 scenarios |
| Onboarding | 3 scenarios |
| Performance and Goals | 4 scenarios |
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

## Sample outputs and evidence

| Asset | What it shows | Link |
|---|---|---|
| Live demo | Search, filtering, client query, implementation toggle, and tool links | https://sahirvhora.github.io/sf-compass/ |
| Social preview | Public preview image used for GitHub and LinkedIn sharing | https://sahirvhora.github.io/sf-compass/preview.png |
| Workshop pack export | Use the Export Pack button in the app after filtering scenarios | In-app |
| Copy-ready summary | Use the Copy Summary button in the app for notes and client follow-up | In-app |

## Design principles

| Principle | Meaning |
|---|---|
| Client-safe first | Default view uses plain English and avoids unnecessary technical depth |
| Technical depth on demand | Implementation steps are available behind a clear toggle |
| Zero employee data extraction | The app is a static reference tool and does not connect to tenant data |
| Workshop speed | Search, filter, copy, and export are optimised for live sessions |
| No build complexity | Single HTML file, inline CSS and JS, no npm, no backend |

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
