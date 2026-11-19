import Link from "next/link";

import { siteConfig } from "@/lib/site";

export function Logo() {
  return (
    <Link
      href="/"
      className="group inline-flex items-center gap-3 text-ink no-underline"
    >
      <span
        className="grid size-10 place-items-center border-2 border-ink bg-cobalt font-mono text-sm font-medium text-white shadow-[3px_3px_0_0_var(--ink)] transition-transform group-hover:-translate-y-0.5"
        aria-hidden="true"
      >
        {"</>"}
      </span>
      <span className="leading-none">
        <span className="block font-display text-lg font-bold tracking-[-0.04em]">
          <span className="sm:hidden">{siteConfig.shortName}</span>
          <span className="hidden sm:inline">{siteConfig.name}</span>
        </span>
        <span className="mt-1 hidden meta-text text-muted sm:block">
          learn by making
        </span>
      </span>
      <span className="sr-only">home</span>
    </Link>
  );
}
