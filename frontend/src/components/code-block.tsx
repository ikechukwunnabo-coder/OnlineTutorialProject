import type { CodeExample } from "@/lib/api/types";
import { highlightCode } from "@/lib/highlight";

import { CopyButton } from "./copy-button";

export async function CodeBlock({ example }: { example: CodeExample }) {
  const highlighted = await highlightCode(example.source, example.language);

  return (
    <figure className="code-window my-8">
      <figcaption className="code-window-bar">
        <span className="flex items-center gap-2">
          <span className="code-dots" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <span>{example.title || "Example"}</span>
        </span>
        <span className="flex items-center gap-2">
          <span className="text-[0.68rem] uppercase tracking-[0.12em] text-[#9fb9ad]">
            {example.language}
          </span>
          <CopyButton text={example.source} />
        </span>
      </figcaption>

      <div
        className="bg-[#0d1117]"
        dangerouslySetInnerHTML={{ __html: highlighted }}
      />

      {example.expected_output ? (
        <details className="border-t border-white/20">
          <summary className="cursor-pointer px-4 py-2.5 font-mono text-[0.7rem] text-[#b8cec4] hover:text-white">
            Expected output
          </summary>
          <pre className="overflow-x-auto border-t border-white/10 bg-[#07120d] px-4 py-3 font-mono text-[0.78rem] leading-relaxed text-[#d9f26a]">
            {example.expected_output}
          </pre>
        </details>
      ) : null}
    </figure>
  );
}
