# Implementation Roadmap

各Phaseは [AGENT_WORKFLOW.md](AGENT_WORKFLOW.md) の流れで進める。

## Phase 0: Documentation

Goal:

- PLAN.mdと補助ドキュメントを整備する

Done:

- READMEがある
- Codex向け作業手順がある
- 要件要約がある
- データモデル、UI、テスト観点が分離されている

## Phase 1: Static UI

Goal:

- 画面と操作感を確認できる静的UIを作る

Build:

- `/kids`
- `/parent/record`
- `/parent/history`
- `/parent/goal`

Use hardcoded sample data.

Do not build:

- persistence
- real transaction mutation
- real cancel mutation
- `/parent/shop`
- `/parent/settings`
- PWA hardening
- PIN enforcement

Done:

- 子ども用キオスク画面がタブレットで読める
- 親記録画面がスマホで操作しやすい
- 履歴画面が静的に確認できる
- 目標設定画面が静的に確認できる
- 子ども画面に円換算や履歴が出ていない

## Phase 2: Local PoC

Goal:

- 端末内で実際に記録と表示更新が動く

Build:

- localStorage or IndexedDB persistence
- children
- transactions
- goals
- shopItems
- settings
- balance calculation
- saved token calculation

Done:

- 親画面から記録すると `/kids` の合計タグとアプリ貯金が変わる

## Phase 3: History And Cancel

Goal:

- 誤入力を削除せず補正できる

Build:

- `/parent/history`
- cancel transaction creation
- cancellation state display

Done:

- 元取引が残る
- 逆符号の取引が追加される
- 残高が補正される

## Phase 4: Goals

Goal:

- 親が子どもごとの目標を設定できる

Build:

- `/parent/goal`
- one active goal per child
- preset goal image selection
- optional goal image URL
- progress display
- achieved display

Done:

- 目標名、必要タグ数、画像プリセット、画像URLを保存できる
- 保存した目標が子ども画面に反映される
- 目標まであと何個が表示される
- 達成時に「たっせい！」が表示される

## Phase 5: Shop And Settings

Goal:

- 親が基本ルールと商品を管理できる

Build:

- `/parent/settings` for child labels and core token rules
- `/parent/shop` later
- tokenYen
- physicalTokenLimit
- weeklyGrantAmount
- PIN setting if needed

Done:

- 子どもの名前とラベルを変えられる
- 週次支給数、物理タグ上限、円換算を変えられる
- 設定値が表示計算に反映される
- 商品価格を変えられる
- 価格変更が過去取引に影響しない

## Phase 6: Sync And Persistence

Goal:

- 親スマホの記録が子どもタブレットに反映され、VPS運用へ進める

Choose one:

- SQLite + Node API

Done:

- DBスキーマがある
- localStorageが本番データの source of truth ではなくなる
- 親スマホから記録できる
- 子どもタブレットへ反映される
- 週次支給が二重付与されない

## Phase 7: VPS Auth And Parent PIN

Goal:

- Cloudflare Tunnel経由でアクセスし、親操作はアプリ内PINで保護できる

Build:

- Cloudflare Access JWT validation
- parent PIN API mutation guards
- parent PIN `/parent/*` route access
- child-safe `/kids` route

Done:

- write APIs reject requests without the parent PIN
- parent PIN can unlock record/cancel/update goal workflows
- Cloudflare Access allowlist limits who can reach the app
- app works behind Cloudflare Tunnel

## Phase 8: Kiosk Hardening

Goal:

- タブレット常時表示で一日運用できる

Build:

- PWA
- offline cache
- last updated display
- wake lock
- polling or realtime refresh
- error fallback

Done:

- オフラインでも真っ白にならない
- 最後の表示状態を維持する
- 最終更新時刻が分かる

## Mission v1: Parent-Managed Missions

Goal:

- 子どもごとに1つの身近なミッションを表示し、親が達成時にトークンを付与できる

Build:

- `missions` app state
- `/parent/mission`
- parent mission completion on `/parent/record`
- mission reward as a positive `grant` transaction
- compact `みっしょん` display on `/kids`

Do not build:

- child-side mission completion
- repeat schedules
- missed-day tracking
- mission analytics
- mission request flows

Done:

- child kiosk shows each current mission without action buttons
- parent can overwrite each child's mission
- parent can complete a mission once
- mission completion appears in normal transaction history
- overdue missions can still be completed by parent judgment
