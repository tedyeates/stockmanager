---
inclusion: always
repo: tedyeates/stockmanager
test_command: "cd stockmanagement_bg && .venv/Scripts/pytest && cd ../stockmanagement-fe && npm run test"
type_check_command: "cd stockmanagement_bg && .venv/Scripts/pyright && cd ../stockmanagement-fe && tsc --noEmit"
build_command: "cd stockmanagement-fe && npm run build"
setup_command: "cd stockmanagement_bg && python -m venv .venv && .venv/Scripts/pip install -r requirements.txt && cd ../stockmanagement-fe && npm ci"
concurrency: 3
---
# Project Configuration

## Issue Tracker

Type: github
Repo: tedyeates/stockmanager
CLI: gh
Write access: verified

## Triage Labels

| Role | Label |
|------|-------|
| ready-for-agent | ready-for-agent |
| ready-for-human | ready-for-human |

## Domain Docs

Layout: multi-context
Context Map: CONTEXT-MAP.md
ADRs: docs/adr/
