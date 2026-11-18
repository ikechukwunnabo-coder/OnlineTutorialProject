import { describe, expect, it } from "vitest";

import { canAccessConsole, canEditConsoleContent, canManageConsole } from "./console";

describe("console access", () => {
  it("allows editorial roles", () => {
    expect(canAccessConsole("editor")).toBe(true);
    expect(canAccessConsole("moderator")).toBe(true);
    expect(canAccessConsole("admin")).toBe(true);
  });

  it("rejects learners and missing roles", () => {
    expect(canAccessConsole("learner")).toBe(false);
    expect(canAccessConsole(undefined)).toBe(false);
  });

  it("lets editors and administrators change content", () => {
    expect(canEditConsoleContent("editor")).toBe(true);
    expect(canEditConsoleContent("admin")).toBe(true);
    expect(canEditConsoleContent("moderator")).toBe(false);
    expect(canEditConsoleContent("learner")).toBe(false);
  });

  it("limits management to administrators", () => {
    expect(canManageConsole("admin")).toBe(true);
    expect(canManageConsole("editor")).toBe(false);
    expect(canManageConsole("moderator")).toBe(false);
  });
});
