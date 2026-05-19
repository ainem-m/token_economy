import { children, goals, settings, shopItems, transactions } from "../data/sampleData";
import { ChildTokenPanel } from "../components/kids/ChildTokenPanel";

export function KidsKiosk() {
  const activeChildren = [...children].filter((child) => child.isActive).sort((a, b) => a.displayOrder - b.displayOrder);
  const activeGoals = goals.filter((goal) => goal.status === "active");

  return (
    <main className="kids-kiosk">
      <header className="kiosk-header">
        <div>
          <p>みんなのタグ</p>
          <h1>きょうの タグばこ</h1>
        </div>
        <span className="last-updated">さいごのこうしん 5/19 23:30</span>
      </header>
      <div className="children-grid">
        {activeChildren.map((child) => {
          const goal = activeGoals.find((item) => item.childId === child.id) ?? activeGoals[0];
          return (
            <ChildTokenPanel
              key={child.id}
              child={child}
              goal={goal}
              settings={settings}
              shopItems={shopItems}
              transactions={transactions}
            />
          );
        })}
      </div>
    </main>
  );
}
