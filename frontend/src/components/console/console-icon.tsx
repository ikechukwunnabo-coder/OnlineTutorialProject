import type { ReactNode } from "react";

const paths: Record<string, ReactNode> = {
  overview: (
    <>
      <path d="M4 5.5h16v13H4z" />
      <path d="M4 10h16M10 10v8.5" />
    </>
  ),
  content: (
    <>
      <path d="M6 3.5h9l3.5 3.5v13.5H6z" />
      <path d="M15 3.5V7h3.5M9 11h6M9 14h6M9 17h4" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="9" r="3" />
      <path d="M3.5 20c.4-3.2 2.6-5 5.5-5s5.1 1.8 5.5 5" />
      <path d="M16 7.5a2.5 2.5 0 0 1 0 5M17 14.5c2.1.5 3.4 2.1 3.7 5" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2M6 6l1.5 1.5M16.5 16.5 18 18M18 6l-1.5 1.5M7.5 16.5 6 18" />
    </>
  ),
  activity: (
    <>
      <path d="M3 13h4l2.5-7 4 12 2.5-6h5" />
    </>
  ),
  back: (
    <>
      <path d="M19 12H5M11 6l-6 6 6 6" />
    </>
  ),
};

export function ConsoleIcon({
  name,
  className = "size-5",
}: {
  name: keyof typeof paths | string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {paths[name] ?? paths.overview}
    </svg>
  );
}
