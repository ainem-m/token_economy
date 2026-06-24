# Data Model

初期PoCはTypeScriptの型とlocalStorage/IndexedDBで実装する。DB化するときは同じ概念をSQLテーブルへ移す。

## Settings

```ts
type Settings = {
  tokenYen: number; // default 250
  physicalTokenLimit: number; // default 3
  weeklyGrantAmount: number; // default 2
  pinHash?: string;
};
```

## Child

```ts
type Child = {
  id: string;
  name: string;
  avatar?: string;
  color: "yellow" | "blue" | "pink" | "green";
  displayOrder: number;
  isActive: boolean;
};
```

Initial sample:

```json
[
  { "name": "あおい", "displayOrder": 1, "color": "yellow" },
  { "name": "はる", "displayOrder": 2, "color": "blue" }
]
```

## Sample Transactions For Phase 1

```json
[
  { "child": "あおい", "type": "grant", "amount": 2, "label": "土ようび", "occurredAt": "2026-05-09T07:00:00+09:00" },
  { "child": "あおい", "type": "grant", "amount": 2, "label": "土ようび", "occurredAt": "2026-05-16T07:00:00+09:00" },
  { "child": "あおい", "type": "spend", "amount": -1, "label": "チョコ", "occurredAt": "2026-05-18T15:00:00+09:00" },
  { "child": "はる", "type": "grant", "amount": 2, "label": "土ようび", "occurredAt": "2026-05-09T07:00:00+09:00" },
  { "child": "はる", "type": "grant", "amount": 2, "label": "土ようび", "occurredAt": "2026-05-16T07:00:00+09:00" },
  { "child": "はる", "type": "adjust", "amount": 6, "label": "サンプル達成", "occurredAt": "2026-05-18T16:00:00+09:00" }
]
```

Expected derived values:

```text
あおい: balance 3, physical 3, saved 0
はる: balance 10, physical 3, saved 7, achieved
```

## Transaction

```ts
type TransactionType = "grant" | "spend" | "adjust" | "refund" | "cancel";

type Transaction = {
  id: string;
  childId: string;
  type: TransactionType;
  amount: number;
  label: string;
  note?: string;
  relatedTransactionId?: string;
  occurredAt: string;
  createdAt: string;
  createdBy?: string;
};
```

Rules:

- `amount` is token count
- grants are positive
- spends are negative
- cancel transactions use the opposite sign of the original transaction
- transactions are append-only

## Goal

```ts
type GoalStatus = "active" | "achieved" | "archived";

type Goal = {
  id: string;
  childId: string;
  title: string;
  targetAmount: number;
  imageUrl?: string;
  imagePreset?: string;
  status: GoalStatus;
  createdAt: string;
  achievedAt?: string;
};
```

Rules:

- one active goal per child
- initial PoC can use preset images instead of upload
- achieved display is derived from balance >= targetAmount
- parent decides when to complete/archive a goal

## Mission

```ts
type Mission = {
  id: string;
  childId: string;
  title: string;
  rewardAmount: number;
  deadlineAt?: string;
  completedAt?: string;
  completedTransactionId?: string;
};
```

Rules:

- one current mission per child
- parent creates or overwrites the current mission
- saving a new mission clears the prior completion state
- child kiosk displays only the title, reward amount, and completed mark
- parent records completion from `/parent/record`
- completion creates one positive `grant` transaction labeled `ミッション: {title}`
- duplicate completion of the same current mission is rejected
- deadline is optional and soft: overdue is shown only to parents, and late completion is allowed

## Shop Item

```ts
type ShopCategory = "snack" | "toy" | "book" | "special";

type ShopItem = {
  id: string;
  name: string;
  cost: number;
  category: ShopCategory;
  imageUrl?: string;
  imagePreset?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
};
```

Rules:

- price changes affect future records only
- past transactions keep their original labels and amounts
- prefer disable over delete

## Derived Values

```ts
function getBalance(transactions: Transaction[], childId: string): number {
  return transactions
    .filter((transaction) => transaction.childId === childId)
    .reduce((sum, transaction) => sum + transaction.amount, 0);
}

function getDisplayBalance(balance: number): number {
  return Math.max(balance, 0);
}

function getPhysicalTokens(balance: number, settings: Settings): number {
  return Math.min(getDisplayBalance(balance), settings.physicalTokenLimit);
}

function getSavedTokens(balance: number, settings: Settings): number {
  return Math.max(getDisplayBalance(balance) - settings.physicalTokenLimit, 0);
}

function getGoalRemaining(balance: number, goal: Goal): number {
  return Math.max(goal.targetAmount - balance, 0);
}
```

Normal parent spend flows should not allow spending below the current balance. If imported or corrupted data produces a negative balance, child-facing total token and saved token displays are clamped at 0 while the parent/history side can still show the ledger problem.

## Future SQL Notes

When moving to DB:

- add `households`
- add `weekly_grants`
- use `unique(child_id, grant_week)` for double-grant prevention
- keep transactions append-only
- derive balances with `sum(amount) group by child_id`
