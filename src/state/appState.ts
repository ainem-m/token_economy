import { children, goals, missions, settings, shopItems, transactions } from "../data/sampleData";
import type { Child, Goal, Mission, Settings, ShopItem, Transaction, TransactionType } from "../domain/types";

export type AppState = {
  settings: Settings;
  children: Child[];
  shopItems: ShopItem[];
  goals: Goal[];
  missions: Mission[];
  transactions: Transaction[];
  lastUpdatedAt: string;
};

export type MissionInput = {
  childId: string;
  title: string;
  rewardAmount: number;
  deadlineAt?: string;
};

export type TransactionInput = {
  childId: string;
  type: TransactionType;
  amount: number;
  label: string;
  note?: string;
  relatedTransactionId?: string;
};

const STORAGE_KEY = "token-eco:poc-state:v1";

export const initialAppState: AppState = {
  settings,
  children,
  shopItems,
  goals,
  missions,
  transactions,
  lastUpdatedAt: "2026-05-19T23:30:00+09:00",
};

export function readStoredState(): AppState {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return initialAppState;

  try {
    const parsed = JSON.parse(raw) as AppState;
    return {
      ...initialAppState,
      ...parsed,
      settings: { ...initialAppState.settings, ...parsed.settings },
      missions: Array.isArray(parsed.missions) ? parsed.missions : initialAppState.missions,
    };
  } catch {
    return initialAppState;
  }
}

export function writeStoredState(state: AppState): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function createTransaction(input: TransactionInput): Transaction {
  return {
    id: crypto.randomUUID(),
    childId: input.childId,
    type: input.type,
    amount: input.amount,
    label: input.label,
    note: input.note || undefined,
    relatedTransactionId: input.relatedTransactionId,
    occurredAt: new Date().toISOString(),
  };
}

export function createMission(input: MissionInput): Mission {
  return {
    id: crypto.randomUUID(),
    childId: input.childId,
    title: input.title.trim() || "みっしょん",
    rewardAmount: Math.max(1, Math.round(input.rewardAmount)),
    deadlineAt: input.deadlineAt || undefined,
  };
}

export function replaceCurrentMission(missions: Mission[], mission: Mission): Mission[] {
  return [...missions.filter((item) => item.childId !== mission.childId), mission];
}

export function createCancelTransaction(source: Transaction, reason: string): Transaction {
  return createTransaction({
    childId: source.childId,
    type: "cancel",
    amount: -source.amount,
    label: `取り消し: ${source.label}`,
    note: reason,
    relatedTransactionId: source.id,
  });
}
