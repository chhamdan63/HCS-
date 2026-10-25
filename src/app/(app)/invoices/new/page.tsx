import { eq } from "drizzle-orm";
import { db } from "@/db";
import { stores } from "@/db/schema";
import { InvoiceForm } from "@/components/InvoiceForm";
import { getSettings, ratesFromSettings, chargeLabels } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function NewInvoicePage() {
  const settings = await getSettings();
  // Invoice line store list = Active stores only.
  const all = await db.select().from(stores).orderBy(stores.storeName);
  const options = all.filter((s) => s.status === "Active").map((s) => ({ id: s.id, label: s.storeName }));

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div className="micro">Invoices</div>
        <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em" }}>Create New Bill</h1>
        <p style={{ color: "var(--muted)", fontSize: 12.5, marginTop: 2 }}>
          Dispatch to PIC CORN. Charges are added on top of the gross corn cost.
        </p>
      </div>
      <InvoiceForm stores={options} rates={ratesFromSettings(settings)} labels={chargeLabels(settings)} />
    </div>
  );
}
