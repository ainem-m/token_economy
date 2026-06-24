import { Check, Minus, Plus, Save } from "lucide-react";
import { useMemo, useState } from "react";
import { ItemIcon } from "../../components/common/ItemIcon";
import { ParentSection } from "../../components/parent/ParentSection";
import { getBalance, getCurrentMission, isMissionCompleted, isMissionOverdue } from "../../domain/calculations";
import type { Mission, ShopItem, TransactionType } from "../../domain/types";
import type { AppState, TransactionInput } from "../../state/appState";

type RecordMode = "grant" | "spend";

export function ParentRecord({
  state,
  onAddTransaction,
  onCompleteMission,
}: {
  state: AppState;
  onAddTransaction: (input: TransactionInput) => void | Promise<void>;
  onCompleteMission: (mission: Mission) => void | Promise<void>;
}) {
  const activeChildren = useMemo(
    () => [...state.children].filter((child) => child.isActive).sort((a, b) => a.displayOrder - b.displayOrder),
    [state.children],
  );
  const activeShopItems = useMemo(
    () => [...state.shopItems].filter((item) => item.isActive).sort((a, b) => a.sortOrder - b.sortOrder),
    [state.shopItems],
  );
  const [childId, setChildId] = useState(activeChildren[0]?.id ?? "");
  const [mode, setMode] = useState<RecordMode>("grant");
  const [amount, setAmount] = useState(state.settings.weeklyGrantAmount);
  const [label, setLabel] = useState("土ようび");
  const [note, setNote] = useState("物理タグの受け渡し");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [missionPending, setMissionPending] = useState(false);
  const balance = getBalance(state.transactions, childId);
  const mission = getCurrentMission(state.missions, childId);

  const chooseWeeklyGrant = () => {
    setMode("grant");
    setAmount(state.settings.weeklyGrantAmount);
    setLabel("土ようび");
    setNote("物理タグの受け渡し");
    setMessage("");
  };

  const chooseShopItem = (item: ShopItem) => {
    setMode("spend");
    setAmount(item.cost);
    setLabel(item.name);
    setNote("物理タグを回収");
    setMessage("");
  };

  const record = async () => {
    const normalizedAmount = Math.max(1, amount);
    const signedAmount = mode === "grant" ? normalizedAmount : -normalizedAmount;

    if (mode === "spend" && normalizedAmount > balance) {
      setMessage("残高が足りないため記録できません");
      return;
    }

    setPending(true);
    try {
      await onAddTransaction({
        childId,
        type: mode as TransactionType,
        amount: signedAmount,
        label: label.trim() || (mode === "grant" ? "もらった" : "つかった"),
        note: note.trim(),
      });
      setMessage("記録しました");
    } catch {
      setMessage("記録できませんでした");
    } finally {
      setPending(false);
    }
  };

  const completeMission = async () => {
    if (!mission || isMissionCompleted(mission)) return;

    setMissionPending(true);
    try {
      await onCompleteMission(mission);
      setMessage("ミッションを記録しました");
    } catch {
      setMessage("ミッションを記録できませんでした");
    } finally {
      setMissionPending(false);
    }
  };

  return (
    <div className="parent-page">
      <ParentSection title="記録する" caption={`いま ${balance}こ。物理タグの受け渡しを親が記録します`}>
        <div className="segmented-control">
          {activeChildren.map((child) => (
            <button className={child.id === childId ? "active" : ""} key={child.id} onClick={() => setChildId(child.id)}>
              {child.name}
            </button>
          ))}
        </div>
        <div className="action-choice">
          <button className={mode === "grant" ? "positive active" : "positive"} onClick={chooseWeeklyGrant}>
            <Plus size={20} />もらった
          </button>
          <button className={mode === "spend" ? "negative active" : "negative"} onClick={() => setMode("spend")}>
            <Minus size={20} />つかった
          </button>
        </div>
      </ParentSection>

      <ParentSection title="クイック商品">
        <div className="quick-grid">
          <button className={label === "土ようび" ? "quick-card selected" : "quick-card"} onClick={chooseWeeklyGrant}>
            <ItemIcon preset="coin" />
            <span>土ようび</span>
            <b>+{state.settings.weeklyGrantAmount}こ</b>
          </button>
          {activeShopItems.slice(0, 3).map((item) => (
            <button className={label === item.name ? "quick-card selected" : "quick-card"} key={item.id} onClick={() => chooseShopItem(item)}>
              <ItemIcon preset={item.imagePreset} />
              <span>{item.name}</span>
              <b>{item.cost}こ</b>
            </button>
          ))}
        </div>
      </ParentSection>

      <ParentSection title="みっしょん">
        {mission ? (
          <div className="mission-complete-card">
            <div>
              <strong>{mission.title}</strong>
              <p className={isMissionOverdue(mission) ? "mission-parent-status overdue" : "mission-parent-status"}>
                {isMissionCompleted(mission) ? "達成済み" : isMissionOverdue(mission) ? "期限を過ぎています" : "できたら記録"}
              </p>
            </div>
            <b>+{mission.rewardAmount}こ</b>
            <button onClick={completeMission} disabled={missionPending || isMissionCompleted(mission)}>
              <Check size={18} />
              {isMissionCompleted(mission) ? "達成済み" : "できた"}
            </button>
          </div>
        ) : (
          <p className="empty-note">ミッションは未設定です</p>
        )}
      </ParentSection>

      <ParentSection title="詳細">
        <div className="form-grid">
          <label>
            数量
            <div className="static-stepper">
              <button aria-label="数量を減らす" onClick={() => setAmount(Math.max(1, amount - 1))}>-</button>
              <input aria-label="数量" value={amount} readOnly />
              <button aria-label="数量を増やす" onClick={() => setAmount(amount + 1)}>+</button>
            </div>
          </label>
          <label>
            メモ
            <input value={note} onChange={(event) => setNote(event.target.value)} />
          </label>
        </div>
      </ParentSection>

      {message && <p className={message.includes("できません") ? "record-message error" : "record-message"}>{message}</p>}

      <button className="primary-action" onClick={record} disabled={pending}>
        <Save size={20} />
        記録する
      </button>
    </div>
  );
}
