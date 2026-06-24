import { PiggyBank } from "lucide-react";
import { ItemIcon } from "../common/ItemIcon";
import { ProgressBar } from "../common/ProgressBar";
import {
  getBalance,
  getGoalRemaining,
  isMissionCompleted,
  isGoalComplete,
  getSavedTokens,
} from "../../domain/calculations";
import type { Child, Goal, Mission, Settings, Transaction } from "../../domain/types";

export function ChildTokenPanel({
  child,
  goal,
  mission,
  settings,
  transactions,
}: {
  child: Child;
  goal: Goal;
  mission?: Mission;
  settings: Settings;
  transactions: Transaction[];
}) {
  const balance = getBalance(transactions, child.id);
  const displayBalance = Math.max(balance, 0);
  const savedTokens = getSavedTokens(balance, settings);
  const remaining = getGoalRemaining(balance, goal);
  const achieved = isGoalComplete(balance, goal);

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
        <div className="total-token" aria-label={`${child.name}の合計 ${displayBalance}こ`}>
          <div className="token-number">
            <span className="star-coin">★</span>
            <strong>{displayBalance}</strong>
            <span>こ</span>
          </div>
          <TokenIconStrip count={displayBalance} icon="★" label={`${displayBalance}このタグ`} />
        </div>
        <div className="token-breakdown">
          <div aria-label={`${child.name}のちょきん ${savedTokens}こ`}>
            <PiggyBank size={24} />
            <span>ちょきん</span>
            <b>{savedTokens}</b>
            <TokenIconStrip count={savedTokens} icon="●" label={`${savedTokens}このちょきん`} compact />
          </div>
        </div>
      </div>

      <div className="goal-box">
        <div className="goal-media">
          <span className="eyebrow">もくひょう</span>
          <GoalImage goal={goal} />
          <h3>{goal.title}</h3>
        </div>
        <div className="goal-progress">
          <ProgressBar value={balance} max={goal.targetAmount} color={child.color} />
          <p className={achieved ? "goal-status achieved" : "goal-status"}>
            {achieved ? "たっせい！" : `あと ${remaining} こ`}
          </p>
        </div>
      </div>

      {mission && <MissionBox mission={mission} childName={child.name} />}
    </section>
  );
}

function MissionBox({ mission, childName }: { mission: Mission; childName: string }) {
  const completed = isMissionCompleted(mission);

  return (
    <div className={completed ? "kids-mission completed" : "kids-mission"} aria-label={`${childName}のみっしょん`}>
      <span className="eyebrow">みっしょん</span>
      <strong>{mission.title}</strong>
      <span className="kids-mission-reward">+{mission.rewardAmount}こ</span>
      {completed && <span className="kids-mission-complete">できた</span>}
    </div>
  );
}

function GoalImage({ goal }: { goal: Goal }) {
  if (goal.imageUrl) {
    return <img className="goal-image" src={goal.imageUrl} alt={goal.title} />;
  }

  return (
    <div className="goal-image preset" role="img" aria-label={goal.title}>
      <ItemIcon preset={goal.imagePreset} large />
    </div>
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
