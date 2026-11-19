import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { EmptyState } from "@/components/empty-state";
import { Notice } from "@/components/ui/notice";
import { SectionHeading } from "@/components/ui/section-heading";
import { StatusBadge, type Status } from "@/components/ui/status-badge";
import { ApiError } from "@/lib/api/errors";
import { getConsoleOverview } from "@/lib/api/server";
import type { ConsoleContentItem, ConsoleStatusCount } from "@/lib/api/types";
import { canEditConsoleContent } from "@/lib/console";
import { formatDateTime } from "@/lib/format";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: "Operations overview",
  description: "Publishing status, recent content, and administrative activity.",
  path: "/console",
  noIndex: true,
});

function StatusLedger({ rows }: { rows: ConsoleStatusCount[] }) {
  const descriptions: Record<string, string> = {
    published: "Live in the catalog",
    draft: "Not visible to readers",
    archived: "Kept for reference only",
  };

  return (
    <section className="mt-10" aria-labelledby="publication-state">
      <SectionHeading
        eyebrow="Publication state"
        title="What readers can see"
        description="A quick count of records in each state before you publish."
        id="publication-state"
      />
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {rows.map((row) => (
          <div key={row.status} className="surface p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <StatusBadge status={row.status as Status} label={row.label} />
              <span className="font-display text-3xl font-bold tabular-nums">{row.count}</span>
            </div>
            <p className="mt-3 text-sm text-muted">{descriptions[row.status] ?? "—"}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function RecentContent({ items }: { items: ConsoleContentItem[] }) {
  if (items.length === 0) {
    return (
      <div className="mt-4">
        <EmptyState
          title="No content yet"
          description="Tutorials and chapters will appear here as soon as the team starts drafting."
          action={<span className="meta-text text-muted">Nothing to review</span>}
        />
      </div>
    );
  }

  return (
    <div className="table-shell mt-4">
      <table className="data-table">
        <caption className="sr-only">Recently touched content</caption>
        <thead>
          <tr>
            <th scope="col">Content</th>
            <th scope="col">Section</th>
            <th scope="col">State</th>
            <th scope="col">Updated</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={`${item.kind}-${item.slug}`}>
              <td className="font-bold">
                {item.title}
                <span className="meta-text mt-1 block text-muted">{item.kind}</span>
              </td>
              <td className="text-muted">{item.parent || "—"}</td>
              <td>
                <StatusBadge status={item.status as Status} />
              </td>
              <td className="meta-text text-muted">{formatDateTime(item.updated_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function ConsoleOverviewPage() {
  let overview;
  try {
    overview = await getConsoleOverview();
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      redirect("/login?next=/console");
    }
    throw error;
  }

  const canEdit = canEditConsoleContent(overview.role);
  const ledger = [
    { label: "Categories", value: overview.counts.categories },
    { label: "Tutorials", value: overview.counts.tutorials },
    { label: "Chapters", value: overview.counts.chapters },
    { label: "Accounts", value: overview.counts.users },
    { label: "Messages", value: overview.counts.contact_messages },
  ];

  return (
    <section aria-labelledby="console-overview-title">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
        <div>
          <p className="eyebrow">Operations desk</p>
          <h1 id="console-overview-title" className="display-title mt-3 text-4xl sm:text-5xl">
            Today at the desk.
          </h1>
          <p className="mt-3 max-w-2xl text-muted">
            A working view of the catalog, publication states, and who changed what.
          </p>
        </div>
        <p className="meta-text text-muted">Read {formatDateTime(overview.generated_at)} UTC</p>
      </div>

      {canEdit ? (
        <nav aria-label="Quick actions" className="mt-6 flex flex-wrap gap-3">
          <Link href="/console/content/tutorials/new" className="button-primary">
            Add tutorial
          </Link>
          <Link href="/console/content/chapters/new" className="button-secondary">
            Add chapter
          </Link>
          <Link href="/console/content" className="button-ghost">
            Review content
          </Link>
        </nav>
      ) : null}

      {overview.counts.demo_content > 0 || overview.counts.drafts > 0 ? (
        <div className="mt-6">
          <Notice tone="warning" title="Before launch">
            {overview.counts.demo_content} demo records and {overview.counts.drafts} drafts are in
            this workspace. Demo records stay hidden from readers.
          </Notice>
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {ledger.map((item) => (
          <div key={item.label} className="surface p-4 sm:px-5 sm:py-5">
            <p className="meta-text text-muted">{item.label}</p>
            <p className="mt-2 font-display text-4xl font-bold tabular-nums">{item.value}</p>
          </div>
        ))}
      </div>

      <StatusLedger rows={overview.content_by_status} />

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <section aria-labelledby="recent-content">
          <SectionHeading
            eyebrow="Catalog"
            title="Recently touched"
            description="The newest changes across tutorials and chapters."
            id="recent-content"
          />
          <RecentContent items={overview.recent_content} />
        </section>

        <section id="activity" aria-labelledby="recent-activity">
          <SectionHeading
            eyebrow="Audit"
            title="Activity trail"
            description="Every recorded change, newest first."
            id="recent-activity"
          />
          {overview.recent_activity.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                title="No activity recorded"
                description="Save or delete a record and the change will be listed here."
                action={<span className="meta-text text-muted">Awaiting first change</span>}
              />
            </div>
          ) : (
            <ol className="mt-5 border-l border-line-strong">
              {overview.recent_activity.map((entry) => (
                <li key={entry.id} className="relative pb-6 pl-5 last:pb-0">
                  <span className="absolute -left-[5px] top-2 size-2 bg-coral" aria-hidden="true" />
                  <p className="text-sm font-bold">
                    {entry.actor ?? "System"} {entry.action.replaceAll("_", " ")}
                  </p>
                  <p className="meta-text mt-1 text-muted">
                    {entry.model_label} · {entry.object_id || "—"}
                  </p>
                  <p className="meta-text mt-1 text-muted">
                    {formatDateTime(entry.created_at)} UTC
                  </p>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </section>
  );
}
