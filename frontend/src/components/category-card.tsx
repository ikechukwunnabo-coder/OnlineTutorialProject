import Link from "next/link";

import type { Category } from "@/lib/api/types";
import { formatCount } from "@/lib/format";

import { CategoryIcon } from "./category-icon";

type CategoryCardData = Pick<Category, "name" | "slug" | "icon" | "description"> & {
  tutorial_count?: number;
};

export function CategoryCard({ category, index }: { category: CategoryCardData; index: number }) {
  return (
    <Link
      href={`/categories/${category.slug}`}
      className="card-index group flex h-full flex-col p-5 no-underline"
    >
      <div className="flex items-start justify-between gap-4">
        <span className="grid size-11 place-items-center border-2 border-ink bg-mint text-ink">
          <CategoryIcon name={category.icon} className="size-6" />
        </span>
        <span className="meta-text text-muted" aria-hidden="true">
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>
      <h3 className="mt-6 font-display text-2xl font-bold tracking-[-0.04em] text-ink group-hover:text-cobalt">
        {category.name}
      </h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{category.description}</p>
      <p className="mt-6 flex items-center justify-between border-t border-line pt-3 meta-text text-muted">
        {typeof category.tutorial_count === "number"
          ? formatCount(category.tutorial_count, "tutorial")
          : "Explore the path"}
        <span className="text-coral transition-transform group-hover:translate-x-1" aria-hidden="true">
          →
        </span>
      </p>
    </Link>
  );
}
