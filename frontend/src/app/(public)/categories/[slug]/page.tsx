import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { CategoryIcon } from "@/components/category-icon";
import { EmptyState } from "@/components/empty-state";
import { JsonLd } from "@/components/json-ld";
import { LessonRow } from "@/components/lesson-row";
import { getCategories, getCategory } from "@/lib/api/client";
import type { CategoryDetail } from "@/lib/api/types";
import { ApiError } from "@/lib/api/errors";
import { formatCount } from "@/lib/format";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

export const revalidate = 300;

export async function generateStaticParams() {
  const categories = await getCategories().catch(() => []);
  return categories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const category = await getCategory(slug);
    return pageMetadata({
      title: category.name,
      description: category.description,
      path: `/categories/${category.slug}`,
    });
  } catch {
    return pageMetadata({
      title: "Category",
      description: "Browse beginner-friendly programming tutorials by category.",
      path: `/categories/${slug}`,
    });
  }
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let category: CategoryDetail;
  try {
    category = await getCategory(slug);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  return (
    <>
      <section className="border-b border-line">
        <div className="container-page py-8 lg:py-12">
          <Breadcrumbs
            items={[
              { name: "Home", path: "/" },
              { name: "Categories", path: "/categories" },
              { name: category.name, path: `/categories/${category.slug}` },
            ]}
          />

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <div className="flex items-center gap-4">
                <span className="grid size-14 place-items-center border-2 border-ink bg-mint">
                  <CategoryIcon name={category.icon} className="size-7" />
                </span>
                <p className="font-mono text-xs text-cobalt">Category</p>
              </div>
              <h1 className="display-title mt-5 text-5xl sm:text-6xl">{category.name}</h1>
              <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">
                {category.description}
              </p>
            </div>

            <div className="border-2 border-ink bg-lime px-5 py-4 shadow-[4px_4px_0_0_var(--ink)]">
              <p className="font-mono text-xs text-[#35420a]">In this path</p>
              <p className="mt-1 font-display text-2xl font-bold tracking-[-0.04em]">
                {formatCount(category.tutorials.length, "tutorial")}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page py-12 lg:py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Tutorials</p>
            <h2 className="display-title mt-3 text-3xl sm:text-4xl">Start anywhere, in order.</h2>
          </div>
          <Link href="/categories" className="link-arrow text-sm">
            All categories
          </Link>
        </div>

        {category.tutorials.length > 0 ? (
          <div className="mt-7">
            {category.tutorials.map((tutorial, index) => (
              <LessonRow
                key={tutorial.slug}
                title={tutorial.title}
                slug={tutorial.slug}
                summary={tutorial.summary}
                categoryName={category.name}
                difficulty={tutorial.difficulty}
                readingTime={tutorial.estimated_reading_time}
                index={index}
              />
            ))}
          </div>
        ) : (
          <div className="mt-7">
            <EmptyState
              title="No tutorials in this category yet."
              description="This path is published, but its first tutorial is still being prepared."
              action={
                <Link href="/tutorials" className="button-secondary text-sm">
                  Browse other tutorials
                </Link>
              }
            />
          </div>
        )}
      </section>

      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Categories", path: "/categories" },
          { name: category.name, path: `/categories/${category.slug}` },
        ])}
      />
    </>
  );
}
