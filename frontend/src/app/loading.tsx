export default function Loading() {
  return (
    <div className="container-page py-16">
      <div className="skeleton h-4 w-32" />
      <div className="skeleton mt-6 h-16 max-w-3xl" />
      <div className="skeleton mt-4 h-6 max-w-xl" />
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="skeleton h-52" />
        ))}
      </div>
      <p className="mt-8 font-mono text-xs text-muted">Loading the library…</p>
    </div>
  );
}
