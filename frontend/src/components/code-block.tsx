import type { CodeExample } from "@/lib/api/types";
import { highlightCode } from "@/lib/highlight";

import { CopyButton } from "./copy-button";

export async function CodeBlock({ example }: { example: CodeExample }) {
  const highlighted = await highlightCode(example.source, example.language);

  return (
    <figure className="code-window my-8">
      <figcaption className="code-window-bar">
        <span className="flex min-w-0 items-center gap-2">
          <span className="code-dots" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <span className="truncate font-bold text-code-text">
            {example.title || "Example"}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-3">
          <span className="meta-text uppercase tracking-[0.12em] text-code-muted">
            {example.language}
          </span>
          <CopyButton text={example.source} />
        </span>
      </figcaption>

      <div
        className="bg-[var(--code-bg)]"
        dangerouslySetInnerHTML={{ __html: highlighted }}
      />

      {example.expected_output ? (
        <details className="code-output">
          <summary className="cursor-pointer px-4 py-2.5 hover:underline">
            Expected output
          </summary>
          <pre>{example.expected_output}</pre>
        </details>
      ) : null}
    </figure>
  );
}
