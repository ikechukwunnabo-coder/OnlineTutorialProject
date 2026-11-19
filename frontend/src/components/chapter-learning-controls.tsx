"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Notice } from "@/components/ui/notice";
import { ApiError } from "@/lib/api/errors";
import {
  addBookmark,
  getChapterWithSession,
  getMe,
  removeBookmark,
  saveProgress,
} from "@/lib/api/browser";

type LearningStatus = "loading" | "anonymous" | "unverified" | "ready" | "error";

interface ChapterLearningControlsProps {
  chapterId: number;
  tutorialSlug: string;
  chapterSlug: string;
}

function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function scrollToReadingPosition(percent: number) {
  const element = document.getElementById("chapter-reading");
  if (!element) {
    return;
  }
  const start = element.offsetTop;
  const distance = Math.max(1, element.offsetHeight - window.innerHeight);
  window.scrollTo({
    top: start + (distance * clampPercent(percent)) / 100,
    behavior: "smooth",
  });
}

export function ChapterLearningControls({
  chapterId,
  tutorialSlug,
  chapterSlug,
}: ChapterLearningControlsProps) {
  const [status, setStatus] = useState<LearningStatus>("loading");
  const [bookmarkSaved, setBookmarkSaved] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [readingPosition, setReadingPosition] = useState(0);
  const [initialPosition, setInitialPosition] = useState(0);
  const [busy, setBusy] = useState<"bookmark" | "complete" | "position" | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const lastSavedPosition = useRef(0);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    let active = true;

    getMe()
      .then(async (session) => {
        if (!active) {
          return;
        }
        if (!session.authenticated || !session.user) {
          setStatus("anonymous");
          return;
        }
        if (!session.user.email_verified) {
          setStatus("unverified");
          return;
        }

        const detail = await getChapterWithSession(tutorialSlug, chapterSlug);
        if (!active) {
          return;
        }
        setBookmarkSaved(detail.bookmark.saved);
        setCompleted(detail.progress?.completed ?? false);
        setReadingPosition(detail.progress?.reading_position ?? 0);
        setInitialPosition(detail.progress?.reading_position ?? 0);
        lastSavedPosition.current = detail.progress?.reading_position ?? 0;
        setStatus("ready");
      })
      .catch(() => {
        if (active) {
          setStatus("error");
        }
      });

    return () => {
      active = false;
      mounted.current = false;
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
      }
    };
  }, [chapterSlug, tutorialSlug]);

  useEffect(() => {
    if (status !== "ready") {
      return;
    }

    function handleScroll() {
      const element = document.getElementById("chapter-reading");
      if (!element) {
        return;
      }
      const start = element.offsetTop;
      const distance = Math.max(1, element.offsetHeight - window.innerHeight);
      const percent = clampPercent(((window.scrollY - start) / distance) * 100);
      setReadingPosition(percent);

      if (percent - lastSavedPosition.current < 5) {
        return;
      }

      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
      }
      saveTimer.current = setTimeout(() => {
        if (!mounted.current) {
          return;
        }
        lastSavedPosition.current = percent;
        saveProgress(chapterId, { reading_position: percent }).catch(() => {
          lastSavedPosition.current = Math.max(0, percent - 5);
        });
      }, 1200);
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
      }
    };
  }, [chapterId, status]);

  function handleLearningError(caught: unknown) {
    if (caught instanceof ApiError && caught.status === 401) {
      setStatus("anonymous");
      setMessage("");
      return;
    }
    if (caught instanceof ApiError && caught.status === 403) {
      setStatus("unverified");
      setMessage("");
      return;
    }
    setError("Your learning state could not be saved. Please try again.");
  }

  async function handleBookmark() {
    setBusy("bookmark");
    setError("");
    setMessage("");
    try {
      if (bookmarkSaved) {
        await removeBookmark(chapterId);
        setBookmarkSaved(false);
        setMessage("Bookmark removed.");
      } else {
        await addBookmark(chapterId);
        setBookmarkSaved(true);
        setMessage("Chapter bookmarked.");
      }
    } catch (caught) {
      handleLearningError(caught);
    } finally {
      setBusy(null);
    }
  }

  async function handleComplete() {
    const nextCompleted = !completed;
    setBusy("complete");
    setError("");
    setMessage("");
    try {
      await saveProgress(chapterId, {
        completed: nextCompleted,
        ...(nextCompleted ? { reading_position: 100 } : {}),
      });
      setCompleted(nextCompleted);
      if (nextCompleted) {
        setReadingPosition(100);
        lastSavedPosition.current = 100;
      }
      setMessage(nextCompleted ? "Chapter marked complete." : "Chapter marked incomplete.");
    } catch (caught) {
      handleLearningError(caught);
    } finally {
      setBusy(null);
    }
  }

  if (status === "loading") {
    return (
      <div className="mt-8" aria-busy="true">
        <Notice tone="info" role="status" title="Checking your learning state…">
          Your saved bookmarks and progress will appear here.
        </Notice>
      </div>
    );
  }

  if (status === "anonymous") {
    return (
      <div className="mt-8">
        <Notice tone="info" role="status" title="Keep your place in this chapter.">
          Log in to bookmark chapters, mark them complete, and save your reading position.
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href={`/login?next=/tutorials/${tutorialSlug}/${chapterSlug}`}
              className="button-primary text-sm"
            >
              Log in
            </Link>
            <Link href="/register" className="button-secondary text-sm">
              Create an account
            </Link>
          </div>
        </Notice>
      </div>
    );
  }

  if (status === "unverified") {
    return (
      <div className="mt-8">
        <Notice tone="warning" role="status" title="Verify your email to save this chapter.">
          Bookmarks, completion, and reading position are available after email verification.
          <Link href="/verify-email" className="button-secondary mt-3 text-sm">
            Verify email
          </Link>
        </Notice>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="mt-8">
        <Notice tone="warning" role="alert" title="Learning tools are unavailable.">
          Refresh the page to try again.
        </Notice>
      </div>
    );
  }

  return (
    <section
      aria-labelledby="learning-controls-title"
      className="surface-strong mt-8 p-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="learning-controls-title" className="font-display text-lg font-bold tracking-[-0.03em]">
            Your learning state
          </h2>
          <p className="mt-1 text-sm text-muted">
            {completed ? "You have completed this chapter." : "Save your place as you read."}
          </p>
        </div>
        <span className="tag tag-lime">
          {readingPosition}% read
        </span>
      </div>

      <div
        role="progressbar"
        aria-label="Reading position"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={readingPosition}
        className="mt-4 h-2 overflow-hidden border border-line-strong bg-paper"
      >
        <div
          className="h-full bg-cobalt transition-[width] duration-300"
          style={{ width: `${readingPosition}%` }}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleBookmark}
          disabled={busy !== null}
          aria-pressed={bookmarkSaved}
          className="button-secondary text-sm disabled:opacity-50"
        >
          {busy === "bookmark" ? "Saving…" : bookmarkSaved ? "Bookmarked" : "Bookmark chapter"}
        </button>
        <button
          type="button"
          onClick={handleComplete}
          disabled={busy !== null}
          aria-pressed={completed}
          className="button-primary text-sm disabled:opacity-50"
        >
          {busy === "complete"
            ? "Saving…"
            : completed
              ? "Completed"
              : "Mark chapter complete"}
        </button>
        {initialPosition > 0 && initialPosition < 100 ? (
          <button
            type="button"
            onClick={() => scrollToReadingPosition(initialPosition)}
            className="button-ghost text-sm"
          >
            Resume at {initialPosition}%
          </button>
        ) : null}
      </div>

      <p aria-live="polite" className="mt-3 min-h-5 text-sm text-cobalt">
        {message}
      </p>
      {error ? (
        <p role="alert" className="mt-1 text-sm text-danger">
          {error}
        </p>
      ) : null}
    </section>
  );
}
