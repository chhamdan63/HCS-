import { db } from "@/db";
import { stores } from "@/db/schema";
import { PurchaseForm } from "@/components/PurchaseForm";

export const dynamic = "force-dynamic";

export default async function NewPurchasePage() {
  const all = await db.select().from(stores).orderBy(stores.storeName);
  const options = all.map((s) => ({ id: s.id, label: s.storeName, hint: s.status }));

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div className="micro">Purchase</div>
        <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em" }}>Add Purchase</h1>
        <p style={{ color: "var(--muted)", fontSize: 12.5, marginTop: 2 }}>
          One store per bill. Clone rows to add more quantities for the same store.
        </p>
      </div>
      <PurchaseForm stores={options} />
    </div>
  );
}
