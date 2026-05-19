import type { ChildColor } from "../../domain/types";

export function ProgressBar({ value, max, color }: { value: number; max: number; color: ChildColor }) {
  const percent = Math.min(100, Math.round((value / Math.max(max, 1)) * 100));

  return (
    <div className={`progress-bar ${color}`} aria-label={`進捗 ${percent}%`}>
      <span style={{ width: `${percent}%` }} />
    </div>
  );
}
