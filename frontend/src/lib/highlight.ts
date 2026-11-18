import { createHighlighter, type Highlighter } from "shiki";

const LANGUAGES = [
  "bash",
  "css",
  "diff",
  "html",
  "javascript",
  "json",
  "jsx",
  "markdown",
  "python",
  "sql",
  "tsx",
  "typescript",
];

let highlighterPromise: Promise<Highlighter> | undefined;

function getHighlighter(): Promise<Highlighter> {
  highlighterPromise ??= createHighlighter({
    themes: ["github-dark"],
    langs: LANGUAGES,
  });
  return highlighterPromise;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export async function highlightCode(source: string, language: string): Promise<string> {
  const highlighter = await getHighlighter();
  const loaded = highlighter.getLoadedLanguages();
  const lang = loaded.includes(language) ? language : "text";

  try {
    return highlighter.codeToHtml(source, {
      lang,
      theme: "github-dark",
    });
  } catch {
    return `<pre class="shiki"><code>${escapeHtml(source)}</code></pre>`;
  }
}
