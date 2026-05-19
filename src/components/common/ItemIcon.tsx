import { BookOpen, Gift } from "lucide-react";
import type { ItemPreset } from "../../domain/types";

export function ItemIcon({ preset, large = false }: { preset: ItemPreset; large?: boolean }) {
  const className = large ? "item-icon large" : "item-icon";

  if (preset === "ice") return <span className={className}>🍦</span>;
  if (preset === "gacha") return <span className={className}>🎁</span>;
  if (preset === "blocks") return <span className={className}>🧱</span>;
  if (preset === "plush") return <span className={className}>🧸</span>;
  if (preset === "book") return <BookOpen className={className} aria-hidden="true" />;
  if (preset === "coin") return <span className={className}>⭐</span>;
  return <span className={className}>🍫</span>;
}
