import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ConsoleTutorialForm } from "@/components/console/console-tutorial-form";
import { ApiError } from "@/lib/api/errors";
import { getConsoleCategories, getCurrentUser } from "@/lib/api/server";
import { canEditConsoleContent, canManageConsole } from "@/lib/console";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: "New tutorial",
  description: "Add a tutorial to the catalog.",
  path: "/console/content/tutorials/new",
  noIndex: true,
});

export default async function NewConsoleTutorialPage() {
  let session;
  let categories;
  try {
    [session, categories] = await Promise.all([getCurrentUser(), getConsoleCategories()]);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      redirect("/login?next=/console/content/tutorials/new");
    }
    throw error;
  }

  if (!session.user || !canEditConsoleContent(session.user.role)) {
    redirect("/console/content");
  }

  return (
    <section aria-labelledby="new-tutorial-title" className="max-w-3xl">
      <Link href="/console/content" className="meta-text text-cobalt underline underline-offset-4">
        Back to content
      </Link>
      <div className="mt-6 border-l-4 border-coral pl-5">
        <p className="eyebrow">New record</p>
        <h1 id="new-tutorial-title" className="display-title mt-3 text-4xl">
          Draft a tutorial.
        </h1>
        <p className="mt-3 text-muted">Add chapters next, then publish when the lesson is ready.</p>
      </div>
      <ConsoleTutorialForm
        categories={categories}
        canPublish={canManageConsole(session.user.role)}
      />
    </section>
  );
}
