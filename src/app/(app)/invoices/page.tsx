import Link from "next/link";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { invoices } from "@/db/schema";
import { InvoiceList, InvoiceRow } from "@/components/InvoiceList";
import { toNum } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function ManageInvoicesPage() {
  const rows = await db.select().from(invoices).orderBy(desc(invoices.invoiceDate), desc(invoices.id)).limit(500);
  const data: InvoiceRow[] = rows.map((r) => ({
    id: r.id,
    invoiceDate: r.invoiceDate,
    vehicleNo: r.vehicleNo,
    biltyNo: r.biltyNo,
    permitNo: r.permitNo,
    totalBori: r.totalBori,
    corncost: toNum(r.corncost),
    total: toNum(r.total),
  }));

  return (
    <div>
      <div className="flex items-end justify-between gap-4 flex-wrap" style={{ marginBottom: 16 }}>
        <div>
          <div className="micro">Invoices</div>
          <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em" }}>Manage Invoices</h1>
        </div>
        <Link href="/invoices/report" className="btn btn-ghost">
          Invoice report
        </Link>
      </div>
      <InvoiceList rows={data} />
    </div>
  );
}
