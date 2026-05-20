import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { seedState } from "./seedData.mjs";

const DB_PATH = process.env.TOKEN_ECO_DB || path.join(process.cwd(), "data", "token-eco.sqlite");

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
}

function seedDocument(key, value) {
  db.prepare("insert or ignore into documents (key, value) values (?, ?)").run(key, JSON.stringify(value));
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

export function addTransaction(input) {
  const transaction = {
    id: crypto.randomUUID(),
    childId: input.childId,
    type: input.type,
    amount: input.amount,
    label: input.label,
    note: input.note || undefined,
    relatedTransactionId: input.relatedTransactionId,
    occurredAt: new Date().toISOString(),
  };

  insertTransaction(transaction);
  writeDocument("lastUpdatedAt", transaction.occurredAt);
  return transaction;
}

export function cancelTransaction(sourceId, reason) {
  const source = db.prepare("select * from transactions where id = ?").get(sourceId);
  if (!source) return null;

  return addTransaction({
    childId: source.child_id,
    type: "cancel",
    amount: -source.amount,
    label: `取り消し: ${source.label}`,
    note: reason,
    relatedTransactionId: source.id,
  });
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
