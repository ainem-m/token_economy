# Agent Instructions

This repository builds a child-facing token economy PoC.

Use [docs/CODEX_START_HERE.md](docs/CODEX_START_HERE.md) as the first orientation document, and treat [PLAN.md](PLAN.md) as the full source of truth.

Use [docs/PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md) for the Phase 1 file layout.

## Required Workflow

For every implementation task, follow:

```text
plan -> observe -> implement -> test -> refactor -> prune
```

Do not skip `prune`. This product must stay intentionally small on the child-facing side.

## Product Guardrails

- `/kids` is a display-only kiosk.
- Children must not be able to mutate the ledger.
- Do not show yen conversion on `/kids`.
- Do not show transaction history on `/kids`.
- Do not implement child purchase requests in the initial PoC.
- Do not implement child goal requests in the initial PoC.
- Do not use ranking or sibling comparison language.
- Do not make punishment, fines, confiscation, or point loss a primary feature.
- Transactions are append-only.
- Corrections are made by adding cancel transactions, not by deleting or editing history.

## Core Formula

```text
balance = sum(transactions.amount)
displayBalance = max(balance, 0)
physicalTokens = min(displayBalance, settings.physicalTokenLimit)
savedTokens = max(displayBalance - settings.physicalTokenLimit, 0)
```

Default settings:

```text
tokenYen = 250
physicalTokenLimit = 3
weeklyGrantAmount = 2
```

## Initial Implementation Bias

Unless the user says otherwise, start with the local PoC path:

- React
- TypeScript
- Vite
- localStorage or IndexedDB
- no backend yet

Start with Phase 1 static UI, then Phase 2 local persistence.

Phase 1 is static only:

- build `/kids`, `/parent/record`, `/parent/history`, `/parent/goal`
- use fixed sample data
- do not implement persistence
- do not implement real ledger mutations
- do not implement `/parent/shop` or `/parent/settings`

## Before Coding

State:

- selected phase
- scope
- exclusions
- files expected to change
- verification plan

## Before Finishing

Verify against:

- [docs/TEST_CHECKLIST.md](docs/TEST_CHECKLIST.md)
- current phase done criteria in [docs/IMPLEMENTATION_ROADMAP.md](docs/IMPLEMENTATION_ROADMAP.md)
