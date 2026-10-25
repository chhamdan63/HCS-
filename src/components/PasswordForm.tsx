"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";
import { ensureCsrf } from "./AppShellClientBridge";

export function PasswordForm({ mustChange }: { mustChange: boolean }) {
  const router = useRouter();
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/password", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": await ensureCsrf() },
        body: JSON.stringify({ current, password, confirm }),
      });
      const json = await res.json();
      setBusy(false);
      if (!res.ok) {
        setError(json.error || "Unable to change the password.");
        return;
      }
      setDone(true);
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 900);
    } catch {
      setBusy(false);
      setError("Network error. Please try again.");
    }
  }

  return (
    <form onSubmit={submit} style={{ maxWidth: 460 }}>
      {mustChange && (
        <div
          style={{
            background: "var(--amber-tint)",
            color: "var(--amber)",
            border: "1px solid #fcd34d",
            padding: "10px 13px",
            borderRadius: 3,
            fontSize: 12.8,
            fontWeight: 600,
            marginBottom: 16,
          }}
        >
          This is the first sign-in on this account. Please set a new password before continuing.
        </div>
      )}
      {error && (
        <div
          style={{
            background: "var(--danger-tint)",
            color: "var(--danger)",
            border: "1px solid #fca5a5",
            padding: "10px 13px",
            borderRadius: 3,
            fontSize: 12.8,
            fontWeight: 600,
            marginBottom: 16,
          }}
        >
          {error}
        </div>
      )}
      {done && (
        <div className="flash no-print" style={{ background: "var(--accent)", color: "#fff" }}>
          Password changed. Taking you to the dashboard...
        </div>
      )}

      <section className="sheet">
        <div className="sheet-head">
          <div>
            <div className="micro">Account</div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Change Password</div>
          </div>
        </div>
        <div className="sheet-body form-grid">
          <div>
            <label className="field-label">Current password</label>
            <input className="input" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
          </div>
          <div>
            <label className="field-label">New password</label>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          </div>
          <div>
            <label className="field-label">Confirm new password</label>
            <input className="input" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={6} />
          </div>
          <button className="btn btn-primary" disabled={busy}>
            {busy ? <Loader2 size={15} className="animate-spin" /> : <ShieldCheck size={15} />} Change Password
          </button>
        </div>
      </section>
    </form>
  );
}
