import type { Goal, Mission, Settings, Transaction } from "./types";

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

export function isGoalComplete(balance: number, goal: Goal): boolean {
  return goal.status === "achieved" || isGoalAchieved(balance, goal);
}

export function getVisibleGoal(goals: Goal[], childId: string): Goal | undefined {
  return goals.find((goal) => goal.childId === childId && goal.status === "active")
    ?? goals.find((goal) => goal.childId === childId && goal.status === "achieved");
}

export function getCurrentMission(missions: Mission[], childId: string): Mission | undefined {
  return missions.find((mission) => mission.childId === childId);
}

export function isMissionCompleted(mission: Mission): boolean {
  return Boolean(mission.completedAt || mission.completedTransactionId);
}

export function isMissionOverdue(mission: Mission, now = new Date()): boolean {
  return Boolean(mission.deadlineAt && !isMissionCompleted(mission) && new Date(mission.deadlineAt) < now);
}

export function isTransactionCancelled(transactions: Transaction[], transactionId: string): boolean {
  return transactions.some((transaction) => transaction.relatedTransactionId === transactionId);
}
