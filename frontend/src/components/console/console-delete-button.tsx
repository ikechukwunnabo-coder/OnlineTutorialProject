"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { deleteConsoleContent } from "@/lib/api/browser";

type ContentKind = "categories" | "tutorials" | "chapters";

export function ConsoleDeleteButton({
  kind,
  id,
  name,
}: {
  kind: ContentKind;
  id: number;
  name: string;
}) {
  const router = useRouter();
  const statusRef = useRef<HTMLDivElement>(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  async function handleDelete() {
    if (!window.confirm(`Delete ${name}? This cannot be undone.`)) {
      return;
    }

    setPending(true);
    setMessage("");
    try {
      await deleteConsoleContent(kind, id);
      router.push("/console/content");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The record could not be deleted.");
      statusRef.current?.focus();
      setPending(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" className="button-secondary" onClick={handleDelete} disabled={pending}>
        {pending ? "Deleting…" : "Delete record"}
      </button>
      {message ? (
        <div ref={statusRef} tabIndex={-1} role="alert" className="alert-error">
          {message}
        </div>
      ) : null}
    </div>
  );
}
