import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ConsoleTutorialForm } from "@/components/console/console-tutorial-form";
import { ApiError } from "@/lib/api/errors";
import { getConsoleCategories, getConsoleTutorial, getCurrentUser } from "@/lib/api/server";
import { canEditConsoleContent, canManageConsole } from "@/lib/console";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: "Edit tutorial",
  description: "Update a tutorial.",
  path: "/console/content/tutorials",
  noIndex: true,
});

export default async function EditConsoleTutorialPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tutorialId = Number(id);
  if (!Number.isInteger(tutorialId)) {
    notFound();
  }

  let session;
  let tutorial;
  let categories;
  try {
    [session, tutorial, categories] = await Promise.all([
      getCurrentUser(),
      getConsoleTutorial(tutorialId),
      getConsoleCategories(),
    ]);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      redirect(`/login?next=/console/content/tutorials/${tutorialId}`);
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
    <section aria-labelledby="edit-tutorial-title" className="max-w-3xl">
      <Link href="/console/content" className="font-mono text-xs text-cobalt underline underline-offset-4">
        Back to content
      </Link>
      <div className="mt-6 border-l-4 border-coral pl-5">
        <p className="eyebrow">Edit record</p>
        <h1 id="edit-tutorial-title" className="display-title mt-3 text-4xl">
          {tutorial.title}
        </h1>
        <p className="mt-3 font-mono text-xs text-muted">
          /{tutorial.slug} · {tutorial.estimated_reading_time} min read
        </p>
        <Link href={`/console/content/chapters/new?tutorial=${tutorial.id}`} className="button-secondary mt-5">
          Add chapter
        </Link>
      </div>
      <ConsoleTutorialForm
        tutorial={tutorial}
        categories={categories}
        canPublish={canManageConsole(session.user.role)}
      />
    </section>
  );
}
