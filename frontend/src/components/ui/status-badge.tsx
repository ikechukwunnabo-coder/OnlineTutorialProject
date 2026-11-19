export type Status = "draft" | "published" | "archived";

const labels: Record<Status, string> = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
};

export function StatusBadge({ status, label }: { status: Status; label?: string }) {
  return (
    <span className={`status-chip status-${status}`}>
      {label ?? labels[status]}
    </span>
  );
}
