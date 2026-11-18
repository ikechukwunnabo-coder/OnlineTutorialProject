import { describe, expect, it } from "vitest";

import {
  difficultyLabel,
  formatCount,
  formatDate,
  formatDateTime,
  formatReadingTime,
} from "./format";

describe("format helpers", () => {
  it("formats dates in UTC", () => {
    expect(formatDate("2026-01-15T23:30:00Z")).toBe("Jan 15, 2026");
  });

  it("handles invalid dates", () => {
    expect(formatDate("not-a-date")).toBe("Date unavailable");
  });

  it("formats date times in UTC", () => {
    const result = formatDateTime("2026-01-15T23:30:00Z");
    expect(result).toContain("Jan 15, 2026");
    expect(result).toContain("23:30");
  });

  it("handles invalid date times", () => {
    expect(formatDateTime("not-a-date")).toBe("Time unavailable");
  });

  it("never shows less than one minute of reading time", () => {
    expect(formatReadingTime(0)).toBe("1 min read");
    expect(formatReadingTime(4.4)).toBe("4 min read");
  });

  it("labels difficulty values", () => {
    expect(difficultyLabel("beginner")).toBe("Beginner");
    expect(difficultyLabel("advanced")).toBe("Advanced");
  });

  it("pluralizes counts", () => {
    expect(formatCount(1, "chapter")).toBe("1 chapter");
    expect(formatCount(2, "chapter")).toBe("2 chapters");
    expect(formatCount(2, "category", "categories")).toBe("2 categories");
  });
});
