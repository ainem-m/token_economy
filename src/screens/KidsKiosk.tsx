import { ClipboardEdit } from "lucide-react";
import { ChildTokenPanel } from "../components/kids/ChildTokenPanel";
import { getVisibleGoal } from "../domain/calculations";
import type { Goal } from "../domain/types";
import type { AppState } from "../state/appState";

export function KidsKiosk({ state, onOpenParentRecord }: { state: AppState; onOpenParentRecord: () => void }) {
  const activeChildren = [...state.children].filter((child) => child.isActive).sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <main className="kids-kiosk">
      <button className="kiosk-parent-link" onClick={onOpenParentRecord} aria-label="親の記録画面へ">
        <ClipboardEdit size={18} />
      </button>
      <span className="last-updated">更新 {formatUpdatedAt(state.lastUpdatedAt)}</span>
      <div className="children-grid">
        {activeChildren.map((child) => {
          const goal = getVisibleGoal(state.goals, child.id) ?? createPlaceholderGoal(child.id);
          return (
            <ChildTokenPanel
              key={child.id}
              child={child}
              goal={goal}
              settings={state.settings}
              transactions={state.transactions}
            />
          );
        })}
      </div>
    </main>
  );
}

function formatUpdatedAt(value: string): string {
  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function createPlaceholderGoal(childId: string): Goal {
  return {
    id: `placeholder-goal-${childId}`,
    childId,
    title: "ほしいもの",
    targetAmount: 1,
    imagePreset: "blocks",
    status: "active",
  };
}
