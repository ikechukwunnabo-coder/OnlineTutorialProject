import Link from "next/link";

import { siteConfig } from "@/lib/site";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 border-t-2 border-ink bg-paper-raised">
      <div className="container-page grid gap-10 py-12 md:grid-cols-[1.3fr_1fr_1fr]">
        <div>
          <p className="font-display text-2xl font-bold tracking-[-0.04em]">{siteConfig.name}</p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">
            A calm place to learn programming. Short chapters, working examples, and plain-language
            explanations for people starting from zero.
          </p>
        </div>

        <nav aria-label="Footer learning links">
          <p className="font-mono text-xs text-cobalt">Learn</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/tutorials" className="text-ink no-underline hover:text-cobalt">
                All tutorials
              </Link>
            </li>
            <li>
              <Link href="/categories" className="text-ink no-underline hover:text-cobalt">
                Categories
              </Link>
            </li>
            <li>
              <Link href="/search" className="text-ink no-underline hover:text-cobalt">
                Search the library
              </Link>
            </li>
          </ul>
        </nav>

        <nav aria-label="Footer site links">
          <p className="font-mono text-xs text-cobalt">Site</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/about" className="text-ink no-underline hover:text-cobalt">
                About
              </Link>
            </li>
            <li>
              <Link href="/contact" className="text-ink no-underline hover:text-cobalt">
                Contact
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="text-ink no-underline hover:text-cobalt">
                Privacy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="text-ink no-underline hover:text-cobalt">
                Terms
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      <div className="border-t border-line">
        <div className="container-page flex flex-col gap-2 py-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {siteConfig.name}. Built for beginners.
          </p>
          <p className="font-mono">Read slowly. Type the examples. Break things.</p>
        </div>
      </div>
    </footer>
  );
}
