import type { Difficulty } from "@/lib/api/types";
import { difficultyLabel } from "@/lib/format";

const classes: Record<Difficulty, string> = {
  beginner: "tag tag-lime",
  intermediate: "tag tag-cobalt",
  advanced: "tag tag-coral",
};

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return <span className={classes[difficulty]}>{difficultyLabel(difficulty)}</span>;
}
