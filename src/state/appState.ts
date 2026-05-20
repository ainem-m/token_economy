import { children, goals, settings, shopItems, transactions } from "../data/sampleData";
import type { Child, Goal, Settings, ShopItem, Transaction, TransactionType } from "../domain/types";

export type AppState = {
  settings: Settings;
  children: Child[];
  shopItems: ShopItem[];
  goals: Goal[];
  transactions: Transaction[];
  lastUpdatedAt: string;
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
