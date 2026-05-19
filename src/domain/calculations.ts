import type { Goal, Settings, Transaction } from "./types";

export function getBalance(transactions: Transaction[], childId: string): number {
  return transactions
    .filter((transaction) => transaction.childId === childId)
    .reduce((sum, transaction) => sum + transaction.amount, 0);
}

export function getDisplayBalance(balance: number): number {
  return Math.max(balance, 0);
}

export function getPhysicalTokens(balance: number, settings: Settings): number {
  return Math.min(getDisplayBalance(balance), settings.physicalTokenLimit);
}

export function getSavedTokens(balance: number, settings: Settings): number {
  return Math.max(getDisplayBalance(balance) - settings.physicalTokenLimit, 0);
}

export function getGoalRemaining(balance: number, goal: Goal): number {
  return Math.max(goal.targetAmount - getDisplayBalance(balance), 0);
}

export function isGoalAchieved(balance: number, goal: Goal): boolean {
  return getDisplayBalance(balance) >= goal.targetAmount;
}
