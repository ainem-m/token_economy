# Token Eco PoC

子ども向けトークン管理アプリのPoC。

このリポジトリでは、[PLAN.md](PLAN.md) を最上位の仕様書として扱う。実装者はまずこのREADMEと [docs/CODEX_START_HERE.md](docs/CODEX_START_HERE.md) を読み、作業対象に応じて補助ドキュメントとPLAN.mdを確認する。

## Product Goal

子どもの「無限のわがまま」を、家族で合意した有限のリソースとして見える化する。

- 子どもに「計画」と「我慢」の感覚を持ってもらう
- 物理タグの手触りは残す
- 物理タグ3枚を超えた分はアプリ内貯金として見せる
- 子ども端末は表示専用キオスク
- 親がスマホで記録・設定する

## Current Source Of Truth

- Full plan: [PLAN.md](PLAN.md)
- Agent workflow: [docs/AGENT_WORKFLOW.md](docs/AGENT_WORKFLOW.md)
- Requirements summary: [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md)
- Implementation phases: [docs/IMPLEMENTATION_ROADMAP.md](docs/IMPLEMENTATION_ROADMAP.md)
- Project structure: [docs/PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md)
- Data model: [docs/DATA_MODEL.md](docs/DATA_MODEL.md)
- UI guide: [docs/UI_GUIDE.md](docs/UI_GUIDE.md)
- Test checklist: [docs/TEST_CHECKLIST.md](docs/TEST_CHECKLIST.md)
- Deployment/auth: [docs/DEPLOYMENT_AUTH.md](docs/DEPLOYMENT_AUTH.md)

## Current Implementation

現在の実装はVPS運用を想定したPoC。

- React + TypeScript + Vite
- Node API + SQLite
- Cloudflare Access as the outer gate
- in-app parent PIN for `/parent/*` and write APIs
- `/kids`, `/parent/record`, `/parent/history`, `/parent/goal`, `/parent/settings`

Later:

- `/parent/shop`
- PWA/Wake Lock hardening

## VPS-Style Local Run

VPS版に近い形で試す:

```bash
npm run build
TOKEN_ECO_PARENT_PIN=2525 npm start
```

Default URL:

- `http://localhost:8787/kids`
- `http://localhost:8787/parent/record`

The Node server binds to `127.0.0.1` by default. Override with `HOST=0.0.0.0` only when you intentionally want direct network binding; Cloudflare Tunnel can use the default localhost target.

The server stores SQLite data under `data/` by default. `data/` is intentionally ignored by git.

Local development auth allows API reads without Cloudflare. Parent API calls still require the app PIN header:

```text
x-token-eco-parent-pin: 2525
```

Cloudflare Access mode uses Cloudflare as the outer gate. Parent actions are unlocked inside the app with `TOKEN_ECO_PARENT_PIN`:

```bash
TOKEN_ECO_AUTH_MODE=cloudflare
CLOUDFLARE_TEAM_DOMAIN=https://<team-name>.cloudflareaccess.com
CLOUDFLARE_POLICY_AUD=<access-application-aud>
TOKEN_ECO_PARENT_PIN=2525
```

## VPS Update

VPS上でこのリポジトリをcloneしてsystemd等で `npm start` を動かしている場合、更新は次のスクリプトで行う:

```bash
./scripts/update-vps.sh
```

The script does:

- refuses to run when the git working tree is dirty
- backs up `data/token-eco.sqlite` to `data/backups/`
- runs `git pull --ff-only`
- runs `npm ci`
- runs `npm run build`
- restarts `token-eco.service` when it exists
- checks `http://127.0.0.1:8787/kids`

If the systemd service name is different:

```bash
TOKEN_ECO_SERVICE=my-service ./scripts/update-vps.sh
```

If the restart command is custom:

```bash
TOKEN_ECO_RESTART_CMD="pm2 restart token-eco" ./scripts/update-vps.sh
```

## Tests

Run the Playwright E2E path:

```bash
npm run test:e2e
```

The test server uses `data/playwright.sqlite` and parent PIN `2468`.

## Non-Negotiables

- 子ども画面から台帳を変更できないこと
- 残高は `transactions` の合計から算出すること
- 子ども画面は合計タグとアプリ内貯金を中心に表示すること
- 子ども画面に円換算と履歴を出さないこと
- 罰金・減点・没収を主機能にしないこと
- 取引は削除せず、取り消し取引で補正すること
