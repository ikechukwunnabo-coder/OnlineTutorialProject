"use client";

import { useId, useMemo, useState } from "react";
import Link from "next/link";

import { StatusBadge, type Status } from "@/components/ui/status-badge";

export interface ConsoleTableRow {
  id: number;
  title: string;
  meta: string;
  status: Status;
  updated: string;
}

const PAGE_SIZE = 8;

export function ConsoleDataTable({
  rows,
  kind,
  canEdit,
  title,
  description,
}: {
  rows: ConsoleTableRow[];
  kind: "categories" | "tutorials" | "chapters";
  canEdit: boolean;
  title: string;
  description: string;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<Status | "all">("all");
  const [page, setPage] = useState(1);
  const searchId = useId();
  const statusId = useId();

  const filteredRows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesQuery =
        needle.length === 0 ||
        row.title.toLowerCase().includes(needle) ||
        row.meta.toLowerCase().includes(needle);
      const matchesStatus = status === "all" || row.status === status;
      return matchesQuery && matchesStatus;
    });
  }, [query, rows, status]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visibleRows = filteredRows.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  return (
    <section className="mt-10" aria-labelledby={`${searchId}-title`}>
      <div className="section-heading">
        <div>
          <h2 id={`${searchId}-title`} className="font-display text-2xl font-bold">
            {title}
          </h2>
          <p className="mt-1 text-sm text-muted">{description}</p>
        </div>
        {canEdit ? (
          <Link href={`/console/content/${kind}/new`} className="button-secondary">
            Add {kind === "categories" ? "category" : kind === "tutorials" ? "tutorial" : "chapter"}
          </Link>
        ) : null}
      </div>

      <div className="table-toolbar mt-5">
        <div>
          <label htmlFor={searchId} className="field-label">
            Search {title.toLowerCase()}
          </label>
          <input
            id={searchId}
            type="search"
            className="field-input"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder="Search by title or detail"
          />
        </div>
        <div>
          <label htmlFor={statusId} className="field-label">
            Publication state
          </label>
          <select
            id={statusId}
            className="field-input"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as Status | "all");
              setPage(1);
            }}
          >
            <option value="all">All states</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      <p className="meta-text mt-3 text-muted" aria-live="polite">
        Showing {visibleRows.length} of {filteredRows.length} records
      </p>

      <div className="table-shell mt-3">
        <table className="data-table">
          <caption className="sr-only">{title}</caption>
          <thead>
            <tr>
              <th scope="col">Record</th>
              <th scope="col">Detail</th>
              <th scope="col">State</th>
              <th scope="col">Updated</th>
              {canEdit ? <th scope="col">Edit</th> : null}
            </tr>
          </thead>
          <tbody>
            {visibleRows.length > 0 ? (
              visibleRows.map((row) => (
                <tr key={`${kind}-${row.id}`}>
                  <td className="font-bold">{row.title}</td>
                  <td className="meta-text text-muted">{row.meta}</td>
                  <td>
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="meta-text text-muted">{row.updated}</td>
                  {canEdit ? (
                    <td>
                      <Link
                        href={`/console/content/${kind}/${row.id}`}
                        className="font-bold text-cobalt underline decoration-cobalt/40 underline-offset-4"
                      >
                        Edit
                      </Link>
                    </td>
                  ) : null}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={canEdit ? 5 : 4} className="py-8 text-center text-muted">
                  No records match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <nav aria-label={`${title} pages`} className="mt-5 flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="button-secondary text-sm"
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span className="meta-text text-muted" aria-live="polite">
            Page {currentPage} of {totalPages}
          </span>
          <button
            type="button"
            className="button-secondary text-sm"
            onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </nav>
      ) : null}
    </section>
  );
}
