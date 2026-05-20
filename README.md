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

## First Implementation Track

最初の実装トラックは、DBなしの端末内PoC。Phase 1では静的UIだけを作り、Phase 2でlocalStorageまたはIndexedDBを入れる。

- React + TypeScript + Vite
- Phase 1: `/kids`, `/parent/record`, `/parent/history`, `/parent/goal` の静的UI
- Phase 2: localStorage または IndexedDB による端末内PoC
- Phase 5: `/parent/shop`, `/parent/settings`

Phase 1でやらないこと:

- 永続化
- 実際の取引作成
- 実際の取り消し処理
- 商品設定
- 基本設定
- PWA/Wake Lock
- PINの実 enforcement

## VPS-Style Local Run

VPS版に近い形で試す:

```bash
npm run build
npm start
```

Default URL:

- `http://localhost:8787/kids`
- `http://localhost:8787/parent/record`

The Node server binds to `127.0.0.1` by default. Override with `HOST=0.0.0.0` only when you intentionally want direct network binding; Cloudflare Tunnel can use the default localhost target.

The server stores SQLite data under `data/` by default. `data/` is intentionally ignored by git.

Local development auth defaults to a parent account. To simulate a child account when calling API directly, send:

```text
x-token-eco-role: child
```

Cloudflare Access mode uses:

```bash
TOKEN_ECO_AUTH_MODE=cloudflare
CLOUDFLARE_TEAM_DOMAIN=https://<team-name>.cloudflareaccess.com
CLOUDFLARE_POLICY_AUD=<access-application-aud>
TOKEN_ECO_PARENT_EMAILS=parent@example.com
TOKEN_ECO_CHILD_EMAILS=child@example.com
```

## Non-Negotiables

- 子ども画面から台帳を変更できないこと
- 残高は `transactions` の合計から算出すること
- 子ども画面は合計タグとアプリ内貯金を中心に表示すること
- 子ども画面に円換算と履歴を出さないこと
- 罰金・減点・没収を主機能にしないこと
- 取引は削除せず、取り消し取引で補正すること
