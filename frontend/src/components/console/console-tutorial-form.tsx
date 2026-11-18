"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { ConsoleDeleteButton } from "@/components/console/console-delete-button";
import { createConsoleTutorial, updateConsoleTutorial } from "@/lib/api/browser";
import { ApiError, fieldErrors } from "@/lib/api/errors";
import type { ConsoleTutorial, ConsoleTutorialInput } from "@/lib/api/types";

const tutorialSchema = z.object({
  category: z.number().int().positive("Choose a category."),
  title: z.string().trim().min(1, "Give the tutorial a title.").max(160),
  slug: z.string().trim().max(160).optional(),
  summary: z.string().trim().min(1, "Add a short summary.").max(300),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  status: z.enum(["draft", "published", "archived"]),
  is_demo: z.boolean(),
});

type TutorialValues = z.infer<typeof tutorialSchema>;

export function ConsoleTutorialForm({
  tutorial,
  categories,
  canPublish,
}: {
  tutorial?: ConsoleTutorial;
  categories: { id: number; name: string; slug: string }[];
  canPublish: boolean;
}) {
  const router = useRouter();
  const [status, setStatus] = useState("");
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<TutorialValues>({
    resolver: zodResolver(tutorialSchema),
    defaultValues: {
      category: tutorial?.category.id ?? categories[0]?.id ?? 0,
      title: tutorial?.title ?? "",
      slug: tutorial?.slug ?? "",
      summary: tutorial?.summary ?? "",
      difficulty: (tutorial?.difficulty ?? "beginner") as TutorialValues["difficulty"],
      status: (tutorial?.status ?? "draft") as TutorialValues["status"],
      is_demo: tutorial?.is_demo ?? false,
    },
  });

  async function onSubmit(values: TutorialValues) {
    setStatus("");
    const input: ConsoleTutorialInput = {
      category: values.category,
      title: values.title,
      slug: values.slug || undefined,
      summary: values.summary,
      difficulty: values.difficulty,
      ...(canPublish ? { status: values.status, is_demo: values.is_demo } : {}),
    };

    try {
      if (tutorial) {
        await updateConsoleTutorial(tutorial.id, input);
        setStatus("Tutorial saved.");
      } else {
        await createConsoleTutorial(input);
        setStatus("Tutorial created.");
      }
      router.push("/console/content");
      router.refresh();
    } catch (error) {
      setStatus(error instanceof ApiError ? error.message : "The tutorial could not be saved.");
      for (const [field, message] of Object.entries(fieldErrors(error))) {
        if (field in values) {
          setError(field as keyof TutorialValues, { message });
        }
      }
    }
  }

  if (categories.length === 0) {
    return (
      <div className="mt-8 border-l-4 border-coral bg-[#fff0ea] px-5 py-4">
        <p className="font-mono text-xs text-coral-text">No categories yet</p>
        <p className="mt-1 text-sm">
          Create a category before drafting a tutorial.
        </p>
        <Link href="/console/content/categories/new" className="button-primary mt-4">
          Create category
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8 space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="tutorial-title" className="field-label">
            Title
          </label>
          <input id="tutorial-title" className="field-input" {...register("title")} />
          {errors.title ? <p className="field-error">{errors.title.message}</p> : null}
        </div>
        <div>
          <label htmlFor="tutorial-slug" className="field-label">
            Slug
          </label>
          <input id="tutorial-slug" className="field-input" {...register("slug")} />
          {errors.slug ? <p className="field-error">{errors.slug.message}</p> : null}
        </div>
      </div>

      <div>
        <label htmlFor="tutorial-summary" className="field-label">
          Summary
        </label>
        <textarea id="tutorial-summary" rows={3} className="field-input" {...register("summary")} />
        {errors.summary ? <p className="field-error">{errors.summary.message}</p> : null}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="tutorial-category" className="field-label">
            Category
          </label>
          <select id="tutorial-category" className="field-input" {...register("category", { setValueAs: Number })}>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {errors.category ? <p className="field-error">{errors.category.message}</p> : null}
        </div>
        <div>
          <label htmlFor="tutorial-difficulty" className="field-label">
            Difficulty
          </label>
          <select id="tutorial-difficulty" className="field-input" {...register("difficulty")}>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
      </div>

      {canPublish ? (
        <div className="grid gap-5 border-t border-line-strong pt-6 sm:grid-cols-2">
          <div>
            <label htmlFor="tutorial-status" className="field-label">
              Publication state
            </label>
            <select id="tutorial-status" className="field-input" {...register("status")}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <label className="flex items-center gap-3 self-end text-sm">
            <input type="checkbox" className="size-4 accent-coral" {...register("is_demo")} />
            Keep this tutorial hidden from readers
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
          {isSubmitting ? "Saving…" : tutorial ? "Save changes" : "Create tutorial"}
        </button>
        {canPublish && tutorial ? (
          <ConsoleDeleteButton kind="tutorials" id={tutorial.id} name={tutorial.title} />
        ) : null}
      </div>
    </form>
  );
}
