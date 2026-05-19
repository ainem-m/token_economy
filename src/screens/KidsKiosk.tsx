import { ChildTokenPanel } from "../components/kids/ChildTokenPanel";
import type { AppState } from "../state/appState";

export function KidsKiosk({ state }: { state: AppState }) {
  const activeChildren = [...state.children].filter((child) => child.isActive).sort((a, b) => a.displayOrder - b.displayOrder);
  const activeGoals = state.goals.filter((goal) => goal.status === "active");

  return (
    <main className="kids-kiosk">
      <header className="kiosk-header">
        <div>
          <p>みんなのタグ</p>
          <h1>きょうの タグばこ</h1>
        </div>
        <span className="last-updated">さいごのこうしん {formatUpdatedAt(state.lastUpdatedAt)}</span>
      </header>
      <div className="children-grid">
        {activeChildren.map((child) => {
          const goal = activeGoals.find((item) => item.childId === child.id) ?? activeGoals[0];
          return (
            <ChildTokenPanel
              key={child.id}
              child={child}
              goal={goal}
              settings={state.settings}
              shopItems={state.shopItems}
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
