"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import { ensureCsrf } from "./AppShellClientBridge";
import { SearchSelect, Option } from "./SearchSelect";
import { lineAmount, lineWeight, money, num } from "@/lib/money";

type Line = { key: number; qtyBori: string; qtyKg: string; rate: string };

export function PurchaseForm({
  stores,
  initial,
  backHref = "/purchases",
}: {
  stores: Option[];
  initial?: { id: number; purchaseDate: string; storeId: number; lines: { qtyBori: number; qtyKg: number; rate: number }[] };
  backHref?: string;
}) {
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(initial?.purchaseDate ?? today);
  const [storeId, setStoreId] = useState<number | null>(initial?.storeId ?? null);
  const [lines, setLines] = useState<Line[]>(
    initial?.lines.map((l, i) => ({
      key: i,
      qtyBori: String(l.qtyBori),
      qtyKg: String(l.qtyKg),
      rate: String(l.rate),
    })) ?? [{ key: 1, qtyBori: "", qtyKg: "", rate: "" }],
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const computed = useMemo(
    () =>
      lines.map((l) => {
        const bori = Number(l.qtyBori || 0);
        const kg = Number(l.qtyKg || 0);
        const rate = Number(l.rate || 0);
        const weight = lineWeight(bori, kg);
        return { weight, amount: lineAmount(weight, rate), bori, kg, rate };
      }),
    [lines],
  );

  const totalBori = computed.reduce((s, c) => s + c.bori, 0);
  const totalWeight = computed.reduce((s, c) => s + c.weight, 0);
  const totalAmount = computed.reduce((s, c) => s + c.amount, 0);
  const avgRate = totalWeight > 0 ? totalAmount / (totalWeight / 40) : 0;

  function update(key: number, patch: Partial<Line>) {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!storeId) {
      setError("Please choose a store for this purchase bill.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/purchases", {
        method: initial ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": await ensureCsrf() },
        body: JSON.stringify({
          id: initial?.id,
          purchaseDate: date,
          storeId,
          lines: lines.map((l) => ({ qtyBori: l.qtyBori || 0, qtyKg: l.qtyKg || 0, rate: l.rate || 0 })),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Unable to save the purchase bill.");
        setBusy(false);
        return;
      }
      router.push(`${backHref}?msg=${encodeURIComponent(initial ? "Purchase bill updated." : "Purchase bill created.")}`);
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
            <div className="micro">{initial ? `PUR-${initial.id}` : "New bill"}</div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Purchase Bill</div>
          </div>
          <div className="flex gap-3 flex-wrap" style={{ alignItems: "flex-end" }}>
            <div style={{ minWidth: 170 }}>
              <label className="field-label">Date</label>
              <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div style={{ minWidth: 240, width: 300 }}>
              <label className="field-label">Store (applies to every row)</label>
              <SearchSelect options={stores} value={storeId} onChange={(id) => setStoreId(id)} placeholder="Search store..." />
            </div>
          </div>
        </div>

        <div className="table-wrap" style={{ border: "none", borderRadius: 0 }}>
          <table className="data">
            <thead>
              <tr>
                <th style={{ width: 46 }}>#</th>
                <th>Store</th>
                <th style={{ width: 110 }}>Qty Bori</th>
                <th style={{ width: 110 }}>Qty Kg</th>
                <th style={{ width: 110 }}>Rate</th>
                <th className="right" style={{ width: 120 }}>
                  Weight (Kg)
                </th>
                <th className="right" style={{ width: 130 }}>
                  Amount
                </th>
                <th className="center" style={{ width: 110 }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l, i) => (
                <tr key={l.key}>
                  <td className="num">{i + 1}</td>
                  <td style={{ color: "var(--muted)", fontSize: 12 }}>
                    {i === 0 ? <em>first row store</em> : <span style={{ opacity: 0.65 }}>same store</span>}
                  </td>
                  <td>
                    <input
                      className="input"
                      type="number"
                      step="any"
                      min="0"
                      value={l.qtyBori}
                      onChange={(e) => update(l.key, { qtyBori: e.target.value })}
                      placeholder="0"
                    />
                  </td>
                  <td>
                    <input
                      className="input"
                      type="number"
                      step="any"
                      min="0"
                      value={l.qtyKg}
                      onChange={(e) => update(l.key, { qtyKg: e.target.value })}
                      placeholder="0"
                    />
                  </td>
                  <td>
                    <input
                      className="input"
                      type="number"
                      step="any"
                      min="0"
                      value={l.rate}
                      onChange={(e) => update(l.key, { rate: e.target.value })}
                      placeholder="0.00"
                    />
                  </td>
                  <td className="right num">{num(computed[i].weight)}</td>
                  <td className="right num" style={{ fontWeight: 700 }}>
                    {money(computed[i].amount)}
                  </td>
                  <td className="center">
                    <div className="flex gap-1 justify-center">
                      <button
                        type="button"
                        className="btn btn-ghost"
                        style={{ padding: "5px 8px" }}
                        title="Clone row (same store)"
                        onClick={() =>
                          setLines((prev) => [...prev, { key: Date.now(), qtyBori: "", qtyKg: "", rate: "" }])
                        }
                      >
                        <Plus size={13} />
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger"
                        style={{ padding: "5px 8px" }}
                        title="Remove row"
                        onClick={() => setLines((prev) => (prev.length > 1 ? prev.filter((x) => x.key !== l.key) : prev))}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={5} className="right micro" style={{ letterSpacing: "0.08em" }}>
                  Rate (Average)
                </td>
                <td className="right num">{money(avgRate)}</td>
                <td className="right num" style={{ fontSize: 15 }}>
                  {money(totalAmount)}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>

        <div
          className="sheet-body"
          style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", borderTop: "1px solid var(--paper-edge)" }}
        >
          <div>
            <div className="micro">Weight (Kg)</div>
            <div className="num" style={{ fontSize: 19, fontWeight: 700 }}>{num(totalWeight)}</div>
          </div>
          <div>
            <div className="micro">Weight (Bori)</div>
            <div className="num" style={{ fontSize: 19, fontWeight: 700 }}>{num(totalBori)}</div>
          </div>
          <div>
            <div className="micro">Rate (Average)</div>
            <div className="num" style={{ fontSize: 19, fontWeight: 700 }}>{money(avgRate)}</div>
          </div>
          <div style={{ borderLeft: "3px solid var(--accent)", paddingLeft: 12 }}>
            <div className="micro">Total Amount</div>
            <div className="num" style={{ fontSize: 22, fontWeight: 700 }}>Rs. {money(totalAmount)}</div>
          </div>
        </div>
      </section>

      <div className="flex gap-2 flex-wrap">
        <button className="btn btn-primary" disabled={busy}>
          {busy ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          {initial ? "Update Purchase" : "Create Purchase"}
        </button>
        <Link href={backHref} className="btn btn-ghost">
          Back
        </Link>
      </div>
      <p className="help">
        weight_kg = bori × 70 + kg · amount = weight_kg ÷ 40 × rate (rate is quoted per 40 kg). All values are
        recalculated on the server when the bill is saved.
      </p>
    </form>
  );
}
