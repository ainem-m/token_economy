import { RotateCcw } from "lucide-react";
import { ItemIcon } from "../../components/common/ItemIcon";
import { ParentSection } from "../../components/parent/ParentSection";
import { children, transactions } from "../../data/sampleData";
import type { ItemPreset, Transaction } from "../../domain/types";

export function ParentHistory() {
  const sorted = [...transactions].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));

  return (
    <div className="parent-page">
      <ParentSection title="履歴" caption="削除せず、取り消し取引で補正します">
        <div className="history-list">
          {sorted.map((transaction) => (
            <HistoryRow key={transaction.id} transaction={transaction} />
          ))}
        </div>
      </ParentSection>
    </div>
  );
}

function HistoryRow({ transaction }: { transaction: Transaction }) {
  const child = children.find((item) => item.id === transaction.childId);
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
      <button className="cancel-button">
        <RotateCcw size={16} />
        取消
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
