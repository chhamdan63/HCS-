import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { storeLedger } from "@/db/schema";
import { LedgerList, LedgerRowData } from "@/components/LedgerList";
import { toNum } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function ManageHistoryPage() {
  // Only manual rows (ref_type = 'manual') are managed/edited here.
  const rows = await db
    .select()
    .from(storeLedger)
    .where(eq(storeLedger.refType, "manual"))
    .orderBy(desc(storeLedger.transactionDate), desc(storeLedger.id))
    .limit(500);

  const data: LedgerRowData[] = rows.map((r) => ({
    id: r.id,
    storeName: r.storeName,
    description: r.description,
    debit: toNum(r.debit),
    credit: toNum(r.credit),
    transactionDate: r.transactionDate,
  }));

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div className="micro">Payments</div>
        <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em" }}>Manage History</h1>
        <p style={{ color: "var(--muted)", fontSize: 12.5, marginTop: 2 }}>
          Manual transactions only. Invoice and purchase postings are edited from their own bills.
        </p>
      </div>
      <LedgerList rows={data} />
    </div>
  );
}
