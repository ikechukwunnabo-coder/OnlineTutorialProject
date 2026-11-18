"use client";

import Link from "next/link";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="grid-paper">
      <div className="container-page flex min-h-[60vh] flex-col justify-center py-16">
        <p className="font-mono text-sm text-coral">Something went wrong</p>
        <h1 className="display-title mt-4 max-w-3xl text-6xl sm:text-7xl">
          The page could not be loaded.
        </h1>
        <p className="mt-5 max-w-xl text-lg text-muted">
          This is usually temporary. Try again, or return to the catalog and pick another lesson.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button type="button" onClick={reset} className="button-primary">
            Try again
          </button>
          <Link href="/tutorials" className="button-secondary">
            Browse tutorials
          </Link>
        </div>
      </div>
    </section>
  );
}
