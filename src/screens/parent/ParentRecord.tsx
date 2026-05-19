import { Minus, Plus, Save } from "lucide-react";
import { ItemIcon } from "../../components/common/ItemIcon";
import { ParentSection } from "../../components/parent/ParentSection";
import { children, shopItems } from "../../data/sampleData";

export function ParentRecord() {
  return (
    <div className="parent-page">
      <ParentSection title="記録する" caption="Phase 1では見た目だけです">
        <div className="segmented-control">
          {children.map((child) => (
            <button className={child.id === "aoi" ? "active" : ""} key={child.id}>{child.name}</button>
          ))}
        </div>
        <div className="action-choice">
          <button className="positive active"><Plus size={20} />もらった</button>
          <button className="negative"><Minus size={20} />つかった</button>
        </div>
      </ParentSection>

      <ParentSection title="クイック商品">
        <div className="quick-grid">
          {shopItems.slice(0, 4).map((item) => (
            <button className="quick-card" key={item.id}>
              <ItemIcon preset={item.imagePreset} />
              <span>{item.name}</span>
              <b>{item.cost}こ</b>
            </button>
          ))}
        </div>
      </ParentSection>

      <ParentSection title="詳細">
        <div className="form-grid">
          <label>
            数量
            <div className="static-stepper">
              <button>-</button>
              <input value="2" readOnly />
              <button>+</button>
            </div>
          </label>
          <label>
            メモ
            <input value="土ようびのタグ" readOnly />
          </label>
        </div>
      </ParentSection>

      <button className="primary-action">
        <Save size={20} />
        記録する
      </button>
    </div>
  );
}
