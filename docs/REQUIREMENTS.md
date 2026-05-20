# Requirements Summary

PLAN.mdから、実装時に迷いやすい要件だけを抜き出した要約。

## Users

- 子どもは2人
- 上の子: 5歳、年長、ひらがなを読める
- 下の子: 3歳、2歳児クラス
- 親は2人
- 親以外の記録者は初期スコープ外

## Core Rule

```text
balance = sum(transactions.amount)
displayBalance = max(balance, 0)
physicalTokens = min(displayBalance, settings.physicalTokenLimit)
savedTokens = max(displayBalance - settings.physicalTokenLimit, 0)
```

初期値:

```text
tokenYen = 250
physicalTokenLimit = 3
weeklyGrantAmount = 2
```

## Child Kiosk

子ども端末は表示専用。

表示する:

- 2人分の状態
- 名前
- 合計タグ数
- アプリ貯金数
- 目標
- 目標まであと何個
- 進捗バー
- 今日買えるもの
- 達成時の「たっせい！」
- 最終更新時刻

表示しない:

- 円換算
- 取引履歴
- 親向け設定
- 購入確定ボタン
- 親へのリクエストボタン
- ランキング

## Parent App

親がスマホで行う:

- タグをもらった記録
- タグを使った記録
- 履歴確認
- 取り消し
- 目標設定
- 商品価格設定
- 基本設定

親画面はPINまたは管理モードで保護する。

## Transactions

- 過去取引は削除しない
- 誤入力は逆符号の取引で補正する
- 価格変更は過去取引に影響させない
- 通常の消費記録では残高を超える消費を許可しない
- 不整合データで残高が負になった場合、子ども画面の合計タグとアプリ貯金は0未満にしない

取り消し例:

```text
5/18 チョコ -1
5/18 取り消し: チョコ +1
```

## Weekly Grant

- 毎週土曜日に各active childへ +2タグ
- 物理タグは最大3枚まで
- 3枚を超えた分はアプリ貯金
- 将来DB化時は二重支給防止をDB制約で担保する

## Phase 1 Sample Balances

Static UI should use deterministic sample data:

```text
あおい: balance 3, physical 3, saved 0, goal レゴ ミニセット 8, remaining 5
はる: balance 10, physical 3, saved 7, goal ポケモンのぬいぐるみ 10, achieved
```

## Out Of Scope For Initial PoC

- 子どもからの購入リクエスト
- 子どもからの目標リクエスト
- 子ども画面での履歴表示
- 複数家庭対応
- 祖父母など親以外の記録者
- 決済連携
- 通知プッシュ
- 本格画像アップロード
- 複雑な分析画面
