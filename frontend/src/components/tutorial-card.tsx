import Link from "next/link";

import type { TutorialListItem } from "@/lib/api/types";
import { formatCount, formatDate, formatReadingTime } from "@/lib/format";

import { DifficultyBadge } from "./difficulty-badge";

export function TutorialCard({
  tutorial,
  index,
}: {
  tutorial: TutorialListItem;
  index?: number;
}) {
  return (
    <article className="group border-t border-line">
      <Link
        href={`/tutorials/${tutorial.slug}`}
        className="grid gap-4 py-6 no-underline transition-colors hover:bg-paper-raised sm:grid-cols-[3.2rem_1fr_auto] sm:gap-5"
      >
        {typeof index === "number" ? (
          <span className="meta-text text-muted" aria-hidden="true">
            {String(index + 1).padStart(2, "0")}
          </span>
        ) : (
          <span className="meta-text text-cobalt" aria-hidden="true">
            {tutorial.category.name}
          </span>
        )}

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <DifficultyBadge difficulty={tutorial.difficulty} />
            <span className="tag">{tutorial.category.name}</span>
          </div>
          <h3 className="mt-3 font-display text-2xl font-bold tracking-[-0.035em] text-ink group-hover:text-cobalt">
            {tutorial.title}
          </h3>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted">{tutorial.summary}</p>
          <p className="meta-text mt-3 text-muted">
            {formatCount(tutorial.chapter_count, "chapter")} ·{" "}
            {formatReadingTime(tutorial.estimated_reading_time)} · Published{" "}
            <time dateTime={tutorial.published_at}>{formatDate(tutorial.published_at)}</time>
          </p>
        </div>

        <span
          className="hidden self-center font-display text-2xl text-coral transition-transform group-hover:translate-x-1 sm:block"
          aria-hidden="true"
        >
          →
        </span>
      </Link>
    </article>
  );
}
