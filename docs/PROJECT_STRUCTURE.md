# Project Structure

Phase 1 starts from an empty workspace. Use this structure when creating the Vite React app.

## Target Tree After Phase 1

```text
.
├── AGENTS.md
├── PLAN.md
├── README.md
├── docs/
│   ├── AGENT_WORKFLOW.md
│   ├── CODEX_START_HERE.md
│   ├── DATA_MODEL.md
│   ├── IMPLEMENTATION_ROADMAP.md
│   ├── PROJECT_STRUCTURE.md
│   ├── README.md
│   ├── REQUIREMENTS.md
│   ├── TEST_CHECKLIST.md
│   └── UI_GUIDE.md
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── public/
│   ├── icon.svg
│   └── manifest.webmanifest
└── src/
    ├── App.tsx
    ├── main.tsx
    ├── styles/
    │   └── global.css
    ├── data/
    │   └── sampleData.ts
    ├── domain/
    │   ├── calculations.ts
    │   └── types.ts
    ├── components/
    │   ├── common/
    │   ├── kids/
    │   └── parent/
    └── screens/
        ├── KidsKiosk.tsx
        └── parent/
            ├── ParentGoal.tsx
            ├── ParentHistory.tsx
            └── ParentRecord.tsx
```

## Responsibilities

### `src/domain/`

Pure product logic and types.

- no React imports
- no browser APIs
- no styling
- safe to test independently later

Expected files:

- `types.ts`: `Child`, `Transaction`, `Goal`, `ShopItem`, `Settings`
- `calculations.ts`: balance, physical tokens, saved tokens, remaining goal count

### `src/data/`

Static fixtures for Phase 1.

- fixed children
- fixed shop items
- fixed goals
- fixed transactions
- fixed settings

Do not use localStorage here in Phase 1.

### `src/screens/`

Route-level screens.

- `KidsKiosk.tsx`
- `parent/ParentRecord.tsx`
- `parent/ParentHistory.tsx`
- `parent/ParentGoal.tsx`

Screens may compose components and sample data.

### `src/components/`

Reusable UI components.

Suggested split:

- `common/`: buttons, progress bars, token badges, layout helpers
- `kids/`: child kiosk panels, physical token meter, savings badge, affordable item list
- `parent/`: record form, history rows, goal form

Avoid abstract component layers before duplication exists.

### `src/styles/`

Global app styling for Phase 1.

Phase 1 can use one global CSS file. Split CSS later only if it becomes hard to maintain.

## Routing In Phase 1

Use simple path-based routing in `App.tsx`.

Required routes:

- `/kids`
- `/parent/record`
- `/parent/history`
- `/parent/goal`

Redirect `/` to `/kids` or render the same screen.

Do not add:

- `/parent/shop`
- `/parent/settings`
- backend routes
- auth routes

## Import Direction

Keep dependencies one-way:

```text
screens -> components -> domain
screens -> data -> domain
components -> domain
```

Avoid:

- `domain` importing React
- `data` importing screens/components
- child components importing parent components
- parent components importing kids components, except shared `common`

## Phase 2 Changes

When moving to Phase 2:

- add `src/store/` or `src/state/` for local persistence
- keep `domain/` pure
- keep `sampleData.ts` as seed/fallback data
- do not mix persistence into visual components

