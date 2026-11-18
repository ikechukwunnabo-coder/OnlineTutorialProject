"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ConsoleIcon } from "@/components/console/console-icon";

const navItems = [
  { label: "Overview", icon: "overview", href: "/console", match: (path: string) => path === "/console" },
  { label: "Activity", icon: "activity", href: "/console#activity" },
  {
    label: "Content",
    icon: "content",
    href: "/console/content",
    match: (path: string) => path.startsWith("/console/content"),
  },
  { label: "People", icon: "users", available: false },
  { label: "Settings", icon: "settings", available: false },
];

export function ConsoleNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Console sections" className="mt-8">
      <ul className="space-y-1">
        {navItems.map((item) => {
          const available = item.available !== false;
          const current = item.match?.(pathname) ?? false;

          return (
            <li key={item.label}>
              {available ? (
                <Link
                  href={item.href ?? "#"}
                  aria-current={current ? "page" : undefined}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-paper/80 no-underline transition-colors hover:bg-white/10 hover:text-paper aria-[current=page]:bg-lime aria-[current=page]:text-ink"
                >
                  <ConsoleIcon name={item.icon} className="size-4 shrink-0" />
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-disabled="true"
                  className="flex items-center gap-3 px-3 py-2.5 text-sm text-paper/40"
                >
                  <ConsoleIcon name={item.icon} className="size-4 shrink-0" />
                  {item.label}
                  <span className="ml-auto font-mono text-[0.6rem]">soon</span>
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
