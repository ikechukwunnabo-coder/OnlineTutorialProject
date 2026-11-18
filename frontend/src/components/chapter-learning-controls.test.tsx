import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  addBookmark,
  getChapterWithSession,
  getMe,
  removeBookmark,
  saveProgress,
} from "@/lib/api/browser";
import type { ChapterDetail } from "@/lib/api/types";

import { ChapterLearningControls } from "./chapter-learning-controls";

vi.mock("@/lib/api/browser", () => ({
  addBookmark: vi.fn(),
  getChapterWithSession: vi.fn(),
  getMe: vi.fn(),
  removeBookmark: vi.fn(),
  saveProgress: vi.fn(),
}));

const mockedGetMe = vi.mocked(getMe);
const mockedGetChapter = vi.mocked(getChapterWithSession);
const mockedAddBookmark = vi.mocked(addBookmark);
const mockedRemoveBookmark = vi.mocked(removeBookmark);
const mockedSaveProgress = vi.mocked(saveProgress);

const chapter = {
  id: 11,
  bookmark: { saved: false },
  progress: { completed: false, reading_position: 25 },
} as ChapterDetail;

describe("ChapterLearningControls", () => {
  it("invites anonymous readers to log in", async () => {
    mockedGetMe.mockResolvedValue({ authenticated: false, user: null });

    render(
      <ChapterLearningControls chapterId={11} tutorialSlug="html" chapterSlug="intro" />,
    );

    expect(await screen.findByText("Keep your place in this chapter.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute(
      "href",
      "/login?next=/tutorials/html/intro",
    );
  });

  it("toggles a bookmark and completion for a verified learner", async () => {
    mockedGetMe.mockResolvedValue({
      authenticated: true,
      user: {
        id: 1,
        email: "ada@example.com",
        role: "learner",
        display_name: "Ada",
        email_verified: true,
        date_joined: "2026-01-01T00:00:00Z",
        bio: "",
      },
    });
    mockedGetChapter.mockResolvedValue(chapter);
    mockedAddBookmark.mockResolvedValue({
      id: 1,
      chapter: {
        id: 11,
        title: "Intro",
        slug: "intro",
        tutorial: { title: "HTML", slug: "html" },
        estimated_reading_time: 5,
      },
      created_at: "2026-01-01T00:00:00Z",
    });
    mockedSaveProgress.mockResolvedValue({
      chapter: 11,
      completed: true,
      completed_at: "2026-01-01T00:00:00Z",
      reading_position: 100,
      updated_at: "2026-01-01T00:00:00Z",
    });

    render(
      <ChapterLearningControls chapterId={11} tutorialSlug="html" chapterSlug="intro" />,
    );

    const bookmarkButton = await screen.findByRole("button", { name: "Bookmark chapter" });
    fireEvent.click(bookmarkButton);

    await waitFor(() => {
      expect(mockedAddBookmark).toHaveBeenCalledWith(11);
    });
    expect(await screen.findByRole("button", { name: "Bookmarked" })).toBeInTheDocument();
    expect(screen.getByText("Chapter bookmarked.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Mark chapter complete" }));

    await waitFor(() => {
      expect(mockedSaveProgress).toHaveBeenCalledWith(11, {
        completed: true,
        reading_position: 100,
      });
    });
    expect(await screen.findByRole("button", { name: "Completed" })).toBeInTheDocument();
    expect(screen.getByText("Chapter marked complete.")).toBeInTheDocument();

    mockedRemoveBookmark.mockResolvedValue();
    fireEvent.click(screen.getByRole("button", { name: "Bookmarked" }));
    await waitFor(() => {
      expect(mockedRemoveBookmark).toHaveBeenCalledWith(11);
    });
  });
});
