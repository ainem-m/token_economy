# Implementation Roadmap

各Phaseは [AGENT_WORKFLOW.md](/Users/ainem/token_eco/docs/AGENT_WORKFLOW.md) の流れで進める。

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
- physical/saved token calculation

Done:

- 親画面から記録すると `/kids` の合計タグ、手元タグ、アプリ貯金が変わる

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
- progress display
- achieved display

Done:

- 目標まであと何個が表示される
- 達成時に「たっせい！」が表示される

## Phase 5: Shop And Settings

Goal:

- 親が基本ルールと商品を管理できる

Build:

- `/parent/shop`
- `/parent/settings`
- tokenYen
- physicalTokenLimit
- weeklyGrantAmount
- PIN setting if needed

Done:

- 商品価格を変えられる
- 設定値が表示計算に反映される
- 価格変更が過去取引に影響しない

## Phase 6: Sync And Persistence

Goal:

- 親スマホの記録が子どもタブレットに反映される

Choose one:

- Supabase
- SQLite + Node API

Done:

- DBスキーマがある
- 親スマホから記録できる
- 子どもタブレットへ反映される
- 週次支給が二重付与されない

## Phase 7: Kiosk Hardening

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
