import Link from "next/link";

import type { Difficulty } from "@/lib/api/types";
import { formatReadingTime } from "@/lib/format";

import { DifficultyBadge } from "./difficulty-badge";

export function LessonRow({
  title,
  slug,
  summary,
  categoryName,
  difficulty,
  readingTime,
  index,
}: {
  title: string;
  slug: string;
  summary: string;
  categoryName: string;
  difficulty: Difficulty;
  readingTime: number;
  index: number;
}) {
  return (
    <article className="group border-t border-line">
      <Link
        href={`/tutorials/${slug}`}
        className="grid gap-3 py-5 no-underline transition-colors hover:bg-paper-raised sm:grid-cols-[2.6rem_1fr_auto] sm:items-start sm:gap-5"
      >
        <span className="font-mono text-xs text-muted" aria-hidden="true">
          {String(index + 1).padStart(2, "0")}
        </span>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="tag">{categoryName}</span>
            <DifficultyBadge difficulty={difficulty} />
          </div>
          <h3 className="mt-2 font-display text-xl font-bold tracking-[-0.035em] text-ink group-hover:text-cobalt">
            {title}
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-muted">{summary}</p>
        </div>
        <span className="self-center font-mono text-[0.7rem] text-muted">
          {formatReadingTime(readingTime)}
        </span>
      </Link>
    </article>
  );
}
