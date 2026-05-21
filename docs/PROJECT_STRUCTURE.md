# Project Structure

Current structure for the VPS-ready PoC. Keep the codebase small and route-oriented.

## Current Tree

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
├── server/
│   ├── auth.mjs
│   ├── db.mjs
│   ├── seedData.mjs
│   └── server.mjs
└── src/
    ├── api/
    │   └── client.ts
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
            ├── ParentRecord.tsx
            └── ParentSettings.tsx
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

Static seed/fallback fixtures.

- fixed children
- fixed shop items
- fixed goals
- fixed transactions
- fixed settings

Do not put persistence logic here.

### `src/api/`

Frontend API boundary.

- calls Node API routes
- attaches parent PIN only for parent reads/writes
- converts network/permission failures into small app-level errors

### `src/screens/`

Route-level screens.

- `KidsKiosk.tsx`
- `parent/ParentRecord.tsx`
- `parent/ParentHistory.tsx`
- `parent/ParentGoal.tsx`
- `parent/ParentSettings.tsx`

Screens may compose components and call callbacks passed from `App.tsx`.

### `src/components/`

Reusable UI components.

Suggested split:

- `common/`: buttons, progress bars, token badges, layout helpers
- `kids/`: child kiosk panels, savings badge, affordable item list
- `parent/`: record form, history rows, goal form

Avoid abstract component layers before duplication exists.

### `src/styles/`

Global app styling.

One global CSS file is still acceptable at this size. Split CSS only when it becomes hard to maintain.

### `server/`

Small Node runtime for VPS-style deployment.

- `server.mjs`: static asset serving and API routing
- `auth.mjs`: Cloudflare Access verification and parent PIN check
- `db.mjs`: SQLite access and document/transaction persistence
- `seedData.mjs`: initial data

## Routing

- `/kids`
- `/parent/record`
- `/parent/history`
- `/parent/goal`
- `/parent/settings`

Redirect `/` to `/kids` or render the same screen.

Do not add yet:

- `/parent/shop`
- child purchase routes
- child goal request routes

## Import Direction

Keep dependencies one-way:

```text
screens -> components -> domain
screens -> api
state -> data -> domain
components -> domain
server -> seed data
```

Avoid:

- `domain` importing React
- `data` importing screens/components
- child components importing parent components
- parent components importing kids components, except shared `common`
- visual components performing direct fetches
- frontend role flags controlling mutations
