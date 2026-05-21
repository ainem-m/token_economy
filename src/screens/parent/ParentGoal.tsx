import { Save } from "lucide-react";
import { useMemo, useState } from "react";
import { ItemIcon } from "../../components/common/ItemIcon";
import { ParentSection } from "../../components/parent/ParentSection";
import type { Goal, ItemPreset } from "../../domain/types";
import type { AppState } from "../../state/appState";

const presets: ItemPreset[] = ["blocks", "plush", "book", "gacha"];

export function ParentGoal({
  state,
  onSaveGoals,
}: {
  state: AppState;
  onSaveGoals: (goals: Goal[]) => void | Promise<void>;
}) {
  const activeChildren = useMemo(
    () => [...state.children].filter((child) => child.isActive).sort((a, b) => a.displayOrder - b.displayOrder),
    [state.children],
  );
  const [goals, setGoals] = useState(state.goals);
  const [childId, setChildId] = useState(activeChildren[0]?.id ?? "");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  const goal = goals.find((item) => item.childId === childId && item.status === "active") ?? goals[0];

  const updateGoal = (patch: Partial<Goal>) => {
    setGoals((current) => current.map((item) => (item.id === goal.id ? { ...item, ...patch } : item)));
    setMessage("");
  };

  const save = async () => {
    const normalizedGoals = goals.map((item) => ({
      ...item,
      title: item.title.trim() || "ほしいもの",
      targetAmount: Math.max(1, Math.round(item.targetAmount)),
      imageUrl: item.imageUrl?.trim() || undefined,
    }));
    setPending(true);
    try {
      await onSaveGoals(normalizedGoals);
      setGoals(normalizedGoals);
      setMessage("保存しました");
    } catch {
      setMessage("保存できませんでした");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="parent-page">
      <ParentSection title="目標を編集" caption="子どもごとに1つだけ">
        <div className="segmented-control">
          {activeChildren.map((child) => (
            <button className={child.id === childId ? "active" : ""} key={child.id} onClick={() => setChildId(child.id)}>
              {child.name}
            </button>
          ))}
        </div>
        <div className="form-grid single">
          <label>
            目標名
            <input value={goal.title} onChange={(event) => updateGoal({ title: event.target.value })} />
          </label>
          <label>
            必要タグ数
            <div className="static-stepper">
              <button onClick={() => updateGoal({ targetAmount: Math.max(1, goal.targetAmount - 1) })}>-</button>
              <input
                aria-label="必要タグ数"
                inputMode="numeric"
                value={goal.targetAmount}
                onChange={(event) => updateGoal({ targetAmount: Number(event.target.value) || 1 })}
              />
              <button onClick={() => updateGoal({ targetAmount: goal.targetAmount + 1 })}>+</button>
            </div>
          </label>
        </div>
      </ParentSection>

      <ParentSection title="画像" caption="URLを入れるとプリセットより優先">
        <label>
          画像URL
          <input
            value={goal.imageUrl ?? ""}
            placeholder="https://..."
            onChange={(event) => updateGoal({ imageUrl: event.target.value })}
          />
        </label>
        <div className="image-preset-grid">
          {presets.map((preset) => (
            <button className={preset === goal.imagePreset ? "active" : ""} key={preset} onClick={() => updateGoal({ imagePreset: preset })}>
              <ItemIcon preset={preset} large />
            </button>
          ))}
        </div>
      </ParentSection>

      {message && <p className={message.includes("できません") ? "record-message error" : "record-message"}>{message}</p>}

      <button className="primary-action" onClick={save} disabled={pending}>
        <Save size={20} />
        保存する
      </button>
    </div>
  );
}
