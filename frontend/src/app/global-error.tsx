"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          background: "#eef4f0",
          color: "#10201b",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <main
          style={{
            maxWidth: "48rem",
            margin: "0 auto",
            padding: "5rem 1.5rem",
          }}
        >
          <p style={{ fontFamily: "monospace", color: "#f05a28", fontSize: "0.875rem" }}>
            Application error
          </p>
          <h1
            style={{
              marginTop: "1rem",
              fontSize: "clamp(2.5rem, 7vw, 4.5rem)",
              lineHeight: 1,
              letterSpacing: "-0.045em",
            }}
          >
            The site hit an unexpected problem.
          </h1>
          <p style={{ marginTop: "1.25rem", color: "#52655e", fontSize: "1.1rem" }}>
            Reload the page to try again. If the problem continues, come back in a few minutes.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "2rem",
              border: "2px solid #10201b",
              background: "#2348e8",
              color: "#fff",
              padding: "0.7rem 1.1rem",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Reload
          </button>
        </main>
      </body>
    </html>
  );
}
