import Link from "next/link";

import type { ChapterNavigationItem } from "@/lib/api/types";

function NavCard({
  direction,
  item,
}: {
  direction: "Previous" | "Next";
  item: ChapterNavigationItem | null;
}) {
  if (!item) {
    return (
      <div className="border-2 border-dashed border-line-strong p-4 text-sm text-muted">
        <p className="font-mono text-[0.68rem] text-muted">{direction}</p>
        <p className="mt-1">You are at the edge of this tutorial.</p>
      </div>
    );
  }

  return (
    <Link
      href={item.url}
      className="group border-2 border-ink bg-paper-raised p-4 no-underline transition-transform hover:-translate-y-0.5 hover:bg-lime"
    >
      <p className="font-mono text-[0.68rem] text-cobalt">{direction}</p>
      <p className="mt-1 font-display text-lg font-bold tracking-[-0.03em] text-ink">{item.title}</p>
    </Link>
  );
}

export function ChapterNavigation({
  previous,
  next,
}: {
  previous: ChapterNavigationItem | null;
  next: ChapterNavigationItem | null;
}) {
  return (
    <nav aria-label="Chapter navigation" className="mt-12 grid gap-4 sm:grid-cols-2">
      <NavCard direction="Previous" item={previous} />
      <NavCard direction="Next" item={next} />
    </nav>
  );
}
