import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { purchaseItems, purchases, stores } from "@/db/schema";
import { PurchaseForm } from "@/components/PurchaseForm";
import { toNum } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function EditPurchasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const billId = Number(id);
  if (!Number.isInteger(billId) || billId <= 0) notFound();

  const hdr = (await db.select().from(purchases).where(eq(purchases.id, billId)).limit(1))[0];
  if (!hdr) notFound();

  const items = await db.select().from(purchaseItems).where(eq(purchaseItems.purchaseId, billId)).orderBy(purchaseItems.id);
  const all = await db.select().from(stores).orderBy(stores.storeName);
  const options = all.map((s) => ({ id: s.id, label: s.storeName, hint: s.status }));

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div className="micro">Edit purchase bill</div>
        <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em" }}>PUR-{hdr.id}</h1>
      </div>
      <PurchaseForm
        stores={options}
        initial={{
          id: hdr.id,
          purchaseDate: hdr.purchaseDate,
          storeId: hdr.storeId,
          lines: items.map((i) => ({ qtyBori: toNum(i.qtyBori), qtyKg: toNum(i.qtyKg), rate: toNum(i.rate) })),
        }}
      />
    </div>
  );
}
