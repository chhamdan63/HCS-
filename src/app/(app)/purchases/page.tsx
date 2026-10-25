import { desc } from "drizzle-orm";
import { db } from "@/db";
import { purchases } from "@/db/schema";
import { PurchaseList, PurchaseRow } from "@/components/PurchaseList";
import { toNum } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function ManagePurchasesPage() {
  const rows = await db.select().from(purchases).orderBy(desc(purchases.purchaseDate), desc(purchases.id)).limit(500);
  const data: PurchaseRow[] = rows.map((r) => ({
    id: r.id,
    storeName: r.storeName,
    totalBori: toNum(r.totalBori),
    totalWeight: toNum(r.totalWeight),
    totalAmount: toNum(r.totalAmount),
    purchaseDate: r.purchaseDate,
  }));

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div className="micro">Purchase</div>
        <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em" }}>Manage Purchase</h1>
      </div>
      <PurchaseList rows={data} />
    </div>
  );
}
