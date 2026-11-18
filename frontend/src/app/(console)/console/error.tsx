"use client";

export default function ConsoleError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="border-2 border-coral bg-[#fff0ea] p-6">
      <p className="eyebrow">Console</p>
      <h1 className="display-title mt-3 text-3xl">The overview did not load.</h1>
      <p className="mt-3 max-w-xl text-sm text-muted">
        The console could not read the current publishing state. Try again; if it continues, check
        the API connection.
      </p>
      <button type="button" onClick={reset} className="button-primary mt-6 text-sm">
        Try again
      </button>
    </section>
  );
}
