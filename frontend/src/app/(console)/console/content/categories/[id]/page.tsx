import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ConsoleCategoryForm } from "@/components/console/console-category-form";
import { ApiError } from "@/lib/api/errors";
import { getConsoleCategory, getCurrentUser } from "@/lib/api/server";
import { canEditConsoleContent, canManageConsole } from "@/lib/console";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: "Edit category",
  description: "Update a catalog category.",
  path: "/console/content/categories",
  noIndex: true,
});

export default async function EditConsoleCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const categoryId = Number(id);
  if (!Number.isInteger(categoryId)) {
    notFound();
  }

  let session;
  let category;
  try {
    [session, category] = await Promise.all([getCurrentUser(), getConsoleCategory(categoryId)]);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      redirect(`/login?next=/console/content/categories/${categoryId}`);
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
    <section aria-labelledby="edit-category-title" className="max-w-3xl">
      <Link href="/console/content" className="font-mono text-xs text-cobalt underline underline-offset-4">
        Back to content
      </Link>
      <div className="mt-6 border-l-4 border-coral pl-5">
        <p className="eyebrow">Edit record</p>
        <h1 id="edit-category-title" className="display-title mt-3 text-4xl">
          {category.name}
        </h1>
        <p className="mt-3 font-mono text-xs text-muted">/{category.slug}</p>
      </div>
      <ConsoleCategoryForm
        category={category}
        canPublish={canManageConsole(session.user.role)}
      />
    </section>
  );
}
