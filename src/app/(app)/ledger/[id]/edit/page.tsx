import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { storeLedger, stores } from "@/db/schema";
import { TxnForm, TxnInitial } from "@/components/TxnForm";
import { toNum } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function EditTransactionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rowId = Number(id);
  if (!Number.isInteger(rowId) || rowId <= 0) notFound();

  const row = (await db.select().from(storeLedger).where(eq(storeLedger.id, rowId)).limit(1))[0];
  if (!row) notFound();

  const all = await db.select().from(stores).orderBy(stores.storeName);
  const options = all.map((s) => ({ id: s.id, label: s.storeName, hint: s.status }));

  const initial: TxnInitial = {
    id: row.id,
    storeId: row.storeId,
    transactionDate: row.transactionDate,
    description: row.description,
    type: toNum(row.debit) > 0 ? "debit" : "credit",
    amount: toNum(row.debit) > 0 ? toNum(row.debit) : toNum(row.credit),
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div className="micro">Payments</div>
        <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em" }}>Edit Transaction #{row.id}</h1>
        {row.refType !== "manual" && (
          <p style={{ color: "var(--danger)", fontSize: 12.5, marginTop: 6, fontWeight: 600 }}>
            This row is posted from a bill and cannot be edited here — edit the source bill instead.
          </p>
        )}
      </div>
      <TxnForm stores={options} initial={initial} />
    </div>
  );
}
