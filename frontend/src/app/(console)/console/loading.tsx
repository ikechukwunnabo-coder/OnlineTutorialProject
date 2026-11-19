export default function ConsoleLoading() {
  return (
    <section aria-busy="true" aria-live="polite" aria-label="Loading console overview">
      <div className="border-b border-line-strong pb-6">
        <div className="skeleton h-3 w-28" />
        <div className="skeleton mt-4 h-10 w-72 max-w-full" />
        <div className="skeleton mt-4 h-4 w-full max-w-xl" />
      </div>
      <div className="mt-6 grid gap-px border border-line-strong bg-line-strong sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="bg-paper-raised p-5">
            <div className="skeleton h-3 w-20" />
            <div className="skeleton mt-3 h-9 w-16" />
          </div>
        ))}
      </div>
      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <div className="skeleton h-72" />
        <div className="skeleton h-72" />
      </div>
    </section>
  );
}
