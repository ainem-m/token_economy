export type ChildColor = "yellow" | "blue" | "pink" | "green";

export type Settings = {
  tokenYen: number;
  physicalTokenLimit: number;
  weeklyGrantAmount: number;
};

export type Child = {
  id: string;
  name: string;
  ageLabel: string;
  avatar: "girl" | "boy";
  color: ChildColor;
  displayOrder: number;
  isActive: boolean;
};

export type TransactionType = "grant" | "spend" | "adjust" | "refund" | "cancel";

export type Transaction = {
  id: string;
  childId: string;
  type: TransactionType;
  amount: number;
  label: string;
  note?: string;
  relatedTransactionId?: string;
  occurredAt: string;
};

export type GoalStatus = "active" | "achieved" | "archived";

export type Goal = {
  id: string;
  childId: string;
  title: string;
  targetAmount: number;
  imagePreset: ItemPreset;
  imageUrl?: string;
  status: GoalStatus;
};

export type ShopCategory = "snack" | "toy" | "book" | "special";

export type ItemPreset = "choco" | "ice" | "gacha" | "blocks" | "book" | "plush" | "coin";

export type ShopItem = {
  id: string;
  name: string;
  cost: number;
  category: ShopCategory;
  imagePreset: ItemPreset;
  isActive: boolean;
  sortOrder: number;
};
