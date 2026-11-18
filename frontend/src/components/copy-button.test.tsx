import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CopyButton } from "./copy-button";

describe("CopyButton", () => {
  const writeText = vi.fn();

  beforeEach(() => {
    writeText.mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
  });

  it("copies code and announces success", async () => {
    render(<CopyButton text="console.log('hello');" />);

    fireEvent.click(screen.getByRole("button", { name: "Copy code" }));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith("console.log('hello');");
    });
    expect(screen.getByRole("button", { name: "Copied" })).toBeInTheDocument();
    expect(screen.getByText("Copied")).toBeInTheDocument();
  });

  it("reports a failed copy", async () => {
    writeText.mockRejectedValue(new Error("Clipboard blocked"));
    render(<CopyButton text="SELECT 1;" />);

    fireEvent.click(screen.getByRole("button", { name: "Copy code" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Copy failed" })).toBeInTheDocument();
    });
  });
});
