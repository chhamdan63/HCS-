"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";
import { money } from "@/lib/money";

export type LedgerRowData = {
  id: number;
  storeName: string;
  description: string;
  debit: number;
  credit: number;
  transactionDate: string;
};

export function LedgerList({ rows }: { rows: LedgerRowData[] }) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase();
    if (!n) return rows;
    return rows
      .filter(
        (r) =>
          r.storeName.toLowerCase().includes(n) ||
          r.description.toLowerCase().includes(n) ||
          String(r.id) === n,
      )
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
            placeholder="Search store, description or ID..."
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <Link href="/ledger/new" className="btn btn-primary">
          <Plus size={15} /> ADD TRANSACTION
        </Link>
      </div>

      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th style={{ width: 60 }}>Sr No</th>
              <th style={{ width: 60 }}>ID</th>
              <th>Store</th>
              <th>Description</th>
              <th className="right">Debit (Out)</th>
              <th className="right">Credit (In)</th>
              <th>Date</th>
              <th className="center" style={{ width: 90 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {slice.map((r, i) => (
              <tr key={r.id}>
                <td className="num">{(current - 1) * 10 + i + 1}</td>
                <td className="num">{r.id}</td>
                <td style={{ fontWeight: 600 }}>{r.storeName}</td>
                <td>{r.description}</td>
                <td className="right num" style={{ color: r.debit > 0 ? "var(--danger)" : "var(--muted)" }}>
                  {r.debit > 0 ? money(r.debit) : "-"}
                </td>
                <td className="right num" style={{ color: r.credit > 0 ? "var(--accent-dark)" : "var(--muted)" }}>
                  {r.credit > 0 ? money(r.credit) : "-"}
                </td>
                <td className="num">{r.transactionDate}</td>
                <td className="center">
                  <Link href={`/ledger/${r.id}/edit`} className="btn btn-ghost" style={{ padding: "5px 10px" }}>
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {!slice.length && (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", color: "var(--muted)", padding: 24 }}>
                  No manual transactions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between" style={{ marginTop: 12 }}>
        <div className="micro">{filtered.length} transaction(s) · page {current} of {pages}</div>
        <div className="flex gap-2">
          <button className="btn btn-ghost" disabled={current <= 1} onClick={() => setPage(current - 1)}>
            <ChevronLeft size={14} /> Prev
          </button>
          <button className="btn btn-ghost" disabled={current >= pages} onClick={() => setPage(current + 1)}>
            Next <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
