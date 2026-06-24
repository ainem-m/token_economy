import type { Child, Goal, Mission, Settings, ShopItem, Transaction } from "../domain/types";

export const settings: Settings = {
  tokenYen: 250,
  physicalTokenLimit: 3,
  weeklyGrantAmount: 2,
};

export const children: Child[] = [
  {
    id: "aoi",
    name: "あおい",
    ageLabel: "5さい",
    avatar: "girl",
    color: "yellow",
    displayOrder: 1,
    isActive: true,
  },
  {
    id: "haru",
    name: "はる",
    ageLabel: "3さい",
    avatar: "boy",
    color: "blue",
    displayOrder: 2,
    isActive: true,
  },
];

export const shopItems: ShopItem[] = [
  { id: "choco", name: "チョコ", cost: 1, category: "snack", imagePreset: "choco", isActive: true, sortOrder: 1 },
  { id: "ice", name: "アイス", cost: 1, category: "snack", imagePreset: "ice", isActive: true, sortOrder: 2 },
  { id: "gacha", name: "ガチャ", cost: 2, category: "toy", imagePreset: "gacha", isActive: true, sortOrder: 3 },
  { id: "lego", name: "レゴ ミニセット", cost: 8, category: "toy", imagePreset: "blocks", isActive: true, sortOrder: 4 },
  { id: "book", name: "本", cost: 4, category: "book", imagePreset: "book", isActive: true, sortOrder: 5 },
];

export const goals: Goal[] = [
  { id: "goal-aoi", childId: "aoi", title: "レゴ ミニセット", targetAmount: 8, imagePreset: "blocks", status: "active" },
  { id: "goal-haru", childId: "haru", title: "ポケモンのぬいぐるみ", targetAmount: 10, imagePreset: "plush", status: "active" },
];

export const missions: Mission[] = [
  {
    id: "mission-aoi",
    childId: "aoi",
    title: "といれにいく",
    rewardAmount: 1,
    deadlineAt: "2026-05-20T20:00:00+09:00",
  },
  {
    id: "mission-haru",
    childId: "haru",
    title: "じゅんびをする",
    rewardAmount: 1,
  },
];

export const transactions: Transaction[] = [
  { id: "tx-aoi-1", childId: "aoi", type: "grant", amount: 2, label: "土ようび", occurredAt: "2026-05-09T07:00:00+09:00" },
  { id: "tx-aoi-2", childId: "aoi", type: "grant", amount: 2, label: "土ようび", occurredAt: "2026-05-16T07:00:00+09:00" },
  { id: "tx-aoi-3", childId: "aoi", type: "spend", amount: -1, label: "チョコ", note: "おやつ", occurredAt: "2026-05-18T15:00:00+09:00" },
  { id: "tx-haru-1", childId: "haru", type: "grant", amount: 2, label: "土ようび", occurredAt: "2026-05-09T07:00:00+09:00" },
  { id: "tx-haru-2", childId: "haru", type: "grant", amount: 2, label: "土ようび", occurredAt: "2026-05-16T07:00:00+09:00" },
  { id: "tx-haru-3", childId: "haru", type: "adjust", amount: 6, label: "サンプル達成", note: "静的UI確認用", occurredAt: "2026-05-18T16:00:00+09:00" },
];
