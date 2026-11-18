import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ConsoleChapterForm } from "@/components/console/console-chapter-form";
import { ApiError } from "@/lib/api/errors";
import { getConsoleTutorials, getCurrentUser } from "@/lib/api/server";
import { canEditConsoleContent, canManageConsole } from "@/lib/console";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: "New chapter",
  description: "Add a chapter to a tutorial.",
  path: "/console/content/chapters/new",
  noIndex: true,
});

export default async function NewConsoleChapterPage({
  searchParams,
}: {
  searchParams: Promise<{ tutorial?: string }>;
}) {
  const { tutorial: tutorialParam } = await searchParams;
  const initialTutorialId = tutorialParam ? Number(tutorialParam) : undefined;

  let session;
  let tutorials;
  try {
    [session, tutorials] = await Promise.all([getCurrentUser(), getConsoleTutorials()]);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      redirect("/login?next=/console/content/chapters/new");
    }
    throw error;
  }

  if (!session.user || !canEditConsoleContent(session.user.role)) {
    redirect("/console/content");
  }

  return (
    <section aria-labelledby="new-chapter-title" className="max-w-3xl">
      <Link href="/console/content" className="font-mono text-xs text-cobalt underline underline-offset-4">
        Back to content
      </Link>
      <div className="mt-6 border-l-4 border-coral pl-5">
        <p className="eyebrow">New record</p>
        <h1 id="new-chapter-title" className="display-title mt-3 text-4xl">
          Write a chapter.
        </h1>
        <p className="mt-3 text-muted">Markdown is stored as written and rendered for readers.</p>
      </div>
      <ConsoleChapterForm
        tutorials={tutorials}
        initialTutorialId={
          initialTutorialId && tutorials.some((tutorial) => tutorial.id === initialTutorialId)
            ? initialTutorialId
            : undefined
        }
        canPublish={canManageConsole(session.user.role)}
      />
    </section>
  );
}
