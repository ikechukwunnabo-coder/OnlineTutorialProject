import Link from "next/link";

import { CategoryCard } from "@/components/category-card";
import { EmptyState } from "@/components/empty-state";
import { LessonRow } from "@/components/lesson-row";
import { getHome } from "@/lib/api/client";
import { formatCount } from "@/lib/format";
import { highlightCode } from "@/lib/highlight";
import { pageMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

export const revalidate = 60;

export const metadata = pageMetadata({
  title: "Learn to code, one chapter at a time",
  description:
    "A beginner-first programming library with short chapters, working examples, and plain-language explanations. Start with HTML, Python, or databases.",
  path: "/",
});

const helloWorld = `<!doctype html>
<html lang="en">
  <head>
    <title>My first page</title>
  </head>
  <body>
    <h1>Hello, world!</h1>
    <p>I made this in a browser.</p>
  </body>
</html>`;

export default async function HomePage() {
  const [home, highlightedHello] = await Promise.all([
    getHome().catch(() => null),
    highlightCode(helloWorld, "html"),
  ]);

  const stats = home?.stats;
  const featuredCategories = home?.featured_categories ?? [];
  const latestTutorials = home?.latest_tutorials ?? [];

  return (
    <>
      <section className="grid-paper border-b border-line">
        <div className="container-page grid items-center gap-12 py-16 lg:grid-cols-[1.08fr_0.92fr] lg:py-24">
          <div>
            <p className="eyebrow">A beginner-first programming library</p>
            <h1 className="display-title mt-5 text-[clamp(3.1rem,8vw,5.8rem)]">
              <span className="block">
                Start with <span className="marker">one line</span>.
              </span>
              <span className="block">Then another.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
              Programming is easier when someone explains the small steps. Each lesson here is
              short, practical, and written for people starting from zero.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/tutorials" className="button-primary">
                Browse tutorials
              </Link>
              <Link href="/search" className="button-secondary">
                Search a topic
              </Link>
            </div>

            <dl className="mt-10 grid max-w-xl grid-cols-3 gap-4 border-t border-line pt-5">
              <div>
                <dt className="font-mono text-[0.68rem] text-muted">Tutorials</dt>
                <dd className="stat-number mt-1">
                  {stats ? stats.published_tutorials : "—"}
                </dd>
              </div>
              <div>
                <dt className="font-mono text-[0.68rem] text-muted">Chapters</dt>
                <dd className="stat-number mt-1">
                  {stats ? stats.published_chapters : "—"}
                </dd>
              </div>
              <div>
                <dt className="font-mono text-[0.68rem] text-muted">Categories</dt>
                <dd className="stat-number mt-1">
                  {stats ? stats.published_categories : "—"}
                </dd>
              </div>
            </dl>
          </div>

          <div className="relative">
            <div className="code-window">
              <div className="code-window-bar">
                <span className="flex items-center gap-2">
                  <span className="code-dots" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </span>
                  <span>first-page.html</span>
                </span>
                <span className="text-[0.68rem] text-[#9fb9ad]">your first file</span>
              </div>
              <div
                className="bg-[#0d1117]"
                dangerouslySetInnerHTML={{ __html: highlightedHello }}
              />
            </div>

            <div className="browser-preview mt-5 sm:ml-10">
              <div className="browser-preview-bar">
                <span className="browser-preview-dot" aria-hidden="true" />
                <span>localhost/first-page.html</span>
              </div>
              <div className="browser-preview-body">
                <h3>Hello, world!</h3>
                <p>I made this in a browser.</p>
              </div>
            </div>

            <p className="mt-5 inline-block -rotate-1 border-2 border-ink bg-lime px-3 py-2 font-mono text-xs shadow-[3px_3px_0_0_var(--ink)]">
              No setup needed for the first lesson.
            </p>
          </div>
        </div>
      </section>

      <section className="container-page py-16 lg:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Choose a path</p>
            <h2 className="display-title mt-3 text-4xl sm:text-5xl">Pick a starting point.</h2>
          </div>
          <Link href="/categories" className="link-arrow text-sm">
            All categories
          </Link>
        </div>

        {featuredCategories.length > 0 ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featuredCategories.map((category, index) => (
              <CategoryCard key={category.slug} category={category} index={index} />
            ))}
          </div>
        ) : (
          <div className="mt-8">
            <EmptyState
              title="The first paths are being prepared."
              description="Categories will appear here as soon as the first tutorials are published."
            />
          </div>
        )}
      </section>

      <section className="border-y border-line bg-paper-raised">
        <div className="container-page py-16 lg:py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Recently published</p>
              <h2 className="display-title mt-3 text-4xl sm:text-5xl">Latest lessons.</h2>
            </div>
            <Link href="/tutorials" className="link-arrow text-sm">
              All tutorials
            </Link>
          </div>

          {latestTutorials.length > 0 ? (
            <div className="mt-8">
              {latestTutorials.map((tutorial, index) => (
                <LessonRow
                  key={tutorial.slug}
                  title={tutorial.title}
                  slug={tutorial.slug}
                  summary={tutorial.summary}
                  categoryName={tutorial.category.name}
                  difficulty={tutorial.difficulty}
                  readingTime={tutorial.estimated_reading_time}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <div className="mt-8">
              <EmptyState
                title="No lessons published yet."
                description="The catalog is connected, but there is nothing public to show right now."
              />
            </div>
          )}
        </div>
      </section>

      <section className="container-page py-16 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr]">
          <div>
            <p className="eyebrow">How this works</p>
            <h2 className="display-title mt-3 text-4xl sm:text-5xl">A slower, clearer pace.</h2>
            <p className="mt-5 max-w-md text-muted">
              No gamified streaks. No fake progress bars. Just a sequence of small lessons that
              build on each other.
            </p>
          </div>

          <ol className="space-y-0 border-t border-line">
            {[
              {
                title: "Read one short chapter",
                body: "Each chapter explains one idea, shows a working example, and stops before it becomes overwhelming.",
              },
              {
                title: "Type the example yourself",
                body: "Copying by hand is slower than pasting. That is the point. You notice the details as you type.",
              },
              {
                title: "Change one thing",
                body: "Break the example on purpose. Change a word, a value, or a tag. Then explain what happened.",
              },
            ].map((step, index) => (
              <li key={step.title} className="grid gap-4 border-b border-line py-6 sm:grid-cols-[3rem_1fr]">
                <span className="font-mono text-xs text-coral" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="font-display text-xl font-bold tracking-[-0.03em]">{step.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="container-page pb-4">
        <div className="border-2 border-ink bg-cobalt p-8 text-white shadow-[6px_6px_0_0_var(--ink)] sm:p-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-mono text-xs text-[#bfe3d0]">Ready when you are</p>
              <h2 className="mt-2 font-display text-3xl font-bold tracking-[-0.04em] sm:text-4xl">
                Pick a lesson. Take your time.
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#dce8ff]">
                {stats
                  ? `${formatCount(stats.published_tutorials, "tutorial")} and ${formatCount(
                      stats.published_chapters,
                      "chapter",
                    )} are waiting.`
                  : "The library is being prepared. Check back soon."}
              </p>
            </div>
            <Link href="/tutorials" className="button-secondary shrink-0">
              Start learning
            </Link>
          </div>
        </div>
        <p className="mt-4 text-center font-mono text-[0.68rem] text-muted">
          {siteConfig.name} · built for beginners
        </p>
      </section>
    </>
  );
}
