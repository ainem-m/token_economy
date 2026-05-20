# Deployment And Auth

This document defines the target deployment direction after the local PoC.

## Goal

Run the app on a VPS and expose it through Cloudflare Tunnel.

Access behavior:

- child account: can view `/kids`
- parent account: can view `/kids` and edit under `/parent/*`
- children must never be able to mutate the ledger

## Recommended Architecture

```text
browser
  -> Cloudflare Access
  -> Cloudflare Tunnel
  -> VPS localhost service
  -> app server / API
  -> SQLite database
```

Cloudflare Tunnel publishes the VPS-local service without opening inbound VPS ports.

Cloudflare Access is the outer authentication layer. The app server still verifies the Access token and maps the authenticated email to an application role.

## Why The App Needs Server-Side Auth

The current local PoC stores state in browser `localStorage`. That is fine for UI and workflow testing, but it is not enough for real account roles.

Do not implement real parent/child permission by hiding buttons in React only. A child browser can still call client code or API endpoints unless the server denies mutations.

Required rule:

```text
all writes must be checked on the server
```

## Account Model

Initial account model:

```ts
type AccountRole = "parent" | "child";

type Account = {
  id: string;
  email: string;
  role: AccountRole;
  childId?: string;
  isActive: boolean;
};
```

Rules:

- `parent` can read all family data and perform ledger/goal/settings writes.
- `child` can only read the kiosk display.
- `child.childId` can be used later if each child gets a personal display, but the initial kiosk can still show both children.
- Unknown authenticated emails are denied by default.

## Route Policy

Frontend routes:

- `/kids`: allowed for `parent` and `child`
- `/parent/*`: allowed for `parent` only

API policy:

- `GET /api/kiosk-state`: `parent` or `child`
- `GET /api/parent-state`: `parent`
- `POST /api/transactions`: `parent`
- `POST /api/transactions/:id/cancel`: `parent`
- `POST /api/goals`: `parent`
- `POST /api/settings`: `parent`

The child kiosk must continue to be display-only even if loaded from a child account.

## Cloudflare Access

Use Cloudflare Access to restrict who can reach the app.

Recommended first setup:

- one self-hosted Access application for `token.example.com`
- One-time PIN or an IdP such as Google as the login method
- explicit allowlist of parent and child emails
- no `Bypass` policy for application routes
- do not use broad `Everyone` or all-valid-email allow rules

Optional later setup:

- separate `kids.example.com` and `parent.example.com` hostnames
- stricter Access policy for the parent hostname
- device posture or WARP only if family operation actually needs it

## Server Token Verification

The server should validate Cloudflare Access JWTs from the `Cf-Access-Jwt-Assertion` header.

Validation inputs:

- `TEAM_DOMAIN`, for example `https://<team-name>.cloudflareaccess.com`
- `POLICY_AUD`, the Access application audience tag

Validation checks:

- JWT signature
- issuer
- audience
- email claim

After validation, look up the email in the local `accounts` table and attach `role` to the request context.

Do not trust a role sent by the browser.

## VPS Runtime Shape

Recommended first VPS stack:

- Node server serving built Vite assets
- API routes in the same process
- SQLite database on disk
- `cloudflared` running as a systemd service
- daily SQLite backup

This keeps the system small while allowing real multi-device sync and server-side permissions.

## Current Repository Entry Point

The repository now includes a small Node server entry point:

```bash
npm run build
npm start
```

Default runtime values:

- port: `8787`
- host: `127.0.0.1`
- SQLite path: `data/token-eco.sqlite`
- auth mode: local dev parent account unless `TOKEN_ECO_AUTH_MODE=cloudflare`

Cloudflare Access mode:

```bash
TOKEN_ECO_AUTH_MODE=cloudflare
CLOUDFLARE_TEAM_DOMAIN=https://<team-name>.cloudflareaccess.com
CLOUDFLARE_POLICY_AUD=<access-application-aud>
TOKEN_ECO_PARENT_EMAILS=parent@example.com
TOKEN_ECO_CHILD_EMAILS=child@example.com
npm start
```

Cloudflare Tunnel should point to the local service:

```text
http://localhost:8787
```

In local dev mode, API tests can simulate role headers:

```text
x-token-eco-role: parent
x-token-eco-role: child
```

## Phase Order

1. Add an API/data-access boundary while keeping local dev simple.
2. Move persistence from `localStorage` to SQLite + API.
3. Add Cloudflare Access token verification middleware.
4. Add account role mapping and route guards.
5. Deploy to VPS behind Cloudflare Tunnel.
6. Add backup and basic operational checks.

## Prune Rules

Do not add:

- multiple family tenancy in the first VPS version
- child-side purchase requests
- child-side goal requests
- social login inside the app if Cloudflare Access is already handling login
- a complex admin console before parent workflows are stable
