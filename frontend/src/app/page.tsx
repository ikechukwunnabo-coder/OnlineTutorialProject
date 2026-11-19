import Link from "next/link";

import { CategoryCard } from "@/components/category-card";
import { EmptyState } from "@/components/empty-state";
import { LessonRow } from "@/components/lesson-row";
import { SectionHeading } from "@/components/ui/section-heading";
import { getHome } from "@/lib/api/client";
import { formatCount } from "@/lib/format";
import { highlightCode } from "@/lib/highlight";
import { pageMetadata } from "@/lib/seo";

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

const steps = [
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
];

const faqs = [
  {
    question: "Do I need an account to learn?",
    answer:
      "No. Public tutorials and chapters are readable without signing in. Account controls are there when you want them, not before.",
  },
  {
    question: "Where should I begin?",
    answer:
      "Pick a category that matches what you want to build, then follow its tutorials in chapter order. The Catalog page also lets you sort by newest, oldest, title, or reading time.",
  },
  {
    question: "How long is a chapter?",
    answer:
      "Each chapter focuses on one idea and includes an estimated reading time so you can choose a lesson that fits your day.",
  },
  {
    question: "Can I copy the examples?",
    answer:
      "Yes. Code blocks include a copy button, but typing the example yourself is still one of the best ways to notice the details.",
  },
  {
    question: "Is this for people who have never coded?",
    answer:
      "Yes. The library is written for absolute beginners, with plain-language explanations and examples that build on each other.",
  },
];

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
            <h1 className="display-title mt-5 text-[clamp(2.8rem,7vw,5.4rem)]">
              Learn programming <span className="marker">one chapter</span> at a time.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
              Short lessons, working examples, and plain-language explanations. Start from zero and
              keep going, one small idea at a time.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/tutorials" className="button-primary">
                Start learning
              </Link>
              <Link href="/categories" className="button-secondary">
                Browse categories
              </Link>
            </div>

            <dl className="mt-10 grid max-w-xl grid-cols-3 gap-4 border-t border-line pt-5">
              <div>
                <dt className="meta-text text-muted">Tutorials</dt>
                <dd className="stat-number mt-1">{stats ? stats.published_tutorials : "—"}</dd>
              </div>
              <div>
                <dt className="meta-text text-muted">Chapters</dt>
                <dd className="stat-number mt-1">{stats ? stats.published_chapters : "—"}</dd>
              </div>
              <div>
                <dt className="meta-text text-muted">Categories</dt>
                <dd className="stat-number mt-1">{stats ? stats.published_categories : "—"}</dd>
              </div>
            </dl>
            <p className="meta-text mt-3 text-muted">
              Counts come from the published library.
            </p>
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
                <span>your first file</span>
              </div>
              <div className="bg-[var(--code-bg)]" dangerouslySetInnerHTML={{ __html: highlightedHello }} />
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

            <p className="meta-text mt-5 inline-block -rotate-1 border-2 border-ink bg-lime px-3 py-2 text-on-lime shadow-[3px_3px_0_0_var(--ink)]">
              No setup needed for the first lesson.
            </p>
          </div>
        </div>
      </section>

      <section className="container-page py-16 lg:py-20">
        <SectionHeading
          eyebrow="Choose a path"
          title="Pick a starting point."
          description="Every category starts from the beginning. Choose what interests you and follow the chapters in order."
          action={
            <Link href="/categories" className="link-arrow text-sm">
              All categories
            </Link>
          }
        />

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
          <SectionHeading
            eyebrow="Recently published"
            title="Latest lessons."
            description="New chapters and tutorials appear here as they are published."
            action={
              <Link href="/tutorials" className="link-arrow text-sm">
                All tutorials
              </Link>
            }
          />

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
                  publishedAt={tutorial.published_at}
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

      <section id="learning-path" className="container-page scroll-mt-28 py-16 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr]">
          <div>
            <p className="eyebrow">Learning resources</p>
            <h2 className="display-title mt-3 text-4xl sm:text-5xl">A slower, clearer pace.</h2>
            <p className="mt-5 max-w-md text-muted">
              No streaks to protect. No invented progress. Just a sequence of small lessons that
              build on each other.
            </p>
            <Link href="/tutorials" className="link-arrow mt-5 text-sm">
              Explore the catalog
            </Link>
          </div>

          <ol className="divide-y divide-line border-y border-line">
            {steps.map((step, index) => (
              <li key={step.title} className="grid gap-4 py-6 sm:grid-cols-[3rem_1fr]">
                <span className="meta-text text-coral" aria-hidden="true">
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

      <section className="border-t border-line bg-paper-raised">
        <div className="container-page py-16 lg:py-20">
          <SectionHeading
            eyebrow="Common questions"
            title="Before you begin."
            description="A few answers to make the first step easier."
          />
          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            {faqs.map((faq) => (
              <details key={faq.question} className="surface group p-5">
                <summary className="flex cursor-pointer items-center justify-between gap-4 font-display text-lg font-bold tracking-[-0.02em] marker:text-coral">
                  {faq.question}
                  <span aria-hidden="true" className="text-coral transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-16 lg:py-20">
        <div className="border-2 border-ink bg-cobalt p-8 text-on-cobalt shadow-[6px_6px_0_0_var(--ink)] sm:p-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="meta-text text-on-cobalt/80">Ready when you are</p>
              <h2 className="mt-2 font-display text-3xl font-bold tracking-[-0.04em] sm:text-4xl">
                Pick a lesson. Take your time.
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-on-cobalt/85">
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
      </section>
    </>
  );
}
