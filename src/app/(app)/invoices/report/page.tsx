import { and, gte, lte, sql } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { invoices } from "@/db/schema";
import { money, num } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function InvoiceReportPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const sp = await searchParams;
  const from = sp.from && /^\d{4}-\d{2}-\d{2}$/.test(sp.from) ? sp.from : "";
  const to = sp.to && /^\d{4}-\d{2}-\d{2}$/.test(sp.to) ? sp.to : "";

  let totals = { bags: 0, corn: 0, weight: 0, count: 0 };
  let rows: { id: number; invoiceDate: string; vehicleNo: string; biltyNo: string; totalBori: number; corncost: string; total: string }[] = [];

  if (from && to) {
    const agg = await db
      .select({
        bags: sql<number>`coalesce(sum(${invoices.totalBori}),0)`,
        corn: sql<string>`coalesce(sum(${invoices.corncost}),0)`,
        weight: sql<string>`coalesce(sum(${invoices.totalWeight}),0)`,
        count: sql<number>`count(*)::int`,
      })
      .from(invoices)
      .where(and(gte(invoices.invoiceDate, from), lte(invoices.invoiceDate, to)));
    totals = {
      bags: Number(agg[0].bags),
      corn: Number(agg[0].corn),
      weight: Number(agg[0].weight),
      count: agg[0].count,
    };
    rows = await db
      .select({
        id: invoices.id,
        invoiceDate: invoices.invoiceDate,
        vehicleNo: invoices.vehicleNo,
        biltyNo: invoices.biltyNo,
        totalBori: invoices.totalBori,
        corncost: invoices.corncost,
        total: invoices.total,
      })
      .from(invoices)
      .where(and(gte(invoices.invoiceDate, from), lte(invoices.invoiceDate, to)))
      .orderBy(invoices.invoiceDate, invoices.id);
  }

  // Average per bag uses true weights (loose kg included).
  const avgPerBag = totals.weight > 0 ? totals.corn / (totals.weight / 40) : 0;

  return (
    <div>
      <div className="flex items-end justify-between gap-4 flex-wrap no-print" style={{ marginBottom: 16 }}>
        <div>
          <div className="micro">Invoices · Report</div>
          <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em" }}>Average Invoice</h1>
        </div>
        <Link href="/invoices" className="btn btn-ghost">Back to list</Link>
      </div>

      <form className="sheet no-print" style={{ marginBottom: 18 }}>
        <div className="sheet-body flex gap-3 flex-wrap items-end">
          <div>
            <label className="field-label">From date</label>
            <input className="input" type="date" name="from" defaultValue={from} required />
          </div>
          <div>
            <label className="field-label">To date</label>
            <input className="input" type="date" name="to" defaultValue={to} required />
          </div>
          <button className="btn btn-primary">Calculate</button>
        </div>
      </form>

      {from && to ? (
        <div className="print-sheet">
          <div style={{ textAlign: "center", borderBottom: "2px solid #111", paddingBottom: 10, marginBottom: 12 }}>
            <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: "0.06em" }}>HAMDAN COMMISSION SHOP</div>
            <div style={{ fontSize: 11 }}>29/B Grain Market, Arifwala | 0300-0070010</div>
            <div style={{ fontSize: 11.5, marginTop: 6, fontWeight: 600 }}>
              AVERAGE INVOICE REPORT · {from} to {to}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Total Bags</th>
                <th>Total Corn Cost</th>
                <th>Average per Bag</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="num" style={{ textAlign: "right", fontSize: 15, fontWeight: 700 }}>{num(totals.bags, 0)}</td>
                <td className="num" style={{ textAlign: "right", fontSize: 15, fontWeight: 700 }}>{money(totals.corn)}</td>
                <td className="num" style={{ textAlign: "right", fontSize: 15, fontWeight: 700 }}>{money(avgPerBag)}</td>
              </tr>
            </tbody>
          </table>

          <table style={{ marginTop: 16 }}>
            <thead>
              <tr>
                <th>Bill</th>
                <th>Date</th>
                <th>Truck</th>
                <th>Bilty</th>
                <th>Bags</th>
                <th>Corn Cost</th>
                <th>Net Payable</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>#{r.id}</td>
                  <td>{r.invoiceDate}</td>
                  <td>{r.vehicleNo.toUpperCase()}</td>
                  <td>{r.biltyNo}</td>
                  <td className="num" style={{ textAlign: "right" }}>{num(r.totalBori, 0)}</td>
                  <td className="num" style={{ textAlign: "right" }}>{money(r.corncost)}</td>
                  <td className="num" style={{ textAlign: "right" }}>{money(r.total)}</td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center" }}>No invoices in this range.</td>
                </tr>
              )}
            </tbody>
          </table>

          <div style={{ marginTop: 22, display: "flex", justifyContent: "space-between", fontSize: 11 }}>
            <div>Prepared by: ____________________</div>
            <div>{totals.count} invoice(s) · printed {new Date().toLocaleString("en-PK")}</div>
          </div>
        </div>
      ) : (
        <div className="sheet">
          <div className="sheet-body" style={{ color: "var(--muted)" }}>
            Choose a date range and press Calculate to build the printable report.
          </div>
        </div>
      )}
    </div>
  );
}
