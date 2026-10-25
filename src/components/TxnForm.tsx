"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Save } from "lucide-react";
import { ensureCsrf } from "./AppShellClientBridge";
import { SearchSelect, Option } from "./SearchSelect";
import { money } from "@/lib/money";

export type TxnInitial = {
  id: number;
  storeId: number;
  transactionDate: string;
  description: string;
  type: "debit" | "credit";
  amount: number;
};

export function TxnForm({ stores, initial }: { stores: Option[]; initial?: TxnInitial }) {
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(initial?.transactionDate ?? today);
  const [storeId, setStoreId] = useState<number | null>(initial?.storeId ?? null);
  const [description, setDescription] = useState(initial?.description ?? "");
  const [type, setType] = useState<"debit" | "credit">(initial?.type ?? "credit");
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!storeId) {
      setError("Please choose a store.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/ledger", {
        method: initial ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": await ensureCsrf() },
        body: JSON.stringify({ id: initial?.id, storeId, transactionDate: date, description, type, amount }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Unable to save the transaction.");
        setBusy(false);
        return;
      }
      router.push(`/ledger?msg=${encodeURIComponent(initial ? "Transaction updated." : "Transaction created.")}`);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setBusy(false);
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

      <section className="sheet" style={{ marginBottom: 16 }}>
        <div className="sheet-head">
          <div>
            <div className="micro">Manage Payments</div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>
              {initial ? `Edit Transaction #${initial.id}` : "Add Transaction"}
            </div>
          </div>
        </div>

        <div className="sheet-body form-grid grid-2">
          <div>
            <label className="field-label">Date</label>
            <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div>
            <label className="field-label">Store</label>
            <SearchSelect options={stores} value={storeId} onChange={(id) => setStoreId(id)} placeholder="Search store..." />
          </div>
          <div>
            <label className="field-label">Detail (Cash / Cheque)</label>
            <input
              className="input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Cash payment received / Cheque #442101"
              maxLength={255}
              required
            />
          </div>
          <div>
            <label className="field-label">Amount (Rs.)</label>
            <input
              className="input"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>
          <div>
            <label className="field-label">Type</label>
            <select className="select" value={type} onChange={(e) => setType(e.target.value as "debit" | "credit")}>
              <option value="credit">Credit (جمع)</option>
              <option value="debit">Debit (بنام)</option>
            </select>
            <div className="help">
              <strong>Credit (جمع)</strong> increases the closing balance (cash in from the store).{" "}
              <strong>Debit (بنام)</strong> decreases the closing balance (paid out to the store). Closing balance
              = credit − debit.
            </div>
          </div>
          <div>
            <label className="field-label">Preview</label>
            <div
              style={{
                padding: "10px 12px",
                border: "1px solid var(--paper-edge)",
                background: "#fff",
                borderRadius: 3,
              }}
            >
              <div className="micro">{type === "credit" ? "Credit (جمع) · In" : "Debit (بنام) · Out"}</div>
              <div className="num" style={{ fontSize: 21, fontWeight: 700 }}>
                Rs. {money(Number(amount || 0))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="flex gap-2 flex-wrap">
        <button className="btn btn-primary" disabled={busy}>
          {busy ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          {initial ? "Update Payment" : "Create Payment"}
        </button>
        <Link href="/ledger" className="btn btn-ghost">
          Back
        </Link>
      </div>
    </form>
  );
}
