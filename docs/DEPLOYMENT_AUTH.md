# Deployment And Auth

This document defines the target deployment direction after the local PoC.

## Goal

Run the app on a VPS and expose it through Cloudflare Tunnel.

Access behavior:

- allowed Cloudflare Access users can view `/kids`
- parent actions under `/parent/*` are unlocked with an in-app PIN
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

Cloudflare Access is the outer authentication layer. The app server still verifies the Access token so only allowed family users can reach API data. Parent write access is checked separately with an app PIN.

## Why The App Needs Server-Side Auth

The current local PoC stores state in browser `localStorage`. That is fine for UI and workflow testing, but it is not enough for shared-device parent permissions.

Do not implement real parent permission by hiding buttons in React only. A child browser can still call client code or API endpoints unless the server denies mutations.

Required rule:

```text
all writes must require the parent PIN on the server
```

## Parent PIN Model

Initial authorization model:

```text
Cloudflare Access allowlist: family members who may reach the app
TOKEN_ECO_PARENT_PIN: shared parent PIN required for /parent/* and writes
```

Rules:

- `/kids` is display-only and does not require the app PIN.
- `/parent/*` requires the app PIN.
- Ledger writes require the app PIN on the server.
- The app does not persist the PIN; leaving parent mode locks parent screens again.
- Cloudflare logout/account switching is not part of the parent/child separation.

## Route Policy

Frontend routes:

- `/kids`: allowed for any Cloudflare Access user
- `/parent/*`: requires parent PIN

API policy:

- `GET /api/kiosk-state`: Cloudflare Access user
- `GET /api/parent-state`: parent PIN
- `POST /api/transactions`: parent PIN
- `POST /api/transactions/:id/cancel`: parent PIN
- `POST /api/goals`: parent PIN
- `POST /api/settings`: parent PIN

The child kiosk must continue to be display-only.

## Cloudflare Access

Use Cloudflare Access to restrict who can reach the app.

Recommended first setup:

- one self-hosted Access application for `token.example.com`
- One-time PIN or an IdP such as Google as the login method
- explicit allowlist of family emails
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

After validation, attach the email to the request context for display/debugging. Do not use Cloudflare email as the parent/child permission boundary in the initial PoC.

Do not trust a role sent by the browser. Do not trust React-only route hiding for parent actions.

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
- auth mode: local dev API access unless `TOKEN_ECO_AUTH_MODE=cloudflare`

Cloudflare Access mode:

```bash
TOKEN_ECO_AUTH_MODE=cloudflare
CLOUDFLARE_TEAM_DOMAIN=https://<team-name>.cloudflareaccess.com
CLOUDFLARE_POLICY_AUD=<access-application-aud>
TOKEN_ECO_PARENT_PIN=2525
npm start
```

Cloudflare Tunnel should point to the local service:

```text
http://localhost:8787
```

Parent API calls must send the PIN:

```text
x-token-eco-parent-pin: 2525
```

## Phase Order

1. Add an API/data-access boundary while keeping local dev simple.
2. Move persistence from `localStorage` to SQLite + API.
3. Add Cloudflare Access token verification middleware.
4. Add parent PIN route guards.
5. Deploy to VPS behind Cloudflare Tunnel.
6. Add backup and basic operational checks.

## Prune Rules

Do not add:

- multiple family tenancy in the first VPS version
- child-side purchase requests
- child-side goal requests
- social login inside the app if Cloudflare Access is already handling login
- a complex admin console before parent workflows are stable
