import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { EmptyState } from "@/components/empty-state";
import { ApiError } from "@/lib/api/errors";
import { getBookmarks, getCurrentUser, getProgress } from "@/lib/api/server";
import type { BookmarkPage, ProgressOverview } from "@/lib/api/types";
import { formatCount, formatDate, formatReadingTime } from "@/lib/format";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: "My learning",
  description: "Your bookmarks, reading progress, and completed chapters.",
  path: "/dashboard",
  noIndex: true,
});

function ProgressBar({ percent, label }: { percent: number; label: string }) {
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      className="h-2 overflow-hidden border border-line-strong bg-paper"
    >
      <div className="h-full bg-cobalt" style={{ width: `${percent}%` }} />
    </div>
  );
}

export default async function DashboardPage() {
  const session = await getCurrentUser();

  if (!session.authenticated || !session.user) {
    redirect("/login?next=/dashboard");
  }

  if (!session.user.email_verified) {
    return (
      <section className="grid-paper">
        <div className="container-page py-12 sm:py-16">
          <div className="mx-auto max-w-2xl border-2 border-coral bg-[#fff0ea] p-6">
            <p className="eyebrow">My learning</p>
            <h1 className="display-title mt-4 text-4xl sm:text-5xl">Verify your email first.</h1>
            <p className="mt-4 text-muted">
              Bookmarks and reading progress are available after you verify your email address.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/verify-email" className="button-primary">
                Verify email
              </Link>
              <Link href="/profile" className="button-secondary">
                Go to profile
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  let bookmarks: BookmarkPage;
  let progress: ProgressOverview;
  try {
    [bookmarks, progress] = await Promise.all([getBookmarks(), getProgress()]);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      redirect("/login?next=/dashboard");
    }
    throw error;
  }

  return (
    <section className="grid-paper">
      <div className="container-page py-10 sm:py-14">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
          <div>
            <p className="eyebrow">My learning</p>
            <h1 className="display-title mt-3 text-4xl sm:text-6xl">
              Welcome back, {session.user.display_name}.
            </h1>
            <p className="mt-3 max-w-2xl text-muted">
              Pick up where you stopped, revisit a saved chapter, or start something new.
            </p>
          </div>
          <Link href="/profile" className="button-secondary text-sm">
            Edit profile
          </Link>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section aria-labelledby="overall-progress" className="card-index p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-mono text-xs text-cobalt">Overall progress</p>
                <h2 id="overall-progress" className="mt-2 font-display text-2xl font-bold tracking-[-0.04em]">
                  {progress.overall.percent_complete}% complete
                </h2>
              </div>
              <span className="tag tag-lime">
                {formatCount(progress.overall.completed_chapters, "chapter")}
              </span>
            </div>
            <div className="mt-4">
              <ProgressBar percent={progress.overall.percent_complete} label="Overall chapter completion" />
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
              <div className="border-l-2 border-coral pl-3">
                <dt className="text-muted">Chapters completed</dt>
                <dd className="mt-1 font-display text-2xl font-bold">
                  {progress.overall.completed_chapters}
                </dd>
              </div>
              <div className="border-l-2 border-cobalt pl-3">
                <dt className="text-muted">Tutorials started</dt>
                <dd className="mt-1 font-display text-2xl font-bold">
                  {progress.overall.started_tutorials}
                </dd>
              </div>
            </dl>
          </section>

          <section aria-labelledby="bookmark-summary" className="card-index p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-mono text-xs text-cobalt">Saved chapters</p>
                <h2 id="bookmark-summary" className="mt-2 font-display text-2xl font-bold tracking-[-0.04em]">
                  {formatCount(bookmarks.count, "bookmark")}
                </h2>
              </div>
              <Link href="/tutorials" className="link-arrow text-sm">
                Find more
              </Link>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              Bookmarks are private to your account and stay with you between sessions.
            </p>
          </section>
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_1fr]">
          <section aria-labelledby="tutorial-progress">
            <div className="flex items-end justify-between gap-4 border-b border-line pb-4">
              <div>
                <p className="eyebrow">In progress</p>
                <h2 id="tutorial-progress" className="display-title mt-3 text-3xl">
                  By tutorial.
                </h2>
              </div>
            </div>

            {progress.tutorials.length > 0 ? (
              <ol className="mt-2">
                {progress.tutorials.map((item) => (
                  <li key={item.tutorial.slug} className="border-b border-line py-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <Link
                          href={`/tutorials/${item.tutorial.slug}`}
                          className="font-display text-xl font-bold tracking-[-0.035em] text-ink no-underline hover:text-cobalt"
                        >
                          {item.tutorial.title}
                        </Link>
                        <p className="mt-1 font-mono text-xs text-muted">
                          {item.completed_chapters} of {item.total_chapters} chapters ·{" "}
                          {formatDate(item.last_activity_at)}
                        </p>
                      </div>
                      <span className="tag tag-cobalt">{item.percent}%</span>
                    </div>
                    <div className="mt-3">
                      <ProgressBar
                        percent={item.percent}
                        label={`${item.tutorial.title} completion`}
                      />
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="mt-6">
                <EmptyState
                  title="No progress yet."
                  description="Open a chapter and mark it complete to start tracking your learning."
                />
              </div>
            )}
          </section>

          <section aria-labelledby="bookmarks-list">
            <div className="flex items-end justify-between gap-4 border-b border-line pb-4">
              <div>
                <p className="eyebrow">Saved for later</p>
                <h2 id="bookmarks-list" className="display-title mt-3 text-3xl">
                  Bookmarks.
                </h2>
              </div>
              <p className="font-mono text-xs text-muted">{bookmarks.count} total</p>
            </div>

            {bookmarks.results.length > 0 ? (
              <ul className="mt-2">
                {bookmarks.results.map((bookmark) => (
                  <li key={bookmark.id} className="border-b border-line py-4">
                    <Link
                      href={`/tutorials/${bookmark.chapter.tutorial.slug}/${bookmark.chapter.slug}`}
                      className="group block no-underline"
                    >
                      <p className="font-mono text-[0.68rem] text-cobalt">
                        {bookmark.chapter.tutorial.title}
                      </p>
                      <p className="mt-1 font-display text-xl font-bold tracking-[-0.035em] text-ink group-hover:text-cobalt">
                        {bookmark.chapter.title}
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        {formatReadingTime(bookmark.chapter.estimated_reading_time)} · Saved{" "}
                        {formatDate(bookmark.created_at)}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-6">
                <EmptyState
                  title="No bookmarks yet."
                  description="Use the bookmark button on any chapter to keep it here."
                />
              </div>
            )}

            {bookmarks.count > bookmarks.results.length ? (
              <p className="mt-4 text-sm text-muted">
                Showing your {bookmarks.results.length} most recent bookmarks.
              </p>
            ) : null}
          </section>
        </div>
      </div>
    </section>
  );
}
