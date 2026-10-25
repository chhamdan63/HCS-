"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";

/**
 * Client-side error boundary: instead of a blank white page, show what happened and
 * give the two actions that always recover — reload or go back to a safe screen.
 */
export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // keep a breadcrumb in the browser console for troubleshooting
    // eslint-disable-next-line no-console
    console.error("[portal]", error);
  }, [error]);

  return (
    <div style={{ maxWidth: 560, margin: "10vh auto", textAlign: "center" }}>
      <div
        style={{
          background: "var(--paper)",
          border: "1px solid var(--paper-edge)",
          borderTop: "3px solid var(--danger)",
          borderRadius: 3,
          padding: "28px 26px",
        }}
      >
        <AlertTriangle size={30} style={{ color: "var(--danger)" }} />
        <h1 style={{ fontSize: 21, fontWeight: 700, margin: "12px 0 6px" }}>Something went wrong on this screen</h1>
        <p style={{ color: "var(--muted)", fontSize: 13, lineHeight: 1.7 }}>
          The page did not finish loading. Your data is safe — nothing was saved or changed by this error.
          Reload the page and try again.
        </p>
        {error?.digest && (
          <p style={{ color: "var(--muted)", fontSize: 11, marginTop: 8 }}>
            Reference: <span className="num">{error.digest}</span>
          </p>
        )}
        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 20 }}>
          <button className="btn btn-primary" onClick={() => reset()}>
            <RefreshCw size={15} /> Try again
          </button>
          <button className="btn btn-ghost" onClick={() => window.location.reload()}>
            Reload page
          </button>
          <Link href="/" className="btn btn-ghost">
            Go to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
