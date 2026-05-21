import { RotateCcw } from "lucide-react";
import { useState } from "react";
import { ItemIcon } from "../../components/common/ItemIcon";
import { ParentSection } from "../../components/parent/ParentSection";
import { isTransactionCancelled } from "../../domain/calculations";
import type { ItemPreset, Transaction } from "../../domain/types";
import type { AppState } from "../../state/appState";

const cancelReasons = ["入力ミス", "数量ミス", "商品ミス", "子ども変更", "その他"];

export function ParentHistory({
  state,
  onCancelTransaction,
}: {
  state: AppState;
  onCancelTransaction: (transaction: Transaction, reason: string) => void | Promise<void>;
}) {
  const sorted = [...state.transactions].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
  const [targetId, setTargetId] = useState<string | null>(null);
  const [reasonType, setReasonType] = useState(cancelReasons[0]);
  const [reasonNote, setReasonNote] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  const targetTransaction = sorted.find((transaction) => transaction.id === targetId);

  const closeCancelPanel = () => {
    setTargetId(null);
    setReasonType(cancelReasons[0]);
    setReasonNote("");
    setMessage("");
  };

  const confirmCancel = async () => {
    if (!targetTransaction) return;
    const reason = [reasonType, reasonNote.trim()].filter(Boolean).join(": ");
    setPending(true);
    try {
      await onCancelTransaction(targetTransaction, reason);
      closeCancelPanel();
    } catch {
      setMessage("取り消しできませんでした");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="parent-page">
      <ParentSection title="履歴" caption="削除せず、取り消し取引で補正します">
        {targetTransaction && (
          <div className="cancel-panel">
            <div>
              <strong>{targetTransaction.label} を取り消す</strong>
              <p>理由を残して、逆符号の取引を追加します。</p>
            </div>
            <div className="reason-grid">
              {cancelReasons.map((reason) => (
                <button className={reason === reasonType ? "active" : ""} key={reason} onClick={() => setReasonType(reason)}>
                  {reason}
                </button>
              ))}
            </div>
            <label>
              メモ
              <input value={reasonNote} onChange={(event) => setReasonNote(event.target.value)} placeholder="任意" />
            </label>
            <div className="cancel-actions">
              <button onClick={closeCancelPanel}>やめる</button>
              <button className="danger" onClick={confirmCancel} disabled={pending}>取り消す</button>
            </div>
            {message && <p className="record-message error">{message}</p>}
          </div>
        )}
        <div className="history-list">
          {sorted.map((transaction) => (
            <HistoryRow
              key={transaction.id}
              transaction={transaction}
              state={state}
              onStartCancel={() => {
                setTargetId(transaction.id);
                setReasonType(cancelReasons[0]);
                setReasonNote("");
                setMessage("");
              }}
            />
          ))}
        </div>
      </ParentSection>
    </div>
  );
}

function HistoryRow({
  transaction,
  state,
  onStartCancel,
}: {
  transaction: Transaction;
  state: AppState;
  onStartCancel: () => void;
}) {
  const child = state.children.find((item) => item.id === transaction.childId);
  const preset = getPreset(transaction);
  const isCancelTransaction = transaction.type === "cancel";
  const cancelled = isTransactionCancelled(state.transactions, transaction.id);

  return (
    <article
      className={cancelled ? "history-row cancelled" : "history-row"}
      aria-label={[child?.name ?? "子ども", transaction.label, transaction.note].filter(Boolean).join(" ")}
    >
      <div className="date-pill">{formatDate(transaction.occurredAt)}</div>
      <ItemIcon preset={preset} />
      <div className="history-text">
        <strong>{transaction.label}</strong>
        <span>{child?.name}{transaction.note ? ` / ${transaction.note}` : ""}</span>
        {cancelled && <em>取消済み</em>}
      </div>
      <b className={transaction.amount >= 0 ? "amount plus" : "amount minus"}>
        {transaction.amount > 0 ? "+" : ""}{transaction.amount}こ
      </b>
      <button className="cancel-button" disabled={isCancelTransaction || cancelled} onClick={onStartCancel}>
        <RotateCcw size={16} />
        {isCancelTransaction ? "取消取引" : cancelled ? "取消済み" : "取消"}
      </button>
    </article>
  );
}

function getPreset(transaction: Transaction): ItemPreset {
  if (transaction.label.includes("チョコ")) return "choco";
  if (transaction.label.includes("アイス")) return "ice";
  if (transaction.label.includes("ガチャ")) return "gacha";
  if (transaction.type === "grant") return "coin";
  if (transaction.type === "cancel") return "coin";
  return "plush";
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("ja-JP", { month: "numeric", day: "numeric" }).format(new Date(value));
}
