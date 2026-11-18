import Link from "next/link";

function pageHref(path: string, params: Record<string, string | undefined>, page: number) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) {
      query.set(key, value);
    }
  }
  if (page > 1) {
    query.set("page", String(page));
  } else {
    query.delete("page");
  }
  const suffix = query.toString();
  return suffix ? `${path}?${suffix}` : path;
}

export function Pagination({
  path,
  params,
  page,
  count,
  pageSize,
}: {
  path: string;
  params: Record<string, string | undefined>;
  page: number;
  count: number;
  pageSize: number;
}) {
  const totalPages = Math.ceil(count / pageSize);
  if (totalPages <= 1) {
    return null;
  }

  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  const pages = Array.from({ length: Math.min(5, totalPages) }, (_, index) => start + index);

  return (
    <nav aria-label="Pagination" className="mt-8 flex flex-wrap items-center gap-2">
      {page > 1 ? (
        <Link
          href={pageHref(path, params, page - 1)}
          rel="prev"
          className="button-secondary text-sm"
        >
          Previous
        </Link>
      ) : null}

      {pages.map((item) => (
        <Link
          key={item}
          href={pageHref(path, params, item)}
          aria-current={item === page ? "page" : undefined}
          className={
            item === page
              ? "button-primary min-w-11 px-3 text-sm"
              : "button-secondary min-w-11 px-3 text-sm"
          }
        >
          {item}
        </Link>
      ))}

      {page < totalPages ? (
        <Link href={pageHref(path, params, page + 1)} rel="next" className="button-secondary text-sm">
          Next
        </Link>
      ) : null}
    </nav>
  );
}
