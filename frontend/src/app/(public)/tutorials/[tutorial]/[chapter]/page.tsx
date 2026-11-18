import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { ChapterIndex } from "@/components/chapter-index";
import { ChapterLearningControls } from "@/components/chapter-learning-controls";
import { ChapterNavigation } from "@/components/chapter-navigation";
import { CodeBlock } from "@/components/code-block";
import { JsonLd } from "@/components/json-ld";
import { TableOfContents } from "@/components/table-of-contents";
import { getAllTutorials, getChapter, getTutorial } from "@/lib/api/client";
import type { ChapterDetail, TutorialDetail } from "@/lib/api/types";
import { ApiError } from "@/lib/api/errors";
import { formatDate, formatReadingTime } from "@/lib/format";
import { articleJsonLd, breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

export const revalidate = 300;

export async function generateStaticParams() {
  const tutorials = await getAllTutorials().catch(() => []);
  const details = await Promise.all(
    tutorials.map((tutorial) => getTutorial(tutorial.slug).catch(() => null)),
  );

  return details.flatMap((tutorial) =>
    tutorial
      ? tutorial.chapters.map((chapter) => ({
          tutorial: tutorial.slug,
          chapter: chapter.slug,
        }))
      : [],
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tutorial: string; chapter: string }>;
}): Promise<Metadata> {
  const { tutorial, chapter } = await params;
  try {
    const detail = await getChapter(tutorial, chapter);
    return pageMetadata({
      title: detail.title,
      description: detail.summary,
      path: `/tutorials/${tutorial}/${chapter}`,
      type: "article",
    });
  } catch {
    return pageMetadata({
      title: "Chapter",
      description: "A beginner-friendly programming chapter.",
      path: `/tutorials/${tutorial}/${chapter}`,
      type: "article",
    });
  }
}

export default async function ChapterPage({
  params,
}: {
  params: Promise<{ tutorial: string; chapter: string }>;
}) {
  const { tutorial: tutorialSlug, chapter: chapterSlug } = await params;

  const [tutorial, chapter] = await Promise.all([
    getTutorial(tutorialSlug).catch(() => null),
    getChapter(tutorialSlug, chapterSlug).catch((error: unknown) => {
      if (error instanceof ApiError && error.status === 404) {
        notFound();
      }
      throw error;
    }),
  ]);

  const tutorialTitle = tutorial?.title ?? chapter.tutorial.title;
  const tutorialData: TutorialDetail | null = tutorial;
  const chapterData: ChapterDetail = chapter;

  return (
    <>
      <section className="border-b border-line">
        <div className="container-page py-7 lg:py-10">
          <Breadcrumbs
            items={[
              { name: "Home", path: "/" },
              { name: "Tutorials", path: "/tutorials" },
              { name: tutorialTitle, path: `/tutorials/${tutorialSlug}` },
              { name: chapterData.title, path: `/tutorials/${tutorialSlug}/${chapterSlug}` },
            ]}
          />

          <div className="mt-7 max-w-4xl">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/tutorials/${tutorialSlug}`}
                className="tag tag-cobalt no-underline hover:bg-lime hover:text-ink"
              >
                {tutorialTitle}
              </Link>
              <span className="tag">
                Chapter {chapterData.order} of {chapterData.tutorial.chapter_count}
              </span>
              <span className="tag">{formatReadingTime(chapterData.estimated_reading_time)}</span>
            </div>

            <h1
              id="chapter-title"
              className="display-title mt-5 text-[clamp(2.5rem,6vw,4.5rem)]"
            >
              {chapterData.title}
            </h1>
            <p className="mt-4 max-w-3xl text-lg leading-relaxed text-muted">{chapterData.summary}</p>
            <p className="mt-4 font-mono text-xs text-muted">
              Updated {formatDate(chapterData.updated_at)}
            </p>
          </div>
        </div>
      </section>

      <div className="container-page py-10 lg:py-14">
        {tutorialData ? (
          <details className="mb-6 border-2 border-ink bg-paper-raised p-4 lg:hidden">
            <summary className="cursor-pointer font-display text-lg font-bold">
              Chapters in this tutorial
            </summary>
            <div className="mt-4">
              <ChapterIndex tutorial={tutorialData} currentSlug={chapterData.slug} />
            </div>
          </details>
        ) : null}

        {chapterData.toc.length > 0 ? (
          <details className="mb-6 border-2 border-ink bg-paper-raised p-4 lg:hidden">
            <summary className="cursor-pointer font-display text-lg font-bold">On this page</summary>
            <div className="mt-4">
              <TableOfContents items={chapterData.toc} />
            </div>
          </details>
        ) : null}

        <div className="grid gap-10 lg:grid-cols-[14rem_minmax(0,1fr)_13rem]">
          {tutorialData ? (
            <aside className="hidden lg:block">
              <div className="sticky-rail">
                <ChapterIndex tutorial={tutorialData} currentSlug={chapterData.slug} />
              </div>
            </aside>
          ) : (
            <div className="hidden lg:block" />
          )}

          <article aria-labelledby="chapter-title" className="min-w-0">
            <ChapterLearningControls
              chapterId={chapterData.id}
              tutorialSlug={tutorialSlug}
              chapterSlug={chapterSlug}
            />

            <div
              id="chapter-reading"
              className="prose-lesson mt-8"
              dangerouslySetInnerHTML={{ __html: chapterData.content_html }}
            />

            {chapterData.images.length > 0 ? (
              <section aria-labelledby="chapter-images" className="mt-10 space-y-6">
                <h2 id="chapter-images" className="eyebrow">
                  Images
                </h2>
                {chapterData.images.map((image) => (
                  <figure key={`${image.order}-${image.url}`}>
                    <div className="relative aspect-video w-full overflow-hidden border-2 border-ink">
                      <Image
                        src={image.url}
                        alt={image.decorative ? "" : image.alt_text}
                        fill
                        unoptimized
                        sizes="(max-width: 1024px) 100vw, 48rem"
                        className="object-contain"
                      />
                    </div>
                    {image.caption ? (
                      <figcaption className="mt-2 text-sm text-muted">
                        {image.caption}
                      </figcaption>
                    ) : null}
                  </figure>
                ))}
              </section>
            ) : null}

            {chapterData.video_embeds.length > 0 ? (
              <section aria-labelledby="chapter-videos" className="mt-12 border-t-2 border-ink pt-8">
                <p className="eyebrow">Watch</p>
                <h2 id="chapter-videos" className="display-title mt-3 text-3xl sm:text-4xl">
                  Video for this chapter.
                </h2>
                {chapterData.video_embeds.map((video) => (
                  <figure key={`${video.order}-${video.embed_url}`} className="mt-6">
                    <div className="aspect-video w-full overflow-hidden border-2 border-ink">
                      <iframe
                        src={video.embed_url}
                        title={video.title}
                        className="h-full w-full"
                        loading="lazy"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                    <figcaption className="mt-2 text-sm text-muted">{video.title}</figcaption>
                  </figure>
                ))}
              </section>
            ) : null}

            {chapterData.code_examples.length > 0 ? (
              <section aria-labelledby="code-examples" className="mt-12 border-t-2 border-ink pt-8">
                <p className="eyebrow">Try it yourself</p>
                <h2
                  id="code-examples"
                  className="display-title mt-3 text-3xl sm:text-4xl"
                >
                  Code from this chapter.
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-muted">
                  Type these examples into your own editor. The expected output is a guide, not a
                  guarantee that every detail will match your setup.
                </p>

                {chapterData.code_examples.map((example) => (
                  <CodeBlock key={`${example.order}-${example.title}`} example={example} />
                ))}
              </section>
            ) : null}

            <div className="mt-10 border-t border-line pt-6">
              <p className="text-sm text-muted">
                Found a mistake in this chapter?{" "}
                <Link href="/contact" className="font-bold text-cobalt">
                  Tell us about it
                </Link>
                .
              </p>
            </div>

            <ChapterNavigation
              previous={chapterData.navigation.previous}
              next={chapterData.navigation.next}
            />

            <div className="mt-8">
              <Link href={`/tutorials/${tutorialSlug}`} className="link-arrow text-sm">
                Back to {tutorialTitle}
              </Link>
            </div>
          </article>

          <aside className="hidden lg:block">
            <div className="sticky-rail">
              <TableOfContents items={chapterData.toc} />
            </div>
          </aside>
        </div>
      </div>

      {tutorialData ? <JsonLd data={articleJsonLd(chapterData, tutorialData)} /> : null}
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Tutorials", path: "/tutorials" },
          { name: tutorialTitle, path: `/tutorials/${tutorialSlug}` },
          { name: chapterData.title, path: `/tutorials/${tutorialSlug}/${chapterSlug}` },
        ])}
      />
    </>
  );
}
