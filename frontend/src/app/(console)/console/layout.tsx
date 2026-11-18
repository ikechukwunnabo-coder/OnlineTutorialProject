import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { ConsoleIcon } from "@/components/console/console-icon";
import { ConsoleNav } from "@/components/console/console-nav";
import { getCurrentUser } from "@/lib/api/server";
import { canAccessConsole } from "@/lib/console";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: "Console",
  description: "Editorial operations for Ben Digital Solution.",
  path: "/console",
  noIndex: true,
});

function roleLabel(role: string): string {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function AccessDenied({ displayName }: { displayName: string }) {
  return (
    <section className="grid-paper">
      <div className="container-page py-12 sm:py-16">
        <div className="max-w-2xl border-2 border-coral bg-[#fff0ea] p-6">
          <p className="eyebrow">Console</p>
          <h1 className="display-title mt-4 text-4xl">This desk is for the editorial team.</h1>
          <p className="mt-4 text-muted">
            {displayName}, your account can learn and manage its own profile, but it cannot open
            the publishing console.
          </p>
          <div className="mt-6">
            <Link href="/dashboard" className="button-secondary">
              Back to my learning
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default async function ConsoleLayout({ children }: { children: ReactNode }) {
  const session = await getCurrentUser();

  if (!session.authenticated || !session.user) {
    redirect("/login?next=/console");
  }

  if (!canAccessConsole(session.user.role)) {
    return <AccessDenied displayName={session.user.display_name} />;
  }

  return (
    <div className="border-y border-line-strong bg-paper-raised">
      <div className="mx-auto grid w-full max-w-[1440px] lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="border-b border-line-strong bg-ink px-5 py-6 text-paper lg:border-b-0 lg:border-r">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-display text-xl font-bold tracking-tight">The desk</p>
              <p className="mt-1 font-mono text-xs text-mint">editorial console</p>
            </div>
            <span className="border border-line-strong px-2 py-1 font-mono text-[0.65rem] text-lime">
              {roleLabel(session.user.role)}
            </span>
          </div>

          <ConsoleNav />

          <div className="mt-10 border-t border-line-strong pt-5">
            <p className="truncate text-sm font-bold">{session.user.display_name}</p>
            <p className="mt-1 truncate font-mono text-xs text-paper/60">{session.user.email}</p>
            <Link
              href="/"
              className="mt-5 inline-flex items-center gap-2 text-sm text-mint no-underline hover:text-paper"
            >
              <ConsoleIcon name="back" className="size-4" />
              Back to the site
            </Link>
          </div>
        </aside>

        <div className="min-w-0 px-5 py-8 sm:px-8 sm:py-10">{children}</div>
      </div>
    </div>
  );
}
