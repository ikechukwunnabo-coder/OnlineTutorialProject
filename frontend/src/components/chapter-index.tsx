import Link from "next/link";

import type { TutorialDetail } from "@/lib/api/types";

export function ChapterIndex({
  tutorial,
  currentSlug,
}: {
  tutorial: TutorialDetail;
  currentSlug: string;
}) {
  return (
    <nav aria-label="Chapters in this tutorial">
      <Link
        href={`/tutorials/${tutorial.slug}`}
        className="font-mono text-xs text-cobalt no-underline hover:underline"
      >
        {tutorial.title}
      </Link>
      <ol className="mt-4 space-y-1 border-l border-line">
        {tutorial.chapters.map((chapter) => {
          const active = chapter.slug === currentSlug;
          return (
            <li key={chapter.slug}>
              <Link
                href={`/tutorials/${tutorial.slug}/${chapter.slug}`}
                aria-current={active ? "page" : undefined}
                className={`-ml-px block border-l-2 py-1.5 pl-3 text-sm leading-snug no-underline ${
                  active
                    ? "border-coral bg-paper-raised font-bold text-ink"
                    : "border-transparent text-muted hover:border-line-strong hover:text-cobalt"
                }`}
              >
                <span className="mr-1.5 font-mono text-[0.65rem] text-coral-text">
                  {String(chapter.order).padStart(2, "0")}
                </span>
                {chapter.title}
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
