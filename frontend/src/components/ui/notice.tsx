import type { ReactNode } from "react";

type Tone = "info" | "success" | "warning" | "error";

export function Notice({
  tone = "info",
  title,
  children,
  role,
}: {
  tone?: Tone;
  title?: ReactNode;
  children: ReactNode;
  role?: "status" | "alert";
}) {
  return (
    <div className={`notice notice-${tone}`} role={role}>
      {title ? <p className="font-display text-base font-bold tracking-[-0.02em]">{title}</p> : null}
      <div className={title ? "mt-1 text-sm leading-relaxed" : "text-sm leading-relaxed"}>
        {children}
      </div>
    </div>
  );
}
