import { Save } from "lucide-react";
import { ItemIcon } from "../../components/common/ItemIcon";
import { ParentSection } from "../../components/parent/ParentSection";
import type { ItemPreset } from "../../domain/types";
import type { AppState } from "../../state/appState";

const presets: ItemPreset[] = ["blocks", "plush", "book", "gacha"];

export function ParentGoal({ state }: { state: AppState }) {
  const goal = state.goals.find((item) => item.status === "active") ?? state.goals[0];

  return (
    <div className="parent-page">
      <ParentSection title="目標を編集" caption="子どもごとに1つだけ">
        <div className="segmented-control">
          {state.children.map((child) => (
            <button className={child.id === goal.childId ? "active" : ""} key={child.id}>{child.name}</button>
          ))}
        </div>
        <div className="form-grid single">
          <label>
            目標名
            <input value={goal.title} readOnly />
          </label>
          <label>
            必要タグ数
            <div className="static-stepper">
              <button>-</button>
              <input value={goal.targetAmount} readOnly />
              <button>+</button>
            </div>
          </label>
        </div>
      </ParentSection>

      <ParentSection title="画像">
        <div className="image-preset-grid">
          {presets.map((preset) => (
            <button className={preset === goal.imagePreset ? "active" : ""} key={preset}>
              <ItemIcon preset={preset} large />
            </button>
          ))}
        </div>
      </ParentSection>

      <button className="primary-action">
        <Save size={20} />
        保存する
      </button>
    </div>
  );
}
