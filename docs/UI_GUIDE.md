# UI Guide

## Design Direction

明るく、家庭向けで、子どもが見て理解しやすいUIにする。操作アプリではなく、子どもにとっては「見るだけの掲示板」に近い。

## Child Kiosk

Routes:

- `/kids`

Layout:

- 2人を同時に表示
- 横向き: 左右2カラム
- 縦向き: 上下2段
- タブレットで遠目に読めるサイズ

Each child panel shows:

- 名前
- 合計タグ
- 手元タグ
- アプリ貯金
- 目標
- 目標まであと何個
- 進捗バー
- 今日買えるもの
- 達成時の「たっせい！」

Do not show:

- 円換算
- 履歴
- ランキング
- 親設定
- 購入確定
- 親へのリクエスト

Interaction:

- no ledger-changing actions
- optional tap effects only
- effects must not change state

## Parent Screens

Routes:

- `/parent/record`
- `/parent/history`
- `/parent/goal`
- `/parent/shop`
- `/parent/settings`

Principles:

- smartphone first
- one-handed use
- record in a few taps
- clear cancel path
- parent-only information lives here

## Visual Rules

- Use large numerals for token counts
- Use color per child
- Use icons or illustrations for tokens, goals, and shop items
- Prefer progress bars over dense text
- Keep text short and hiragana-friendly on child screen
- Avoid comparison language between siblings
- Avoid punishment framing

## Recommended Components

- `KidsKiosk`
- `ChildTokenPanel`
- `PhysicalTokenMeter`
- `SavingsBadge`
- `GoalCard`
- `ProgressBar`
- `AffordableItemList`
- `ShopItemChip`
- `ParentShell`
- `PinGate`
- `TransactionForm`
- `QuickItemGrid`
- `HistoryList`
- `HistoryRow`
- `GoalForm`
- `ShopItemList`
- `SettingsForm`
- `OfflineBanner`
- `LastUpdatedLabel`
- `TapEffectLayer`

