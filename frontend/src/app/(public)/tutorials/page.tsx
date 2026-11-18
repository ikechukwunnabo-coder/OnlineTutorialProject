import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { Pagination } from "@/components/pagination";
import { TutorialCard } from "@/components/tutorial-card";
import { getCategories, getTutorials } from "@/lib/api/client";
import type { Difficulty } from "@/lib/api/types";
import { formatCount } from "@/lib/format";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 300;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const difficulties: Array<{ value: Difficulty; label: string }> = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

const orderings = [
  { value: "-published_at", label: "Newest first" },
  { value: "published_at", label: "Oldest first" },
  { value: "title", label: "Title A–Z" },
  { value: "estimated_reading_time", label: "Shortest first" },
];

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parsePage(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? "1", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const params = await searchParams;
  const hasFilters = Boolean(
    first(params.category) || first(params.difficulty) || first(params.ordering),
  );

  return pageMetadata({
    title: "Tutorials",
    description:
      "Browse beginner-first programming tutorials for web development, Python, databases, and everyday developer tools.",
    path: "/tutorials",
    noIndex: hasFilters,
  });
}

export default async function TutorialsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const category = first(params.category);
  const difficultyValue = first(params.difficulty);
  const difficulty = difficulties.some((item) => item.value === difficultyValue)
    ? (difficultyValue as Difficulty)
    : undefined;
  const orderingValue = first(params.ordering);
  const ordering = orderings.some((item) => item.value === orderingValue)
    ? (orderingValue as "-published_at" | "published_at" | "title" | "estimated_reading_time")
    : "-published_at";
  const page = parsePage(first(params.page));

  const [categories, tutorials] = await Promise.all([
    getCategories().catch(() => []),
    getTutorials({ category, difficulty, ordering, page, pageSize: 12 }).catch(() => null),
  ]);

  const hasFilters = Boolean(category || difficulty || orderingValue);
  const paginationParams = {
    category,
    difficulty,
    ordering: orderingValue,
  };

  return (
    <>
      <section className="grid-paper border-b border-line">
        <div className="container-page py-14 lg:py-18">
          <p className="eyebrow">The library</p>
          <h1 className="display-title mt-4 max-w-3xl text-5xl sm:text-6xl">
            Every tutorial, in one place.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-muted">
            Start with the fundamentals or jump to a specific tool. Each tutorial is a sequence of
            short chapters, written to be read in order.
          </p>
        </div>
      </section>

      <section className="container-page py-10 lg:py-14">
        <form
          action="/tutorials"
          method="get"
          className="grid gap-4 border-2 border-ink bg-paper-raised p-4 shadow-[4px_4px_0_0_var(--ink)] sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_auto]"
        >
          <div>
            <label htmlFor="filter-category" className="field-label">
              Category
            </label>
            <select
              id="filter-category"
              name="category"
              defaultValue={category ?? ""}
              className="field-input"
            >
              <option value="">All categories</option>
              {categories.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="filter-difficulty" className="field-label">
              Difficulty
            </label>
            <select
              id="filter-difficulty"
              name="difficulty"
              defaultValue={difficulty ?? ""}
              className="field-input"
            >
              <option value="">Any level</option>
              {difficulties.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="filter-ordering" className="field-label">
              Order
            </label>
            <select
              id="filter-ordering"
              name="ordering"
              defaultValue={orderingValue ?? "-published_at"}
              className="field-input"
            >
              {orderings.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button type="submit" className="button-primary text-sm">
              Apply
            </button>
            {hasFilters ? (
              <Link href="/tutorials" className="button-secondary text-sm">
                Clear
              </Link>
            ) : null}
          </div>
        </form>

        <div className="mt-8 flex flex-wrap items-end justify-between gap-3 border-b border-line pb-4">
          <div>
            <p className="eyebrow">Results</p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-[-0.04em]">
              {tutorials ? formatCount(tutorials.count, "tutorial") : "Catalog unavailable"}
            </h2>
          </div>
          {tutorials && tutorials.count > 0 ? (
            <p className="font-mono text-xs text-muted">
              Page {page} of {Math.max(1, Math.ceil(tutorials.count / 12))}
            </p>
          ) : null}
        </div>

        {tutorials && tutorials.results.length > 0 ? (
          <>
            <div>
              {tutorials.results.map((tutorial, index) => (
                <TutorialCard key={tutorial.slug} tutorial={tutorial} index={index} />
              ))}
            </div>
            <Pagination
              path="/tutorials"
              params={paginationParams}
              page={page}
              count={tutorials.count}
              pageSize={12}
            />
          </>
        ) : tutorials ? (
          <div className="mt-8">
            <EmptyState
              title="No tutorials match those filters."
              description="Try a different category or difficulty, or clear the filters to see everything."
              action={
                <Link href="/tutorials" className="button-secondary text-sm">
                  Clear filters
                </Link>
              }
            />
          </div>
        ) : (
          <div className="mt-8">
            <EmptyState
              title="The catalog is temporarily unavailable."
              description="We could not load tutorials right now. Please try again in a moment."
              action={
                <Link href="/tutorials" className="button-secondary text-sm">
                  Try again
                </Link>
              }
            />
          </div>
        )}
      </section>
    </>
  );
}
