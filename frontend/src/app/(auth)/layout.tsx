import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <section className="grid-paper">
      <div className="container-page flex min-h-[70vh] items-center justify-center py-12 sm:py-16">
        <div className="w-full max-w-xl">{children}</div>
      </div>
    </section>
  );
}
