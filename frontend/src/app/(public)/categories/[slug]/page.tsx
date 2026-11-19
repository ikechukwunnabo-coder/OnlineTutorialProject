import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { CategoryIcon } from "@/components/category-icon";
import { EmptyState } from "@/components/empty-state";
import { JsonLd } from "@/components/json-ld";
import { LessonRow } from "@/components/lesson-row";
import { PageHeader } from "@/components/ui/page-header";
import { SectionHeading } from "@/components/ui/section-heading";
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
      <PageHeader
        eyebrow="Category path"
        title={
          <span className="flex flex-wrap items-center gap-4">
            <span className="grid size-14 place-items-center border-2 border-ink bg-mint">
              <CategoryIcon name={category.icon} className="size-7" />
            </span>
            {category.name}
          </span>
        }
        description={category.description}
        breadcrumbs={
          <Breadcrumbs
            items={[
              { name: "Home", path: "/" },
              { name: "Categories", path: "/categories" },
              { name: category.name, path: `/categories/${category.slug}` },
            ]}
          />
        }
        meta={
          <p className="meta-text text-muted">
            In this path · {formatCount(category.tutorials.length, "tutorial")}
          </p>
        }
        actions={
          <>
            <Link href="/tutorials" className="button-primary">
              Browse all tutorials
            </Link>
            <Link href="/categories" className="button-ghost">
              All categories
            </Link>
          </>
        }
      />

      <section className="container-page py-12 lg:py-16">
        <SectionHeading
          eyebrow="Tutorials"
          title="Start anywhere, in order."
          description="Each tutorial is a short sequence of chapters. Publication dates and reading times are shown so you can pick the right lesson for today."
          action={
            <Link href="/categories" className="link-arrow text-sm">
              All categories
            </Link>
          }
        />

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
                publishedAt={tutorial.published_at}
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
