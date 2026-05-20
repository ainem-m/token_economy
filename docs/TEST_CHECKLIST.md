# Test Checklist

Use the section for the current phase before considering it complete.

## Phase 1: Static UI

Build:

- TypeScript passes
- production build passes
- no runtime console errors on main routes

Static routes:

- `/kids` renders
- `/parent/record` renders
- `/parent/history` renders
- `/parent/goal` renders

Child kiosk:

- two children are visible
- token numbers are readable
- token counts also have repeated icons for non-readers
- saved tokens are visually distinct from total tokens
- goals and remaining counts are visible
- goal image area is large enough for user-provided images and has a preset fallback
- achieved sample can show `たっせい！` once without duplicate badges
- no spend button
- no grant button
- no cancel button
- no settings controls
- no buyable item list
- no transaction history
- no yen conversion
- no ranking or comparison language

Parent static screens:

- record screen shows child choice, action choice, quick items, amount, memo, record button
- history screen shows date, child, label, amount, memo, cancel button
- goal screen shows child choice, goal title, target amount, image preset, save button

Responsive UI:

- mobile width around 390px
- tablet portrait
- tablet landscape
- no overlapping text
- parent controls reachable on mobile

## Phase 2+: Build

- TypeScript passes
- production build passes
- no runtime console errors on main routes

## Phase 2+: Core Calculations

Given `physicalTokenLimit = 3`:

- balance 0 -> physical 0, saved 0
- balance 2 -> physical 2, saved 0
- balance 3 -> physical 3, saved 0
- balance 5 -> physical 3, saved 2
- negative balance is blocked for normal spend flows; if corrupted data is displayed, total and saved token display must not go below 0

## Phase 2+: Parent Record

- grant adds positive transaction
- spend adds negative transaction
- transaction appears in history
- child balance updates from transactions sum
- total/saved token display updates
- spend greater than current balance is blocked or requires explicit adjust/refund flow

## Phase 3+: History And Cancel

- original transaction remains
- cancel adds opposite amount
- cancel transaction references original transaction
- cancelling twice is prevented or clearly handled
- balance is corrected

## Phase 4+: Goals

- each child has one active goal
- remaining count is `max(targetAmount - balance, 0)`
- progress bar reflects balance against target
- achieved state appears when balance >= targetAmount
- achieved text is `たっせい！`

## All Phases: Child Kiosk Safety

- no spend button
- no grant button
- no cancel button
- no settings controls
- no purchase request button in initial PoC
- no goal request button in initial PoC
- no transaction history
- no yen conversion
- no ranking or comparison language

## All Phases: Responsive UI

Check:

- mobile width around 390px
- tablet portrait
- tablet landscape

Expect:

- no overlapping text
- token numbers readable
- two children visible in kiosk mode
- parent controls reachable with thumb on mobile

## Phase 7: VPS Auth And Parent PIN

- authenticated Cloudflare Access user can open `/kids`
- `/parent/*` shows a PIN lock before parent controls
- requests without the parent PIN cannot create/cancel/update records through API
- valid parent PIN can unlock `/parent/*`
- valid parent PIN can create/cancel/update records
- Cloudflare Access allowlist denies unknown users before they reach the app
- Cloudflare Access JWT is validated server-side

## Phase 8+: Kiosk Resilience

For later phases:

- last updated time is visible
- reload keeps last saved data
- offline state does not blank the app
- wake lock failure does not break the app
