"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Plus, Printer, Save, Trash2 } from "lucide-react";
import { ensureCsrf } from "./AppShellClientBridge";
import { SearchSelect, Option } from "./SearchSelect";
import { ChargeOverrides, ChargeRates, computeInvoiceTotals, money, num } from "@/lib/money";

type Line = { key: number; storeId: number | null; qtyBori: string; qtyKg: string; rate: string };
type OverrideKey = "commission" | "labour" | "thread" | "plasticBag" | "marketFee";
type OverrideState = Record<OverrideKey, { on: boolean; value: string }>;

const EMPTY_OVERRIDES: OverrideState = {
  commission: { on: false, value: "" },
  labour: { on: false, value: "" },
  thread: { on: false, value: "" },
  plasticBag: { on: false, value: "" },
  marketFee: { on: false, value: "" },
};

export type InvoiceInitial = {
  id: number;
  invoiceDate: string;
  agentCode: string;
  biltyNo: string;
  vehicleNo: string;
  permitNo: string | null;
  brokery: number;
  rateSnapshot: ChargeRates;
  chargeOverrides: Partial<Record<OverrideKey, number>>;
  lines: { storeId: number; storeName: string; qtyBori: number; qtyKg: number; rate: number }[];
};

export function InvoiceForm({
  stores,
  rates,
  labels,
  initial,
  backHref = "/invoices",
}: {
  stores: Option[];
  rates: ChargeRates;
  labels: { commission: string; labour: string; thread: string; plasticBag: string; marketFee: string; brokery: string };
  initial?: InvoiceInitial;
  backHref?: string;
}) {
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(initial?.invoiceDate ?? today);
  const [agentCode, setAgentCode] = useState(initial?.agentCode ?? "160018");
  const [biltyNo, setBiltyNo] = useState(initial?.biltyNo ?? "");
  const [vehicleNo, setVehicleNo] = useState(initial?.vehicleNo ?? "");
  const [permitNo, setPermitNo] = useState(initial?.permitNo ?? "");
  const [brokery, setBrokery] = useState(initial ? String(initial.brokery) : "0");
  const [lines, setLines] = useState<Line[]>(
    initial?.lines.map((l, i) => ({
      key: i + 1,
      storeId: l.storeId,
      qtyBori: String(l.qtyBori),
      qtyKg: String(l.qtyKg),
      rate: String(l.rate),
    })) ?? [{ key: 1, storeId: null, qtyBori: "", qtyKg: "", rate: "" }],
  );
  const [overrides, setOverrides] = useState<OverrideState>(() => {
    const base = { ...EMPTY_OVERRIDES };
    if (initial?.chargeOverrides) {
      for (const [k, v] of Object.entries(initial.chargeOverrides)) {
        if (v !== undefined && v !== null) {
          (base as any)[k] = { on: true, value: String(v) };
        }
      }
    }
    return base;
  });
  const [recalculate, setRecalculate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const activeRates: ChargeRates = rates;
  const overrideValues: ChargeOverrides = {};
  (Object.keys(overrides) as OverrideKey[]).forEach((k) => {
    if (overrides[k].on && overrides[k].value !== "") overrideValues[k] = Number(overrides[k].value);
  });

  const totals = useMemo(
    () =>
      computeInvoiceTotals(
        lines.map((l) => ({ qtyBori: Number(l.qtyBori || 0), qtyKg: Number(l.qtyKg || 0), rate: Number(l.rate || 0) })),
        activeRates,
        overrideValues,
        Number(brokery || 0),
      ),
    [lines, activeRates, brokery, JSON.stringify(overrideValues)],
  );

  function update(key: number, patch: Partial<Line>) {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (lines.some((l) => l.storeId === null)) {
      setError("Every item line needs a shop name.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/invoices", {
        method: initial ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": await ensureCsrf() },
        body: JSON.stringify({
          id: initial?.id,
          invoiceDate: date,
          agentCode,
          biltyNo,
          vehicleNo,
          permitNo,
          brokery: brokery || 0,
          lines: lines.map((l) => ({
            storeId: l.storeId,
            qtyBori: l.qtyBori || 0,
            qtyKg: l.qtyKg || 0,
            rate: l.rate || 0,
          })),
          overrides: overrideValues,
          recalculate: initial ? recalculate : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Unable to save the invoice.");
        setBusy(false);
        return;
      }
      router.push(`/invoices/${json.data.id}/print?msg=Invoice saved successfully.`);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setBusy(false);
    }
  }

  const chargeRows: { key: OverrideKey; label: string; value: number }[] = [
    { key: "commission", label: labels.commission, value: totals.commission },
    { key: "labour", label: labels.labour, value: totals.labour },
    { key: "thread", label: labels.thread, value: totals.thread },
    { key: "plasticBag", label: labels.plasticBag, value: totals.plasticBag },
    { key: "marketFee", label: labels.marketFee, value: totals.marketFee },
  ];

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
            <div className="micro">{initial ? `Invoice #${initial.id}` : "New bill"}</div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Create New Bill</div>
          </div>
          {initial && (
            <label className="flex items-center gap-2" style={{ fontSize: 12.2, color: "var(--muted)" }}>
              <input type="checkbox" checked={recalculate} onChange={(e) => setRecalculate(e.target.checked)} />
              Recalculate with current rates
            </label>
          )}
        </div>

        <div
          className="sheet-body"
          style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))" }}
        >
          <div>
            <label className="field-label">Date</label>
            <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div>
            <label className="field-label">Agent Code</label>
            <input className="input" value={agentCode} onChange={(e) => setAgentCode(e.target.value)} maxLength={50} />
          </div>
          <div>
            <label className="field-label">Bilty No.</label>
            <input className="input" value={biltyNo} onChange={(e) => setBiltyNo(e.target.value)} maxLength={50} required />
          </div>
          <div>
            <label className="field-label">Vehicle No.</label>
            <input className="input" value={vehicleNo} onChange={(e) => setVehicleNo(e.target.value)} maxLength={50} required />
          </div>
          <div>
            <label className="field-label">Permit Number</label>
            <input className="input" value={permitNo} onChange={(e) => setPermitNo(e.target.value)} maxLength={50} placeholder="---" />
          </div>
        </div>

        <div className="table-wrap" style={{ border: "none", borderRadius: 0 }}>
          <table className="data">
            <thead>
              <tr>
                <th style={{ width: 46 }}>#</th>
                <th style={{ minWidth: 220 }}>Shop Name</th>
                <th style={{ width: 100 }}>Bori</th>
                <th style={{ width: 100 }}>Kg</th>
                <th style={{ width: 100 }}>Rate</th>
                <th className="right" style={{ width: 115 }}>Weight</th>
                <th className="right" style={{ width: 130 }}>Amount</th>
                <th className="center" style={{ width: 110 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l, i) => (
                <tr key={l.key}>
                  <td className="num">{i + 1}</td>
                  <td>
                    <SearchSelect
                      options={stores}
                      value={l.storeId}
                      onChange={(id) => update(l.key, { storeId: id })}
                      placeholder="Search shop name..."
                    />
                  </td>
                  <td>
                    <input className="input" type="number" step="any" min="0" value={l.qtyBori}
                      onChange={(e) => update(l.key, { qtyBori: e.target.value })} placeholder="0" />
                  </td>
                  <td>
                    <input className="input" type="number" step="any" min="0" value={l.qtyKg}
                      onChange={(e) => update(l.key, { qtyKg: e.target.value })} placeholder="0" />
                  </td>
                  <td>
                    <input className="input" type="number" step="any" min="0" value={l.rate}
                      onChange={(e) => update(l.key, { rate: e.target.value })} placeholder="0.00" />
                  </td>
                  <td className="right num">{num(totals.lines[i]?.weight ?? 0)}</td>
                  <td className="right num" style={{ fontWeight: 700 }}>{money(totals.lines[i]?.amount ?? 0)}</td>
                  <td className="center">
                    <div className="flex gap-1 justify-center">
                      <button type="button" className="btn btn-ghost" style={{ padding: "5px 8px" }} title="Add row"
                        onClick={() =>
                          setLines((prev) => [...prev, { key: Date.now(), storeId: l.storeId, qtyBori: "", qtyKg: "", rate: "" }])
                        }>
                        <Plus size={13} />
                      </button>
                      <button type="button" className="btn btn-danger" style={{ padding: "5px 8px" }} title="Remove row"
                        onClick={() => setLines((prev) => (prev.length > 1 ? prev.filter((x) => x.key !== l.key) : prev))}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* two-column ruled summary block */}
        <div
          className="sheet-body"
          style={{ display: "grid", gap: 18, gridTemplateColumns: "minmax(0,1.25fr) minmax(0,1fr)", borderTop: "1px solid var(--paper-edge)" }}
        >
          <div>
            <div className="micro" style={{ marginBottom: 8 }}>Expenses / Charges</div>
            {chargeRows.map((c) => (
              <div
                key={c.key}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: "1px dashed var(--rule)" }}
              >
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--muted)", width: 84 }}>
                  <input
                    type="checkbox"
                    checked={overrides[c.key].on}
                    onChange={(e) =>
                      setOverrides({ ...overrides, [c.key]: { on: e.target.checked, value: overrides[c.key].value } })
                    }
                  />
                  override
                </label>
                <span style={{ flex: 1, fontSize: 12.8, fontWeight: 600 }}>{c.label}</span>
                {overrides[c.key].on ? (
                  <input
                    className="input"
                    style={{ width: 130, textAlign: "right" }}
                    type="number"
                    step="0.01"
                    min="0"
                    value={overrides[c.key].value}
                    onChange={(e) =>
                      setOverrides({ ...overrides, [c.key]: { on: true, value: e.target.value } })
                    }
                  />
                ) : (
                  <span className="num" style={{ width: 130, textAlign: "right", fontWeight: 700 }}>{money(c.value)}</span>
                )}
              </div>
            ))}
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0" }}>
              <span style={{ width: 84 }} />
              <span style={{ flex: 1, fontSize: 12.8, fontWeight: 600 }}>{labels.brokery}</span>
              <input
                className="input"
                style={{ width: 130, textAlign: "right" }}
                type="number"
                step="0.01"
                min="0"
                value={brokery}
                onChange={(e) => setBrokery(e.target.value)}
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, borderTop: "2px solid var(--ink)", paddingTop: 8 }}>
              <span style={{ width: 84 }} />
              <span style={{ flex: 1, fontSize: 12, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                Total Exp
              </span>
              <span className="num" style={{ width: 130, textAlign: "right", fontWeight: 700 }}>
                {money(totals.commission + totals.labour + totals.thread + totals.plasticBag + totals.marketFee + totals.brokery)}
              </span>
            </div>
          </div>

          <div>
            <div className="micro" style={{ marginBottom: 8 }}>Totals</div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid var(--rule)" }}>
              <span style={{ fontSize: 12.8, fontWeight: 600 }}>Total Bori</span>
              <span className="num" style={{ fontWeight: 700 }}>{num(totals.totalBori, 0)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid var(--rule)" }}>
              <span style={{ fontSize: 12.8, fontWeight: 600 }}>Total Weight</span>
              <span className="num" style={{ fontWeight: 700 }}>{num(totals.totalWeight)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid var(--rule)" }}>
              <span style={{ fontSize: 12.8, fontWeight: 600 }}>Gross Amount (Corn Cost)</span>
              <span className="num" style={{ fontWeight: 700 }}>{money(totals.corncost)}</span>
            </div>
            <div
              style={{
                marginTop: 12,
                background: "var(--slate-deep)",
                color: "#fff",
                padding: "14px 16px",
                borderRadius: 3,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div className="micro" style={{ color: "#7dd3fc" }}>NET PAYABLE</div>
                <div style={{ fontSize: 11, color: "#cbd5e1" }}>gross + all charges</div>
              </div>
              <div className="num" style={{ fontSize: 25, fontWeight: 700, letterSpacing: "-0.02em" }}>
                Rs. {money(totals.total)}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="flex gap-2 flex-wrap">
        <button className="btn btn-primary" disabled={busy}>
          {busy ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} SAVE DATA
        </button>
        {initial && (
          <Link href={`/invoices/${initial.id}/print`} className="btn btn-dark">
            <Printer size={15} /> PRINT
          </Link>
        )}
        {!initial && (
          <button type="button" className="btn btn-ghost" onClick={() => window.print()}>
            <Printer size={15} /> PRINT
          </button>
        )}
        <Link href={backHref} className="btn btn-ghost">
          Back
        </Link>
      </div>
      <p className="help">
        weight = bori × 70 + kg · amount = weight ÷ 40 × rate. Charges are added on top of the gross corn cost.
        The browser only previews the calculation — the server recalculates every value before saving.
      </p>
    </form>
  );
}
