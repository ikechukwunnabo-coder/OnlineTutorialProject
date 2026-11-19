import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ConsoleCategoryForm } from "@/components/console/console-category-form";
import { ApiError } from "@/lib/api/errors";
import { getCurrentUser } from "@/lib/api/server";
import { canEditConsoleContent, canManageConsole } from "@/lib/console";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: "New category",
  description: "Add a category to the catalog.",
  path: "/console/content/categories/new",
  noIndex: true,
});

export default async function NewConsoleCategoryPage() {
  let session;
  try {
    session = await getCurrentUser();
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      redirect("/login?next=/console/content/categories/new");
    }
    throw error;
  }

  if (!session.user || !canEditConsoleContent(session.user.role)) {
    redirect("/console/content");
  }

  return (
    <section aria-labelledby="new-category-title" className="max-w-3xl">
      <Link href="/console/content" className="meta-text text-cobalt underline underline-offset-4">
        Back to content
      </Link>
      <div className="mt-6 border-l-4 border-coral pl-5">
        <p className="eyebrow">New record</p>
        <h1 id="new-category-title" className="display-title mt-3 text-4xl">
          Create a category.
        </h1>
        <p className="mt-3 text-muted">Give readers a shelf to browse. You can publish it later.</p>
      </div>
      <ConsoleCategoryForm canPublish={canManageConsole(session.user.role)} />
    </section>
  );
}
