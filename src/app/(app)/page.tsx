import Link from "next/link";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { invoices, purchases, stores } from "@/db/schema";
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
    </div>
  );
}
