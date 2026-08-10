"use client";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ reset }: GlobalErrorProps) {
  return (
    <html lang="en">
      <head>
        <title>BiteWise could not load</title>
      </head>
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
          padding: "1rem",
          boxSizing: "border-box",
          background: "#f8f5ed",
          color: "#27261f",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <main style={{ maxWidth: "30rem", textAlign: "center" }}>
          <p style={{ color: "#1a4936", fontSize: "0.75rem", fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase" }}>
            BiteWise needs another try
          </p>
          <h1 style={{ margin: "1rem 0 0", fontFamily: "Georgia, serif", fontSize: "clamp(2rem, 8vw, 3rem)", lineHeight: 1.05 }}>
            We could not prepare this page.
          </h1>
          <p style={{ margin: "1rem auto 0", color: "#6e6b61", lineHeight: 1.7 }}>
            Your information is still safe. Retry the page when you are ready.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{ marginTop: "1.75rem", minHeight: "2.75rem", border: 0, borderRadius: "0.75rem", padding: "0 1.25rem", background: "#1a4936", color: "#fffdf7", fontWeight: 700, cursor: "pointer" }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
