import { sql } from "drizzle-orm";
import { db } from "@/db";
import { storeLedger } from "@/db/schema";
import { StoreManager, StoreRow } from "@/components/StoreManager";

export const dynamic = "force-dynamic";

export default async function StoresPage() {
  const balances = await db
    .select({
      storeId: storeLedger.storeId,
      credit: sql<string>`coalesce(sum(${storeLedger.credit}),0)`,
      debit: sql<string>`coalesce(sum(${storeLedger.debit}),0)`,
    })
    .from(storeLedger)
    .groupBy(storeLedger.storeId);
  const balMap = new Map(balances.map((b) => [b.storeId, b]));

  const { stores } = await import("@/db/schema");
  const all = await db.select().from(stores).orderBy(stores.id);

  const rows: StoreRow[] = all.map((s) => {
    const b = balMap.get(s.id);
    const debit = Number(b?.debit ?? 0);
    const credit = Number(b?.credit ?? 0);
    return {
      id: s.id,
      storeName: s.storeName,
      storeAddress: s.storeAddress,
      storePhone: s.storePhone,
      storeBank: s.storeBank,
      status: s.status,
      debit,
      credit,
      balance: credit - debit,
    };
  });

  return (
    <div>
      <div className="flex items-end justify-between gap-4 flex-wrap" style={{ marginBottom: 16 }}>
        <div>
          <div className="micro">Accounts</div>
          <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em" }}>Stores</h1>
          <p style={{ color: "var(--muted)", fontSize: 12.5, marginTop: 2 }}>
            Closing balance = total credit (جمع) − total debit (بنام). Fixed accounts are system accounts
            and cannot be renamed or deleted.
          </p>
        </div>
      </div>
      <StoreManager rows={rows} />
    </div>
  );
}
