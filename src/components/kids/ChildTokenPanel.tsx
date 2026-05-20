import { PiggyBank } from "lucide-react";
import { ProgressBar } from "../common/ProgressBar";
import {
  getBalance,
  getGoalRemaining,
  getSavedTokens,
  isGoalAchieved,
} from "../../domain/calculations";
import type { Child, Goal, Settings, Transaction } from "../../domain/types";

export function ChildTokenPanel({
  child,
  goal,
  settings,
  transactions,
}: {
  child: Child;
  goal: Goal;
  settings: Settings;
  transactions: Transaction[];
}) {
  const balance = getBalance(transactions, child.id);
  const displayBalance = Math.max(balance, 0);
  const savedTokens = getSavedTokens(balance, settings);
  const remaining = getGoalRemaining(balance, goal);
  const achieved = isGoalAchieved(balance, goal);

  return (
    <section className={`child-panel ${child.color}`} aria-label={`${child.name}のタグ`}>
      <header className="child-header">
        <div className="avatar" aria-hidden="true">{child.avatar === "girl" ? "👧" : "👦"}</div>
        <div>
          <p>{child.ageLabel}</p>
          <h2>{child.name}</h2>
        </div>
      </header>

      <div className="token-summary">
        <div className="total-token">
          <div className="token-number">
            <span className="star-coin">★</span>
            <strong>{displayBalance}</strong>
            <span>こ</span>
          </div>
          <TokenIconStrip count={displayBalance} icon="★" label={`${displayBalance}このタグ`} />
        </div>
        <div className="token-breakdown">
          <div>
            <PiggyBank size={24} />
            <span>ちょきん</span>
            <b>{savedTokens}</b>
            <TokenIconStrip count={savedTokens} icon="●" label={`${savedTokens}このちょきん`} compact />
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
      </div>
    </section>
  );
}

function TokenIconStrip({
  count,
  icon,
  label,
  compact = false,
}: {
  count: number;
  icon: string;
  label: string;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "token-icons compact" : "token-icons"} aria-label={label}>
      {Array.from({ length: count }, (_, index) => (
        <span key={index}>{icon}</span>
      ))}
    </div>
  );
}
