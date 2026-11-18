import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { EmptyState } from "@/components/empty-state";
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
  ConsolePublicationStatus,
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

const statusStyles: Record<ConsolePublicationStatus, string> = {
  published: "border-line-strong bg-mint text-ink",
  draft: "border-line-strong bg-lime text-ink",
  archived: "border-line-strong bg-paper text-muted",
};

function StatusChip({ status }: { status: ConsolePublicationStatus }) {
  return (
    <span className={`inline-flex border px-2 py-0.5 font-mono text-[0.65rem] ${statusStyles[status]}`}>
      {status}
    </span>
  );
}

function SectionHeader({
  id,
  title,
  description,
  href,
  canEdit,
}: {
  id: string;
  title: string;
  description: string;
  href: string;
  canEdit: boolean;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 id={id} className="font-display text-2xl font-bold">{title}</h2>
        <p className="mt-1 text-sm text-muted">{description}</p>
      </div>
      {canEdit ? (
        <Link href={href} className="button-secondary">
          Add new
        </Link>
      ) : null}
    </div>
  );
}

function ContentTable({
  rows,
  canEdit,
  kind,
}: {
  rows: { id: number; title: string; meta: string; status: ConsolePublicationStatus; updated: string }[];
  canEdit: boolean;
  kind: "categories" | "tutorials" | "chapters";
}) {
  if (rows.length === 0) {
    return (
      <div className="mt-4">
        <EmptyState
          title="Nothing here yet"
          description="Records will appear here once the team starts drafting."
          action={<span className="font-mono text-xs text-muted">Awaiting first record</span>}
        />
      </div>
    );
  }

  return (
    <div className="mt-4 overflow-x-auto border border-line-strong bg-paper-raised">
      <table className="w-full min-w-[620px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-line-strong bg-ink text-paper">
            <th scope="col" className="px-4 py-3 font-mono text-xs font-medium">Record</th>
            <th scope="col" className="px-4 py-3 font-mono text-xs font-medium">Detail</th>
            <th scope="col" className="px-4 py-3 font-mono text-xs font-medium">State</th>
            <th scope="col" className="px-4 py-3 font-mono text-xs font-medium">Updated</th>
            {canEdit ? <th scope="col" className="px-4 py-3 font-mono text-xs font-medium">Edit</th> : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${kind}-${row.id}`} className="border-b border-line last:border-b-0">
              <td className="px-4 py-3 font-bold">{row.title}</td>
              <td className="px-4 py-3 font-mono text-xs text-muted">{row.meta}</td>
              <td className="px-4 py-3"><StatusChip status={row.status} /></td>
              <td className="px-4 py-3 font-mono text-xs text-muted">{formatDateTime(row.updated)}</td>
              {canEdit ? (
                <td className="px-4 py-3">
                  <Link href={`/console/content/${kind}/${row.id}`} className="text-cobalt underline decoration-cobalt/40 underline-offset-4">
                    Edit
                  </Link>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

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
      updated: category.updated_at,
    })),
    tutorials: tutorials.map((tutorial) => ({
      id: tutorial.id,
      title: tutorial.title,
      meta: `${tutorial.category.name} · ${tutorial.difficulty} · ${tutorial.estimated_reading_time} min`,
      status: tutorial.status,
      updated: tutorial.updated_at,
    })),
    chapters: chapters.map((chapter) => ({
      id: chapter.id,
      title: chapter.title,
      meta: `${chapter.tutorial.title} · order ${chapter.order}`,
      status: chapter.status,
      updated: chapter.updated_at,
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
    <section aria-labelledby="console-content-title">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line-strong pb-6">
        <div>
          <p className="eyebrow">Content desk</p>
          <h1 id="console-content-title" className="display-title mt-3 text-4xl sm:text-5xl">
            The catalog, in one place.
          </h1>
          <p className="mt-3 max-w-2xl text-muted">
            Draft lessons, arrange chapters, and move records into publication. Changes appear on
            the live site after the cache refreshes.
          </p>
        </div>
        <p className="font-mono text-xs text-muted">
          {categories.length} categories · {tutorials.length} tutorials · {chapters.length} chapters
        </p>
      </div>

      <div className="mt-12 space-y-12">
        <section aria-labelledby="console-categories-title">
          <SectionHeader
            id="console-categories-title"
            title="Categories"
            description="The top shelves readers browse first."
            href="/console/content/categories/new"
            canEdit={canEdit}
          />
          <ContentTable rows={rows.categories} canEdit={canEdit} kind="categories" />
        </section>

        <section aria-labelledby="console-tutorials-title">
          <SectionHeader
            id="console-tutorials-title"
            title="Tutorials"
            description="Each tutorial groups a sequence of chapters."
            href="/console/content/tutorials/new"
            canEdit={canEdit}
          />
          <ContentTable rows={rows.tutorials} canEdit={canEdit} kind="tutorials" />
        </section>

        <section aria-labelledby="console-chapters-title">
          <SectionHeader
            id="console-chapters-title"
            title="Chapters"
            description="The lessons readers actually work through."
            href="/console/content/chapters/new"
            canEdit={canEdit}
          />
          <ContentTable rows={rows.chapters} canEdit={canEdit} kind="chapters" />
        </section>
      </div>
    </section>
  );
}
