import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getBrowserSuggestions } from "@/lib/api/browser";

import { SearchForm } from "./search-form";

vi.mock("@/lib/api/browser", () => ({
  getBrowserSuggestions: vi.fn(),
}));

const mockedSuggestions = vi.mocked(getBrowserSuggestions);

describe("SearchForm", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockedSuggestions.mockResolvedValue({
      suggestions: [{ title: "HTML Basics", url: "/tutorials/html-basics", type: "tutorial" }],
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not request suggestions for a single character", async () => {
    render(<SearchForm />);

    fireEvent.change(
      screen.getByRole("combobox", { name: "Search tutorials, chapters, and categories" }),
      { target: { value: "h" } },
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });

    expect(mockedSuggestions).not.toHaveBeenCalled();
  });

  it("shows suggestions after the debounce", async () => {
    render(<SearchForm />);

    fireEvent.change(
      screen.getByRole("combobox", { name: "Search tutorials, chapters, and categories" }),
      { target: { value: "ht" } },
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(mockedSuggestions).toHaveBeenCalledWith("ht", expect.any(AbortSignal));
    expect(screen.getByText("HTML Basics")).toBeInTheDocument();
    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });
});
