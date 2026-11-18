"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import { verifyEmail } from "@/lib/api/browser";
import { ApiError } from "@/lib/api/errors";

type Status = "idle" | "verifying" | "success" | "error";

function notifyAuthChanged() {
  window.dispatchEvent(new Event("bds:auth-changed"));
}

export function VerifyEmailForm({ token = "" }: { token?: string }) {
  const [status, setStatus] = useState<Status>(token ? "verifying" : "idle");
  const [message, setMessage] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [tokenInput, setTokenInput] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) {
      return;
    }

    let active = true;

    verifyEmail(token)
      .then((data) => {
        if (active) {
          setStatus("success");
          setMessage(data.message);
          setDisplayName(data.user.display_name);
          notifyAuthChanged();
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setStatus("error");
          setMessage(
            error instanceof ApiError
              ? error.message
              : "We could not verify that link. Please request a new one.",
          );
        }
      });

    return () => {
      active = false;
    };
  }, [token]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = tokenInput.trim();
    if (!value) {
      setStatus("error");
      setMessage("Paste the verification token from your email.");
      return;
    }

    setBusy(true);
    setStatus("verifying");
    setMessage("");

    try {
      const data = await verifyEmail(value);
      setStatus("success");
      setMessage(data.message);
      setDisplayName(data.user.display_name);
      notifyAuthChanged();
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof ApiError
          ? error.message
          : "We could not verify that token. Please request a new one.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (status === "verifying") {
    return (
      <div className="border-2 border-ink bg-paper-raised p-6 shadow-[7px_7px_0_0_var(--ink)] sm:p-8">
        <p className="eyebrow">Email verification</p>
        <h1 className="display-title mt-3 text-4xl sm:text-5xl">Checking your link.</h1>
        <p className="mt-4 text-sm text-muted" role="status">
          Hold on while we verify your email address…
        </p>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="border-2 border-ink bg-paper-raised p-6 shadow-[7px_7px_0_0_var(--ink)] sm:p-8">
        <p className="eyebrow">You are in</p>
        <h1 className="display-title mt-3 text-4xl sm:text-5xl">
          Welcome, {displayName || "learner"}.
        </h1>
        <div role="status" className="alert-success mt-6">
          {message}
        </div>
        <p className="mt-5 text-sm leading-relaxed text-muted">
          Your account is verified and you are logged in. You can now save bookmarks and track
          reading progress.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/profile" className="button-primary text-sm">
            Go to your profile
          </Link>
          <Link href="/tutorials" className="button-secondary text-sm">
            Browse tutorials
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="border-2 border-ink bg-paper-raised p-6 shadow-[7px_7px_0_0_var(--ink)] sm:p-8">
      <p className="eyebrow">Email verification</p>
      <h1 className="display-title mt-3 text-4xl sm:text-5xl">Verify your email.</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Open the link in your verification email. If you copied the token instead, paste it below.
      </p>

      {status === "error" && message ? (
        <div role="alert" className="alert-error mt-5">
          {message}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div>
          <label htmlFor="verification-token" className="field-label">
            Verification token
          </label>
          <input
            id="verification-token"
            type="text"
            value={tokenInput}
            onChange={(event) => setTokenInput(event.target.value)}
            autoComplete="one-time-code"
            className="field-input font-mono text-sm"
            placeholder="Paste the token from your email"
          />
        </div>
        <button type="submit" className="button-primary w-full" disabled={busy}>
          {busy ? "Verifying…" : "Verify email"}
        </button>
      </form>

      <p className="mt-6 border-t border-line pt-5 text-sm text-muted">
        Need a new link?{" "}
        <Link href="/login" className="font-bold text-cobalt">
          Log in
        </Link>{" "}
        and resend it from your profile.
      </p>
    </div>
  );
}
