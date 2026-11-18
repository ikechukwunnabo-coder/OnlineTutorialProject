import Link from "next/link";

export default function NotFound() {
  return (
    <section className="grid-paper">
      <div className="container-page flex min-h-[60vh] flex-col justify-center py-16">
        <p className="font-mono text-sm text-coral">404 · page not found</p>
        <h1 className="display-title mt-4 max-w-3xl text-6xl sm:text-7xl">
          This page is not in the library.
        </h1>
        <p className="mt-5 max-w-xl text-lg text-muted">
          The link may be old, or the tutorial may not be published yet. Try the catalog or search
          for the topic instead.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/tutorials" className="button-primary">
            Browse tutorials
          </Link>
          <Link href="/search" className="button-secondary">
            Search the library
          </Link>
        </div>
        <p className="mt-10 text-sm text-muted">
          Or go back to the{" "}
          <Link href="/" className="font-bold text-cobalt">
            home page
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
