export const seedState = {
  settings: {
    tokenYen: 250,
    physicalTokenLimit: 3,
    weeklyGrantAmount: 2,
  },
  children: [
    { id: "aoi", name: "あおい", ageLabel: "5さい", avatar: "girl", color: "yellow", displayOrder: 1, isActive: true },
    { id: "haru", name: "はる", ageLabel: "3さい", avatar: "boy", color: "blue", displayOrder: 2, isActive: true },
  ],
  shopItems: [
    { id: "choco", name: "チョコ", cost: 1, category: "snack", imagePreset: "choco", isActive: true, sortOrder: 1 },
    { id: "ice", name: "アイス", cost: 1, category: "snack", imagePreset: "ice", isActive: true, sortOrder: 2 },
    { id: "gacha", name: "ガチャ", cost: 2, category: "toy", imagePreset: "gacha", isActive: true, sortOrder: 3 },
    { id: "lego", name: "レゴ ミニセット", cost: 8, category: "toy", imagePreset: "blocks", isActive: true, sortOrder: 4 },
    { id: "book", name: "本", cost: 4, category: "book", imagePreset: "book", isActive: true, sortOrder: 5 },
  ],
  goals: [
    { id: "goal-aoi", childId: "aoi", title: "レゴ ミニセット", targetAmount: 8, imagePreset: "blocks", status: "active" },
    { id: "goal-haru", childId: "haru", title: "ポケモンのぬいぐるみ", targetAmount: 10, imagePreset: "plush", status: "active" },
  ],
  missions: [
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
  ],
  transactions: [
    { id: "tx-aoi-1", childId: "aoi", type: "grant", amount: 2, label: "土ようび", occurredAt: "2026-05-09T07:00:00+09:00" },
    { id: "tx-aoi-2", childId: "aoi", type: "grant", amount: 2, label: "土ようび", occurredAt: "2026-05-16T07:00:00+09:00" },
    { id: "tx-aoi-3", childId: "aoi", type: "spend", amount: -1, label: "チョコ", note: "おやつ", occurredAt: "2026-05-18T15:00:00+09:00" },
    { id: "tx-haru-1", childId: "haru", type: "grant", amount: 2, label: "土ようび", occurredAt: "2026-05-09T07:00:00+09:00" },
    { id: "tx-haru-2", childId: "haru", type: "grant", amount: 2, label: "土ようび", occurredAt: "2026-05-16T07:00:00+09:00" },
    { id: "tx-haru-3", childId: "haru", type: "grant", amount: 2, label: "おてつだい", occurredAt: "2026-05-17T17:00:00+09:00" },
    { id: "tx-haru-4", childId: "haru", type: "grant", amount: 2, label: "がんばった", occurredAt: "2026-05-18T18:00:00+09:00" },
    { id: "tx-haru-5", childId: "haru", type: "grant", amount: 2, label: "土ようび", occurredAt: "2026-05-19T07:00:00+09:00" },
  ],
  lastUpdatedAt: "2026-05-19T23:30:00+09:00",
};
