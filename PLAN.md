# 子ども向けトークン管理アプリ PoC 実装計画

## 1. 概要

家庭内で運用する子ども向けトークンエコノミー管理アプリのPoCを作る。

このアプリの主目的は、子どもの「無限のわがまま」を、家族で合意した有限のリソースとして見える化すること。子どもには「計画する」「我慢する」「考えて使う」感覚を身につけてもらう。

物理タグは手触りや実感があるため残す。ただし物理タグは子ども1人あたり最大3枚までとし、それを超える分はアプリ内の「貯金」として可視化する。

PoCでは、子ども用端末は中古Androidタブレットをキオスク的に常時表示し、親はスマホから記録する。子ども端末は表示専用で、台帳を変更する操作は行わせない。

---

## 2. 前提・利用者

### 2.1 子ども

- 子どもは2人
- 上の子: 5歳、年長、ひらがなを読める
- 下の子: 3歳、2歳児クラス
- 下の子も見るため、文字だけに頼らず、数字・色・絵・進捗バーを中心にする

### 2.2 親

- 親は2人が利用する
- 祖父母など親以外の記録者は初期スコープ外
- 操作主体は親
- 親スマホから記録・設定を行う

### 2.3 端末

- 子ども端末はタブレット想定
- 画面向きは未定
- 初期実装ではレスポンシブ対応し、横向きなら左右2カラム、縦向きなら上下2段で表示する

---

## 3. 基本方針

### 3.1 子ども用端末

- `/kids` をPWAとして常時表示する
- Androidの画面固定、またはキオスク相当の運用を行う
- 子ども画面は表示専用
- 子ども画面から残高変更、購入確定、目標変更、履歴取り消しはできない
- タップしても表示が変わるだけ、またはコインや星の軽いエフェクト程度に留める
- 初期PoCでは「親にきく」リクエスト機能は入れない

### 3.2 親用端末

- 親スマホから `/parent/*` にアクセスする
- タグ支給、消費記録、取り消し、目標設定、商品設定を行う
- 親操作画面はPINまたは管理モードで保護する
- 親画面は片手で短時間に記録できることを優先する

### 3.3 データの正

- 物理タグとアプリ残高がズレた場合は、アプリ側の取引履歴を正とする
- 残高は `transactions` の合計から算出する
- 取引履歴は削除しない
- 誤入力は「取り消し取引」を追加して補正する

---

## 4. トークン運用ルール

### 4.1 基本ルール

- 毎週土曜日に各子どもへ +2タグを支給する
- 物理タグは子ども1人あたり最大3枚まで
- 3枚を超える分はアプリ内貯金として表示する
- 1タグあたりの円換算額は設定で変更可能にする
- 初期表示では、子ども画面に円換算は出さない
- 円換算は親画面または設定画面に限定する
- 半タグや端数は扱わない
- ペナルティ、減点、没収を主機能にしない
- 通常の消費記録では、現在残高を超える消費を許可しない
- 不整合データで残高が負になった場合、子ども画面の合計タグとアプリ貯金は0未満にしない

### 4.2 残高表示の考え方

```text
合計残高 = transactions の合計
表示用残高 = max(合計残高, 0)
手元タグ = min(表示用残高, 3)
アプリ貯金 = max(表示用残高 - 3, 0)
```

例:

```text
残高2 -> アプリ貯金0
残高3 -> アプリ貯金0
残高5 -> アプリ貯金2
```

手元タグ数は物理タグを見れば分かるため、子ども画面には出さない。アプリでは、物理タグだけでは分かりにくい合計残高とアプリ貯金を見せる。

### 4.3 消費時の運用

- 子どもが商品を買う、または使うことを親と合意する
- 親がスマホで消費を記録する
- 物理タグを使った場合は、親が物理タグも回収する
- アプリでは `transactions` に負の取引を追加する

### 4.4 土曜支給時の運用

- 毎週土曜日に +2タグを支給する
- 手元タグが3枚未満なら物理タグも渡す
- すでに手元タグが3枚ある場合、アプリ内貯金だけが増える
- 将来的には二重支給をDB制約で防ぐ

---

## 5. MVPスコープ

### 5.1 必須機能

- 子ども2人を並べたキオスク表示
- 子どもごとの合計タグ残高表示
- 合計タグ数とアプリ内貯金数の表示
- 目標表示
- 目標まであと何個かの表示
- 目標達成時の「たっせい！」表示
- 親による「もらった」「つかった」記録
- 最近の履歴表示は親画面のみ
- 取引取り消し
- 目標設定
- 商品価格設定
- タグ単価設定

### 5.2 初期PoCでは後回しにする機能

- 子どもからの購入リクエスト
- 子どもからの「これほしい」目標リクエスト
- 子ども画面での履歴表示
- 複数家庭対応の高度な権限管理
- 決済連携
- 通知プッシュ
- 画像アップロードの本格実装
- 複雑な分析画面
- 子どもによる直接購入確定
- 祖父母など親以外の記録者対応

---

## 6. 推奨技術スタック

### 6.1 初期PoC

開発速度と運用感の確認を優先し、最初は軽量な端末内PoCにする。

- React
- TypeScript
- Vite
- PWA対応
- React Router または軽量な自前ルーティング
- localStorage または IndexedDB
- CSS Modules または通常CSS

初期PoCでは、画面・操作感・家庭内ルールの妥当性を検証する。DB連携は画面設計が固まってから行う。

### 6.2 次段階候補

親スマホの記録を子どもタブレットに反映する段階で、以下のどちらかを選ぶ。

#### 案A: Supabase

- Supabase Postgres
- Supabase Auth
- Supabase Realtime またはポーリング
- Supabase Cronで毎週支給

#### 案B: ローカル/軽量構成

- SQLite
- Node.js API
- 家庭内LANまたはCloudflare Tunnel等で親スマホからアクセス

---

## 7. 画面一覧

## 7.1 `/kids` 子ども用キオスク画面

目的: 子ども2人が、自分のタグ・貯金・目標を常時確認する。

表示方針:

- 2人を並べて表示する
- 横向きでは左右2カラム
- 縦向きでは上下2段
- 文字は大きく、ひらがな中心
- 下の子も理解できるよう、数字・色・絵・進捗バーを重視する

子どもごとの表示項目:

- 名前
- 合計タグ数
- アプリ貯金数
- 現在の目標
- 目標まであと何個
- 進捗バー
- 達成時の「たっせい！」表示
- 最終更新時刻は親の確認用として画面隅に小さく表示

表示しないもの:

- 円換算
- 取引履歴
- 親向けの詳細設定
- 購入確定ボタン
- 親へのリクエストボタン

操作:

- 初期PoCでは台帳に影響する操作なし
- タップ時に軽いエフェクトを出す程度は可
- 将来的に「買ったらどうなる？」シミュレーションを追加可能

---

## 7.2 `/parent/record` 親の記録

目的: 親がタグの増減を素早く記録する。

表示項目:

- 子ども選択
- 操作選択: `+ もらった`, `- つかった`
- クイック商品
- 数量選択
- メモ欄
- 記録ボタン

操作:

- 取引を `transactions` に追加する
- 記録後は残高再計算
- 子ども用画面に反映

優先度:

- 親操作の中心画面
- スマホ片手で短時間に記録できることを重視する

---

## 7.3 `/parent/history` 履歴確認

目的: 取引履歴を確認し、誤入力を取り消す。

表示項目:

- 日付
- 子ども名
- 取引ラベル
- 増減タグ数
- メモ
- 取り消しボタン

操作:

- 取引そのものは削除しない
- 取り消し時は逆符号の補正取引を追加する

例:

```text
5/18 チョコ -1
5/18 取り消し: チョコ +1
```

---

## 7.4 `/parent/goal` 目標設定

目的: 親が子どもの目標を設定・変更する。

表示項目:

- 子ども選択
- 目標名
- 必要タグ数
- 目標画像
- 保存ボタン

仕様:

- 目標は子どもごとに1つ
- 目標達成後の完了操作は親が行う
- 初期PoCでは画像アップロードではなく、プリセット画像または絵文字から選択してよい

---

## 7.5 `/parent/shop` 商品設定

目的: 家庭内タグショップの商品と価格を管理する。

表示項目:

- 商品名
- 必要タグ数
- カテゴリ
- 有効/無効
- 並び順

仕様:

- 商品価格は変わる可能性がある
- 頻度は未定のため、初期PoCではシンプルな編集UIにする
- 価格変更は過去取引に影響させない
- 商品削除ではなく無効化を基本にする

---

## 7.6 `/parent/settings` 設定

目的: 家庭内ルールの基本値を管理する。

表示項目:

- 1タグあたりの円換算額
- 物理タグ上限
- 毎週支給数
- PIN

初期値:

```text
1タグ = 250円
物理タグ上限 = 3
毎週支給数 = 2
```

子ども画面には円換算を出さないが、将来表示する可能性を残すため設定値として保持する。

---

## 8. 子ども端末の操作レベル

## 8.1 レベル0: 完全表示モード

PoC初期はこの状態で開始する。

可能:

- 2人分のホーム表示
- タグ残高確認
- 合計タグとアプリ貯金の確認
- 目標確認

不可:

- 残高変更
- 消費確定
- 目標変更
- 商品編集
- 履歴取り消し
- 親へのリクエスト作成

---

## 8.2 レベル1: 閲覧エフェクトモード

追加候補:

- タップ時にコインや星のエフェクトを表示する
- 表示内容は変えない
- 台帳には一切影響しない

---

## 8.3 レベル2: シミュレーションモード

将来候補:

- 「これを買ったら残り何個？」を見る
- 「目標まであと何個増える？」を見る

このレベルでも、子ども端末だけで残高を変更してはいけない。

---

## 9. データモデル案

## 9.1 settings

```sql
id uuid primary key
household_id uuid not null references households(id)
token_yen int not null default 250
physical_token_limit int not null default 3
weekly_grant_amount int not null default 2
pin_hash text
updated_at timestamptz not null default now()
```

---

## 9.2 households

```sql
id uuid primary key
name text not null
created_at timestamptz not null default now()
```

---

## 9.3 children

```sql
id uuid primary key
household_id uuid not null references households(id)
name text not null
avatar text
color text
display_order int not null default 0
is_active boolean not null default true
created_at timestamptz not null default now()
```

---

## 9.4 transactions

```sql
id uuid primary key
household_id uuid not null references households(id)
child_id uuid not null references children(id)
type text not null -- grant, spend, adjust, refund, cancel
amount int not null -- +2, -1 etc. Unit: token count
label text not null
note text
related_transaction_id uuid references transactions(id)
idempotency_key text
occurred_at timestamptz not null default now()
created_at timestamptz not null default now()
created_by text
```

残高算出:

```sql
select child_id, sum(amount) as balance
from transactions
group by child_id;
```

手元タグとアプリ貯金:

```text
display_balance = greatest(balance, 0)
physical_tokens = least(display_balance, settings.physical_token_limit)
saved_tokens = greatest(display_balance - settings.physical_token_limit, 0)
```

---

## 9.5 goals

```sql
id uuid primary key
household_id uuid not null references households(id)
child_id uuid not null references children(id)
title text not null
target_amount int not null
image_url text
status text not null default 'active' -- active, achieved, archived
created_at timestamptz not null default now()
achieved_at timestamptz
```

仕様:

- active goalは子どもごとに1つ
- 達成判定は表示上で行う
- 達成完了操作は親が行う

---

## 9.6 shop_items

```sql
id uuid primary key
household_id uuid not null references households(id)
name text not null
cost int not null
category text not null -- snack, toy, book, special
image_url text
is_active boolean not null default true
sort_order int not null default 0
created_at timestamptz not null default now()
```

---

## 9.7 weekly_grants

```sql
id uuid primary key
household_id uuid not null references households(id)
child_id uuid not null references children(id)
grant_week date not null
amount int not null default 2
transaction_id uuid references transactions(id)
created_at timestamptz not null default now()
unique(child_id, grant_week)
```

週次支給の二重実行を防ぐために `unique(child_id, grant_week)` を必須とする。

---

## 10. 主要イベント

## 10.1 毎週土曜支給

仕様:

- 毎週土曜日に全active childrenへ +2タグを支給する
- `weekly_grants` を作成する
- 対応する `transactions` に `type = grant` の取引を作成する
- 同じ週に二重支給しない
- 物理タグ上限3枚を超えた分はアプリ貯金として表示する

PoC初期では手動支給でもよいが、設計上はサーバー側ジョブに寄せる。

---

## 10.2 親による消費記録

仕様:

- 親が子ども、商品、数量を選ぶ
- `transactions` に負のamountを追加する
- 残高は取引合計で再計算する
- 子ども画面へ反映する
- 物理タグを使った場合は親が回収する

---

## 10.3 取り消し

仕様:

- 元取引は削除しない
- 元取引と逆符号の取引を作る
- `related_transaction_id` に元取引IDを入れる
- labelは `取り消し: {元ラベル}` とする

---

## 10.4 目標達成判定

仕様:

- 残高がactive goalの `target_amount` 以上になった場合、子ども画面で「たっせい！」と表示する
- 自動的に `achieved` にするかはPoCでは行わない
- 目標完了、次の目標設定は親が操作する

---

## 11. UI方針

## 11.1 子ども画面

- 2人並べて見せる
- 大きい数字
- ひらがな中心
- アイコン・絵・色・進捗バー多め
- 円換算は出さない
- 履歴は出さない
- 比較やランキングを避ける
- 「あと何個」を強調する
- 手元タグ数は表示せず、合計タグとアプリ貯金を見せる
- 下の子が数字を読めなくても分かるように、合計タグとアプリ貯金は個数分のアイコンも併記する
- 達成表示はくどくならないように「たっせい！」を1箇所に絞る
- 子どもが連打したくなる危険なボタンは置かない
- 子ども画面では買えるもの一覧を出さず、目標とタグ量に集中させる
- 目標だけは買えなくても常に表示する

## 11.2 親画面

- 片手で短時間に記録できること
- 子ども選択 -> 操作選択 -> 商品選択 -> 記録、の順
- よく使う商品はクイックボタン化
- 記録後の取り消し導線を用意する
- 円換算や設定値は親画面側に置く

## 11.3 管理画面

- 普段は使わない
- 商品価格、目標、タグ単価、物理タグ上限などを管理する
- 親モード内からのみアクセスする

---

## 12. キオスク運用

## 12.1 Androidタブレット設定

- Chromeで `/kids` を開く
- ホーム画面に追加してPWA化
- PWAを起動
- Androidの画面固定を有効化
- PINなしで解除できないようにする
- 通知をオフ
- 自動明るさをオフまたは低め固定
- 画面タイムアウトを最大にする
- 可能なら夜間はスリープ

## 12.2 アプリ側対策

- Screen Wake Lock APIを使用する
- 失敗しても動作するようにする
- 5分ごとにデータ再取得
- 最終更新時刻を表示
- 通信失敗時は最後の状態を表示し続ける
- エラー時に真っ白画面にしない

---

## 13. 画面遷移

```text
/kids
  -- 親モード / PIN --> /parent/record

/parent/record
  -> /parent/history
  -> /parent/goal
  -> /parent/shop
  -> /parent/settings

/parent/history
  -> /parent/record

/parent/goal
  -> /parent/record

/parent/shop
  -> /parent/record

/parent/settings
  -> /parent/record
```

PoCでは、子ども端末から親モードに入れなくてもよい。親スマホから直接 `/parent/record` にアクセスする運用を第一候補とする。

---

## 14. 想定コンポーネント

- `AppShell`
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

---

## 15. 実装順序

## Phase 0: 計画確定

- インタビュー結果をPLAN.mdへ反映する
- 子ども画面を2人並びキオスクに変更する
- 物理タグ上限とアプリ貯金の考え方を明記する

完了条件:

- 本PLAN.mdが最新要件と一致している

---

## Phase 1: 静的UI

- `/kids` の2人並びキオスク画面を作る
- `/parent/record` の静的画面を作る
- `/parent/history` の静的画面を作る
- `/parent/goal` の静的画面を作る
- サンプルデータをハードコードする

このPhaseでは作らない:

- 永続化
- 実際の取引作成
- 実際の取り消し処理
- `/parent/shop`
- `/parent/settings`
- PWA対応
- PINの実 enforcement

完了条件:

- 子ども用キオスク画面がタブレットで見やすい
- 親記録画面がスマホで操作しやすい
- 履歴画面が静的に確認できる
- 目標設定画面が静的に確認できる
- 子ども画面に円換算や履歴が出ていない

---

## Phase 2: 端末内PoC

- localStorageまたはIndexedDBでデータを保存する
- children / transactions / goals / shop_items / settings を実装する
- 残高計算をtransactions合計にする
- アプリ貯金を算出する
- 親記録画面から取引作成する
- 子ども画面に反映する

完了条件:

- 親画面から記録すると子ども画面の合計タグとアプリ貯金が変わる

---

## Phase 3: 履歴と取り消し

- `/parent/history` 実装
- 取り消し取引の追加
- 履歴表示

完了条件:

- 誤入力を削除せずに補正できる

---

## Phase 4: 目標設定

- `/parent/goal` 実装
- active goalの設定
- 目標画像のプリセット選択
- 子ども画面の進捗バー反映
- 達成時の「たっせい！」表示

完了条件:

- 子どもごとの目標と進捗が表示される
- 達成時に子ども画面で分かる

---

## Phase 5: 商品・設定

- `/parent/shop` 実装
- `/parent/settings` 実装
- 商品価格を画面に反映
- タグ単価、物理タグ上限、毎週支給数を設定可能にする

完了条件:

- 親が商品価格と基本ルールを最低限管理できる

---

## Phase 6: 同期・永続化

- SupabaseまたはSQLite + Node APIを選定する
- DBスキーマを作成する
- 親スマホの記録を子どもタブレットに反映する
- 週次支給の二重付与を防ぐ

完了条件:

- 親スマホから記録すると子どもタブレットへ反映される
- 週次支給が二重付与されない

---

## Phase 7: キオスク耐性

- PWA対応
- オフラインキャッシュ
- 最終更新時刻
- Wake Lock
- 自動再取得
- エラー時フォールバック

完了条件:

- タブレット常時表示で一日運用できる

---

## Phase 8: 将来機能

- 買ったらどうなる？シミュレーション
- 親にきく購入リクエスト
- これほしい目標リクエスト

完了条件:

- 子どもが意思表示できるが、台帳変更は親承認のみ

---

## 16. 受け入れ条件

## 16.1 子ども用キオスク

- 2人分の状態が同時に分かる
- 10インチ程度のタブレットで遠目にも読める
- 現在のタグ数がすぐ分かる
- 合計タグとアプリ貯金が分かる
- 数字が読めない子にも、アイコン数でタグ量が分かる
- 目標まであと何個か分かる
- 達成時に「たっせい！」が1箇所で分かる
- 子どもが残高を変更できない
- 円換算が出ていない
- 履歴が出ていない

## 16.2 親の記録

- スマホで短時間に消費記録できる
- 誤入力を取り消せる
- 履歴が残る
- 記録後に子ども画面へ反映される
- 物理タグ回収の運用と矛盾しない

## 16.3 運用

- 毎週土曜の支給が二重付与されない設計になっている
- 通信失敗時も子ども画面が真っ白にならない
- 物理タグとアプリ残高のズレを説明可能
- 親以外が管理画面を操作できない

---

## 17. 非機能要件

- 低スペック中古Androidタブレットでも動くこと
- 画面ロードが軽いこと
- 主要画面はレスポンシブ対応すること
- タブレット横向きまたは縦向きのどちらにも対応できること
- 家庭内利用のため、過剰な認証UXは避ける
- ただし、親操作には最低限のPIN保護を入れる

---

## 18. 開発時の注意

- 子ども向け画面にランキングを出さない
- 兄弟を比較する見せ方にしない
- 罰金・減点・没収を主機能にしない
- 「貯める」だけでなく「考えて使う」ことも肯定する
- 買えない商品を大量に見せて欲求を増やさない
- 価格変更は履歴上の過去取引に影響させない
- 商品価格変更は将来の取引から反映する
- 削除ではなく無効化・アーカイブを基本にする
- 子ども画面のタップは台帳に影響させない

---

## 19. 開発ワークフロー

実装は各Phaseごとに、以下の `plan / observe / implement / test / refactor / prune` の順で進める。

この流れの目的は、作りすぎを防ぎつつ、家庭内運用に合うかを短い周期で確認すること。特にこのアプリは「機能が多いほどよい」タイプではなく、子ども画面を安全で単純に保つことが重要なため、毎回 `prune` まで行う。

### 19.1 plan

各作業前に、その回で作る範囲を小さく決める。

確認すること:

- 対象Phase
- 対象画面
- 追加するデータ項目
- 子ども画面に出すもの、出さないもの
- 親画面だけに置くもの
- 今回やらないこと

出力:

- 作業スコープ
- 完了条件
- 触る予定のファイル

例:

```text
Phase 1 / kids kiosk
作る: 2人並び表示、合計タグ、アプリ貯金、目標
作らない: 親へのリクエスト、履歴、円換算、DB連携
```

### 19.2 observe

実装前に既存状態を観察する。

確認すること:

- 現在のファイル構成
- 既存コンポーネント
- 既存データモデル
- 既存スタイル
- すでに実装済みの挙動
- PLAN.mdとの差分

新規プロジェクトの初回は、空のワークスペースであること、採用する技術スタック、作るファイル構成を確認する。

出力:

- 現状メモ
- 変更方針
- 既存設計と衝突しそうな点

### 19.3 implement

planで決めた範囲だけを実装する。

原則:

- 子ども画面は表示専用を維持する
- 残高は必ずtransactions合計から算出する
- アプリ貯金は設定値から算出する
- 過去取引を直接変更しない
- 削除ではなく無効化、アーカイブ、取り消し取引を使う
- UIはまず実運用に必要な情報を優先し、装飾を後回しにする

実装単位:

- 画面
- データモデル
- 状態管理
- 永続化
- 操作フロー
- PWA/キオスク耐性

### 19.4 test

実装後に、機能と運用の両方を確認する。

最低限の確認:

- buildが通る
- 主要画面が表示される
- 親の記録で残高が変わる
- 残高からアプリ貯金が正しく出る
- 取り消しで逆取引が追加される
- 子ども画面から台帳を変更できない
- 子ども画面に円換算と履歴が出ていない

画面確認:

- スマホ幅で親画面が片手操作しやすい
- タブレット横向きで2人並びが読める
- タブレット縦向きで上下表示が破綻しない
- 文字やボタンが重ならない

運用確認:

- 物理タグ3枚上限の説明と表示が一致している
- 土曜支給で3枚を超えた分が貯金になる
- 目標達成時に「たっせい！」が表示される
- 買えない商品を大量に見せていない

### 19.5 refactor

テスト後、必要な範囲だけ整理する。

対象:

- 重複した計算ロジック
- 大きすぎるコンポーネント
- 名前が曖昧な型や関数
- 子ども画面と親画面で混ざった責務
- 将来DB化するときに障害になる状態管理

避けること:

- 見た目だけの大規模作り替え
- まだ使わない抽象化
- Phase外の機能追加
- データモデルの過剰な一般化

### 19.6 prune

最後に、今回入れたものを削る観点で見直す。

確認すること:

- 子ども画面に不要な情報が増えていないか
- 子どもが押したくなる危険なボタンがないか
- 親画面の操作数が増えすぎていないか
- 将来機能を先に作り込んでいないか
- 買えない商品や欲求を増やす表示が多すぎないか
- 説明文が画面に出すぎていないか
- サンプルデータやデバッグ表示が残っていないか

pruneで削る候補:

- 子ども画面の履歴
- 子ども画面の円換算
- 購入リクエスト導線
- 目標リクエスト導線
- ランキングに見える表現
- 過剰なアニメーション
- 設定画面に逃がせる親向け情報

---

## 20. Phaseごとのワークフロー適用

### Phase 1: 静的UI

- plan: `/kids`, `/parent/record`, `/parent/history`, `/parent/goal` の表示項目を固定する
- observe: 画面向き未定を前提に、レスポンシブ要件を確認する
- implement: 2人並びキオスク、親記録、履歴、目標設定の静的UIを作る
- test: スマホ幅、タブレット縦、タブレット横で確認する
- refactor: 表示部品を `ChildTokenPanel` などに分ける
- prune: 子ども画面から円換算、履歴、余計な操作を削り、Phase 2以降の実動作を入れていないか確認する

### Phase 2: 端末内PoC

- plan: localStorage/IndexedDBで扱うデータ型を決める
- observe: 静的UIで必要になった状態を確認する
- implement: transactions合計とアプリ貯金を実装する
- test: 記録後に残高表示が変わることを確認する
- refactor: 残高計算を共通関数にする
- prune: DB前提の未使用コードや過剰な同期処理を入れない

### Phase 3: 履歴と取り消し

- plan: 取り消し対象と表示ルールを決める
- observe: transactionsの扱いが削除になっていないか確認する
- implement: 逆符号のcancel取引を追加する
- test: 元取引が残り、残高だけ補正されることを確認する
- refactor: 取引作成処理を整理する
- prune: 履歴を子ども画面へ出さない

### Phase 4: 目標設定

- plan: 目標は子どもごとに1つと決める
- observe: 目標達成判定に必要な残高計算を確認する
- implement: 親が目標を保存し、子ども画面に反映する
- test: 達成時に「たっせい！」が出ることを確認する
- refactor: Goal関連表示を整理する
- prune: 子どもからの目標リクエストを入れない

### Phase 5: 商品・設定

- plan: 商品価格、タグ単価、物理タグ上限、週次支給数だけに絞る
- observe: 子ども画面の商品表示に必要な項目を確認する
- implement: 親画面で商品と設定を編集できるようにする
- test: 商品価格変更が過去取引に影響しないことを確認する
- refactor: settings参照を共通化する
- prune: 在庫管理やカテゴリ詳細など未決定機能を入れない

### Phase 6: 同期・永続化

- plan: SupabaseかSQLite + Node APIを選ぶ
- observe: 端末内PoCのデータ操作を洗い出す
- implement: DBスキーマと同期処理を実装する
- test: 親スマホの記録が子どもタブレットに反映されることを確認する
- refactor: localStorage依存をデータアクセス層へ寄せる
- prune: 本格認証や複数家庭対応を初期同期に混ぜない

### Phase 7: キオスク耐性

- plan: 常時表示に必要な耐性だけを決める
- observe: 実機またはブラウザで表示崩れと再読み込み時挙動を確認する
- implement: PWA、キャッシュ、Wake Lock、最終更新時刻を実装する
- test: オフライン時に真っ白にならないことを確認する
- refactor: エラー表示とキャッシュ処理を整理する
- prune: 子どもに不要なエラー詳細を出さない

---

## 21. 初期サンプルデータ

### settings

```json
{
  "token_yen": 250,
  "physical_token_limit": 3,
  "weekly_grant_amount": 2
}
```

### children

```json
[
  { "name": "あおい", "display_order": 1, "color": "yellow" },
  { "name": "はる", "display_order": 2, "color": "blue" }
]
```

### shop_items

初期商品は未確定。PoCでは仮データとして以下を置く。

```json
[
  { "name": "チョコ", "cost": 1, "category": "snack" },
  { "name": "アイス", "cost": 1, "category": "snack" },
  { "name": "ガチャ", "cost": 2, "category": "toy" },
  { "name": "レゴ ミニセット", "cost": 8, "category": "toy" },
  { "name": "本", "cost": 4, "category": "book" }
]
```

### goals

初期目標は未確定。PoCでは仮データとして以下を置く。

```json
[
  { "child": "あおい", "title": "レゴ ミニセット", "target_amount": 8, "status": "active" },
  { "child": "はる", "title": "ポケモンのぬいぐるみ", "target_amount": 10, "status": "active" }
]
```

### transactions

Phase 1の静的UIでは、以下の仮取引から表示用残高を算出する。

```json
[
  { "child": "あおい", "type": "grant", "amount": 2, "label": "土ようび", "occurred_at": "2026-05-09T07:00:00+09:00" },
  { "child": "あおい", "type": "grant", "amount": 2, "label": "土ようび", "occurred_at": "2026-05-16T07:00:00+09:00" },
  { "child": "あおい", "type": "spend", "amount": -1, "label": "チョコ", "occurred_at": "2026-05-18T15:00:00+09:00" },
  { "child": "はる", "type": "grant", "amount": 2, "label": "土ようび", "occurred_at": "2026-05-09T07:00:00+09:00" },
  { "child": "はる", "type": "grant", "amount": 2, "label": "土ようび", "occurred_at": "2026-05-16T07:00:00+09:00" },
  { "child": "はる", "type": "adjust", "amount": 6, "label": "サンプル達成", "occurred_at": "2026-05-18T16:00:00+09:00" }
]
```

このサンプルでは:

```text
あおい: 合計3 / アプリ貯金0 / レゴまであと5
はる: 合計10 / アプリ貯金7 / ポケモンのぬいぐるみをたっせい！
```

---

## 22. 未決定事項

- 子ども端末の画面向き
- 初期商品リスト
- 初期目標
- 商品価格変更の頻度
- 最初から親スマホと子どもタブレットを同期するか
- Supabaseにするか、SQLite + Node APIにするか
- 円換算を将来子ども画面に出すか

---

## 23. 参考画像

設計時には以下のコンセプト画像を参照する。

- `family_friendly_token_management_app_concept.png`
- `ui_design_flow_for_kids_token_app.png`

この `PLAN.md` は、上記コンセプト、画面遷移図、インタビュー結果をもとに、コーディングエージェントがPoCを実装するための実行計画として使う。
