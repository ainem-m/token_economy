import { PiggyBank, Sparkles } from "lucide-react";
import { ItemIcon } from "../common/ItemIcon";
import { ProgressBar } from "../common/ProgressBar";
import {
  getBalance,
  getGoalRemaining,
  getSavedTokens,
  isGoalAchieved,
} from "../../domain/calculations";
import type { Child, Goal, Settings, ShopItem, Transaction } from "../../domain/types";

export function ChildTokenPanel({
  child,
  goal,
  settings,
  shopItems,
  transactions,
}: {
  child: Child;
  goal: Goal;
  settings: Settings;
  shopItems: ShopItem[];
  transactions: Transaction[];
}) {
  const balance = getBalance(transactions, child.id);
  const displayBalance = Math.max(balance, 0);
  const savedTokens = getSavedTokens(balance, settings);
  const remaining = getGoalRemaining(balance, goal);
  const achieved = isGoalAchieved(balance, goal);
  const affordableItems = shopItems.filter((item) => item.isActive && item.cost <= balance).slice(0, 4);

  return (
    <section className={`child-panel ${child.color}`} aria-label={`${child.name}のタグ`}>
      <header className="child-header">
        <div className="avatar" aria-hidden="true">{child.avatar === "girl" ? "👧" : "👦"}</div>
        <div>
          <p>{child.ageLabel}</p>
          <h2>{child.name}</h2>
        </div>
        {achieved && (
          <div className="achieved-badge">
            <Sparkles size={20} />
            たっせい！
          </div>
        )}
      </header>

      <div className="token-summary">
        <div className="total-token">
          <span className="star-coin">★</span>
          <strong>{displayBalance}</strong>
          <span>こ</span>
        </div>
        <div className="token-breakdown">
          <div>
            <PiggyBank size={24} />
            <span>ちょきん</span>
            <b>{savedTokens}</b>
          </div>
        </div>
      </div>

      <div className="goal-box">
        <div>
          <span className="eyebrow">もくひょう</span>
          <h3>{goal.title}</h3>
          <ProgressBar value={balance} max={goal.targetAmount} color={child.color} />
          <p className={achieved ? "goal-status achieved" : "goal-status"}>
            {achieved ? "たっせい！" : `あと ${remaining} こ`}
          </p>
        </div>
        <ItemIcon preset={goal.imagePreset} large />
      </div>

      <div className="affordable-box">
        <h3>いま かえるもの</h3>
        <div className="affordable-list">
          {affordableItems.map((item) => (
            <article key={item.id} className="shop-chip">
              <ItemIcon preset={item.imagePreset} />
              <span>{item.name}</span>
              <b>{item.cost}こ</b>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
