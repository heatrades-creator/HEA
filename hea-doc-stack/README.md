# HEA Free Document Stack

## 1. Overview

The HEA Document Stack is a zero-recurring-cost document automation pipeline for Home Energy Australia, built entirely on Google Apps Script. It accepts Google Form submissions, uses the Claude AI API to generate structured proposal content, fills a Google Slides master template with the generated content, exports a client-facing PDF, and stores all artefacts in Google Drive — all without any paid SaaS subscription.

---

## 2. Architecture

| Layer | Technology | Role |
|---|---|---|
| **Design Reference** | Google Slides (master template) | Branded visual template with `{{PLACEHOLDER}}` tokens |
| **Template Runtime** | SlidesApp / DocumentApp (GAS) | Duplicate master, replace placeholders, export PDF |
| **Intelligence** | Claude API via UrlFetchApp | Generate structured JSON content from job intake data |
| **Orchestration** | Google Apps Script triggers | Connect form → normalise → AI → fill → export → log |
| **Approval** | SIGNING_QUEUE + DocuSeal/OpenSign (Phase 7) | Route signed PDFs back to job folder |

---

## 3. Prerequisites

- **Node.js** (v18+) and **npm** — required to install clasp
- **clasp** — Google's CLI for Apps Script: `npm install -g @google/clasp`
- **Google Account** — with access to Google Sheets, Drive, Slides, and Forms
- **Claude API key** — from [console.anthropic.com](https://console.anthropic.com)

---

## 4. First-Time Setup

### a. Clone the repository
```bash
git clone <repo-url>
cd hea-doc-stack
```

### b. Authenticate clasp
```bash
clasp login
```

### c. Create a new Google Sheet
Go to [sheets.google.com](https://sheets.google.com), create a blank spreadsheet, and note the **Sheet ID** from the URL:
`https://docs.google.com/spreadsheets/d/**SHEET_ID**/edit`

### d. Create a bound Apps Script project
In the spreadsheet: **Extensions → Apps Script**. Note the **Script ID** from the URL in the Apps Script editor:
`https://script.google.com/home/projects/**SCRIPT_ID**/edit`

### e. Update `.clasp.json`
Replace `REPLACE_WITH_YOUR_SCRIPT_ID` in `.clasp.json` with your Script ID.

### f. Push the codebase
```bash
clasp push
```

### g. Run `setupSheetHeaders()`
In the Apps Script editor, open `setup.gs` (note: this file is not pushed by clasp — copy it manually or run it from the `scripts/` folder locally). Select `setupSheetHeaders` from the function dropdown and click **Run**. This creates all 10 tabs with correct headers and seeds SETTINGS and BRAND_CONFIG.

### h. Set the Claude API key
In the Apps Script editor: **Project Settings → Script Properties → Add property**:
- Key: `CLAUDE_API_KEY`
- Value: your Anthropic API key

### i. Create a Google Slides master template
Design your proposal template in Google Slides using `{{PLACEHOLDER}}` tokens (e.g. `{{CLIENT_NAME}}`, `{{SCOPE_SUMMARY}}`). Note the file's **Drive file ID**.

### j. Add the template to `TEMPLATE_CONFIG`
In the spreadsheet's `TEMPLATE_CONFIG` tab, add a row:

| template_id | doc_class | runtime_type | master_file_id | output_folder_rule | export_pdf | require_signing | active |
|---|---|---|---|---|---|---|---|
| HEA_TEMPLATE_SOLAR_BATTERY_PROPOSAL_MASTER_v001 | solar_battery_proposal | SLIDES | `<your-file-id>` | proposal | TRUE | FALSE | TRUE |

### k. Add the placeholder manifest
In the same `TEMPLATE_CONFIG` row, paste the JSON manifest (from Section 6 of the build brief) into the `placeholder_manifest_json` column.

### l. Run `testDryRun()` to verify prompt output
In the Apps Script editor, select `testDryRun` and click **Run**. Check the execution log for the generated system prompt and user content. No API calls or Drive writes are made.

### m. Set up the Form submit trigger
In the Apps Script editor: **Triggers (clock icon) → Add Trigger**:
- Function: `onFormSubmit`
- Event source: From spreadsheet
- Event type: On form submit

---

## 5. Running Tests

In the Apps Script editor, select `runAllTests` from the function dropdown and click **Run**. Results appear in the **Execution Log** panel. The final line shows `=== X/Y TESTS PASSED ===`.

---

## 6. Module Map

| File | Role |
|---|---|
| `src/Config.gs` | All constants — tabs, stages, error classes, Claude config |
| `src/Utilities.gs` | Pure utility functions — string, date, coercion |
| `src/Logger.gs` | Console logging and sheet log writes (`Logger_`) |
| `src/SheetRepository.gs` | All Spreadsheet I/O — reads, writes, updates |
| `src/DriveRepository.gs` | All Drive I/O — folders, files, links |
| `src/TemplateRegistry.gs` | Reads template config and placeholder manifests |
| `src/JobService.gs` | Job lifecycle — IDs, registration, folder, output names |
| `src/Normalizer.gs` | Raw form data → canonical normalised object |
| `src/PromptBuilder.gs` | Builds Claude API prompt payloads |
| `src/ClaudeClient.gs` | HTTP client for Claude API with retry logic |
| `src/JsonValidator.gs` | Parses and validates Claude JSON responses |
| `src/SlidesTemplateEngine.gs` | Google Slides placeholder replacement and PDF audit |
| `src/DocsTemplateEngine.gs` | Google Docs placeholder replacement (secondary runtime) |
| `src/ExportService.gs` | Exports Slides/Docs files to PDF via Drive export URL |
| `src/SigningService.gs` | Signing queue writer (Phase 7 stub) |
| `src/TriggerHandlers.gs` | Apps Script entry points and 17-step pipeline |

---

## 7. Placeholder Standard

- **Format**: `{{UPPER_SNAKE_CASE}}` — double curly braces, uppercase only, underscores allowed
- **Naming**: Descriptive, unambiguous — e.g. `{{SCOPE_SUMMARY}}` not `{{SCOPE}}`
- **Null policies**:
  - `error` — required field; pipeline throws if absent
  - `today` — replaced with today's date in long format
  - `TBC` — replaced with the literal string "TBC"
  - `empty` — replaced with empty string if absent
- **Character budgets**: Enforced by the Claude prompt constraints; long_text fields max 300–400 chars

---

## 8. Adding a New Template

1. Design the Google Slides (or Docs) master with `{{PLACEHOLDER}}` tokens
2. Note the Drive file ID of the master
3. Write the `placeholder_manifest_json` for the new template (follow the Section 6 schema)
4. Add a new row to `TEMPLATE_CONFIG` with `active = TRUE` and a unique `template_id`
5. Add a `PROMPT_CONFIG` row for the new `doc_class` if custom AI instructions are needed

---

## 9. Error Recovery

To re-run a failed job after fixing the underlying issue:

```javascript
// In Apps Script editor — run this function:
manualRunByJobId('JOB-2026-0001')
```

This looks up the existing normalised data for the job and replays the full pipeline. Check the `ERROR_LOG` tab to identify what failed before retrying.

---

## 10. Phase Roadmap

| Phase | Description |
|---|---|
| 1 | Core pipeline: form → normalise → Claude → Slides → PDF → Drive |
| 2 | Multi-template support (smarthome_proposal, energy_audit_report) |
| 3 | Prompt Config sheet — per-doc-class Claude instructions |
| 4 | Brand Config integration — dynamic brand values in placeholders |
| 5 | Output versioning — v002, v003 on manual re-runs |
| 6 | Dashboard view — JOBS_REGISTER read via web app |
| 7 | E-signature integration — DocuSeal or OpenSign via SIGNING_QUEUE |
| 8 | Client portal — read-only PDF delivery link per job |
| 9 | Automated testing pipeline — CI via clasp run in GitHub Actions |
