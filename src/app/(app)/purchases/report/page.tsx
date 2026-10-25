import Link from "next/link";
import { and, gte, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { purchases } from "@/db/schema";
import { money, num } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function PurchaseReportPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const sp = await searchParams;
  const from = sp.from && /^\d{4}-\d{2}-\d{2}$/.test(sp.from) ? sp.from : "";
  const to = sp.to && /^\d{4}-\d{2}-\d{2}$/.test(sp.to) ? sp.to : "";

  let totals = { bags: 0, weight: 0, amount: 0, count: 0 };
  let rows: { id: number; storeName: string; purchaseDate: string; totalBori: string; totalWeight: string; totalAmount: string }[] = [];

  if (from && to) {
    const agg = await db
      .select({
        bags: sql<string>`coalesce(sum(${purchases.totalBori}),0)`,
        weight: sql<string>`coalesce(sum(${purchases.totalWeight}),0)`,
        amount: sql<string>`coalesce(sum(${purchases.totalAmount}),0)`,
        count: sql<number>`count(*)::int`,
      })
      .from(purchases)
      .where(and(gte(purchases.purchaseDate, from), lte(purchases.purchaseDate, to)));
    totals = {
      bags: Number(agg[0].bags),
      weight: Number(agg[0].weight),
      amount: Number(agg[0].amount),
      count: agg[0].count,
    };
    rows = await db
      .select()
      .from(purchases)
      .where(and(gte(purchases.purchaseDate, from), lte(purchases.purchaseDate, to)))
      .orderBy(purchases.purchaseDate, purchases.id);
  }

  // Average rate uses the true weights (loose kg included): amount / (sum weight / 40)
  const avgRate = totals.weight > 0 ? totals.amount / (totals.weight / 40) : 0;

  return (
    <div>
      <div className="flex items-end justify-between gap-4 flex-wrap no-print" style={{ marginBottom: 16 }}>
        <div>
          <div className="micro">Purchase · Report</div>
          <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em" }}>Average Rate</h1>
        </div>
        <Link href="/purchases" className="btn btn-ghost">
          Back to list
        </Link>
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
              PURCHASE AVERAGE RATE REPORT · {from} to {to}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style={{ width: "26%" }}>Total Weight (Bags)</th>
                <th style={{ width: "26%" }}>Total Weight (Kg)</th>
                <th style={{ width: "24%" }}>Average Rate</th>
                <th style={{ width: "24%" }}>Total Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="num" style={{ textAlign: "right", fontSize: 15, fontWeight: 700 }}>
                  {num(totals.bags)}
                </td>
                <td className="num" style={{ textAlign: "right", fontSize: 15, fontWeight: 700 }}>
                  {num(totals.weight)}
                </td>
                <td className="num" style={{ textAlign: "right", fontSize: 15, fontWeight: 700 }}>
                  {money(avgRate)}
                </td>
                <td className="num" style={{ textAlign: "right", fontSize: 15, fontWeight: 700 }}>
                  {money(totals.amount)}
                </td>
              </tr>
            </tbody>
          </table>

          <table style={{ marginTop: 16 }}>
            <thead>
              <tr>
                <th>Bill</th>
                <th>Date</th>
                <th>Store</th>
                <th>Bags</th>
                <th>Weight (Kg)</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>PUR-{r.id}</td>
                  <td>{r.purchaseDate}</td>
                  <td>{r.storeName}</td>
                  <td className="num" style={{ textAlign: "right" }}>{num(Number(r.totalBori))}</td>
                  <td className="num" style={{ textAlign: "right" }}>{num(Number(r.totalWeight))}</td>
                  <td className="num" style={{ textAlign: "right" }}>{money(r.totalAmount)}</td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center" }}>
                    No purchase bills in this range.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div style={{ marginTop: 22, display: "flex", justifyContent: "space-between", fontSize: 11 }}>
            <div>Prepared by: ____________________</div>
            <div>{totals.count} bill(s) · printed {new Date().toLocaleString("en-PK")}</div>
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
