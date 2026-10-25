"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarRange, ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";
import { money, num } from "@/lib/money";

export type PurchaseRow = {
  id: number;
  storeName: string;
  totalBori: number;
  totalWeight: number;
  totalAmount: number;
  purchaseDate: string;
};

export function PurchaseList({ rows }: { rows: PurchaseRow[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [range, setRange] = useState({ from: "", to: "" });
  const [reportOpen, setReportOpen] = useState(false);

  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase();
    if (!n) return rows;
    return rows
      .filter((r) => r.storeName.toLowerCase().includes(n) || String(r.id) === n)
      .slice(0, 50);
  }, [rows, q]);

  const pages = Math.max(1, Math.ceil(filtered.length / 10));
  const current = Math.min(page, pages);
  const slice = filtered.slice((current - 1) * 10, current * 10);

  return (
    <div>
      <div className="flex items-center gap-3 flex-wrap" style={{ marginBottom: 14 }}>
        <div style={{ position: "relative", flex: "1 1 240px", maxWidth: 400 }}>
          <Search size={15} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
          <input
            className="input"
            style={{ paddingLeft: 32 }}
            placeholder="Search by bill no. or store..."
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <button className="btn btn-dark" onClick={() => setReportOpen(true)}>
          <CalendarRange size={15} /> AVERAGE RATE
        </button>
        <Link href="/purchases/new" className="btn btn-primary">
          <Plus size={15} /> NEW PURCHASE
        </Link>
      </div>

      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th style={{ width: 80 }}>ID</th>
              <th>Store</th>
              <th className="right">Bags</th>
              <th className="right">Avg Rate</th>
              <th className="right">Amount</th>
              <th>Date</th>
              <th className="center" style={{ width: 90 }}>
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {slice.map((r) => {
              const avg = r.totalWeight > 0 ? r.totalAmount / (r.totalWeight / 40) : 0;
              return (
                <tr key={r.id}>
                  <td className="num" style={{ fontWeight: 700 }}>
                    PUR-{r.id}
                  </td>
                  <td style={{ fontWeight: 600 }}>{r.storeName}</td>
                  <td className="right num">{num(r.totalBori)}</td>
                  <td className="right num">{money(avg)}</td>
                  <td className="right num" style={{ fontWeight: 700 }}>
                    {money(r.totalAmount)}
                  </td>
                  <td className="num">{r.purchaseDate}</td>
                  <td className="center">
                    <Link href={`/purchases/${r.id}/edit`} className="btn btn-ghost" style={{ padding: "5px 10px" }}>
                      Edit
                    </Link>
                  </td>
                </tr>
              );
            })}
            {!slice.length && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", color: "var(--muted)", padding: 24 }}>
                  No purchase bills found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between" style={{ marginTop: 12 }}>
        <div className="micro">
          {filtered.length} bill(s) · page {current} of {pages}
        </div>
        <div className="flex gap-2">
          <button className="btn btn-ghost" disabled={current <= 1} onClick={() => setPage(current - 1)}>
            <ChevronLeft size={14} /> Prev
          </button>
          <button className="btn btn-ghost" disabled={current >= pages} onClick={() => setPage(current + 1)}>
            Next <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {reportOpen && (
        <div className="modal-backdrop no-print" onClick={(e) => e.target === e.currentTarget && setReportOpen(false)}>
          <div className="modal-card" style={{ maxWidth: 430 }}>
            <div className="sheet-head">
              <div>
                <div className="micro">Report</div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>Average Rate</div>
              </div>
            </div>
            <div className="sheet-body">
              <div className="form-grid grid-2">
                <div>
                  <label className="field-label">From date</label>
                  <input className="input" type="date" value={range.from} onChange={(e) => setRange({ ...range, from: e.target.value })} />
                </div>
                <div>
                  <label className="field-label">To date</label>
                  <input className="input" type="date" value={range.to} onChange={(e) => setRange({ ...range, to: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-2 justify-end" style={{ marginTop: 18 }}>
                <button className="btn btn-ghost" onClick={() => setReportOpen(false)}>
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  disabled={!range.from || !range.to}
                  onClick={() => router.push(`/purchases/report?from=${range.from}&to=${range.to}`)}
                >
                  Generate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
