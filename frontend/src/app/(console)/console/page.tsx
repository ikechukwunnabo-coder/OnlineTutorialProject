import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { EmptyState } from "@/components/empty-state";
import { ApiError } from "@/lib/api/errors";
import { getConsoleOverview } from "@/lib/api/server";
import type { ConsoleContentItem, ConsoleStatusCount } from "@/lib/api/types";
import { formatDateTime } from "@/lib/format";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: "Operations overview",
  description: "Publishing status, recent content, and administrative activity.",
  path: "/console",
  noIndex: true,
});

const statusStyles: Record<string, string> = {
  published: "border-line-strong bg-mint text-ink",
  draft: "border-line-strong bg-lime text-ink",
  archived: "border-line-strong bg-paper text-muted",
};

function StatusChip({ status, label }: { status: string; label?: string }) {
  return (
    <span
      className={`inline-flex items-center border px-2 py-0.5 font-mono text-[0.65rem] ${
        statusStyles[status] ?? statusStyles.archived
      }`}
    >
      {label ?? status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function StatusLedger({ rows }: { rows: ConsoleStatusCount[] }) {
  return (
    <div className="mt-8" aria-labelledby="publication-state">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs text-cobalt">Publication state</p>
          <h2 id="publication-state" className="font-display text-2xl font-bold">
            What readers can see
          </h2>
        </div>
      </div>
      <div className="mt-4 grid gap-px border border-line-strong bg-line-strong sm:grid-cols-3">
        {rows.map((row) => (
          <div key={row.status} className="bg-paper-raised p-4">
            <div className="flex items-center justify-between gap-3">
              <StatusChip status={row.status} label={row.label} />
              <span className="font-display text-3xl font-bold tabular-nums">{row.count}</span>
            </div>
            <p className="mt-3 text-xs text-muted">
              {row.status === "published"
                ? "Live in the catalog"
                : row.status === "draft"
                  ? "Not visible to readers"
                  : "Kept for reference only"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecentContent({ items }: { items: ConsoleContentItem[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="No content yet"
        description="Tutorials and chapters will appear here as soon as the team starts drafting."
        action={<span className="font-mono text-xs text-muted">Nothing to review</span>}
      />
    );
  }

  return (
    <div className="mt-4 overflow-x-auto border border-line-strong bg-paper-raised">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-line-strong bg-ink text-paper">
            <th scope="col" className="px-4 py-3 font-mono text-xs font-medium">
              Content
            </th>
            <th scope="col" className="px-4 py-3 font-mono text-xs font-medium">
              Section
            </th>
            <th scope="col" className="px-4 py-3 font-mono text-xs font-medium">
              State
            </th>
            <th scope="col" className="px-4 py-3 font-mono text-xs font-medium">
              Updated
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={`${item.kind}-${item.slug}`} className="border-b border-line last:border-b-0">
              <td className="px-4 py-3 align-top">
                <p className="font-bold">{item.title}</p>
                <p className="mt-1 font-mono text-xs text-muted">{item.kind}</p>
              </td>
              <td className="px-4 py-3 align-top text-muted">{item.parent || "—"}</td>
              <td className="px-4 py-3 align-top">
                <StatusChip status={item.status} />
              </td>
              <td className="px-4 py-3 align-top font-mono text-xs text-muted">
                {formatDateTime(item.updated_at)}
              </td>
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

  const ledger = [
    { label: "Categories", value: overview.counts.categories },
    { label: "Tutorials", value: overview.counts.tutorials },
    { label: "Chapters", value: overview.counts.chapters },
    { label: "Accounts", value: overview.counts.users },
    { label: "Messages", value: overview.counts.contact_messages },
  ];

  return (
    <section aria-labelledby="console-overview-title">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line-strong pb-6">
        <div>
          <p className="eyebrow">Operations desk</p>
          <h1 id="console-overview-title" className="display-title mt-3 text-4xl sm:text-5xl">
            Today at the desk.
          </h1>
          <p className="mt-3 max-w-2xl text-muted">
            A working view of the catalog, publication states, and who changed what.
          </p>
        </div>
        <p className="font-mono text-xs text-muted">
          Read {formatDateTime(overview.generated_at)} UTC
        </p>
      </div>

      {overview.counts.demo_content > 0 || overview.counts.drafts > 0 ? (
        <div className="mt-6 border-l-4 border-coral bg-[#fff0ea] px-5 py-4">
          <p className="font-mono text-xs text-coral-text">Before launch</p>
          <p className="mt-1 text-sm">
            {overview.counts.demo_content} demo records and {overview.counts.drafts} drafts are in
            this workspace. Demo records stay hidden from readers.
          </p>
        </div>
      ) : null}

      <div className="mt-6 grid gap-px border border-line-strong bg-line-strong sm:grid-cols-2 lg:grid-cols-5">
        {ledger.map((item) => (
          <div key={item.label} className="bg-paper-raised px-4 py-5">
            <p className="font-mono text-xs text-muted">{item.label}</p>
            <p className="mt-2 font-display text-4xl font-bold tabular-nums">{item.value}</p>
          </div>
        ))}
      </div>

      <StatusLedger rows={overview.content_by_status} />

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <div aria-labelledby="recent-content">
          <p className="font-mono text-xs text-cobalt">Catalog</p>
          <h2 id="recent-content" className="font-display text-2xl font-bold">
            Recently touched
          </h2>
          <RecentContent items={overview.recent_content} />
        </div>

        <div id="activity" aria-labelledby="recent-activity">
          <p className="font-mono text-xs text-cobalt">Audit</p>
          <h2 id="recent-activity" className="font-display text-2xl font-bold">
            Activity trail
          </h2>
          {overview.recent_activity.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                title="No activity recorded"
                description="Save or delete a record and the change will be listed here."
                action={<span className="font-mono text-xs text-muted">Awaiting first change</span>}
              />
            </div>
          ) : (
            <ol className="mt-4 border-l border-line-strong">
              {overview.recent_activity.map((entry) => (
                <li key={entry.id} className="relative pb-6 pl-5 last:pb-0">
                  <span className="absolute -left-[5px] top-2 size-2 bg-coral" aria-hidden="true" />
                  <p className="text-sm font-bold">
                    {entry.actor ?? "System"} {entry.action.replaceAll("_", " ")}
                  </p>
                  <p className="mt-1 font-mono text-xs text-muted">
                    {entry.model_label} · {entry.object_id || "—"}
                  </p>
                  <p className="mt-1 font-mono text-xs text-muted">
                    {formatDateTime(entry.created_at)} UTC
                  </p>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </section>
  );
}
