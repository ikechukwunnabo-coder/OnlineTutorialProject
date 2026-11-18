"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { changePassword } from "@/lib/api/browser";
import { ApiError, fieldErrors } from "@/lib/api/errors";

const passwordSchema = z
  .object({
    current_password: z.string().min(1, "Enter your current password."),
    new_password: z.string().min(12, "Use at least 12 characters."),
    confirm_password: z.string().min(1, "Confirm your new password."),
  })
  .refine((values) => values.new_password === values.confirm_password, {
    path: ["confirm_password"],
    message: "Passwords do not match.",
  });

type PasswordValues = z.infer<typeof passwordSchema>;

export function PasswordChangeForm() {
  const [message, setMessage] = useState("");
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      current_password: "",
      new_password: "",
      confirm_password: "",
    },
  });

  async function onSubmit(values: PasswordValues) {
    setMessage("");
    try {
      const response = await changePassword({
        current_password: values.current_password,
        new_password: values.new_password,
      });
      reset();
      setMessage(response.message);
    } catch (error) {
      const fields = fieldErrors(error);
      let mapped = false;

      for (const [field, fieldMessage] of Object.entries(fields)) {
        if (field === "current_password" || field === "new_password") {
          setError(field, { message: fieldMessage });
          mapped = true;
        }
      }

      if (!mapped) {
        setError("root", {
          message:
            error instanceof ApiError
              ? error.message
              : "We could not change your password. Please try again.",
        });
      }
    }
  }

  return (
    <div className="border-2 border-ink bg-paper p-6">
      <p className="eyebrow">Security</p>
      <h2 className="display-title mt-2 text-2xl">Change password</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Use at least 12 characters. You will stay signed in on this device.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-5 space-y-4">
        <div>
          <label htmlFor="current-password" className="field-label">
            Current password
          </label>
          <input
            id="current-password"
            type="password"
            autoComplete="current-password"
            className="field-input"
            aria-invalid={Boolean(errors.current_password)}
            aria-describedby={errors.current_password ? "current-password-error" : undefined}
            {...register("current_password")}
          />
          {errors.current_password ? (
            <p id="current-password-error" className="field-error">
              {errors.current_password.message}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="new-password" className="field-label">
            New password
          </label>
          <input
            id="new-password"
            type="password"
            autoComplete="new-password"
            className="field-input"
            aria-invalid={Boolean(errors.new_password)}
            aria-describedby={errors.new_password ? "new-password-error" : undefined}
            {...register("new_password")}
          />
          {errors.new_password ? (
            <p id="new-password-error" className="field-error">
              {errors.new_password.message}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="confirm-new-password" className="field-label">
            Confirm new password
          </label>
          <input
            id="confirm-new-password"
            type="password"
            autoComplete="new-password"
            className="field-input"
            aria-invalid={Boolean(errors.confirm_password)}
            aria-describedby={errors.confirm_password ? "confirm-new-password-error" : undefined}
            {...register("confirm_password")}
          />
          {errors.confirm_password ? (
            <p id="confirm-new-password-error" className="field-error">
              {errors.confirm_password.message}
            </p>
          ) : null}
        </div>

        {errors.root?.message ? (
          <div role="alert" className="alert-error">
            {errors.root.message}
          </div>
        ) : null}

        {message ? (
          <div role="status" className="alert-success">
            {message}
          </div>
        ) : null}

        <button type="submit" className="button-secondary w-full" disabled={isSubmitting}>
          {isSubmitting ? "Updating…" : "Update password"}
        </button>
      </form>
    </div>
  );
}
