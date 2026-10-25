import { eq, inArray } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { invoiceItems, invoices, stores } from "@/db/schema";
import { InvoiceForm, InvoiceInitial } from "@/components/InvoiceForm";
import { getSettings, chargeLabels, DEFAULT_SETTINGS } from "@/lib/settings";
import { ChargeRates, toNum } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invoiceId = Number(id);
  if (!Number.isInteger(invoiceId) || invoiceId <= 0) notFound();

  const hdr = (await db.select().from(invoices).where(eq(invoices.id, invoiceId)).limit(1))[0];
  if (!hdr) notFound();

  const items = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId)).orderBy(invoiceItems.id);
  const settings = await getSettings();
  const snap = (hdr.rateSnapshot ?? {}) as Record<string, unknown>;
  // Editing keeps the invoice's own rate snapshot.
  const rates: ChargeRates = {
    commissionPercent: toNum(snap.commissionPercent, DEFAULT_SETTINGS.commissionPercent),
    labourPerBori: toNum(snap.labourPerBori, DEFAULT_SETTINGS.labourPerBori),
    threadPerBori: toNum(snap.threadPerBori, DEFAULT_SETTINGS.threadPerBori),
    plasticPerBori: toNum(snap.plasticPerBori, DEFAULT_SETTINGS.plasticPerBori),
    marketFeePerBori: toNum(snap.marketFeePerBori, DEFAULT_SETTINGS.marketFeePerBori),
  };

  // Active stores + every store already used on this invoice (lines are never lost).
  const usedIds = Array.from(new Set(items.map((i) => i.storeId)));
  const all = await db.select().from(stores).orderBy(stores.storeName);
  const options = all
    .filter((s) => s.status === "Active" || usedIds.includes(s.id))
    .map((s) => ({ id: s.id, label: s.status === "Active" ? s.storeName : `${s.storeName} (inactive)`, hint: s.status }));

  const initial: InvoiceInitial = {
    id: hdr.id,
    invoiceDate: hdr.invoiceDate,
    agentCode: hdr.agentCode,
    biltyNo: hdr.biltyNo,
    vehicleNo: hdr.vehicleNo,
    permitNo: hdr.permitNo,
    brokery: toNum(hdr.brokery),
    rateSnapshot: rates,
    chargeOverrides: (hdr.chargeOverrides ?? {}) as InvoiceInitial["chargeOverrides"],
    lines: items.map((i) => ({
      storeId: i.storeId,
      storeName: i.storeName,
      qtyBori: i.qtyBori,
      qtyKg: toNum(i.qtyKg),
      rate: toNum(i.price),
    })),
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div className="micro">Edit invoice</div>
        <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em" }}>Invoice #{hdr.id}</h1>
        <p style={{ color: "var(--muted)", fontSize: 12.5, marginTop: 2 }}>
          Saved rates: commission {rates.commissionPercent}% · labour {rates.labourPerBori} · thread{" "}
          {rates.threadPerBori} · plastic {rates.plasticPerBori} · market fee {rates.marketFeePerBori}. Tick
          “Recalculate with current rates” only if you want the bill re-priced at today&apos;s settings.
        </p>
      </div>
      <InvoiceForm
        stores={options}
        rates={rates}
        labels={chargeLabels(settings)}
        initial={initial}
      />
    </div>
  );
}
