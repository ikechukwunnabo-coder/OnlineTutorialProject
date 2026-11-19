"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { ConsoleDeleteButton } from "@/components/console/console-delete-button";
import { Notice } from "@/components/ui/notice";
import { createConsoleCategory, updateConsoleCategory } from "@/lib/api/browser";
import { ApiError, fieldErrors } from "@/lib/api/errors";
import type { ConsoleCategory, ConsoleCategoryInput } from "@/lib/api/types";

const categorySchema = z.object({
  name: z.string().trim().min(1, "Give the category a name.").max(100),
  slug: z.string().trim().max(120, "Keep the slug under 120 characters.").optional(),
  description: z.string().max(2000).optional(),
  icon: z.enum(["code", "terminal", "database", "tools", "globe", "chart"]),
  display_order: z.number().int().min(0, "Use zero or more."),
  status: z.enum(["draft", "published", "archived"]),
  is_demo: z.boolean(),
});

type CategoryValues = z.infer<typeof categorySchema>;

const icons = ["code", "terminal", "database", "tools", "globe", "chart"] as const;

export function ConsoleCategoryForm({
  category,
  canPublish,
}: {
  category?: ConsoleCategory;
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
  } = useForm<CategoryValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name ?? "",
      slug: category?.slug ?? "",
      description: category?.description ?? "",
      icon: (icons.includes(category?.icon as (typeof icons)[number])
        ? category?.icon
        : "code") as CategoryValues["icon"],
      display_order: category?.display_order ?? 0,
      status: (category?.status ?? "draft") as CategoryValues["status"],
      is_demo: category?.is_demo ?? false,
    },
  });

  async function onSubmit(values: CategoryValues) {
    setStatus("");
    setFormError("");
    const input: ConsoleCategoryInput = {
      name: values.name,
      slug: values.slug || undefined,
      description: values.description,
      icon: values.icon,
      display_order: values.display_order,
      ...(canPublish ? { status: values.status, is_demo: values.is_demo } : {}),
    };

    try {
      if (category) {
        await updateConsoleCategory(category.id, input);
        setStatus("Category saved.");
      } else {
        await createConsoleCategory(input);
        setStatus("Category created.");
      }
      router.push("/console/content");
      router.refresh();
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "The category could not be saved.";
      setFormError(message);
      for (const [field, message] of Object.entries(fieldErrors(error))) {
        if (field in values) {
          setError(field as keyof CategoryValues, { message });
        }
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8 space-y-8">
      {formError ? (
        <div>
          <Notice tone="error" role="alert" title="This category was not saved">
            {formError}
          </Notice>
        </div>
      ) : null}

      <fieldset className="form-section border-t-0 pt-0">
        <legend className="font-display text-xl font-bold tracking-[-0.03em]">Basics</legend>
        <div className="form-grid mt-4">
          <div>
            <label htmlFor="category-name" className="field-label">
              Name <span className="field-required">*</span>
              <span className="sr-only"> required</span>
            </label>
            <input
              id="category-name"
              className="field-input"
              aria-invalid={errors.name ? true : undefined}
              aria-describedby={errors.name ? "category-name-error" : undefined}
              {...register("name")}
            />
            {errors.name ? (
              <p id="category-name-error" className="field-error">
                {errors.name.message}
              </p>
            ) : null}
          </div>
          <div>
            <label htmlFor="category-slug" className="field-label">
              Slug
            </label>
            <input
              id="category-slug"
              className="field-input"
              aria-invalid={errors.slug ? true : undefined}
              aria-describedby={errors.slug ? "category-slug-error" : undefined}
              {...register("slug")}
            />
            {errors.slug ? (
              <p id="category-slug-error" className="field-error">
                {errors.slug.message}
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-5">
          <label htmlFor="category-description" className="field-label">
            Description
          </label>
          <textarea
            id="category-description"
            rows={4}
            className="field-input"
            aria-invalid={errors.description ? true : undefined}
            aria-describedby={errors.description ? "category-description-error" : undefined}
            {...register("description")}
          />
          <p className="field-hint">Shown on category cards and category pages.</p>
          {errors.description ? (
            <p id="category-description-error" className="field-error">
              {errors.description.message}
            </p>
          ) : null}
        </div>
      </fieldset>

      <fieldset className="form-section">
        <legend className="font-display text-xl font-bold tracking-[-0.03em]">
          Display and publication
        </legend>
        <div className="form-grid mt-4">
          <div>
            <label htmlFor="category-icon" className="field-label">
              Icon
            </label>
            <select id="category-icon" className="field-input" {...register("icon")}>
              {icons.map((icon) => (
                <option key={icon} value={icon}>
                  {icon}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="category-order" className="field-label">
              Display order <span className="field-required">*</span>
              <span className="sr-only"> required</span>
            </label>
            <input
              id="category-order"
              type="number"
              min={0}
              className="field-input"
              aria-invalid={errors.display_order ? true : undefined}
              aria-describedby={errors.display_order ? "category-order-error" : undefined}
              {...register("display_order", { setValueAs: Number })}
            />
            {errors.display_order ? (
              <p id="category-order-error" className="field-error">
                {errors.display_order.message}
              </p>
            ) : null}
          </div>
        </div>

        {canPublish ? (
          <div className="form-grid mt-5">
            <div>
              <label htmlFor="category-status" className="field-label">
                Publication state
              </label>
              <select id="category-status" className="field-input" {...register("status")}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <label className="flex items-center gap-3 self-end text-sm">
              <input type="checkbox" className="size-4 accent-coral" {...register("is_demo")} />
              Keep this category hidden from readers
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
          {isSubmitting ? "Saving…" : category ? "Save changes" : "Create category"}
        </button>
        {canPublish && category ? (
          <ConsoleDeleteButton kind="categories" id={category.id} name={category.name} />
        ) : null}
      </div>
    </form>
  );
}
