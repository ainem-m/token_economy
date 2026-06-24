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
- アプリ貯金
- 合計タグとアプリ貯金の個数分のアイコン
- 目標
- 目標画像
- 目標まであと何個
- 進捗バー
- みっしょん
- ミッション名
- 達成時にもらえるタグ数
- 達成済みの短い印
- 達成時の「たっせい！」は1箇所だけ
- 最終更新時刻は親の確認用として画面隅に小さく表示

Do not show:

- 円換算
- 履歴
- 今日買えるもの一覧
- ランキング
- 親設定
- 購入確定
- 親へのリクエスト
- ミッション達成操作
- ミッション期限切れ表示

Interaction:

- no ledger-changing actions
- optional tap effects only
- effects must not change state

## Parent Screens

Routes:

- `/parent/record`
- `/parent/history`
- `/parent/goal`
- `/parent/mission`
- `/parent/shop`
- `/parent/settings`

Principles:

- smartphone first
- one-handed use
- record in a few taps
- clear cancel path
- mission setup belongs on `/parent/mission`
- mission completion belongs on `/parent/record`
- parent-only information lives here

## Visual Rules

- Use large numerals for token counts
- Pair token counts with repeated icons so the younger child can read quantity without numerals
- Reserve a larger goal image area for user-provided images, with preset icons as fallback
- Use color per child
- Use icons or illustrations for tokens, goals, and shop items
- Prefer progress bars over dense text
- Keep text short and hiragana-friendly on child screen
- Avoid comparison language between siblings
- Avoid punishment framing

## Recommended Components

- `KidsKiosk`
- `ChildTokenPanel`
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
