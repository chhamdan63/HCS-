import { db } from "@/db";
import { stores } from "@/db/schema";
import { StorePicker } from "@/components/StorePicker";

export const dynamic = "force-dynamic";

export default async function StoreTransactionPicker() {
  const all = await db.select().from(stores).orderBy(stores.storeName);
  const options = all.map((s) => ({ id: s.id, label: s.storeName, hint: s.status }));

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div className="micro">Print Session</div>
        <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em" }}>Store Transaction</h1>
        <p style={{ color: "var(--muted)", fontSize: 12.5, marginTop: 2 }}>
          Pick an account to print its statement (کھاتہ تفصیل) with running balance.
        </p>
      </div>

      <section className="sheet">
        <div className="sheet-body">
          <StorePicker stores={options} />
        </div>
      </section>
    </div>
  );
}
