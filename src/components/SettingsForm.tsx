"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { ensureCsrf } from "./AppShellClientBridge";

export type SettingsValues = {
  shopName: string;
  shopAddress: string;
  shopPhone: string;
  agentCode: string;
  commissionPercent: string;
  labourPerBori: string;
  threadPerBori: string;
  plasticPerBori: string;
  marketFeePerBori: string;
  balanceWording: string;
  timezone: string;
};

export function SettingsForm({ initial }: { initial: SettingsValues }) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  function set(key: keyof SettingsValues, value: string) {
    setForm({ ...form, [key]: value });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": await ensureCsrf() },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      setBusy(false);
      if (!res.ok) {
        setError(json.error || "Unable to save settings.");
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
      router.refresh();
    } catch {
      setBusy(false);
      setError("Network error. Please try again.");
    }
  }

  return (
    <form onSubmit={submit}>
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
            marginBottom: 14,
          }}
        >
          {error}
        </div>
      )}
      {saved && (
        <div className="flash no-print" style={{ background: "var(--accent)", color: "#fff" }}>
          Settings saved. Rate changes apply to new invoices only.
        </div>
      )}

      <section className="sheet" style={{ marginBottom: 16 }}>
        <div className="sheet-head">
          <div>
            <div className="micro">Printed paperwork</div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Shop details</div>
          </div>
        </div>
        <div className="sheet-body form-grid grid-2">
          <div>
            <label className="field-label">Shop Name</label>
            <input className="input" value={form.shopName} onChange={(e) => set("shopName", e.target.value)} required />
          </div>
          <div>
            <label className="field-label">Phone</label>
            <input className="input" value={form.shopPhone} onChange={(e) => set("shopPhone", e.target.value)} maxLength={20} />
          </div>
          <div>
            <label className="field-label">Address</label>
            <input className="input" value={form.shopAddress} onChange={(e) => set("shopAddress", e.target.value)} />
          </div>
          <div>
            <label className="field-label">Default Agent Code</label>
            <input className="input" value={form.agentCode} onChange={(e) => set("agentCode", e.target.value)} maxLength={50} />
          </div>
          <div>
            <label className="field-label">Timezone</label>
            <input className="input" value={form.timezone} onChange={(e) => set("timezone", e.target.value)} maxLength={60} />
          </div>
          <div>
            <label className="field-label">Balance sheet standing line</label>
            <input className="input" value={form.balanceWording} onChange={(e) => set("balanceWording", e.target.value)} />
            <div className="help">Wording used for the standing balance row on the balance sheet.</div>
          </div>
        </div>
      </section>

      <section className="sheet" style={{ marginBottom: 16 }}>
        <div className="sheet-head">
          <div>
            <div className="micro">Season rates</div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Charge rates</div>
          </div>
        </div>
        <div className="sheet-body form-grid grid-3">
          <div>
            <label className="field-label">Commission %</label>
            <input className="input" type="number" step="any" min="0" value={form.commissionPercent} onChange={(e) => set("commissionPercent", e.target.value)} />
          </div>
          <div>
            <label className="field-label">Labour per bori</label>
            <input className="input" type="number" step="any" min="0" value={form.labourPerBori} onChange={(e) => set("labourPerBori", e.target.value)} />
          </div>
          <div>
            <label className="field-label">Thread per bori</label>
            <input className="input" type="number" step="any" min="0" value={form.threadPerBori} onChange={(e) => set("threadPerBori", e.target.value)} />
          </div>
          <div>
            <label className="field-label">Plastic bag per bori</label>
            <input className="input" type="number" step="any" min="0" value={form.plasticPerBori} onChange={(e) => set("plasticPerBori", e.target.value)} />
          </div>
          <div>
            <label className="field-label">Market fee per bori</label>
            <input className="input" type="number" step="any" min="0" value={form.marketFeePerBori} onChange={(e) => set("marketFeePerBori", e.target.value)} />
          </div>
        </div>
        <div className="sheet-body" style={{ borderTop: "1px solid var(--paper-edge)" }}>
          <div className="help">
            Net payable = gross corn cost + commission + labour + thread + plastic bag + market fee + brokery.
            Existing invoices keep the rates frozen in their rate snapshot; only new invoices use these values
            unless you tick “Recalculate with current rates” while editing.
          </div>
        </div>
      </section>

      <button className="btn btn-primary" disabled={busy}>
        {busy ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Save Settings
      </button>
    </form>
  );
}
