import { CheckCircle2, Save, X } from "lucide-react";
import { useEffect, useRef, type KeyboardEvent } from "react";
import { ItemIcon } from "../common/ItemIcon";
import { getBalance, isGoalAchieved } from "../../domain/calculations";
import type { Goal, ItemPreset } from "../../domain/types";
import type { AppState } from "../../state/appState";

const presets: ItemPreset[] = ["blocks", "plush", "book", "gacha"];
const presetLabels: Record<ItemPreset, string> = {
  blocks: "ブロック",
  plush: "ぬいぐるみ",
  book: "本",
  gacha: "プレゼント",
  choco: "チョコ",
  ice: "アイス",
  coin: "コイン",
};

export function GoalEditorModal({
  childName,
  confirmClose,
  draft,
  message,
  pending,
  state,
  onCancelClose,
  onChange,
  onDiscard,
  onRequestClose,
  onSave,
}: {
  childName: string;
  confirmClose: boolean;
  draft: Goal;
  message: string;
  pending: boolean;
  state: AppState;
  onCancelClose: () => void;
  onChange: (patch: Partial<Goal>) => void;
  onDiscard: () => void;
  onRequestClose: () => void;
  onSave: () => void;
}) {
  const modalRef = useRef<HTMLElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const continueButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    firstInputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (confirmClose) continueButtonRef.current?.focus();
  }, [confirmClose]);

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onRequestClose();
      return;
    }

    if (event.key !== "Tab" || !modalRef.current) return;
    const focusable = Array.from(
      modalRef.current.querySelectorAll<HTMLElement>("button:not(:disabled), input:not(:disabled)"),
    ).filter((element) => element.offsetParent !== null && !element.closest("[inert]"));
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!first || !last) return;

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <div className="modal-backdrop" role="presentation" onClick={onRequestClose}>
      <section
        className="goal-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="goal-modal-title"
        ref={modalRef}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <header className="modal-header">
          <div>
            <p>目標設定</p>
            <h2 id="goal-modal-title">{childName}の目標</h2>
          </div>
          <button className="icon-button" onClick={onRequestClose} aria-label="目標設定を閉じる">
            <X size={20} />
          </button>
        </header>

        <div className="form-grid single" aria-hidden={confirmClose || undefined} inert={confirmClose || undefined}>
          <label>
            目標名
            <input ref={firstInputRef} value={draft.title} onChange={(event) => onChange({ title: event.target.value })} />
          </label>
          <label>
            必要タグ数
            <div className="static-stepper">
              <button aria-label="必要タグ数を減らす" onClick={() => onChange({ targetAmount: Math.max(1, draft.targetAmount - 1) })}>
                -
              </button>
              <input
                aria-label="必要タグ数"
                inputMode="numeric"
                value={draft.targetAmount}
                onChange={(event) => onChange({ targetAmount: Number(event.target.value) || 1 })}
              />
              <button aria-label="必要タグ数を増やす" onClick={() => onChange({ targetAmount: draft.targetAmount + 1 })}>
                +
              </button>
            </div>
          </label>
          <label>
            画像URL
            <input value={draft.imageUrl ?? ""} placeholder="https://..." onChange={(event) => onChange({ imageUrl: event.target.value })} />
          </label>
        </div>

        <div className="image-preset-grid" aria-hidden={confirmClose || undefined} inert={confirmClose || undefined}>
          {presets.map((preset) => (
            <button
              aria-label={presetLabels[preset]}
              aria-pressed={preset === draft.imagePreset}
              className={preset === draft.imagePreset ? "active" : ""}
              key={preset}
              onClick={() => onChange({ imagePreset: preset })}
            >
              <ItemIcon preset={preset} large />
            </button>
          ))}
        </div>

        <div aria-hidden={confirmClose || undefined} inert={confirmClose || undefined}>
          <AchievedControl draft={draft} state={state} onChange={(status) => onChange({ status })} />
        </div>

        {confirmClose && (
          <div className="modal-confirm" role="alert">
            <strong>保存していない変更があります</strong>
          </div>
        )}

        {message && <p className={message.includes("できません") ? "record-message error" : "record-message"}>{message}</p>}

        {confirmClose ? (
          <div className="modal-actions">
            <button ref={continueButtonRef} onClick={onCancelClose}>編集を続ける</button>
            <button className="danger-action" onClick={onDiscard}>破棄する</button>
          </div>
        ) : (
          <div className="modal-actions">
            <button onClick={onRequestClose}>キャンセル</button>
            <button className="primary-action" onClick={onSave} disabled={pending}>
              <Save size={20} />
              保存する
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

function AchievedControl({
  draft,
  state,
  onChange,
}: {
  draft: Goal;
  state: AppState;
  onChange: (status: Goal["status"]) => void;
}) {
  const balance = getBalance(state.transactions, draft.childId);
  const achieved = isGoalAchieved(balance, draft);

  return (
    <label className={achieved ? "achieved-toggle" : "achieved-toggle disabled"}>
      <input
        type="checkbox"
        checked={draft.status === "achieved"}
        disabled={!achieved}
        onChange={(event) => onChange(event.target.checked ? "achieved" : "active")}
      />
      <CheckCircle2 size={20} />
      <span>{achieved ? "達成済みにする" : "必要タグ数に届くと達成済みにできます"}</span>
    </label>
  );
}
