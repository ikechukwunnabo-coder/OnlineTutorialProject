import Link from "next/link";
import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="border-2 border-dashed border-line-strong bg-paper-raised px-6 py-10 text-center">
      <p className="font-display text-2xl font-bold tracking-[-0.04em]">{title}</p>
      <p className="mx-auto mt-2 max-w-lg text-sm text-muted">{description}</p>
      <div className="mt-5">
        {action ?? (
          <Link href="/tutorials" className="button-secondary text-sm">
            Browse tutorials
          </Link>
        )}
      </div>
    </div>
  );
}
