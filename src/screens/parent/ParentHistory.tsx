import { RotateCcw } from "lucide-react";
import { ItemIcon } from "../../components/common/ItemIcon";
import { ParentSection } from "../../components/parent/ParentSection";
import type { ItemPreset, Transaction } from "../../domain/types";
import type { AppState } from "../../state/appState";

export function ParentHistory({ state }: { state: AppState }) {
  const sorted = [...state.transactions].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));

  return (
    <div className="parent-page">
      <ParentSection title="履歴" caption="削除せず、取り消し取引で補正します">
        <div className="history-list">
          {sorted.map((transaction) => (
            <HistoryRow key={transaction.id} transaction={transaction} state={state} />
          ))}
        </div>
      </ParentSection>
    </div>
  );
}

function HistoryRow({ transaction, state }: { transaction: Transaction; state: AppState }) {
  const child = state.children.find((item) => item.id === transaction.childId);
  const preset = getPreset(transaction);

  return (
    <article className="history-row">
      <div className="date-pill">{formatDate(transaction.occurredAt)}</div>
      <ItemIcon preset={preset} />
      <div className="history-text">
        <strong>{transaction.label}</strong>
        <span>{child?.name}{transaction.note ? ` / ${transaction.note}` : ""}</span>
      </div>
      <b className={transaction.amount >= 0 ? "amount plus" : "amount minus"}>
        {transaction.amount > 0 ? "+" : ""}{transaction.amount}こ
      </b>
      <button className="cancel-button" disabled title="Phase 3で実装">
        <RotateCcw size={16} />
        取消は次
      </button>
    </article>
  );
}

function getPreset(transaction: Transaction): ItemPreset {
  if (transaction.label.includes("チョコ")) return "choco";
  if (transaction.label.includes("アイス")) return "ice";
  if (transaction.label.includes("ガチャ")) return "gacha";
  if (transaction.type === "grant") return "coin";
  return "plush";
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("ja-JP", { month: "numeric", day: "numeric" }).format(new Date(value));
}
