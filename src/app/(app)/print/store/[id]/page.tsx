import Link from "next/link";
import { and, asc, eq, gte, lte, sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PrintButton } from "@/components/PrintButton";
import { db } from "@/db";
import { storeLedger, stores } from "@/db/schema";
import { getSettings } from "@/lib/settings";
import { money, toNum } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function StoreStatementPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const storeId = Number(id);
  if (!Number.isInteger(storeId) || storeId <= 0) notFound();

  const store = (await db.select().from(stores).where(eq(stores.id, storeId)).limit(1))[0];
  if (!store) notFound();

  const from = sp.from && /^\d{4}-\d{2}-\d{2}$/.test(sp.from) ? sp.from : "";
  const to = sp.to && /^\d{4}-\d{2}-\d{2}$/.test(sp.to) ? sp.to : "";
  const filters = [eq(storeLedger.storeId, storeId)];
  if (from) filters.push(gte(storeLedger.transactionDate, from));
  if (to) filters.push(lte(storeLedger.transactionDate, to));

  const rows = await db
    .select()
    .from(storeLedger)
    .where(and(...filters))
    .orderBy(asc(storeLedger.transactionDate), asc(storeLedger.id));

  const settings = await getSettings();
  let running = 0;
  const withBalance = rows.map((r, i) => {
    running = running + toNum(r.credit) - toNum(r.debit);
    return { ...r, index: i + 1, balance: running };
  });
  const closing = running;
  const totalDebit = rows.reduce((s, r) => s + toNum(r.debit), 0);
  const totalCredit = rows.reduce((s, r) => s + toNum(r.credit), 0);

  return (
    <div>
      <div className="flex items-center gap-2 flex-wrap no-print" style={{ marginBottom: 16 }}>
        <Link href="/print/store" className="btn btn-ghost">
          <ArrowLeft size={15} /> Choose another store
        </Link>
        <PrintButton label="Print statement" />
      </div>

      <form className="sheet no-print" style={{ marginBottom: 16 }}>
        <div className="sheet-body flex gap-3 flex-wrap items-end">
          <div>
            <label className="field-label">From date (optional)</label>
            <input className="input" type="date" name="from" defaultValue={from} />
          </div>
          <div>
            <label className="field-label">To date (optional)</label>
            <input className="input" type="date" name="to" defaultValue={to} />
          </div>
          <button className="btn btn-ghost">Apply range</button>
        </div>
      </form>

      <div className="print-sheet">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: "0.07em" }}>{settings.shopName}</div>
            <div style={{ fontSize: 11 }}>{settings.shopAddress} | {settings.shopPhone}</div>
          </div>
          <div style={{ fontSize: 11, textAlign: "right" }}>
            <div>Report date: {new Date().toISOString().slice(0, 10)}</div>
            {from || to ? (
              <div>
                Range: {from || "start"} → {to || "today"}
              </div>
            ) : null}
          </div>
        </div>

        <div className="urdu" style={{ textAlign: "center", fontSize: 21, fontWeight: 700, margin: "12px 0 4px" }}>
          کھاتہ تفصیل: {store.storeName}
        </div>
        <div style={{ textAlign: "center", fontSize: 11, marginBottom: 12 }}>
          Account: <strong>{store.storeName}</strong> · Status: {store.status}
        </div>

        <table>
          <thead>
            <tr>
              <th style={{ width: 36 }}>#</th>
              <th style={{ width: 52 }}>ID</th>
              <th style={{ width: 82 }}>Date</th>
              <th>Description</th>
              <th style={{ width: 96 }}>Debit (بنام)</th>
              <th style={{ width: 96 }}>Credit (جمع)</th>
              <th style={{ width: 104 }}>Balance</th>
            </tr>
          </thead>
          <tbody>
            {withBalance.map((r) => (
              <tr key={r.id}>
                <td className="num">{r.index}</td>
                <td className="num">{r.id}</td>
                <td className="num">{r.transactionDate}</td>
                <td>{r.description}</td>
                <td className="num" style={{ textAlign: "right" }}>{toNum(r.debit) ? money(r.debit) : "-"}</td>
                <td className="num" style={{ textAlign: "right" }}>{toNum(r.credit) ? money(r.credit) : "-"}</td>
                <td className="num" style={{ textAlign: "right", fontWeight: 700 }}>{money(r.balance)}</td>
              </tr>
            ))}
            {!withBalance.length && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center" }}>No entries in this range.</td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={4} style={{ fontWeight: 700 }}>TOTAL</td>
              <td className="num" style={{ textAlign: "right" }}>{money(totalDebit)}</td>
              <td className="num" style={{ textAlign: "right" }}>{money(totalCredit)}</td>
              <td className="num" style={{ textAlign: "right" }}>{money(closing)}</td>
            </tr>
            <tr>
              <td colSpan={6} style={{ fontWeight: 700, textAlign: "right" }}>
                CLOSING BALANCE ({closing >= 0 ? "Credit جمع" : "Debit بنام"})
              </td>
              <td className="num" style={{ textAlign: "right", fontWeight: 700 }}>{money(Math.abs(closing))}</td>
            </tr>
          </tfoot>
        </table>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 52, fontSize: 11 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ borderTop: "1px solid #111", width: 180, paddingTop: 4 }}>Accountant Sign</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ borderTop: "1px solid #111", width: 180, paddingTop: 4 }}>Authorized Stamp</div>
          </div>
        </div>
      </div>
    </div>
  );
}
