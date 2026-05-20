import { Save } from "lucide-react";
import { useMemo, useState } from "react";
import { ParentSection } from "../../components/parent/ParentSection";
import type { Child, Settings } from "../../domain/types";
import type { AppState } from "../../state/appState";

export function ParentSettings({
  state,
  onSaveSettings,
}: {
  state: AppState;
  onSaveSettings: (input: { settings: Settings; children: Child[] }) => void;
}) {
  const sortedChildren = useMemo(
    () => [...state.children].sort((a, b) => a.displayOrder - b.displayOrder),
    [state.children],
  );
  const [settings, setSettings] = useState(state.settings);
  const [children, setChildren] = useState(sortedChildren);
  const [message, setMessage] = useState("");

  const updateSetting = (key: keyof Settings, value: number) => {
    setSettings((current) => ({
      ...current,
      [key]: Math.max(1, Math.round(value)),
    }));
    setMessage("");
  };

  const updateChild = (id: string, patch: Partial<Child>) => {
    setChildren((current) => current.map((child) => (child.id === id ? { ...child, ...patch } : child)));
    setMessage("");
  };

  const save = () => {
    const normalizedChildren = children.map((child, index) => ({
      ...child,
      name: child.name.trim() || `こども${index + 1}`,
      ageLabel: child.ageLabel.trim() || "こども",
      displayOrder: index + 1,
    }));
    onSaveSettings({ settings, children: normalizedChildren });
    setMessage("保存しました");
  };

  return (
    <div className="parent-page">
      <ParentSection title="タグ設定" caption="支給数と表示の上限">
        <div className="form-grid">
          <NumberStepper
            label="土ようび支給"
            value={settings.weeklyGrantAmount}
            suffix="こ"
            onChange={(value) => updateSetting("weeklyGrantAmount", value)}
          />
          <NumberStepper
            label="物理タグ上限"
            value={settings.physicalTokenLimit}
            suffix="こ"
            onChange={(value) => updateSetting("physicalTokenLimit", value)}
          />
          <NumberStepper
            label="1タグ"
            value={settings.tokenYen}
            suffix="円"
            step={50}
            onChange={(value) => updateSetting("tokenYen", value)}
          />
        </div>
      </ParentSection>

      <ParentSection title="子ども表示" caption="キオスクに出る名前とラベル">
        <div className="child-settings-list">
          {children.map((child) => (
            <section className="child-settings-row" key={child.id}>
              <div className={`settings-avatar ${child.color}`}>{child.avatar === "girl" ? "👧" : "👦"}</div>
              <label>
                名前
                <input value={child.name} onChange={(event) => updateChild(child.id, { name: event.target.value })} />
              </label>
              <label>
                ラベル
                <input value={child.ageLabel} onChange={(event) => updateChild(child.id, { ageLabel: event.target.value })} />
              </label>
            </section>
          ))}
        </div>
      </ParentSection>

      {message && <p className="record-message">{message}</p>}

      <button className="primary-action" onClick={save}>
        <Save size={20} />
        保存する
      </button>
    </div>
  );
}

function NumberStepper({
  label,
  value,
  suffix,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  suffix: string;
  step?: number;
  onChange: (value: number) => void;
}) {
  return (
    <label>
      {label}
      <div className="static-stepper with-suffix">
        <button onClick={() => onChange(Math.max(1, value - step))}>-</button>
        <input
          inputMode="numeric"
          value={value}
          onChange={(event) => onChange(Number(event.target.value) || 1)}
        />
        <button onClick={() => onChange(value + step)}>+</button>
        <span>{suffix}</span>
      </div>
    </label>
  );
}
