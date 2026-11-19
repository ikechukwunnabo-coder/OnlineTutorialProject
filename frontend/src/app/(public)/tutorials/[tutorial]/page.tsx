import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { CategoryIcon } from "@/components/category-icon";
import { DifficultyBadge } from "@/components/difficulty-badge";
import { EmptyState } from "@/components/empty-state";
import { JsonLd } from "@/components/json-ld";
import { Notice } from "@/components/ui/notice";
import { getAllTutorials, getTutorial } from "@/lib/api/client";
import type { TutorialDetail } from "@/lib/api/types";
import { ApiError } from "@/lib/api/errors";
import { difficultyLabel, formatCount, formatDate, formatReadingTime } from "@/lib/format";
import { breadcrumbJsonLd, courseJsonLd, pageMetadata } from "@/lib/seo";

export const revalidate = 300;

export async function generateStaticParams() {
  const tutorials = await getAllTutorials().catch(() => []);
  return tutorials.map((tutorial) => ({ tutorial: tutorial.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tutorial: string }>;
}): Promise<Metadata> {
  const { tutorial: slug } = await params;
  try {
    const tutorial = await getTutorial(slug);
    return pageMetadata({
      title: tutorial.title,
      description: tutorial.summary,
      path: `/tutorials/${tutorial.slug}`,
      type: "article",
    });
  } catch {
    return pageMetadata({
      title: "Tutorial",
      description: "A beginner-friendly programming tutorial.",
      path: `/tutorials/${slug}`,
      type: "article",
    });
  }
}

export default async function TutorialPage({
  params,
}: {
  params: Promise<{ tutorial: string }>;
}) {
  const { tutorial: slug } = await params;
  let tutorial: TutorialDetail;
  try {
    tutorial = await getTutorial(slug);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  const firstChapter = tutorial.chapters[0];

  return (
    <>
      <section className="border-b border-line">
        <div className="container-page py-8 lg:py-12">
          <Breadcrumbs
            items={[
              { name: "Home", path: "/" },
              { name: "Tutorials", path: "/tutorials" },
              { name: tutorial.title, path: `/tutorials/${tutorial.slug}` },
            ]}
          />

          <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_18rem]">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/categories/${tutorial.category.slug}`}
                  className="tag tag-cobalt no-underline hover:bg-lime hover:text-on-lime"
                >
                  <CategoryIcon name="book" className="mr-1 size-3.5" />
                  {tutorial.category.name}
                </Link>
                <DifficultyBadge difficulty={tutorial.difficulty} />
                <span className="tag">{formatReadingTime(tutorial.estimated_reading_time)}</span>
              </div>

              <h1 className="display-title mt-5 max-w-4xl text-5xl sm:text-6xl">
                {tutorial.title}
              </h1>
              <p className="mt-5 max-w-3xl text-lg leading-relaxed text-muted">{tutorial.summary}</p>

              <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted">
                <span>
                  By <strong className="text-ink">{tutorial.author.display_name}</strong>
                </span>
                <span>Updated {formatDate(tutorial.updated_at)}</span>
                <span>{formatCount(tutorial.chapters.length, "chapter")}</span>
              </div>

              {firstChapter ? (
                <Link
                  href={`/tutorials/${tutorial.slug}/${firstChapter.slug}`}
                  className="button-primary mt-8"
                >
                  Start with chapter 1
                </Link>
              ) : null}
            </div>

            <aside className="surface-strong p-5">
              <p className="meta-text text-cobalt">At a glance</p>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between gap-4 border-b border-line pb-2">
                  <dt className="text-muted">Level</dt>
                  <dd className="font-semibold">{difficultyLabel(tutorial.difficulty)}</dd>
                </div>
                <div className="flex items-center justify-between gap-4 border-b border-line pb-2">
                  <dt className="text-muted">Chapters</dt>
                  <dd className="font-semibold">{tutorial.chapters.length}</dd>
                </div>
                <div className="flex items-center justify-between gap-4 border-b border-line pb-2">
                  <dt className="text-muted">Reading time</dt>
                  <dd className="font-semibold">{formatReadingTime(tutorial.estimated_reading_time)}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted">Published</dt>
                  <dd className="font-semibold">{formatDate(tutorial.published_at)}</dd>
                </div>
              </dl>

              {tutorial.progress ? (
                <section className="mt-5 border-t border-line pt-4" aria-label="Your progress">
                  <div className="flex items-center justify-between gap-3">
                    <p className="meta-text text-cobalt">Your progress</p>
                    <p className="meta-text text-muted">{tutorial.progress.percent}%</p>
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    {tutorial.progress.completed_chapters} of {tutorial.progress.total_chapters}{" "}
                    chapters complete
                  </p>
                  <div
                    role="progressbar"
                    aria-label={`${tutorial.title} progress`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={tutorial.progress.percent}
                    className="mt-2 h-2 overflow-hidden border border-line-strong bg-paper"
                  >
                    <div
                      className="h-full bg-cobalt transition-[width] duration-300"
                      style={{ width: `${tutorial.progress.percent}%` }}
                    />
                  </div>
                </section>
              ) : null}

              {tutorial.tags.length > 0 ? (
                <div className="mt-5 border-t border-line pt-4">
                  <p className="meta-text text-cobalt">Topics</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {tutorial.tags.map((tag) => (
                      <span key={tag.slug} className="tag">
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </aside>
          </div>
        </div>
      </section>

      <section className="container-page py-12 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[1fr_18rem]">
          <div>
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-4">
              <div>
                <p className="eyebrow">Contents</p>
                <h2 className="display-title mt-3 text-3xl sm:text-4xl">Follow the sequence.</h2>
              </div>
              <p className="meta-text text-muted">
                {formatCount(tutorial.chapters.length, "chapter")}
              </p>
            </div>

            {tutorial.chapters.length > 0 ? (
              <ol>
                {tutorial.chapters.map((chapter) => (
                  <li key={chapter.slug} className="border-b border-line">
                    <Link
                      href={`/tutorials/${tutorial.slug}/${chapter.slug}`}
                      className="group grid gap-3 py-5 no-underline transition-colors hover:bg-paper-raised sm:grid-cols-[2.7rem_1fr_auto] sm:gap-5"
                    >
                      <span className="meta-text text-coral" aria-hidden="true">
                        {String(chapter.order).padStart(2, "0")}
                      </span>
                      <div>
                        <h3 className="font-display text-xl font-bold tracking-[-0.035em] text-ink group-hover:text-cobalt">
                          {chapter.title}
                        </h3>
                        <p className="mt-1 text-sm leading-relaxed text-muted">{chapter.summary}</p>
                      </div>
                      <span className="meta-text self-center text-muted">
                        {formatReadingTime(chapter.estimated_reading_time)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="mt-7">
                <EmptyState
                  title="Chapters are on the way."
                  description="This tutorial is published, but its chapters are still being prepared."
                  action={
                    <Link href="/tutorials" className="button-secondary text-sm">
                      Browse other tutorials
                    </Link>
                  }
                />
              </div>
            )}
          </div>

          <aside className="space-y-6">
            <Notice tone="warning" title="How to use this tutorial">
              Read the chapters in order. Type the examples into your own editor instead of pasting
              them. Change one thing after each example and see what happens.
            </Notice>
            <div className="surface p-5">
              <p className="meta-text text-cobalt">Author</p>
              <p className="mt-2 font-display text-lg font-bold">{tutorial.author.display_name}</p>
              <p className="mt-1 text-sm text-muted">
                Writing practical lessons for people who are starting from zero.
              </p>
            </div>
          </aside>
        </div>
      </section>

      <JsonLd data={courseJsonLd(tutorial)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Tutorials", path: "/tutorials" },
          { name: tutorial.title, path: `/tutorials/${tutorial.slug}` },
        ])}
      />
    </>
  );
}
