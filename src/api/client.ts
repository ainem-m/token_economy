import type { AppState, TransactionInput } from "../state/appState";
import type { Transaction } from "../domain/types";

export type SessionAccount = {
  email: string;
};

export type ApiState = {
  state: AppState;
  account?: SessionAccount;
};

export class ApiUnavailableError extends Error {
  constructor() {
    super("API unavailable");
  }
}

export class ApiForbiddenError extends Error {
  constructor() {
    super("API forbidden");
  }
}

export async function fetchState(parent: boolean, parentPin?: string): Promise<ApiState> {
  return request(parent ? "/api/parent-state" : "/api/kiosk-state", undefined, parentPin);
}

export async function postTransaction(input: TransactionInput, parentPin: string): Promise<ApiState> {
  return request("/api/transactions", {
    method: "POST",
    body: JSON.stringify(input),
  }, parentPin);
}

export async function postCancelTransaction(source: Transaction, reason: string, parentPin: string): Promise<ApiState> {
  return request(`/api/transactions/${encodeURIComponent(source.id)}/cancel`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  }, parentPin);
}

export async function postSettings(state: Pick<AppState, "settings" | "children">, parentPin: string): Promise<ApiState> {
  return request("/api/settings", {
    method: "POST",
    body: JSON.stringify(state),
  }, parentPin);
}

async function request(path: string, init?: RequestInit, parentPin?: string): Promise<ApiState> {
  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      headers: {
        "content-type": "application/json",
        ...(parentPin ? { "x-token-eco-parent-pin": parentPin } : {}),
        ...init?.headers,
      },
    });
  } catch {
    throw new ApiUnavailableError();
  }

  if (response.status === 404) throw new ApiUnavailableError();
  if (response.status === 401 || response.status === 403) throw new ApiForbiddenError();
  if (!response.ok) throw new Error(`API request failed: ${response.status}`);

  return response.json() as Promise<ApiState>;
}
