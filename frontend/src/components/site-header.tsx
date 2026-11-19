"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { AccountNav } from "./account-nav";
import { Logo } from "./logo";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/tutorials", label: "Tutorials" },
  { href: "/categories", label: "Categories" },
  { href: "/search", label: "Search" },
  { href: "/about", label: "About" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  function isActive(href: string) {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-paper/90 backdrop-blur-md">
      <div className="container-page flex h-[4.6rem] items-center justify-between gap-5">
        <Logo />

        <nav aria-label="Main navigation" className="hidden items-center gap-5 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={`border-b-2 py-1 text-sm font-bold no-underline transition-colors ${
                isActive(item.href)
                  ? "border-coral text-ink"
                  : "border-transparent text-muted hover:border-line-strong hover:text-ink"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <AccountNav />
          <Link href="/tutorials" className="button-primary hidden text-sm sm:inline-flex">
            Start learning
          </Link>
          <Link href="/contact" className="button-secondary hidden text-sm xl:inline-flex">
            Get in touch
          </Link>

          <button
            type="button"
            aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-navigation"
            className="button-secondary min-w-[4.75rem] px-3 text-sm lg:hidden"
            onClick={() => setMobileOpen((value) => !value)}
          >
            {mobileOpen ? "Close" : "Menu"}
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <nav
          id="mobile-navigation"
          aria-label="Mobile navigation"
          className="border-t border-line bg-paper-raised shadow-[0_16px_30px_-24px_var(--ink)] lg:hidden"
        >
          <div className="container-page grid gap-1 py-3">
            {[...navItems, { href: "/contact", label: "Contact" }].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center justify-between border-l-4 px-3 py-2.5 text-sm font-bold no-underline ${
                  isActive(item.href)
                    ? "border-coral bg-surface text-ink"
                    : "border-transparent text-muted hover:bg-surface hover:text-ink"
                }`}
              >
                {item.label}
                {isActive(item.href) ? (
                  <span className="meta-text text-coral" aria-hidden="true">
                    Current
                  </span>
                ) : null}
              </Link>
            ))}
            <Link
              href="/tutorials"
              onClick={() => setMobileOpen(false)}
              className="button-primary mt-2 text-sm"
            >
              Start learning
            </Link>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
