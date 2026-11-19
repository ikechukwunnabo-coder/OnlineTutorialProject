"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { Notice } from "@/components/ui/notice";
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
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  async function handleDelete() {
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
      {!confirming ? (
        <button
          type="button"
          className="button-danger"
          onClick={() => {
            setConfirming(true);
            setMessage("");
          }}
          disabled={pending}
        >
          Delete record
        </button>
      ) : (
        <div className="w-full max-w-lg" role="group" aria-label={`Confirm deletion of ${name}`}>
          <Notice tone="warning" title={`Delete ${name}?`}>
            This cannot be undone.
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className="button-danger text-sm"
                onClick={handleDelete}
                disabled={pending}
              >
                {pending ? "Deleting…" : "Delete permanently"}
              </button>
              <button
                type="button"
                className="button-secondary text-sm"
                onClick={() => setConfirming(false)}
                disabled={pending}
              >
                Keep record
              </button>
            </div>
          </Notice>
        </div>
      )}
      {message ? (
        <div ref={statusRef} tabIndex={-1} role="alert" className="w-full max-w-lg">
          <Notice tone="error" role="alert" title="Deletion failed">
            {message}
          </Notice>
        </div>
      ) : null}
    </div>
  );
}
