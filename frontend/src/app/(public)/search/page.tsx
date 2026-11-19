import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { Pagination } from "@/components/pagination";
import { SearchForm } from "@/components/search-form";
import { PageHeader } from "@/components/ui/page-header";
import { SectionHeading } from "@/components/ui/section-heading";
import { searchCatalog } from "@/lib/api/client";
import type { SearchResults } from "@/lib/api/types";
import { ApiError } from "@/lib/api/errors";
import { formatCount } from "@/lib/format";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Search",
  description: "Search beginner-friendly programming tutorials, chapters, and categories.",
  path: "/search",
  noIndex: true,
});

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const validTypes = new Set(["all", "tutorials", "chapters", "categories"]);

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parsePage(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? "1", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export default async function SearchPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const query = (first(params.q) ?? "").trim();
  const requestedType = first(params.type) ?? "all";
  const type = validTypes.has(requestedType) ? requestedType : "all";
  const page = parsePage(first(params.page));
  const hasQuery = query.length >= 2;

  let results: SearchResults | null = null;
  let searchError: string | null = null;

  if (hasQuery) {
    try {
      results = await searchCatalog(query, type, page);
    } catch (error) {
      searchError =
        error instanceof ApiError && error.code === "search_query_invalid"
          ? "Use between 2 and 100 characters for a search."
          : error instanceof ApiError
            ? error.message
            : "Search is temporarily unavailable.";
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Find a lesson"
        title="Search the library."
        description="Search by topic, language, or chapter title. Results include tutorials, individual chapters, and categories."
        meta={
          <div className="max-w-3xl">
            <SearchForm initialQuery={query} initialType={type} />
          </div>
        }
        actions={
          <Link href="/tutorials" className="button-ghost">
            Browse the catalog instead
          </Link>
        }
      />

      <section className="container-page py-10 lg:py-14">
        {!hasQuery ? (
          <div className="grid gap-8 lg:grid-cols-[1fr_18rem]">
            <div>
              <SectionHeading
                eyebrow="Try a search"
                title="Start with a word or phrase."
                description="Short searches work best. Try a language, a concept, or the name of a chapter."
              />
              <div className="mt-6 flex flex-wrap gap-2">
                {["HTML", "Python", "databases", "CSS", "SQL", "beginner"].map((term) => (
                  <Link
                    key={term}
                    href={`/search?q=${encodeURIComponent(term)}`}
                    className="tag tag-cobalt no-underline hover:bg-lime hover:text-on-lime"
                  >
                    {term}
                  </Link>
                ))}
              </div>
            </div>
            <aside className="border-l-4 border-coral bg-paper-raised p-5">
              <p className="font-display text-lg font-bold tracking-[-0.03em]">Search tips</p>
              <ul className="mt-3 space-y-2 text-sm text-muted">
                <li>Use two or more characters.</li>
                <li>Try a topic instead of a full question.</li>
                <li>Filter by tutorials, chapters, or categories.</li>
              </ul>
            </aside>
          </div>
        ) : searchError ? (
          <EmptyState
            title="Search could not be completed."
            description={searchError}
            action={
              <Link href={`/search?q=${encodeURIComponent(query)}`} className="button-secondary text-sm">
                Try again
              </Link>
            }
          />
        ) : results && results.results.length > 0 ? (
          <>
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-4">
              <div>
                <p className="eyebrow">Results for “{query}”</p>
                <h2 className="mt-2 font-display text-3xl font-bold tracking-[-0.04em]">
                  {formatCount(results.count, "result")}
                </h2>
              </div>
              <p className="meta-text text-muted">
                Page {page} of {Math.max(1, Math.ceil(results.count / 10))}
              </p>
            </div>

            <div>
              {results.results.map((result, index) => (
                <article
                  key={`${result.type}-${result.url}-${index}`}
                  className="border-b border-line py-6"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="tag tag-coral">{result.type}</span>
                    {result.tutorial ? <span className="tag">{result.tutorial.title}</span> : null}
                  </div>
                  <h3 className="mt-3 font-display text-2xl font-bold tracking-[-0.035em]">
                    <Link href={result.url} className="text-ink no-underline hover:text-cobalt">
                      {result.title}
                    </Link>
                  </h3>
                  <p
                    className="search-mark mt-2 max-w-3xl text-sm leading-relaxed text-muted"
                    dangerouslySetInnerHTML={{ __html: result.excerpt }}
                  />
                </article>
              ))}
            </div>

            <Pagination
              path="/search"
              params={{ q: query, type }}
              page={page}
              count={results.count}
              pageSize={10}
            />
          </>
        ) : results ? (
          <EmptyState
            title="No results found."
            description={`Nothing matched “${query}”. Try a shorter or more general search.`}
            action={
              <Link href="/tutorials" className="button-secondary text-sm">
                Browse all tutorials
              </Link>
            }
          />
        ) : null}
      </section>
    </>
  );
}
