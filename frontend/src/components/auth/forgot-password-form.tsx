"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { requestPasswordReset } from "@/lib/api/browser";
import { ApiError, fieldErrors } from "@/lib/api/errors";

const forgotSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
});

type ForgotValues = z.infer<typeof forgotSchema>;

export function ForgotPasswordForm() {
  const [sentMessage, setSentMessage] = useState("");
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ForgotValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotValues) {
    try {
      const response = await requestPasswordReset(values.email);
      setSentMessage(response.message);
    } catch (error) {
      const fields = fieldErrors(error);
      if (fields.email) {
        setError("email", { message: fields.email });
      } else {
        setError("root", {
          message:
            error instanceof ApiError
              ? error.message
              : "We could not send the reset email. Please try again.",
        });
      }
    }
  }

  if (sentMessage) {
    return (
      <div className="border-2 border-ink bg-paper-raised p-6 shadow-[7px_7px_0_0_var(--ink)] sm:p-8">
        <p className="eyebrow">Check your inbox</p>
        <h1 className="display-title mt-3 text-4xl sm:text-5xl">Reset link sent.</h1>
        <div role="status" className="alert-success mt-6">
          {sentMessage}
        </div>
        <p className="mt-5 text-sm leading-relaxed text-muted">
          The link expires after a short time. If it does not arrive, check your spam folder before
          requesting another.
        </p>
        <Link href="/login" className="button-secondary mt-6 text-sm">
          Back to log in
        </Link>
      </div>
    );
  }

  return (
    <div className="border-2 border-ink bg-paper-raised p-6 shadow-[7px_7px_0_0_var(--ink)] sm:p-8">
      <p className="eyebrow">Account recovery</p>
      <h1 className="display-title mt-3 text-4xl sm:text-5xl">Forgot your password?</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Enter the email address on your account. We will send a reset link if an account exists.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-7 space-y-5">
        <div>
          <label htmlFor="forgot-email" className="field-label">
            Email address
          </label>
          <input
            id="forgot-email"
            type="email"
            autoComplete="email"
            className="field-input"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "forgot-email-error" : undefined}
            {...register("email")}
          />
          {errors.email ? (
            <p id="forgot-email-error" className="field-error">
              {errors.email.message}
            </p>
          ) : null}
        </div>

        {errors.root?.message ? (
          <div role="alert" className="alert-error">
            {errors.root.message}
          </div>
        ) : null}

        <button type="submit" className="button-primary w-full" disabled={isSubmitting}>
          {isSubmitting ? "Sending…" : "Send reset link"}
        </button>
      </form>

      <p className="mt-6 border-t border-line pt-5 text-sm text-muted">
        Remembered it?{" "}
        <Link href="/login" className="font-bold text-cobalt">
          Log in
        </Link>
        .
      </p>
    </div>
  );
}
