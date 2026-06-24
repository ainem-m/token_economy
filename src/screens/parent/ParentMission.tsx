import { Save, Trophy } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ParentSection } from "../../components/parent/ParentSection";
import { getCurrentMission, isMissionCompleted, isMissionOverdue } from "../../domain/calculations";
import type { Child, Mission } from "../../domain/types";
import type { AppState, MissionInput } from "../../state/appState";

export function ParentMission({
  state,
  onSaveMission,
}: {
  state: AppState;
  onSaveMission: (input: MissionInput) => void | Promise<void>;
}) {
  const activeChildren = useMemo(
    () => [...state.children].filter((child) => child.isActive).sort((a, b) => a.displayOrder - b.displayOrder),
    [state.children],
  );
  const [childId, setChildId] = useState(activeChildren[0]?.id ?? "");
  const currentMission = getCurrentMission(state.missions, childId);
  const [title, setTitle] = useState(currentMission?.title ?? "");
  const [rewardAmount, setRewardAmount] = useState(currentMission?.rewardAmount ?? 1);
  const [deadlineLocal, setDeadlineLocal] = useState(toDateTimeLocal(currentMission?.deadlineAt));
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (dirty) return;
    const mission = getCurrentMission(state.missions, childId);
    setTitle(mission?.title ?? "");
    setRewardAmount(mission?.rewardAmount ?? 1);
    setDeadlineLocal(toDateTimeLocal(mission?.deadlineAt));
  }, [childId, dirty, state.missions]);

  const chooseChild = (nextChildId: string) => {
    setChildId(nextChildId);
    setDirty(false);
    setMessage("");
  };

  const updateTitle = (value: string) => {
    setTitle(value);
    setDirty(true);
    setMessage("");
  };

  const updateRewardAmount = (value: number) => {
    setRewardAmount(Math.max(1, Math.round(value)));
    setDirty(true);
    setMessage("");
  };

  const updateDeadline = (value: string) => {
    setDeadlineLocal(value);
    setDirty(true);
    setMessage("");
  };

  const save = async () => {
    const normalizedTitle = title.trim();
    if (!normalizedTitle) {
      setMessage("ミッション名を入力してください");
      return;
    }

    setPending(true);
    try {
      await onSaveMission({
        childId,
        title: normalizedTitle,
        rewardAmount,
        deadlineAt: fromDateTimeLocal(deadlineLocal),
      });
      setDirty(false);
      setMessage("ミッションを保存しました");
    } catch {
      setMessage("保存できませんでした");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="parent-page">
      <ParentSection title="ミッション設定" caption="子どもごとに1つだけ。保存すると前のミッションを上書きします">
        <div className="segmented-control">
          {activeChildren.map((child) => (
            <button className={child.id === childId ? "active" : ""} key={child.id} onClick={() => chooseChild(child.id)}>
              {child.name}
            </button>
          ))}
        </div>
        <div className="form-grid single">
          <label>
            ミッション名
            <input value={title} onChange={(event) => updateTitle(event.target.value)} placeholder="といれにいく" />
          </label>
          <label>
            期限
            <input
              aria-label="期限"
              type="datetime-local"
              value={deadlineLocal}
              onChange={(event) => updateDeadline(event.target.value)}
            />
          </label>
          <label>
            報酬
            <div className="static-stepper with-suffix">
              <button aria-label="報酬を減らす" onClick={() => updateRewardAmount(rewardAmount - 1)}>-</button>
              <input
                aria-label="報酬"
                inputMode="numeric"
                value={rewardAmount}
                onChange={(event) => updateRewardAmount(Number(event.target.value) || 1)}
              />
              <button aria-label="報酬を増やす" onClick={() => updateRewardAmount(rewardAmount + 1)}>+</button>
              <span>こ</span>
            </div>
          </label>
        </div>
      </ParentSection>

      <ParentSection title="いまのミッション" caption="期限切れでも親の判断で達成記録できます">
        <div className="mission-card-list">
          {activeChildren.map((child) => (
            <MissionStatusCard key={child.id} child={child} mission={getCurrentMission(state.missions, child.id)} />
          ))}
        </div>
      </ParentSection>

      {message && <p className={message.includes("できません") || message.includes("入力") ? "record-message error" : "record-message"}>{message}</p>}

      <button className="primary-action" onClick={save} disabled={pending}>
        <Save size={20} />
        保存する
      </button>
    </div>
  );
}

function MissionStatusCard({ child, mission }: { child: Child; mission?: Mission }) {
  if (!mission) {
    return (
      <article className="mission-parent-card" aria-label={`${child.name}のミッション`}>
        <div className="mission-parent-icon" aria-hidden="true">
          <Trophy size={24} />
        </div>
        <div>
          <span>{child.name}</span>
          <strong>未設定</strong>
          <p>相談して決めます</p>
        </div>
      </article>
    );
  }

  const completed = isMissionCompleted(mission);
  const overdue = isMissionOverdue(mission);

  return (
    <article className="mission-parent-card" aria-label={`${child.name}のミッション`}>
      <div className="mission-parent-icon" aria-hidden="true">
        <Trophy size={24} />
      </div>
      <div>
        <span>{child.name}</span>
        <strong>{mission.title}</strong>
        <p className={completed ? "mission-parent-status completed" : overdue ? "mission-parent-status overdue" : "mission-parent-status"}>
          {completed ? "達成済み" : overdue ? "期限を過ぎています" : formatDeadline(mission.deadlineAt)}
        </p>
      </div>
      <b>+{mission.rewardAmount}こ</b>
    </article>
  );
}

function toDateTimeLocal(value?: string): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function fromDateTimeLocal(value: string): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function formatDeadline(value?: string): string {
  if (!value) return "期限なし";
  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
