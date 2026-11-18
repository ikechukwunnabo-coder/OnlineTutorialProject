"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { register as registerAccount } from "@/lib/api/browser";
import { ApiError, fieldErrors } from "@/lib/api/errors";

const registerSchema = z
  .object({
    display_name: z
      .string()
      .trim()
      .min(1, "Tell us what to call you.")
      .max(80, "Keep your name under 80 characters."),
    email: z.string().trim().email("Enter a valid email address.").max(254),
    password: z.string().min(12, "Use at least 12 characters."),
    confirm_password: z.string().min(1, "Confirm your password."),
  })
  .refine((values) => values.password === values.confirm_password, {
    path: ["confirm_password"],
    message: "Passwords do not match.",
  });

type RegisterValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const [sentMessage, setSentMessage] = useState("");
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      display_name: "",
      email: "",
      password: "",
      confirm_password: "",
    },
  });

  async function onSubmit(values: RegisterValues) {
    try {
      const response = await registerAccount({
        display_name: values.display_name,
        email: values.email,
        password: values.password,
      });
      setSentMessage(response.message);
    } catch (error) {
      const fields = fieldErrors(error);
      let mapped = false;

      for (const [field, message] of Object.entries(fields)) {
        if (field === "display_name" || field === "email" || field === "password") {
          setError(field, { message });
          mapped = true;
        }
      }

      if (!mapped) {
        setError("root", {
          message:
            error instanceof ApiError
              ? error.message
              : "We could not create your account. Please try again.",
        });
      }
    }
  }

  if (sentMessage) {
    return (
      <div className="border-2 border-ink bg-paper-raised p-6 shadow-[7px_7px_0_0_var(--ink)] sm:p-8">
        <p className="eyebrow">One more step</p>
        <h1 className="display-title mt-3 text-4xl sm:text-5xl">Check your email.</h1>
        <div role="status" className="alert-success mt-6">
          {sentMessage}
        </div>
        <p className="mt-6 text-sm leading-relaxed text-muted">
          The link expires in 24 hours. If it does not arrive, check your spam folder or request a
          new link from the verification page.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/verify-email" className="button-primary text-sm">
            Verification help
          </Link>
          <Link href="/login" className="button-secondary text-sm">
            Back to log in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="border-2 border-ink bg-paper-raised p-6 shadow-[7px_7px_0_0_var(--ink)] sm:p-8">
      <p className="eyebrow">Start here</p>
      <h1 className="display-title mt-3 text-4xl sm:text-5xl">Create an account.</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Save bookmarks, track progress, and keep your place across devices.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-7 space-y-5">
        <div>
          <label htmlFor="register-name" className="field-label">
            Display name
          </label>
          <input
            id="register-name"
            type="text"
            autoComplete="nickname"
            className="field-input"
            aria-invalid={Boolean(errors.display_name)}
            aria-describedby={errors.display_name ? "register-name-error" : undefined}
            {...register("display_name")}
          />
          {errors.display_name ? (
            <p id="register-name-error" className="field-error">
              {errors.display_name.message}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="register-email" className="field-label">
            Email address
          </label>
          <input
            id="register-email"
            type="email"
            autoComplete="email"
            className="field-input"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "register-email-error" : undefined}
            {...register("email")}
          />
          {errors.email ? (
            <p id="register-email-error" className="field-error">
              {errors.email.message}
            </p>
          ) : null}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="register-password" className="field-label">
              Password
            </label>
            <input
              id="register-password"
              type="password"
              autoComplete="new-password"
              className="field-input"
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? "register-password-error" : "register-password-hint"}
              {...register("password")}
            />
            <p id="register-password-hint" className="mt-1.5 text-xs text-muted">
              At least 12 characters.
            </p>
            {errors.password ? (
              <p id="register-password-error" className="field-error">
                {errors.password.message}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="register-confirm" className="field-label">
              Confirm password
            </label>
            <input
              id="register-confirm"
              type="password"
              autoComplete="new-password"
              className="field-input"
              aria-invalid={Boolean(errors.confirm_password)}
              aria-describedby={errors.confirm_password ? "register-confirm-error" : undefined}
              {...register("confirm_password")}
            />
            {errors.confirm_password ? (
              <p id="register-confirm-error" className="field-error">
                {errors.confirm_password.message}
              </p>
            ) : null}
          </div>
        </div>

        {errors.root?.message ? (
          <div role="alert" className="alert-error">
            {errors.root.message}
          </div>
        ) : null}

        <button type="submit" className="button-primary w-full" disabled={isSubmitting}>
          {isSubmitting ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-6 border-t border-line pt-5 text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-bold text-cobalt">
          Log in
        </Link>
        .
      </p>
    </div>
  );
}
