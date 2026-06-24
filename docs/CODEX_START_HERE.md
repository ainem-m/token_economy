# Codex Start Here

When starting a new implementation turn, read in this order:

1. [README.md](../README.md)
2. [docs/AGENT_WORKFLOW.md](AGENT_WORKFLOW.md)
3. [docs/REQUIREMENTS.md](REQUIREMENTS.md)
4. The specific doc for the current task:
   - Data work: [docs/DATA_MODEL.md](DATA_MODEL.md)
   - UI work: [docs/UI_GUIDE.md](UI_GUIDE.md)
   - File layout: [docs/PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)
   - Phase planning: [docs/IMPLEMENTATION_ROADMAP.md](IMPLEMENTATION_ROADMAP.md)
   - Deployment/auth: [docs/DEPLOYMENT_AUTH.md](DEPLOYMENT_AUTH.md)
   - Verification: [docs/TEST_CHECKLIST.md](TEST_CHECKLIST.md)
5. [PLAN.md](../PLAN.md) for the relevant phase before coding

## Current Implementation Baseline

The app is past the initial static phase. Current baseline:

- React + TypeScript + Vite frontend
- Node API serving built assets
- SQLite source of truth for VPS-style runs
- parent PIN required for `/parent/*` and write APIs
- `/kids` remains display-only
- mission v1 is parent-managed: one current mission per child, child-facing display only

Current exclusions:

- no child-side ledger mutations
- no `/parent/shop`
- no PWA hardening

Before coding, state:

- selected phase
- exact scope
- excluded features
- files expected to be created
- verification plan

## Guardrails

Do not add child-side ledger mutation.

Do not show yen conversion or history on `/kids`.

Do not implement child purchase requests in the initial PoC.

Do not delete transaction history.

Do not treat siblings as a ranking.
