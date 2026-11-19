import Link from "next/link";

import { CategoryCard } from "@/components/category-card";
import { EmptyState } from "@/components/empty-state";
import { JsonLd } from "@/components/json-ld";
import { PageHeader } from "@/components/ui/page-header";
import { SectionHeading } from "@/components/ui/section-heading";
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
      <PageHeader
        eyebrow="Browse by subject"
        title="Find the corner of code that fits."
        description="Categories group tutorials by the kind of thing you want to build or understand. Start with one path, then follow it as far as you like."
        meta={
          <p className="meta-text text-muted">
            {categories ? formatCount(categories.length, "category", "categories") : "Catalog loading"}
          </p>
        }
        actions={
          <>
            <Link href="/tutorials" className="button-primary">
              Browse all tutorials
            </Link>
            <Link href="/search" className="button-ghost">
              Search the library
            </Link>
          </>
        }
      />

      <section className="container-page py-14 lg:py-18">
        <SectionHeading
          eyebrow="Learning paths"
          title="Start with one subject."
          description="Each path groups its tutorials in a practical order, from first steps to working examples."
        />

        <div className="mt-8">
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
        </div>
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
