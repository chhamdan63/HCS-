"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, AlertTriangle } from "lucide-react";

/** Flash messages: ?msg= success / ?err= error, auto-hide after 4 seconds. */
export function Flash() {
  const params = useSearchParams();
  const msg = params.get("msg");
  const err = params.get("err");
  const [visible, setVisible] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    if (!msg && !err) return;
    setVisible({ kind: err ? "err" : "ok", text: err || msg || "" });
    const t = setTimeout(() => setVisible(null), 4000);
    return () => clearTimeout(t);
  }, [msg, err]);

  if (!visible) return null;
  return (
    <div
      className={`flash no-print ${visible.kind === "ok" ? "" : ""}`}
      style={{
        background: visible.kind === "ok" ? "var(--accent)" : "var(--danger)",
        color: "#fff",
        display: "flex",
        gap: 9,
        alignItems: "flex-start",
      }}
      role="status"
    >
      {visible.kind === "ok" ? <CheckCircle2 size={17} /> : <AlertTriangle size={17} />}
      <span>{visible.text}</span>
    </div>
  );
}
