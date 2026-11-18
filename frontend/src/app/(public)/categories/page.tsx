import Link from "next/link";

import { CategoryCard } from "@/components/category-card";
import { EmptyState } from "@/components/empty-state";
import { JsonLd } from "@/components/json-ld";
import { getCategories } from "@/lib/api/client";
import { formatCount } from "@/lib/format";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

export const revalidate = 300;

export const metadata = pageMetadata({
  title: "Categories",
  description:
    "Browse programming categories: web development, Python, databases, and the tools that support them.",
  path: "/categories",
});

export default async function CategoriesPage() {
  const categories = await getCategories().catch(() => null);

  return (
    <>
      <section className="grid-paper border-b border-line">
        <div className="container-page py-14 lg:py-20">
          <p className="eyebrow">Browse by subject</p>
          <h1 className="display-title mt-4 max-w-3xl text-5xl sm:text-6xl">
            Find the corner of code that fits.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-muted">
            Categories group tutorials by the kind of thing you want to build or understand. Start
            with one path, then follow it as far as you like.
          </p>
          <p className="mt-4 font-mono text-xs text-muted">
            {categories ? formatCount(categories.length, "category", "categories") : "Catalog loading"}
          </p>
        </div>
      </section>

      <section className="container-page py-14 lg:py-18">
        {categories && categories.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category, index) => (
              <CategoryCard key={category.slug} category={category} index={index} />
            ))}
          </div>
        ) : categories ? (
          <EmptyState
            title="No categories published yet."
            description="Once the first tutorials are published, their categories will appear here."
          />
        ) : (
          <EmptyState
            title="The catalog is temporarily unavailable."
            description="We could not load categories right now. Please try again in a moment."
            action={
              <Link href="/categories" className="button-secondary text-sm">
                Try again
              </Link>
            }
          />
        )}
      </section>

      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Categories", path: "/categories" },
        ])}
      />
    </>
  );
}
