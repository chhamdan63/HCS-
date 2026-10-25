"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Search, Loader2, X } from "lucide-react";
import { ensureCsrf } from "./AppShellClientBridge";

export type StoreRow = {
  id: number;
  storeName: string;
  storeAddress: string | null;
  storePhone: string | null;
  storeBank: string | null;
  status: "Active" | "Inactive" | "Fixed";
  debit: number;
  credit: number;
  balance: number;
};

const EMPTY = { storeName: "", storeAddress: "", storePhone: "", storeBank: "", status: "Active" as string };

export function StoreManager({ rows }: { rows: StoreRow[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<StoreRow | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter(
      (r) =>
        r.storeName.toLowerCase().includes(needle) ||
        String(r.id) === needle ||
        (r.storePhone ?? "").includes(needle),
    );
  }, [rows, q]);

  function openAdd() {
    setEditing(null);
    setForm(EMPTY);
    setError(null);
    setOpen(true);
  }

  function openEdit(row: StoreRow) {
    setEditing(row);
    setForm({
      storeName: row.storeName,
      storeAddress: row.storeAddress ?? "",
      storePhone: row.storePhone ?? "",
      storeBank: row.storeBank ?? "",
      status: row.status,
    });
    setError(null);
    setOpen(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/stores", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": await ensureCsrf() },
        body: JSON.stringify(editing ? { id: editing.id, ...form } : form),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Unable to save the store.");
        setBusy(false);
        return;
      }
      setOpen(false);
      setBusy(false);
      setNotice(editing ? "Store updated." : "Store added.");
      setTimeout(() => setNotice(null), 4000);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3 flex-wrap" style={{ marginBottom: 14 }}>
        <div style={{ position: "relative", flex: "1 1 260px", maxWidth: 420 }}>
          <Search
            size={15}
            style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }}
          />
          <input
            className="input"
            style={{ paddingLeft: 32 }}
            placeholder="Search store name, ID or phone..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={15} /> ADD STORE
        </button>
      </div>

      {notice && (
        <div className="flash no-print" style={{ background: "var(--accent)", color: "#fff" }}>
          {notice}
        </div>
      )}

      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th style={{ width: 60 }}>ID</th>
              <th>Store Name</th>
              <th className="right">Total Debit</th>
              <th className="right">Total Credit</th>
              <th className="right">Closing Balance</th>
              <th className="center">Status</th>
              <th className="center" style={{ width: 80 }}>
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id}>
                <td className="num">{r.id}</td>
                <td style={{ fontWeight: 600 }}>
                  {r.storeName}
                  {r.storeAddress ? (
                    <div style={{ fontWeight: 400, color: "var(--muted)", fontSize: 11.5 }}>{r.storeAddress}</div>
                  ) : null}
                </td>
                <td className="right num">{r.debit.toLocaleString("en-PK", { minimumFractionDigits: 2 })}</td>
                <td className="right num">{r.credit.toLocaleString("en-PK", { minimumFractionDigits: 2 })}</td>
                <td className={`right num ${r.balance >= 0 ? "pos" : "neg"}`}>
                  {r.balance.toLocaleString("en-PK", { minimumFractionDigits: 2 })}
                </td>
                <td className="center">
                  <span
                    className={`badge ${
                      r.status === "Fixed" ? "badge-amber" : r.status === "Active" ? "badge-green" : "badge-slate"
                    }`}
                  >
                    {r.status}
                  </span>
                </td>
                <td className="center">
                  <button className="btn btn-ghost" style={{ padding: "5px 9px" }} onClick={() => openEdit(r)}>
                    <Pencil size={13} /> Edit
                  </button>
                </td>
              </tr>
            ))}
            {!filtered.length && (
              <tr>
                <td colSpan={7} style={{ color: "var(--muted)", padding: 22, textAlign: "center" }}>
                  No stores match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="modal-backdrop no-print" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="modal-card">
            <div className="sheet-head">
              <div>
                <div className="micro">{editing ? "Edit account" : "New account"}</div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{editing ? editing.storeName : "Add Store"}</div>
              </div>
              <button className="btn btn-ghost" style={{ padding: "6px 9px" }} onClick={() => setOpen(false)}>
                <X size={15} />
              </button>
            </div>
            <form onSubmit={save} className="sheet-body">
              <div style={{ marginBottom: 13 }}>
                <label className="field-label">Store Name</label>
                <input
                  className="input"
                  value={form.storeName}
                  onChange={(e) => setForm({ ...form, storeName: e.target.value })}
                  required
                  disabled={editing?.status === "Fixed"}
                  placeholder="e.g. Hamdan Afzal Ch"
                />
                {editing?.status === "Fixed" && (
                  <div className="help">Fixed system accounts cannot be renamed.</div>
                )}
              </div>
              <div style={{ marginBottom: 13 }}>
                <label className="field-label">Address</label>
                <input
                  className="input"
                  value={form.storeAddress}
                  onChange={(e) => setForm({ ...form, storeAddress: e.target.value })}
                />
              </div>
              <div className="form-grid grid-2" style={{ marginBottom: 13 }}>
                <div>
                  <label className="field-label">Phone</label>
                  <input
                    className="input"
                    value={form.storePhone}
                    onChange={(e) => setForm({ ...form, storePhone: e.target.value })}
                    maxLength={20}
                  />
                </div>
                <div>
                  <label className="field-label">Bank</label>
                  <input
                    className="input"
                    value={form.storeBank}
                    onChange={(e) => setForm({ ...form, storeBank: e.target.value })}
                    maxLength={100}
                  />
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label className="field-label">Status</label>
                <select
                  className="select"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  disabled={editing?.status === "Fixed"}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  {editing?.status === "Fixed" && <option value="Fixed">Fixed</option>}
                </select>
              </div>

              {error && (
                <div
                  style={{
                    background: "var(--danger-tint)",
                    color: "var(--danger)",
                    border: "1px solid #fca5a5",
                    padding: "9px 12px",
                    borderRadius: 3,
                    fontSize: 12.5,
                    fontWeight: 600,
                    marginBottom: 14,
                  }}
                >
                  {error}
                </div>
              )}

              <div className="flex gap-2 justify-end">
                <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>
                  Cancel
                </button>
                <button className="btn btn-primary" disabled={busy}>
                  {busy ? <Loader2 size={14} className="animate-spin" /> : null}
                  {editing ? "Save Changes" : "Create Store"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
