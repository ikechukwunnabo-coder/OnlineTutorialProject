import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ConsoleChapterForm } from "@/components/console/console-chapter-form";
import { ApiError } from "@/lib/api/errors";
import { getConsoleChapter, getConsoleTutorials, getCurrentUser } from "@/lib/api/server";
import { canEditConsoleContent, canManageConsole } from "@/lib/console";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: "Edit chapter",
  description: "Update a lesson chapter.",
  path: "/console/content/chapters",
  noIndex: true,
});

export default async function EditConsoleChapterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const chapterId = Number(id);
  if (!Number.isInteger(chapterId)) {
    notFound();
  }

  let session;
  let chapter;
  let tutorials;
  try {
    [session, chapter, tutorials] = await Promise.all([
      getCurrentUser(),
      getConsoleChapter(chapterId),
      getConsoleTutorials(),
    ]);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      redirect(`/login?next=/console/content/chapters/${chapterId}`);
    }
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  if (!session.user || !canEditConsoleContent(session.user.role)) {
    redirect("/console/content");
  }

  return (
    <section aria-labelledby="edit-chapter-title" className="max-w-3xl">
      <Link href="/console/content" className="meta-text text-cobalt underline underline-offset-4">
        Back to content
      </Link>
      <div className="mt-6 border-l-4 border-coral pl-5">
        <p className="eyebrow">Edit record</p>
        <h1 id="edit-chapter-title" className="display-title mt-3 text-4xl">
          {chapter.title}
        </h1>
        <p className="mt-3 meta-text text-muted">
          {chapter.tutorial.title} · order {chapter.order} · {chapter.estimated_reading_time} min
        </p>
      </div>
      <ConsoleChapterForm
        chapter={chapter}
        tutorials={tutorials}
        canPublish={canManageConsole(session.user.role)}
      />
    </section>
  );
}
