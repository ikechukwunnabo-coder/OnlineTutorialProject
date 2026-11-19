import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { ConsoleIcon } from "@/components/console/console-icon";
import { ConsoleNav } from "@/components/console/console-nav";
import { Notice } from "@/components/ui/notice";
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
        <div className="max-w-2xl">
          <p className="eyebrow">Console</p>
          <h1 className="display-title mt-4 text-4xl">This desk is for the editorial team.</h1>
          <div className="mt-6">
            <Notice tone="warning" title="Access is limited">
              {displayName}, your account can learn and manage its own profile, but it cannot open
              the publishing console.
              <Link href="/dashboard" className="button-secondary mt-4 text-sm">
                Back to my learning
              </Link>
            </Notice>
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
        <aside className="border-b border-line-strong bg-console-rail px-5 py-6 text-on-console lg:border-b-0 lg:border-r">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-display text-xl font-bold tracking-tight">The desk</p>
              <p className="meta-text mt-1 text-lime">Editorial console</p>
            </div>
            <span className="status-chip border-on-console/30 text-on-console">
              {roleLabel(session.user.role)}
            </span>
          </div>

          <ConsoleNav />

          <div className="mt-10 border-t border-on-console/20 pt-5">
            <p className="truncate text-sm font-bold">{session.user.display_name}</p>
            <p className="meta-text mt-1 truncate text-on-console/60">{session.user.email}</p>
            <Link
              href="/"
              className="mt-5 inline-flex items-center gap-2 text-sm text-lime no-underline hover:text-on-console"
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
