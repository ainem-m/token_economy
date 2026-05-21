import { Edit3 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ItemIcon } from "../../components/common/ItemIcon";
import { GoalEditorModal } from "../../components/parent/GoalEditorModal";
import { ParentSection } from "../../components/parent/ParentSection";
import { getBalance, getGoalRemaining, getVisibleGoal, isGoalAchieved, isGoalComplete } from "../../domain/calculations";
import type { Child, Goal } from "../../domain/types";
import type { AppState } from "../../state/appState";

export function ParentGoal({
  state,
  onSaveGoals,
  onModalOpenChange,
}: {
  state: AppState;
  onSaveGoals: (goals: Goal[]) => void | Promise<void>;
  onModalOpenChange: (open: boolean) => void;
}) {
  const activeChildren = useMemo(
    () => [...state.children].filter((child) => child.isActive).sort((a, b) => a.displayOrder - b.displayOrder),
    [state.children],
  );
  const [goals, setGoals] = useState(state.goals);
  const [editing, setEditing] = useState<Goal | undefined>();
  const [original, setOriginal] = useState<Goal | undefined>();
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const lastTriggerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!editing) setGoals(state.goals);
  }, [editing, state.goals]);

  useEffect(() => {
    onModalOpenChange(Boolean(editing));
    return () => onModalOpenChange(false);
  }, [editing, onModalOpenChange]);

  useEffect(() => {
    if (editing) return;
    lastTriggerRef.current?.focus();
  }, [editing]);

  const openEditor = (goal: Goal, trigger: HTMLButtonElement) => {
    const draft = toDraft(goal);
    lastTriggerRef.current = trigger;
    setEditing(draft);
    setOriginal(draft);
    setMessage("");
    setConfirmClose(false);
  };

  const updateDraft = (patch: Partial<Goal>) => {
    setEditing((current) => {
      if (!current) return current;
      const next = { ...current, ...patch };
      const balance = getBalance(state.transactions, next.childId);
      return isGoalAchieved(balance, next) ? next : { ...next, status: "active" };
    });
    setMessage("");
    setConfirmClose(false);
  };

  const requestClose = () => {
    if (hasDraftChanges(editing, original)) {
      setConfirmClose(true);
      return;
    }
    closeEditor();
  };

  const closeEditor = () => {
    setEditing(undefined);
    setOriginal(undefined);
    setConfirmClose(false);
  };

  const save = async () => {
    if (!editing) return;
    const normalizedGoal = normalizeDraft(editing);
    const baseGoals = state.goals.some((item) => item.id === normalizedGoal.id) ? state.goals : goals;
    const normalizedGoals = baseGoals.map((item) => (item.id === normalizedGoal.id ? { ...item, ...normalizedGoal } : item));
    const child = activeChildren.find((item) => item.id === normalizedGoal.childId);
    setPending(true);
    try {
      await onSaveGoals(normalizedGoals);
      setGoals(normalizedGoals);
      setMessage(`${child?.name ?? "子ども"}の目標を保存しました`);
      closeEditor();
    } catch {
      setMessage("保存できませんでした");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="parent-page">
      <div className="goal-overview-section" aria-hidden={editing ? true : undefined} inert={editing ? true : undefined}>
        <ParentSection title="目標" caption="子どもごとに1つだけ">
          <div className="goal-card-list">
            {activeChildren.map((child) => {
              const goal = getVisibleGoal(goals, child.id);
              return goal ? (
                <GoalCard key={child.id} child={child} goal={goal} state={state} onEdit={(trigger) => openEditor(goal, trigger)} />
              ) : (
                <MissingGoalCard key={child.id} child={child} />
              );
            })}
          </div>
        </ParentSection>
      </div>

      {!editing && message && (
        <p className={message.includes("できません") ? "record-message error" : "record-message"}>{message}</p>
      )}

      {editing && (
        <GoalEditorModal
          childName={getChildName(activeChildren, editing.childId)}
          confirmClose={confirmClose}
          draft={editing}
          message={message}
          pending={pending}
          state={state}
          onCancelClose={() => setConfirmClose(false)}
          onChange={updateDraft}
          onDiscard={closeEditor}
          onRequestClose={requestClose}
          onSave={save}
        />
      )}
    </div>
  );
}

function GoalCard({ child, goal, state, onEdit }: { child: Child; goal: Goal; state: AppState; onEdit: (trigger: HTMLButtonElement) => void }) {
  const balance = getBalance(state.transactions, child.id);
  const achieved = isGoalComplete(balance, goal);
  const remaining = getGoalRemaining(balance, goal);

  return (
    <article className="goal-card" aria-label={`${child.name}の目標`}>
      <div className="goal-card-icon" aria-hidden="true">
        <ItemIcon preset={goal.imagePreset} large />
      </div>
      <div className="goal-card-text">
        <span>{child.name}</span>
        <strong>{goal.title}</strong>
        <p className={achieved ? "goal-card-status achieved" : "goal-card-status"}>
          {goal.status === "achieved" ? "達成済み" : achieved ? "達成確認待ち" : `あと ${remaining} こ`}
        </p>
      </div>
      <button className="edit-goal-button" onClick={(event) => onEdit(event.currentTarget)}>
        <Edit3 size={18} />
        編集
      </button>
    </article>
  );
}

function MissingGoalCard({ child }: { child: Child }) {
  return (
    <article className="goal-card" aria-label={`${child.name}の目標`}>
      <div className="goal-card-icon" aria-hidden="true">
        <ItemIcon preset="blocks" large />
      </div>
      <div className="goal-card-text">
        <span>{child.name}</span>
        <strong>目標がありません</strong>
        <p className="goal-card-status">設定が必要です</p>
      </div>
      <button className="edit-goal-button" disabled>
        <Edit3 size={18} />
        編集
      </button>
    </article>
  );
}

function getChildName(children: Child[], childId: string): string {
  return children.find((child) => child.id === childId)?.name ?? "子ども";
}

function toDraft(goal: Goal): Goal {
  return {
    id: goal.id,
    childId: goal.childId,
    title: goal.title,
    targetAmount: goal.targetAmount,
    imagePreset: goal.imagePreset,
    imageUrl: goal.imageUrl,
    status: goal.status,
  };
}

function normalizeDraft(draft: Goal): Goal {
  return {
    ...draft,
    title: draft.title.trim() || "ほしいもの",
    targetAmount: Math.max(1, Math.round(draft.targetAmount)),
    imageUrl: draft.imageUrl?.trim() || undefined,
  };
}

function hasDraftChanges(current?: Goal, original?: Goal): boolean {
  return Boolean(current && original && JSON.stringify(normalizeDraft(current)) !== JSON.stringify(normalizeDraft(original)));
}
