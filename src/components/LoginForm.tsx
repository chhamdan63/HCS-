"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogIn } from "lucide-react";
import { ensureCsrf, refreshCsrf } from "./AppShellClientBridge";

export function LoginForm({ csrfToken }: { csrfToken: string }) {
  const router = useRouter();
  const [username, setUsername] = useState("hamdan");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState(csrfToken);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Make sure we always post with a live token, even if this page was loaded earlier.
  useEffect(() => {
    let alive = true;
    ensureCsrf().then((t) => {
      if (alive && t) setToken(t);
    });
    return () => {
      alive = false;
    };
  }, []);

  async function attempt(csrf: string) {
    return fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-csrf-token": csrf },
      body: JSON.stringify({ username, password }),
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      let res = await attempt(token || (await refreshCsrf()));
      let json = await res.json().catch(() => ({} as any));

      // A stale/absent token is the only error worth retrying automatically.
      if (!res.ok && /security token/i.test(String(json?.error ?? ""))) {
        const fresh = await refreshCsrf();
        if (fresh) {
          setToken(fresh);
          res = await attempt(fresh);
          json = await res.json().catch(() => ({} as any));
        }
      }

      if (!res.ok) {
        setError(json?.error || "Unable to sign in. Please refresh the page and try again.");
        setBusy(false);
        return;
      }

      // Confirm the session cookie survived before navigating — if the browser blocks
      // cookies the next screen would otherwise come up empty.
      const session = await fetch("/api/session", { cache: "no-store" })
        .then((r) => r.json())
        .catch(() => null);
      if (!session?.data?.authenticated) {
        setError(
          "You signed in, but this browser is blocking cookies — usually because the portal is opened inside another page. Open the link in a new tab (or allow cookies for this site) and sign in again.",
        );
        setBusy(false);
        return;
      }

      router.push(json?.data?.mustChangePassword ? "/account/password" : "/");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} style={{ width: "100%", maxWidth: 380 }}>
      <input type="hidden" name="csrf-token" value={token} readOnly />
      <div style={{ marginBottom: 18 }}>
        <label className="field-label">Username</label>
        <input
          className="input"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          required
        />
      </div>
      <div style={{ marginBottom: 18 }}>
        <label className="field-label">Password</label>
        <input
          className="input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
      </div>

      {error && (
        <div
          role="alert"
          style={{
            background: "var(--danger-tint)",
            color: "var(--danger)",
            border: "1px solid #fca5a5",
            padding: "9px 12px",
            borderRadius: 3,
            fontSize: 12.5,
            marginBottom: 16,
            fontWeight: 600,
          }}
        >
          {error}
        </div>
      )}

      <button
        className="btn btn-primary"
        style={{ width: "100%", justifyContent: "center", padding: "11px" }}
        disabled={busy}
      >
        {busy ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
        SIGN IN
      </button>
    </form>
  );
}
