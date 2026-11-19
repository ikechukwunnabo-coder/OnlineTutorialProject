import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ConsoleDataTable } from "@/components/ui/console-data-table";
import { PageHeader } from "@/components/ui/page-header";
import { ApiError } from "@/lib/api/errors";
import {
  getConsoleCategories,
  getConsoleChapters,
  getCurrentUser,
  getConsoleTutorials,
} from "@/lib/api/server";
import type {
  ConsoleCategory,
  ConsoleChapter,
  ConsoleTutorial,
} from "@/lib/api/types";
import { canEditConsoleContent } from "@/lib/console";
import { formatDateTime } from "@/lib/format";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: "Content",
  description: "Manage categories, tutorials, and chapters.",
  path: "/console/content",
  noIndex: true,
});

function toRows(
  categories: ConsoleCategory[],
  tutorials: ConsoleTutorial[],
  chapters: ConsoleChapter[],
) {
  return {
    categories: categories.map((category) => ({
      id: category.id,
      title: category.name,
      meta: `/${category.slug} · order ${category.display_order}`,
      status: category.status,
      updated: formatDateTime(category.updated_at),
    })),
    tutorials: tutorials.map((tutorial) => ({
      id: tutorial.id,
      title: tutorial.title,
      meta: `${tutorial.category.name} · ${tutorial.difficulty} · ${tutorial.estimated_reading_time} min`,
      status: tutorial.status,
      updated: formatDateTime(tutorial.updated_at),
    })),
    chapters: chapters.map((chapter) => ({
      id: chapter.id,
      title: chapter.title,
      meta: `${chapter.tutorial.title} · order ${chapter.order}`,
      status: chapter.status,
      updated: formatDateTime(chapter.updated_at),
    })),
  };
}

export default async function ConsoleContentPage() {
  let categories: ConsoleCategory[];
  let tutorials: ConsoleTutorial[];
  let chapters: ConsoleChapter[];
  let session;

  try {
    [session, categories, tutorials, chapters] = await Promise.all([
      getCurrentUser(),
      getConsoleCategories(),
      getConsoleTutorials(),
      getConsoleChapters(),
    ]);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      redirect("/login?next=/console/content");
    }
    throw error;
  }

  const canEdit = canEditConsoleContent(session.user?.role);
  const rows = toRows(categories, tutorials, chapters);

  return (
    <>
      <PageHeader
        eyebrow="Content desk"
        title="The catalog, in one place."
        description="Draft lessons, arrange chapters, and move records into publication. Changes appear on the live site after the cache refreshes."
        meta={
          <p className="meta-text text-muted">
            {categories.length} categories · {tutorials.length} tutorials · {chapters.length}{" "}
            chapters
          </p>
        }
        actions={
          <>
            <Link href="/console" className="button-ghost">
              Back to overview
            </Link>
          </>
        }
      />

      <div className="mt-12 space-y-12">
        <ConsoleDataTable
          rows={rows.categories}
          kind="categories"
          canEdit={canEdit}
          title="Categories"
          description="The top shelves readers browse first."
        />
        <ConsoleDataTable
          rows={rows.tutorials}
          kind="tutorials"
          canEdit={canEdit}
          title="Tutorials"
          description="Each tutorial groups a sequence of chapters."
        />
        <ConsoleDataTable
          rows={rows.chapters}
          kind="chapters"
          canEdit={canEdit}
          title="Chapters"
          description="The lessons readers actually work through."
        />
      </div>
    </>
  );
}
