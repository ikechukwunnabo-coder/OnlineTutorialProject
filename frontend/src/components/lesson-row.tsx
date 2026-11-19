import Link from "next/link";

import type { Difficulty } from "@/lib/api/types";
import { formatDate, formatReadingTime } from "@/lib/format";

import { DifficultyBadge } from "./difficulty-badge";

export function LessonRow({
  title,
  slug,
  summary,
  categoryName,
  difficulty,
  readingTime,
  publishedAt,
  index,
}: {
  title: string;
  slug: string;
  summary: string;
  categoryName: string;
  difficulty: Difficulty;
  readingTime: number;
  publishedAt?: string;
  index: number;
}) {
  return (
    <article className="group border-t border-line">
      <Link
        href={`/tutorials/${slug}`}
        className="grid gap-3 py-5 no-underline transition-colors hover:bg-paper-raised sm:grid-cols-[2.6rem_1fr_auto] sm:items-start sm:gap-5"
      >
        <span className="meta-text text-muted" aria-hidden="true">
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
        <span className="meta-text self-center text-muted sm:text-right">
          {formatReadingTime(readingTime)}
          {publishedAt ? (
            <>
              <br />
              <time dateTime={publishedAt}>{formatDate(publishedAt)}</time>
            </>
          ) : null}
        </span>
      </Link>
    </article>
  );
}
