"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { login } from "@/lib/api/browser";
import { ApiError, fieldErrors } from "@/lib/api/errors";

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

type LoginValues = z.infer<typeof loginSchema>;

export function LoginForm({ nextPath = "/profile" }: { nextPath?: string }) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginValues) {
    try {
      await login(values);
      window.dispatchEvent(new Event("bds:auth-changed"));
      router.push(nextPath);
      router.refresh();
    } catch (error) {
      const fields = fieldErrors(error);
      let mapped = false;

      for (const [field, message] of Object.entries(fields)) {
        if (field === "email" || field === "password") {
          setError(field, { message });
          mapped = true;
        }
      }

      if (!mapped) {
        setError("root", {
          message:
            error instanceof ApiError
              ? error.message
              : "We could not log you in. Please try again.",
        });
      }
    }
  }

  return (
    <div className="border-2 border-ink bg-paper-raised p-6 shadow-[7px_7px_0_0_var(--ink)] sm:p-8">
      <p className="eyebrow">Welcome back</p>
      <h1 className="display-title mt-3 text-4xl sm:text-5xl">Log in.</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Pick up where you left off. Your bookmarks and reading progress are waiting.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-7 space-y-5">
        <div>
          <label htmlFor="login-email" className="field-label">
            Email address
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            className="field-input"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "login-email-error" : undefined}
            {...register("email")}
          />
          {errors.email ? (
            <p id="login-email-error" className="field-error">
              {errors.email.message}
            </p>
          ) : null}
        </div>

        <div>
          <div className="flex items-center justify-between gap-4">
            <label htmlFor="login-password" className="field-label">
              Password
            </label>
            <Link href="/forgot-password" className="text-xs font-bold text-cobalt">
              Forgot password?
            </Link>
          </div>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            className="field-input"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "login-password-error" : undefined}
            {...register("password")}
          />
          {errors.password ? (
            <p id="login-password-error" className="field-error">
              {errors.password.message}
            </p>
          ) : null}
        </div>

        {errors.root?.message ? (
          <div role="alert" className="alert-error">
            {errors.root.message}
          </div>
        ) : null}

        <button type="submit" className="button-primary w-full" disabled={isSubmitting}>
          {isSubmitting ? "Logging in…" : "Log in"}
        </button>
      </form>

      <p className="mt-6 border-t border-line pt-5 text-sm text-muted">
        New here?{" "}
        <Link href="/register" className="font-bold text-cobalt">
          Create an account
        </Link>
        .
      </p>
    </div>
  );
}
