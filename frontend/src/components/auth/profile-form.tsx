"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { resendVerification, updateProfile } from "@/lib/api/browser";
import { ApiError, fieldErrors } from "@/lib/api/errors";
import type { UserProfile } from "@/lib/api/types";
import { formatDate } from "@/lib/format";

const profileSchema = z.object({
  display_name: z
    .string()
    .trim()
    .min(1, "Tell us what to call you.")
    .max(80, "Keep your name under 80 characters."),
  bio: z.string().max(500, "Keep your bio under 500 characters."),
});

type ProfileValues = z.infer<typeof profileSchema>;

export function ProfileForm({ user }: { user: UserProfile }) {
  const router = useRouter();
  const [savedMessage, setSavedMessage] = useState("");
  const [resendMessage, setResendMessage] = useState("");
  const [resending, setResending] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      display_name: user.display_name,
      bio: user.bio ?? "",
    },
  });

  async function onSubmit(values: ProfileValues) {
    setSavedMessage("");
    try {
      const updated = await updateProfile(values);
      reset({ display_name: updated.display_name, bio: updated.bio ?? "" });
      setSavedMessage("Profile saved.");
      window.dispatchEvent(new Event("bds:auth-changed"));
      router.refresh();
    } catch (error) {
      const fields = fieldErrors(error);
      let mapped = false;

      for (const [field, message] of Object.entries(fields)) {
        if (field === "display_name" || field === "bio") {
          setError(field, { message });
          mapped = true;
        }
      }

      if (!mapped) {
        setError("root", {
          message:
            error instanceof ApiError
              ? error.message
              : "We could not save your profile. Please try again.",
        });
      }
    }
  }

  async function handleResend() {
    setResending(true);
    setResendMessage("");
    try {
      const response = await resendVerification();
      setResendMessage(response.message);
    } catch (error) {
      setResendMessage(
        error instanceof ApiError
          ? error.message
          : "We could not resend the verification email.",
      );
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="border-2 border-ink bg-paper-raised p-6 shadow-[7px_7px_0_0_var(--ink)] sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Your account</p>
          <h1 className="display-title mt-3 text-4xl sm:text-5xl">{user.display_name}</h1>
        </div>
        <span
          className={`border px-2.5 py-1 font-mono text-[0.65rem] uppercase tracking-[0.12em] ${
            user.email_verified
              ? "border-ink/40 bg-mint/30 text-ink"
              : "border-coral/50 bg-coral/10 text-coral"
          }`}
        >
          {user.email_verified ? "Email verified" : "Email unverified"}
        </span>
      </div>

      <dl className="mt-6 grid gap-4 border-y border-line py-5 text-sm sm:grid-cols-3">
        <div>
          <dt className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-muted">Email</dt>
          <dd className="mt-1 break-all font-bold text-ink">{user.email}</dd>
        </div>
        <div>
          <dt className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-muted">Role</dt>
          <dd className="mt-1 font-bold capitalize text-ink">{user.role}</dd>
        </div>
        <div>
          <dt className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-muted">
            Joined
          </dt>
          <dd className="mt-1 font-bold text-ink">{formatDate(user.date_joined)}</dd>
        </div>
      </dl>

      {!user.email_verified ? (
        <div className="mt-5 border border-coral/40 bg-coral/5 p-4">
          <p className="text-sm font-bold text-ink">Verify your email to unlock everything.</p>
          <p className="mt-1 text-sm text-muted">
            Check your inbox for the verification link, or send a fresh one.
          </p>
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="button-secondary mt-3 text-xs"
          >
            {resending ? "Sending…" : "Resend verification email"}
          </button>
          {resendMessage ? (
            <p role="status" className="mt-2 text-sm text-ink">
              {resendMessage}
            </p>
          ) : null}
        </div>
      ) : null}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-5">
        <div>
          <label htmlFor="profile-name" className="field-label">
            Display name
          </label>
          <input
            id="profile-name"
            type="text"
            autoComplete="nickname"
            className="field-input"
            aria-invalid={Boolean(errors.display_name)}
            aria-describedby={errors.display_name ? "profile-name-error" : undefined}
            {...register("display_name")}
          />
          {errors.display_name ? (
            <p id="profile-name-error" className="field-error">
              {errors.display_name.message}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="profile-bio" className="field-label">
            Bio <span className="font-normal normal-case tracking-normal text-muted">(optional)</span>
          </label>
          <textarea
            id="profile-bio"
            rows={4}
            className="field-input resize-y"
            aria-invalid={Boolean(errors.bio)}
            aria-describedby={errors.bio ? "profile-bio-error" : "profile-bio-hint"}
            {...register("bio")}
          />
          <p id="profile-bio-hint" className="mt-1.5 text-xs text-muted">
            A short note about what you are learning. Up to 500 characters.
          </p>
          {errors.bio ? (
            <p id="profile-bio-error" className="field-error">
              {errors.bio.message}
            </p>
          ) : null}
        </div>

        {errors.root?.message ? (
          <div role="alert" className="alert-error">
            {errors.root.message}
          </div>
        ) : null}

        {savedMessage ? (
          <div role="status" className="alert-success">
            {savedMessage}
          </div>
        ) : null}

        <button type="submit" className="button-primary" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Save changes"}
        </button>
      </form>
    </div>
  );
}
