import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { seedState } from "./seedData.mjs";

const DB_PATH = process.env.TOKEN_ECO_DB || path.join(process.cwd(), "data", "token-eco.sqlite");
const TEST_RESET_ENABLED = process.env.TOKEN_ECO_TEST_RESET === "1";

if (TEST_RESET_ENABLED && !DB_PATH.endsWith("playwright.sqlite")) {
  throw new Error("TOKEN_ECO_TEST_RESET can only be used with the Playwright test database");
}

mkdirSync(path.dirname(DB_PATH), { recursive: true });

export const db = new DatabaseSync(DB_PATH);

export function initDb() {
  db.exec(`
    create table if not exists documents (
      key text primary key,
      value text not null
    );

    create table if not exists transactions (
      id text primary key,
      child_id text not null,
      type text not null,
      amount integer not null,
      label text not null,
      note text,
      related_transaction_id text,
      occurred_at text not null
    );

  `);

  seedDocument("settings", seedState.settings);
  seedDocument("children", seedState.children);
  seedDocument("shopItems", seedState.shopItems);
  seedDocument("goals", seedState.goals);
  seedDocument("lastUpdatedAt", seedState.lastUpdatedAt);

  const transactionCount = db.prepare("select count(*) as count from transactions").get().count;
  if (transactionCount === 0) {
    seedTransactions();
  }
}

export function resetAppStateForTest() {
  if (!TEST_RESET_ENABLED) {
    throw httpError(404, "not_found");
  }

  db.exec("begin immediate");
  try {
    db.exec("delete from transactions; delete from documents;");
    seedDocument("settings", seedState.settings);
    seedDocument("children", seedState.children);
    seedDocument("shopItems", seedState.shopItems);
    seedDocument("goals", seedState.goals);
    seedDocument("lastUpdatedAt", seedState.lastUpdatedAt);
    seedTransactions();
    db.exec("commit");
  } catch (error) {
    db.exec("rollback");
    throw error;
  }
}

function seedDocument(key, value) {
  db.prepare("insert or ignore into documents (key, value) values (?, ?)").run(key, JSON.stringify(value));
}

function seedTransactions() {
  const insert = db.prepare(`
    insert into transactions
      (id, child_id, type, amount, label, note, related_transaction_id, occurred_at)
    values
      (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const transaction of seedState.transactions) {
    insert.run(
      transaction.id,
      transaction.childId,
      transaction.type,
      transaction.amount,
      transaction.label,
      transaction.note ?? null,
      transaction.relatedTransactionId ?? null,
      transaction.occurredAt,
    );
  }
}

export function readAppState() {
  return {
    settings: readDocument("settings"),
    children: readDocument("children"),
    shopItems: readDocument("shopItems"),
    goals: readDocument("goals"),
    transactions: readTransactions(),
    lastUpdatedAt: readDocument("lastUpdatedAt"),
  };
}

export function addTransaction(input, options = {}) {
  const normalized = normalizeTransactionInput(input, options);

  if (normalized.type === "spend" && Math.abs(normalized.amount) > getBalance(normalized.childId)) {
    throw httpError(400, "insufficient_balance");
  }

  const transaction = {
    id: crypto.randomUUID(),
    ...normalized,
    occurredAt: new Date().toISOString(),
  };

  insertTransaction(transaction);
  writeDocument("lastUpdatedAt", transaction.occurredAt);
  return transaction;
}

export function cancelTransaction(sourceId, reason) {
  const source = db.prepare("select * from transactions where id = ?").get(sourceId);
  if (!source) throw httpError(404, "transaction_not_found");

  const existingCancel = db.prepare("select count(*) as count from transactions where related_transaction_id = ?").get(sourceId).count;
  if (existingCancel > 0) throw httpError(409, "transaction_already_cancelled");

  return addTransaction({
    childId: source.child_id,
    type: "cancel",
    amount: -source.amount,
    label: `取り消し: ${source.label}`,
    note: reason,
    relatedTransactionId: source.id,
  }, { allowCancel: true });
}

function getBalance(childId) {
  return db.prepare("select coalesce(sum(amount), 0) as balance from transactions where child_id = ?").get(childId).balance;
}

export function updateSettings(input) {
  const current = readAppState();
  const settings = normalizeSettings(input.settings, current.settings);
  const children = normalizeChildren(input.children, current.children);
  const updatedAt = new Date().toISOString();

  writeDocument("settings", settings);
  writeDocument("children", children);
  writeDocument("lastUpdatedAt", updatedAt);
}

export function updateGoals(input) {
  const current = readAppState();
  const goals = normalizeGoals(input.goals, current.goals, current.children);
  const updatedAt = new Date().toISOString();

  writeDocument("goals", goals);
  writeDocument("lastUpdatedAt", updatedAt);
}

function normalizeSettings(input, fallback) {
  return {
    ...fallback,
    tokenYen: positiveInteger(input?.tokenYen, fallback.tokenYen),
    physicalTokenLimit: positiveInteger(input?.physicalTokenLimit, fallback.physicalTokenLimit),
    weeklyGrantAmount: positiveInteger(input?.weeklyGrantAmount, fallback.weeklyGrantAmount),
  };
}

function normalizeTransactionInput(input, { allowCancel = false } = {}) {
  const current = readAppState();
  const child = current.children.find((candidate) => candidate.id === input?.childId && candidate.isActive);
  if (!child) throw httpError(400, "invalid_child");

  const type = String(input?.type || "");
  const allowedTypes = allowCancel ? new Set(["grant", "spend", "cancel"]) : new Set(["grant", "spend"]);
  if (!allowedTypes.has(type)) throw httpError(400, "invalid_transaction_type");

  const amount = Number(input?.amount);
  if (!Number.isInteger(amount) || amount === 0) throw httpError(400, "invalid_amount");
  if (type === "grant" && amount <= 0) throw httpError(400, "invalid_amount_sign");
  if (type === "spend" && amount >= 0) throw httpError(400, "invalid_amount_sign");
  if (type === "cancel" && !input?.relatedTransactionId) throw httpError(400, "invalid_cancel");

  const label = String(input?.label || "").trim().slice(0, 32);
  if (!label) throw httpError(400, "invalid_label");

  const note = String(input?.note || "").trim().slice(0, 120);
  const relatedTransactionId = input?.relatedTransactionId ? String(input.relatedTransactionId).slice(0, 80) : undefined;

  return {
    childId: child.id,
    type,
    amount,
    label,
    note: note || undefined,
    relatedTransactionId,
  };
}

function normalizeChildren(input, fallback) {
  if (!Array.isArray(input)) return fallback;

  return fallback.map((child) => {
    const next = input.find((candidate) => candidate?.id === child.id);
    if (!next) return child;
    return {
      ...child,
      name: String(next.name || child.name).trim().slice(0, 16) || child.name,
      ageLabel: String(next.ageLabel || child.ageLabel).trim().slice(0, 16) || child.ageLabel,
      displayOrder: positiveInteger(next.displayOrder, child.displayOrder),
      isActive: typeof next.isActive === "boolean" ? next.isActive : child.isActive,
    };
  });
}

function normalizeGoals(input, fallback, children) {
  if (!Array.isArray(input)) return fallback;
  const activeChildIds = new Set(children.filter((child) => child.isActive).map((child) => child.id));

  return fallback.map((goal) => {
    const next = input.find((candidate) => candidate?.id === goal.id);
    if (!next || !activeChildIds.has(goal.childId)) return goal;
    const imageUrl = String(next.imageUrl || "").trim();
    const targetAmount = positiveInteger(next.targetAmount, goal.targetAmount);
    const status = normalizeGoalStatus(next.status, goal.status);
    if (status === "achieved" && getBalance(goal.childId) < targetAmount) {
      throw httpError(400, "goal_not_achieved");
    }

    return {
      ...goal,
      title: String(next.title || goal.title).trim().slice(0, 32) || goal.title,
      targetAmount,
      imagePreset: normalizePreset(next.imagePreset, goal.imagePreset),
      imageUrl: imageUrl ? imageUrl.slice(0, 500) : undefined,
      status,
    };
  });
}

function normalizePreset(value, fallback) {
  const presets = new Set(["choco", "ice", "gacha", "blocks", "book", "plush", "coin"]);
  return presets.has(value) ? value : fallback;
}

function normalizeGoalStatus(value, fallback) {
  const statuses = new Set(["active", "achieved", "archived"]);
  return statuses.has(value) ? value : fallback;
}

function positiveInteger(value, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(1, Math.round(parsed));
}

function httpError(status, code) {
  const error = new Error(code);
  error.status = status;
  error.code = code;
  return error;
}

function readDocument(key) {
  const row = db.prepare("select value from documents where key = ?").get(key);
  return row ? JSON.parse(row.value) : null;
}

function writeDocument(key, value) {
  db.prepare("insert into documents (key, value) values (?, ?) on conflict(key) do update set value = excluded.value").run(
    key,
    JSON.stringify(value),
  );
}

function insertTransaction(transaction) {
  db.prepare(`
    insert into transactions
      (id, child_id, type, amount, label, note, related_transaction_id, occurred_at)
    values
      (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    transaction.id,
    transaction.childId,
    transaction.type,
    transaction.amount,
    transaction.label,
    transaction.note ?? null,
    transaction.relatedTransactionId ?? null,
    transaction.occurredAt,
  );
}

function readTransactions() {
  return db.prepare("select * from transactions order by occurred_at desc, id desc").all().map((row) => ({
    id: row.id,
    childId: row.child_id,
    type: row.type,
    amount: row.amount,
    label: row.label,
    note: row.note ?? undefined,
    relatedTransactionId: row.related_transaction_id ?? undefined,
    occurredAt: row.occurred_at,
  }));
}
