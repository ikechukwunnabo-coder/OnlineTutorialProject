import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  meta,
  actions,
  breadcrumbs,
  id,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  breadcrumbs?: ReactNode;
  id?: string;
}) {
  return (
    <header className="page-header" aria-labelledby={id}>
      <div className="container-page py-12 sm:py-16 lg:py-20">
        {breadcrumbs ? <div className="mb-7">{breadcrumbs}</div> : null}
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1 id={id} className="display-title mt-4 max-w-4xl text-5xl sm:text-6xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">{description}</p>
        ) : null}
        {meta ? <div className="mt-5">{meta}</div> : null}
        {actions ? <div className="mt-7 flex flex-wrap gap-3">{actions}</div> : null}
      </div>
    </header>
  );
}
