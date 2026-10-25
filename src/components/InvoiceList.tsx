"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarRange, ChevronLeft, ChevronRight, Plus, Printer, Search, Trash2 } from "lucide-react";
import { ensureCsrf, refreshCsrf } from "./AppShellClientBridge";
import { money, num } from "@/lib/money";

export type InvoiceRow = {
  id: number;
  invoiceDate: string;
  vehicleNo: string;
  biltyNo: string;
  permitNo: string | null;
  totalBori: number;
  corncost: number;
  total: number;
};

export function InvoiceList({ rows }: { rows: InvoiceRow[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [range, setRange] = useState({ from: "", to: "" });
  const [reportOpen, setReportOpen] = useState(false);

  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase();
    if (!n) return rows;
    return rows
      .filter(
        (r) =>
          String(r.id) === n ||
          r.vehicleNo.toLowerCase().includes(n) ||
          r.biltyNo.toLowerCase().includes(n) ||
          (r.permitNo ?? "").toLowerCase().includes(n),
      )
      .slice(0, 50);
  }, [rows, q]);

  const pages = Math.max(1, Math.ceil(filtered.length / 10));
  const current = Math.min(page, pages);
  const slice = filtered.slice((current - 1) * 10, current * 10);

  async function voidInvoice(id: number) {
    if (!confirm(`Void invoice #${id}? This removes the bill and its ledger entries.`)) return;
    const res = await fetch("/api/invoices", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", "x-csrf-token": await ensureCsrf() },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      router.refresh();
      return;
    }
    let json = await res.json().catch(() => ({} as any));
    if (res.status === 403) {
      // stale token: retry once with a freshly issued one
      const fresh = await refreshCsrf();
      const retry = await fetch("/api/invoices", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", "x-csrf-token": fresh },
        body: JSON.stringify({ id }),
      });
      if (retry.ok) {
        router.refresh();
        return;
      }
      json = await retry.json().catch(() => ({} as any));
    }
    alert(json.error || "Unable to void the invoice.");
  }

  return (
    <div>
      <div className="flex items-center gap-3 flex-wrap" style={{ marginBottom: 14 }}>
        <div style={{ position: "relative", flex: "1 1 240px", maxWidth: 400 }}>
          <Search size={15} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
          <input
            className="input"
            style={{ paddingLeft: 32 }}
            placeholder="Search bill no., truck, bilty or permit..."
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <button className="btn btn-dark" onClick={() => setReportOpen(true)}>
          <CalendarRange size={15} /> AVERAGE INVOICE
        </button>
        <Link href="/invoices/new" className="btn btn-primary">
          <Plus size={15} /> NEW INVOICE
        </Link>
      </div>

      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Bill No.</th>
              <th>Vehicle</th>
              <th>Bilty</th>
              <th>Permit</th>
              <th className="right">Bags</th>
              <th className="right">Corn Cost</th>
              <th className="right">Net Amt</th>
              <th>Date</th>
              <th className="center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {slice.map((r) => (
              <tr key={r.id}>
                <td style={{ fontWeight: 700 }} className="num">#{r.id}</td>
                <td><span className="badge badge-slate">{r.vehicleNo.toUpperCase()}</span></td>
                <td><span className="badge badge-green">{r.biltyNo}</span></td>
                <td>
                  {r.permitNo ? <span className="badge badge-amber">{r.permitNo}</span> : <span style={{ color: "var(--muted)" }}>---</span>}
                </td>
                <td className="right num">{num(r.totalBori, 0)}</td>
                <td className="right num">{money(r.corncost)}</td>
                <td className="right num" style={{ fontWeight: 700 }}>{money(r.total)}</td>
                <td className="num">{r.invoiceDate}</td>
                <td className="center">
                  <div className="flex gap-1 justify-center">
                    <Link href={`/invoices/${r.id}/edit`} className="btn btn-ghost" style={{ padding: "5px 9px" }}>
                      Edit
                    </Link>
                    <Link href={`/invoices/${r.id}/print`} className="btn btn-ghost" style={{ padding: "5px 9px" }}>
                      <Printer size={13} /> Print
                    </Link>
                    <button className="btn btn-danger" style={{ padding: "5px 9px" }} onClick={() => voidInvoice(r.id)} title="Void bill">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!slice.length && (
              <tr>
                <td colSpan={9} style={{ textAlign: "center", color: "var(--muted)", padding: 24 }}>
                  No invoices found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between" style={{ marginTop: 12 }}>
        <div className="micro">{filtered.length} bill(s) · page {current} of {pages}</div>
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
                <div style={{ fontWeight: 700, fontSize: 16 }}>Average Invoice</div>
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
                <button className="btn btn-ghost" onClick={() => setReportOpen(false)}>Cancel</button>
                <button
                  className="btn btn-primary"
                  disabled={!range.from || !range.to}
                  onClick={() => router.push(`/invoices/report?from=${range.from}&to=${range.to}`)}
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
