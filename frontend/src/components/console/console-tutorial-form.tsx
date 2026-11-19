"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { ConsoleDeleteButton } from "@/components/console/console-delete-button";
import { Notice } from "@/components/ui/notice";
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
  const [formError, setFormError] = useState("");
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
    setFormError("");
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
      const message =
        error instanceof ApiError ? error.message : "The tutorial could not be saved.";
      setFormError(message);
      for (const [field, message] of Object.entries(fieldErrors(error))) {
        if (field in values) {
          setError(field as keyof TutorialValues, { message });
        }
      }
    }
  }

  if (categories.length === 0) {
    return (
      <div className="mt-8">
        <Notice tone="warning" title="No categories yet" role="status">
          Create a category before drafting a tutorial.
          <Link href="/console/content/categories/new" className="button-primary mt-4">
            Create category
          </Link>
        </Notice>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8 space-y-8">
      {formError ? (
        <div>
          <Notice tone="error" role="alert" title="This tutorial was not saved">
            {formError}
          </Notice>
        </div>
      ) : null}

      <fieldset className="form-section border-t-0 pt-0">
        <legend className="font-display text-xl font-bold tracking-[-0.03em]">Basics</legend>
        <div className="form-grid mt-4">
          <div>
            <label htmlFor="tutorial-title" className="field-label">
              Title <span className="field-required">*</span>
              <span className="sr-only"> required</span>
            </label>
            <input
              id="tutorial-title"
              className="field-input"
              aria-invalid={errors.title ? true : undefined}
              aria-describedby={errors.title ? "tutorial-title-error" : undefined}
              {...register("title")}
            />
            {errors.title ? (
              <p id="tutorial-title-error" className="field-error">
                {errors.title.message}
              </p>
            ) : null}
          </div>
          <div>
            <label htmlFor="tutorial-slug" className="field-label">
              Slug
            </label>
            <input
              id="tutorial-slug"
              className="field-input"
              aria-invalid={errors.slug ? true : undefined}
              aria-describedby={errors.slug ? "tutorial-slug-error" : undefined}
              {...register("slug")}
            />
            {errors.slug ? (
              <p id="tutorial-slug-error" className="field-error">
                {errors.slug.message}
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-5">
          <label htmlFor="tutorial-summary" className="field-label">
            Summary <span className="field-required">*</span>
            <span className="sr-only"> required</span>
          </label>
          <textarea
            id="tutorial-summary"
            rows={3}
            className="field-input"
            aria-invalid={errors.summary ? true : undefined}
            aria-describedby={errors.summary ? "tutorial-summary-error" : undefined}
            {...register("summary")}
          />
          <p className="field-hint">This appears on cards and at the top of the tutorial page.</p>
          {errors.summary ? (
            <p id="tutorial-summary-error" className="field-error">
              {errors.summary.message}
            </p>
          ) : null}
        </div>
      </fieldset>

      <fieldset className="form-section">
        <legend className="font-display text-xl font-bold tracking-[-0.03em]">
          Placement and publication
        </legend>
        <div className="form-grid mt-4">
          <div>
            <label htmlFor="tutorial-category" className="field-label">
              Category <span className="field-required">*</span>
              <span className="sr-only"> required</span>
            </label>
            <select
              id="tutorial-category"
              className="field-input"
              aria-invalid={errors.category ? true : undefined}
              aria-describedby={errors.category ? "tutorial-category-error" : undefined}
              {...register("category", { setValueAs: Number })}
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {errors.category ? (
              <p id="tutorial-category-error" className="field-error">
                {errors.category.message}
              </p>
            ) : null}
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
          <div className="form-grid mt-5">
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
      </fieldset>

      {status ? (
        <Notice tone="success" role="status" title="Saved">
          {status}
        </Notice>
      ) : null}

      <div className="flex flex-wrap items-center gap-4 border-t border-line pt-6">
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
