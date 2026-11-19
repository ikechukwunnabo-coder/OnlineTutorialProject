"use client";

import { Notice } from "@/components/ui/notice";

export default function ConsoleError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="max-w-2xl">
      <p className="eyebrow">Console</p>
      <h1 className="display-title mt-3 text-3xl">The overview did not load.</h1>
      <div className="mt-5">
        <Notice tone="warning" title="Try again">
          The console could not read the current publishing state. If it continues, check the API
          connection.
          <button type="button" onClick={reset} className="button-primary mt-4 text-sm">
            Try again
          </button>
        </Notice>
      </div>
    </section>
  );
}
