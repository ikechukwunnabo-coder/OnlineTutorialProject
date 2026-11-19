import type { TocItem } from "@/lib/api/types";

export function TableOfContents({ items }: { items: TocItem[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <nav aria-label="On this page">
      <p className="meta-text text-cobalt">On this page</p>
      <ol className="mt-3 space-y-2 border-l border-line">
        {items.map((item) => (
          <li key={item.id} className={item.level === 3 ? "pl-6" : "pl-3"}>
            <a
              href={`#${item.id}`}
              className="block text-sm leading-snug text-muted no-underline hover:text-cobalt"
            >
              {item.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
