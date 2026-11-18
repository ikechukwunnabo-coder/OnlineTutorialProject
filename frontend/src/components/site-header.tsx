import Link from "next/link";

import { AccountNav } from "./account-nav";
import { Logo } from "./logo";

const navItems = [
  { href: "/tutorials", label: "Tutorials" },
  { href: "/categories", label: "Categories" },
  { href: "/search", label: "Search" },
  { href: "/about", label: "About" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-paper/90 backdrop-blur-md">
      <div className="container-page flex h-[4.6rem] items-center justify-between gap-5">
        <Logo />

        <nav aria-label="Main navigation" className="hidden items-center gap-6 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-bold text-ink no-underline decoration-coral decoration-2 underline-offset-4 hover:underline"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <AccountNav />
          <Link href="/contact" className="button-secondary hidden text-sm lg:inline-flex">
            Get in touch
          </Link>

          <details className="relative md:hidden">
            <summary className="button-secondary cursor-pointer list-none text-sm [&::-webkit-details-marker]:hidden">
              Menu
            </summary>
            <nav
              aria-label="Mobile navigation"
              className="absolute right-0 top-[calc(100%+0.7rem)] w-56 border-2 border-ink bg-paper-raised p-2 shadow-[5px_5px_0_0_var(--ink)]"
            >
              {[...navItems, { href: "/contact", label: "Contact" }].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block border-b border-line/70 px-3 py-2.5 text-sm font-bold text-ink no-underline last:border-b-0 hover:bg-lime"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
