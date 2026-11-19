"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { ConsoleDeleteButton } from "@/components/console/console-delete-button";
import { Notice } from "@/components/ui/notice";
import { createConsoleChapter, updateConsoleChapter } from "@/lib/api/browser";
import { ApiError, fieldErrors } from "@/lib/api/errors";
import type { ConsoleChapter, ConsoleChapterInput } from "@/lib/api/types";

const chapterSchema = z.object({
  tutorial: z.number().int().positive("Choose a tutorial."),
  title: z.string().trim().min(1, "Give the chapter a title.").max(160),
  slug: z.string().trim().max(160).optional(),
  summary: z.string().max(300).optional(),
  content: z.string().max(50000).optional(),
  order: z.number().int().min(1, "Order starts at 1."),
  status: z.enum(["draft", "published", "archived"]),
  is_demo: z.boolean(),
});

type ChapterValues = z.infer<typeof chapterSchema>;

export function ConsoleChapterForm({
  chapter,
  tutorials,
  initialTutorialId,
  canPublish,
}: {
  chapter?: ConsoleChapter;
  tutorials: { id: number; title: string; slug: string }[];
  initialTutorialId?: number;
  canPublish: boolean;
}) {
  const router = useRouter();
  const [status, setStatus] = useState("");
  const [formError, setFormError] = useState("");
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ChapterValues>({
    resolver: zodResolver(chapterSchema),
    defaultValues: {
      tutorial: chapter?.tutorial.id ?? initialTutorialId ?? tutorials[0]?.id ?? 0,
      title: chapter?.title ?? "",
      slug: chapter?.slug ?? "",
      summary: chapter?.summary ?? "",
      content: chapter?.content ?? "",
      order: chapter?.order ?? 1,
      status: (chapter?.status ?? "draft") as ChapterValues["status"],
      is_demo: chapter?.is_demo ?? false,
    },
  });

  async function onSubmit(values: ChapterValues) {
    setStatus("");
    setFormError("");
    const input: ConsoleChapterInput = {
      tutorial: values.tutorial,
      title: values.title,
      slug: values.slug || undefined,
      summary: values.summary,
      content: values.content,
      order: values.order,
      ...(canPublish ? { status: values.status, is_demo: values.is_demo } : {}),
    };

    try {
      if (chapter) {
        await updateConsoleChapter(chapter.id, input);
        setStatus("Chapter saved.");
      } else {
        await createConsoleChapter(input);
        setStatus("Chapter created.");
      }
      router.push("/console/content");
      router.refresh();
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "The chapter could not be saved.";
      setFormError(message);
      for (const [field, message] of Object.entries(fieldErrors(error))) {
        if (field in values) {
          setError(field as keyof ChapterValues, { message });
        }
      }
    }
  }

  if (tutorials.length === 0) {
    return (
      <div className="mt-8">
        <Notice tone="warning" title="No tutorials yet" role="status">
          Create a tutorial before adding chapters.
          <Link href="/console/content/tutorials/new" className="button-primary mt-4">
            Create tutorial
          </Link>
        </Notice>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8 space-y-8">
      {formError ? (
        <div>
          <Notice tone="error" role="alert" title="This chapter was not saved">
            {formError}
          </Notice>
        </div>
      ) : null}

      <fieldset className="form-section border-t-0 pt-0">
        <legend className="font-display text-xl font-bold tracking-[-0.03em]">Basics</legend>
        <div className="form-grid mt-4">
          <div>
            <label htmlFor="chapter-title" className="field-label">
              Title <span className="field-required">*</span>
              <span className="sr-only"> required</span>
            </label>
            <input
              id="chapter-title"
              className="field-input"
              aria-invalid={errors.title ? true : undefined}
              aria-describedby={errors.title ? "chapter-title-error" : undefined}
              {...register("title")}
            />
            {errors.title ? (
              <p id="chapter-title-error" className="field-error">
                {errors.title.message}
              </p>
            ) : null}
          </div>
          <div>
            <label htmlFor="chapter-slug" className="field-label">
              Slug
            </label>
            <input
              id="chapter-slug"
              className="field-input"
              aria-invalid={errors.slug ? true : undefined}
              aria-describedby={errors.slug ? "chapter-slug-error" : undefined}
              {...register("slug")}
            />
            {errors.slug ? (
              <p id="chapter-slug-error" className="field-error">
                {errors.slug.message}
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-5">
          <label htmlFor="chapter-summary" className="field-label">
            Summary
          </label>
          <textarea
            id="chapter-summary"
            rows={2}
            className="field-input"
            aria-invalid={errors.summary ? true : undefined}
            aria-describedby={errors.summary ? "chapter-summary-error" : undefined}
            {...register("summary")}
          />
          <p className="field-hint">Used in chapter lists and page descriptions.</p>
          {errors.summary ? (
            <p id="chapter-summary-error" className="field-error">
              {errors.summary.message}
            </p>
          ) : null}
        </div>
      </fieldset>

      <fieldset className="form-section">
        <legend className="font-display text-xl font-bold tracking-[-0.03em]">
          Lesson structure
        </legend>
        <div className="form-grid mt-4">
          <div>
            <label htmlFor="chapter-tutorial" className="field-label">
              Tutorial <span className="field-required">*</span>
              <span className="sr-only"> required</span>
            </label>
            <select
              id="chapter-tutorial"
              className="field-input"
              aria-invalid={errors.tutorial ? true : undefined}
              aria-describedby={errors.tutorial ? "chapter-tutorial-error" : undefined}
              {...register("tutorial", { setValueAs: Number })}
            >
              {tutorials.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
            {errors.tutorial ? (
              <p id="chapter-tutorial-error" className="field-error">
                {errors.tutorial.message}
              </p>
            ) : null}
          </div>
          <div>
            <label htmlFor="chapter-order" className="field-label">
              Chapter order <span className="field-required">*</span>
              <span className="sr-only"> required</span>
            </label>
            <input
              id="chapter-order"
              type="number"
              min={1}
              className="field-input"
              aria-invalid={errors.order ? true : undefined}
              aria-describedby={errors.order ? "chapter-order-error" : undefined}
              {...register("order", { setValueAs: Number })}
            />
            {errors.order ? (
              <p id="chapter-order-error" className="field-error">
                {errors.order.message}
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-5">
          <label htmlFor="chapter-content" className="field-label">
            Lesson content
          </label>
          <textarea
            id="chapter-content"
            rows={12}
            className="field-input resize-y font-mono text-sm"
            aria-invalid={errors.content ? true : undefined}
            aria-describedby={errors.content ? "chapter-content-error" : "chapter-content-hint"}
            {...register("content")}
          />
          <p id="chapter-content-hint" className="field-hint">
            Markdown is supported. Reading time updates when you save.
          </p>
          {errors.content ? (
            <p id="chapter-content-error" className="field-error">
              {errors.content.message}
            </p>
          ) : null}
        </div>
      </fieldset>

      {canPublish ? (
        <fieldset className="form-section">
          <legend className="font-display text-xl font-bold tracking-[-0.03em]">
            Publication
          </legend>
          <div className="form-grid mt-4">
            <div>
              <label htmlFor="chapter-status" className="field-label">
                Publication state
              </label>
              <select id="chapter-status" className="field-input" {...register("status")}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <label className="flex items-center gap-3 self-end text-sm">
              <input type="checkbox" className="size-4 accent-coral" {...register("is_demo")} />
              Keep this chapter hidden from readers
            </label>
          </div>
        </fieldset>
      ) : null}

      {status ? (
        <Notice tone="success" role="status" title="Saved">
          {status}
        </Notice>
      ) : null}

      <div className="flex flex-wrap items-center gap-4 border-t border-line pt-6">
        <button type="submit" className="button-primary" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : chapter ? "Save changes" : "Create chapter"}
        </button>
        {canPublish && chapter ? (
          <ConsoleDeleteButton kind="chapters" id={chapter.id} name={chapter.title} />
        ) : null}
      </div>
    </form>
  );
}
