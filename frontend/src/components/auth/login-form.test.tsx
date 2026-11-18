import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { login } from "@/lib/api/browser";

import { LoginForm } from "./login-form";

const { pushMock, refreshMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  refreshMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));

vi.mock("@/lib/api/browser", () => ({
  login: vi.fn(),
}));

const mockedLogin = vi.mocked(login);

describe("LoginForm", () => {
  it("submits credentials and returns to the requested path", async () => {
    mockedLogin.mockResolvedValue({
      user: {
        id: 1,
        email: "ada@example.com",
        role: "learner",
        display_name: "Ada",
        email_verified: true,
        date_joined: "2026-01-01T00:00:00Z",
      },
      message: "Welcome back.",
    });

    render(<LoginForm nextPath="/tutorials" />);

    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "ada@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "correct horse battery staple" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Log in" }));

    await waitFor(() => {
      expect(mockedLogin).toHaveBeenCalledWith({
        email: "ada@example.com",
        password: "correct horse battery staple",
      });
    });
    expect(pushMock).toHaveBeenCalledWith("/tutorials");
    expect(refreshMock).toHaveBeenCalled();
  });

  it("shows validation messages without calling the API", async () => {
    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "not-an-email" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Log in" }));

    expect(await screen.findByText("Enter a valid email address.")).toBeInTheDocument();
    expect(mockedLogin).not.toHaveBeenCalled();
  });
});
