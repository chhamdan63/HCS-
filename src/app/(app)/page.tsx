import Link from "next/link";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { invoices, purchases, storeLedger, stores } from "@/db/schema";
import { getSettings } from "@/lib/settings";
import { money, num } from "@/lib/money";

export const dynamic = "force-dynamic";

function karachiToday() {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Karachi",
  }).format(new Date());
}

export default async function Dashboard() {
  const settings = await getSettings();

  const [inv] = await db.select({ c: sql<number>`count(*)::int` }).from(invoices);
  const [purch] = await db.select({ c: sql<number>`count(*)::int` }).from(purchases);
  const [st] = await db.select({ c: sql<number>`count(*)::int` }).from(stores);
  const [bags] = await db.select({ v: sql<number>`coalesce(sum(${invoices.totalBori}),0)` }).from(invoices);
  const [gross] = await db.select({ v: sql<string>`coalesce(sum(${invoices.corncost}),0)` }).from(invoices);
  const [monthGross] = await db
    .select({ v: sql<string>`coalesce(sum(${invoices.corncost}),0)` })
    .from(invoices)
    .where(sql`to_char(${invoices.invoiceDate}::date, 'YYYY-MM') = to_char(current_date, 'YYYY-MM')`);

  const balances = await db
    .select({
      storeName: storeLedger.storeName,
      credit: sql<string>`coalesce(sum(${storeLedger.credit}),0)`,
      debit: sql<string>`coalesce(sum(${storeLedger.debit}),0)`,
    })
    .from(storeLedger)
    .groupBy(storeLedger.storeName)
    .orderBy(sql`abs(coalesce(sum(${storeLedger.credit}),0) - coalesce(sum(${storeLedger.debit}),0)) desc`)
    .limit(5);

  const cards = [
    { label: "Total Invoices", value: num(inv.c, 0), href: "/invoices", sub: "Bills dispatched to PIC CORN" },
    { label: "Total Stores", value: num(st.c, 0), href: "/stores", sub: "Accounts in the ledger" },
    { label: "Total Purchases", value: num(purch.c, 0), href: "/purchases", sub: "Purchase bills" },
    {
      label: "Total Bags (Bori)",
      value: num(bags.v, 0),
      href: "/invoices",
      sub: `Gross corn cost Rs. ${money(gross.v)}`,
    },
  ];

  return (
    <div>
      <div className="flex items-end justify-between gap-4 flex-wrap mb-5">
        <div>
          <div className="micro">Business Overview</div>
          <h1 style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.02em", marginTop: 4 }}>
            {settings.shopName}
          </h1>
          <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 2 }}>
            {settings.shopAddress} · {settings.shopPhone}
          </p>
        </div>
        <div
          className="sheet"
          style={{ padding: "10px 16px", borderLeft: "3px solid var(--accent)" }}
        >
          <div className="micro">Today</div>
          <div style={{ fontWeight: 600, fontSize: 13.5 }}>{karachiToday()}</div>
        </div>
      </div>

      <div className="grid form-grid grid-2" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))" }}>
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="stat">
            <div className="micro">{c.label}</div>
            <div className="stat-value num" style={{ marginTop: 8 }}>
              {c.value}
            </div>
            <div style={{ color: "var(--muted)", fontSize: 11.5, marginTop: 6 }}>{c.sub}</div>
          </Link>
        ))}
      </div>

      <div className="grid form-grid grid-2" style={{ marginTop: 22, gridTemplateColumns: "1fr 1fr" }}>
        <section className="sheet">
          <div className="sheet-head">
            <div>
              <div className="micro">Extra</div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>This month</div>
            </div>
            <Link href="/invoices/report" className="btn btn-ghost">
              Average Invoice
            </Link>
          </div>
          <div className="sheet-body">
            <div className="micro">Gross corn cost billed</div>
            <div className="num" style={{ fontSize: 34, fontWeight: 700, letterSpacing: "-0.02em" }}>
              Rs. {money(monthGross.v)}
            </div>
            <p className="help">
              Charges (commission, labour, thread, plastic bag, market fee, brokery) are added on top of the
              gross corn cost when the net payable is calculated.
            </p>
          </div>
        </section>

        <section className="sheet">
          <div className="sheet-head">
            <div>
              <div className="micro">Extra</div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>Top 5 balances</div>
            </div>
            <Link href="/print/balance-sheet" className="btn btn-ghost">
              Balance Sheet
            </Link>
          </div>
          <div className="table-wrap" style={{ border: "none" }}>
            <table className="data" style={{ minWidth: 0 }}>
              <thead>
                <tr>
                  <th>Account</th>
                  <th className="right">Debit (بنام)</th>
                  <th className="right">Credit (جمع)</th>
                  <th className="right">Balance</th>
                </tr>
              </thead>
              <tbody>
                {balances.map((b) => {
                  const bal = Number(b.credit) - Number(b.debit);
                  return (
                    <tr key={b.storeName}>
                      <td style={{ fontWeight: 600 }}>{b.storeName}</td>
                      <td className="right num">{money(b.debit)}</td>
                      <td className="right num">{money(b.credit)}</td>
                      <td className={`right num ${bal >= 0 ? "pos" : "neg"}`}>{money(bal)}</td>
                    </tr>
                  );
                })}
                {!balances.length && (
                  <tr>
                    <td colSpan={4} style={{ color: "var(--muted)" }}>
                      No ledger entries yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
