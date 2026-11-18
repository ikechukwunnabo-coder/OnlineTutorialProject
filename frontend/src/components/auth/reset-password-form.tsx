"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { confirmPasswordReset } from "@/lib/api/browser";
import { ApiError, fieldErrors } from "@/lib/api/errors";

const resetSchema = z
  .object({
    new_password: z.string().min(12, "Use at least 12 characters."),
    confirm_password: z.string().min(1, "Confirm your new password."),
  })
  .refine((values) => values.new_password === values.confirm_password, {
    path: ["confirm_password"],
    message: "Passwords do not match.",
  });

type ResetValues = z.infer<typeof resetSchema>;

export function ResetPasswordForm({ uid = "", token = "" }: { uid?: string; token?: string }) {
  const [message, setMessage] = useState("");
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { new_password: "", confirm_password: "" },
  });

  async function onSubmit(values: ResetValues) {
    if (!uid || !token) {
      setError("root", { message: "This reset link is missing information. Request a new one." });
      return;
    }

    try {
      const response = await confirmPasswordReset({
        uid,
        token,
        new_password: values.new_password,
      });
      setMessage(response.message);
    } catch (error) {
      const fields = fieldErrors(error);
      if (fields.new_password) {
        setError("new_password", { message: fields.new_password });
      } else {
        setError("root", {
          message:
            error instanceof ApiError
              ? error.message
              : "We could not reset your password. Request a new link.",
        });
      }
    }
  }

  if (message) {
    return (
      <div className="border-2 border-ink bg-paper-raised p-6 shadow-[7px_7px_0_0_var(--ink)] sm:p-8">
        <p className="eyebrow">Password updated</p>
        <h1 className="display-title mt-3 text-4xl sm:text-5xl">You can log in now.</h1>
        <div role="status" className="alert-success mt-6">
          {message}
        </div>
        <Link href="/login" className="button-primary mt-6 text-sm">
          Go to log in
        </Link>
      </div>
    );
  }

  return (
    <div className="border-2 border-ink bg-paper-raised p-6 shadow-[7px_7px_0_0_var(--ink)] sm:p-8">
      <p className="eyebrow">Choose a new password</p>
      <h1 className="display-title mt-3 text-4xl sm:text-5xl">Reset your password.</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Use at least 12 characters. A longer phrase is easier to remember than a short scramble.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-7 space-y-5">
        <div>
          <label htmlFor="reset-password" className="field-label">
            New password
          </label>
          <input
            id="reset-password"
            type="password"
            autoComplete="new-password"
            className="field-input"
            aria-invalid={Boolean(errors.new_password)}
            aria-describedby={errors.new_password ? "reset-password-error" : undefined}
            {...register("new_password")}
          />
          {errors.new_password ? (
            <p id="reset-password-error" className="field-error">
              {errors.new_password.message}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="reset-confirm" className="field-label">
            Confirm new password
          </label>
          <input
            id="reset-confirm"
            type="password"
            autoComplete="new-password"
            className="field-input"
            aria-invalid={Boolean(errors.confirm_password)}
            aria-describedby={errors.confirm_password ? "reset-confirm-error" : undefined}
            {...register("confirm_password")}
          />
          {errors.confirm_password ? (
            <p id="reset-confirm-error" className="field-error">
              {errors.confirm_password.message}
            </p>
          ) : null}
        </div>

        {errors.root?.message ? (
          <div role="alert" className="alert-error">
            {errors.root.message}
          </div>
        ) : null}

        <button type="submit" className="button-primary w-full" disabled={isSubmitting}>
          {isSubmitting ? "Updating…" : "Update password"}
        </button>
      </form>

      <p className="mt-6 border-t border-line pt-5 text-sm text-muted">
        Link expired?{" "}
        <Link href="/forgot-password" className="font-bold text-cobalt">
          Request another
        </Link>
        .
      </p>
    </div>
  );
}
