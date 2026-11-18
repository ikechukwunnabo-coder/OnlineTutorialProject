"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { ConsoleDeleteButton } from "@/components/console/console-delete-button";
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
      setStatus(error instanceof ApiError ? error.message : "The chapter could not be saved.");
      for (const [field, message] of Object.entries(fieldErrors(error))) {
        if (field in values) {
          setError(field as keyof ChapterValues, { message });
        }
      }
    }
  }

  if (tutorials.length === 0) {
    return (
      <div className="mt-8 border-l-4 border-coral bg-[#fff0ea] px-5 py-4">
        <p className="font-mono text-xs text-coral-text">No tutorials yet</p>
        <p className="mt-1 text-sm">Create a tutorial before adding chapters.</p>
        <Link href="/console/content/tutorials/new" className="button-primary mt-4">
          Create tutorial
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8 space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="chapter-title" className="field-label">
            Title
          </label>
          <input id="chapter-title" className="field-input" {...register("title")} />
          {errors.title ? <p className="field-error">{errors.title.message}</p> : null}
        </div>
        <div>
          <label htmlFor="chapter-slug" className="field-label">
            Slug
          </label>
          <input id="chapter-slug" className="field-input" {...register("slug")} />
          {errors.slug ? <p className="field-error">{errors.slug.message}</p> : null}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="chapter-tutorial" className="field-label">
            Tutorial
          </label>
          <select id="chapter-tutorial" className="field-input" {...register("tutorial", { setValueAs: Number })}>
            {tutorials.map((tutorial) => (
              <option key={tutorial.id} value={tutorial.id}>
                {tutorial.title}
              </option>
            ))}
          </select>
          {errors.tutorial ? <p className="field-error">{errors.tutorial.message}</p> : null}
        </div>
        <div>
          <label htmlFor="chapter-order" className="field-label">
            Chapter order
          </label>
          <input id="chapter-order" type="number" min={1} className="field-input" {...register("order", { setValueAs: Number })} />
          {errors.order ? <p className="field-error">{errors.order.message}</p> : null}
        </div>
      </div>

      <div>
        <label htmlFor="chapter-summary" className="field-label">
          Summary
        </label>
        <textarea id="chapter-summary" rows={2} className="field-input" {...register("summary")} />
        {errors.summary ? <p className="field-error">{errors.summary.message}</p> : null}
      </div>

      <div>
        <label htmlFor="chapter-content" className="field-label">
          Lesson content
        </label>
        <textarea id="chapter-content" rows={12} className="field-input resize-y font-mono text-sm" {...register("content")} />
        <p className="mt-1.5 text-xs text-muted">Markdown is supported. Reading time updates when you save.</p>
        {errors.content ? <p className="field-error">{errors.content.message}</p> : null}
      </div>

      {canPublish ? (
        <div className="grid gap-5 border-t border-line-strong pt-6 sm:grid-cols-2">
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
      ) : null}

      {status ? (
        <div role="status" className="alert-success">
          {status}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-4 border-t border-line-strong pt-6">
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
