import { db } from "@/db";
import { stores } from "@/db/schema";
import { TxnForm } from "@/components/TxnForm";

export const dynamic = "force-dynamic";

export default async function AddTransactionPage() {
  const all = await db.select().from(stores).orderBy(stores.storeName);
  const options = all.map((s) => ({ id: s.id, label: s.storeName, hint: s.status }));

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div className="micro">Payments</div>
        <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em" }}>Add Transaction</h1>
        <p style={{ color: "var(--muted)", fontSize: 12.5, marginTop: 2 }}>
          Manual cash/cheque movements against a store account. Use Debit (بنام) for money out and Credit (جمع)
          for money in.
        </p>
      </div>
      <TxnForm stores={options} />
    </div>
  );
}
