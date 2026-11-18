"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { submitContact } from "@/lib/api/browser";
import { ApiError, fieldErrors } from "@/lib/api/errors";

export const contactSchema = z.object({
  name: z.string().trim().min(1, "Tell us your name.").max(100, "Keep your name under 100 characters."),
  email: z
    .string()
    .trim()
    .email("Enter a valid email address.")
    .max(254, "Keep your email under 254 characters."),
  subject: z
    .string()
    .trim()
    .min(1, "Add a short subject.")
    .max(160, "Keep the subject under 160 characters."),
  message: z
    .string()
    .trim()
    .min(10, "Add at least 10 characters so we can help.")
    .max(5000, "Keep your message under 5,000 characters."),
  website: z.string().max(200).optional(),
});

export type ContactValues = z.infer<typeof contactSchema>;

type Status = "idle" | "success" | "error";

export function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [serverMessage, setServerMessage] = useState("");
  const statusRef = useRef<HTMLDivElement>(null);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
      website: "",
    },
  });

  useEffect(() => {
    if (status !== "idle") {
      statusRef.current?.focus();
    }
  }, [status]);

  async function onSubmit(values: ContactValues) {
    setStatus("idle");
    setServerMessage("");

    try {
      const response = await submitContact(values);
      setStatus("success");
      setServerMessage(response.message);
      reset();
    } catch (error) {
      setStatus("error");
      setServerMessage(
        error instanceof ApiError
          ? error.message
          : "Something went wrong. Please try again in a moment.",
      );

      const errorsByField = fieldErrors(error);
      for (const [field, message] of Object.entries(errorsByField)) {
        if (field in values) {
          setError(field as keyof ContactValues, { message });
        }
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className="field-label">
            Your name
          </label>
          <input
            id="contact-name"
            type="text"
            autoComplete="name"
            className="field-input"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "contact-name-error" : undefined}
            {...register("name")}
          />
          {errors.name ? (
            <p id="contact-name-error" className="field-error">
              {errors.name.message}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="contact-email" className="field-label">
            Email address
          </label>
          <input
            id="contact-email"
            type="email"
            autoComplete="email"
            className="field-input"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "contact-email-error" : undefined}
            {...register("email")}
          />
          {errors.email ? (
            <p id="contact-email-error" className="field-error">
              {errors.email.message}
            </p>
          ) : null}
        </div>
      </div>

      <div>
        <label htmlFor="contact-subject" className="field-label">
          Subject
        </label>
        <input
          id="contact-subject"
          type="text"
          className="field-input"
          aria-invalid={Boolean(errors.subject)}
          aria-describedby={errors.subject ? "contact-subject-error" : undefined}
          {...register("subject")}
        />
        {errors.subject ? (
          <p id="contact-subject-error" className="field-error">
            {errors.subject.message}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="contact-message" className="field-label">
          What can we help with?
        </label>
        <textarea
          id="contact-message"
          rows={7}
          className="field-input resize-y"
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? "contact-message-error" : "contact-message-hint"}
          {...register("message")}
        />
        <p id="contact-message-hint" className="mt-1.5 text-xs text-muted">
          Include the tutorial or chapter name if your question is about a lesson.
        </p>
        {errors.message ? (
          <p id="contact-message-error" className="field-error">
            {errors.message.message}
          </p>
        ) : null}
      </div>

      <div className="hidden" aria-hidden="true">
        <label htmlFor="contact-website">Website</label>
        <input id="contact-website" type="text" tabIndex={-1} autoComplete="off" {...register("website")} />
      </div>

      {status !== "idle" ? (
        <div
          ref={statusRef}
          tabIndex={-1}
          role={status === "error" ? "alert" : "status"}
          className={status === "error" ? "alert-error" : "alert-success"}
        >
          {serverMessage}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" className="button-primary" disabled={isSubmitting}>
          {isSubmitting ? "Sending…" : "Send message"}
        </button>
        <p className="text-xs text-muted">We usually reply within two working days.</p>
      </div>
    </form>
  );
}
