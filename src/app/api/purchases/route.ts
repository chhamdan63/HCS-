import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { auditLog, purchaseItems, purchases, storeLedger } from "@/db/schema";
import { handleApi } from "@/lib/api";
import { ApiError, validDate } from "@/lib/validate";
import { computePurchaseLines, round2, toNum } from "@/lib/money";
import { purchaseLedgerRow, replaceLedgerForRef } from "@/lib/ledger";
import { getStore } from "@/lib/text";

export type PurchasePayload = {
  purchaseDate?: string;
  storeId?: number;
  lines?: { qtyBori?: number | string; qtyKg?: number | string; rate?: number | string }[];
};

async function buildPurchase(body: PurchasePayload) {
  const purchaseDate = validDate(body.purchaseDate);
  const storeId = Number(body.storeId);
  if (!Number.isInteger(storeId) || storeId <= 0) throw new ApiError("Please choose a store.");
  const store = await getStore(storeId);
  if (!store) throw new ApiError("The selected store does not exist.");

  const raw = Array.isArray(body.lines) ? body.lines : [];
  if (!raw.length) throw new ApiError("Add at least one purchase line.");
  for (const r of raw) {
    if (toNum(r.qtyBori) < 0 || toNum(r.qtyKg) < 0 || toNum(r.rate) < 0) {
      throw new ApiError("Negative quantities or rates are not allowed.");
    }
  }
  const lines = computePurchaseLines(
    raw.map((r) => ({ qtyBori: toNum(r.qtyBori), qtyKg: toNum(r.qtyKg), rate: toNum(r.rate) })),
  );
  const valid = lines.filter((l) => l.amount > 0);
  if (!valid.length) throw new ApiError("A purchase line must have an amount greater than zero.");

  const totalAmount = round2(valid.reduce((s, l) => s + l.amount, 0));
  const totalBori = round2(valid.reduce((s, l) => s + l.qtyBori, 0));
  const totalWeight = round2(valid.reduce((s, l) => s + l.weightKg, 0));
  return { purchaseDate, store, valid, totalAmount, totalBori, totalWeight };
}

function ledgerRow(storeId: number, storeName: string, date: string, id: number, amount: number) {
  return purchaseLedgerRow({ storeId, storeName, date, purchaseId: id, totalAmount: amount });
}

export async function POST(req: Request) {
  return handleApi<PurchasePayload>(req, "purchase-create", async (body) => {
    const p = await buildPurchase(body);
    const id = await db.transaction(async (tx) => {
      const [hdr] = await tx
        .insert(purchases)
        .values({
          purchaseDate: p.purchaseDate,
          storeId: p.store.id,
          storeName: p.store.storeName,
          totalBori: p.totalBori.toFixed(2),
          totalWeight: p.totalWeight.toFixed(2),
          totalAmount: p.totalAmount.toFixed(2),
        })
        .returning();
      await tx.insert(purchaseItems).values(
        p.valid.map((l) => ({
          purchaseId: hdr.id,
          qtyBori: l.qtyBori.toFixed(2),
          qtyKg: l.qtyKg.toFixed(2),
          rate: l.rate.toFixed(2),
          weightKg: l.weightKg.toFixed(2),
          amount: l.amount.toFixed(2),
        })),
      );
      await replaceLedgerForRef(tx, "purchase", hdr.id, [
        ledgerRow(p.store.id, p.store.storeName, p.purchaseDate, hdr.id, p.totalAmount),
      ]);
      return hdr.id;
    });
    return NextResponse.json({ ok: true, data: { id } });
  });
}

export async function PUT(req: Request) {
  return handleApi<PurchasePayload & { id?: number }>(req, "purchase-update", async (body) => {
    const id = Number(body.id);
    if (!Number.isInteger(id) || id <= 0) throw new ApiError("Invalid purchase id.");
    const existing = await db.select().from(purchases).where(eq(purchases.id, id)).limit(1);
    if (!existing[0]) throw new ApiError("Purchase bill not found.", 404);

    const p = await buildPurchase(body);
    await db.transaction(async (tx) => {
      await tx
        .update(purchases)
        .set({
          purchaseDate: p.purchaseDate,
          storeId: p.store.id,
          storeName: p.store.storeName,
          totalBori: p.totalBori.toFixed(2),
          totalWeight: p.totalWeight.toFixed(2),
          totalAmount: p.totalAmount.toFixed(2),
          updatedAt: new Date(),
        })
        .where(eq(purchases.id, id));
      await tx.delete(purchaseItems).where(eq(purchaseItems.purchaseId, id));
      await tx.insert(purchaseItems).values(
        p.valid.map((l) => ({
          purchaseId: id,
          qtyBori: l.qtyBori.toFixed(2),
          qtyKg: l.qtyKg.toFixed(2),
          rate: l.rate.toFixed(2),
          weightKg: l.weightKg.toFixed(2),
          amount: l.amount.toFixed(2),
        })),
      );
      await replaceLedgerForRef(tx, "purchase", id, [
        ledgerRow(p.store.id, p.store.storeName, p.purchaseDate, id, p.totalAmount),
      ]);
    });
    return NextResponse.json({ ok: true, data: { id } });
  });
}

export async function DELETE(req: Request) {
  return handleApi<{ id?: number }>(req, "purchase-void", async (body) => {
    const id = Number(body.id);
    if (!Number.isInteger(id) || id <= 0) throw new ApiError("Invalid purchase id.");
    await db.transaction(async (tx) => {
      await tx
        .delete(storeLedger)
        .where(and(eq(storeLedger.refType, "purchase"), eq(storeLedger.refId, id)));
      await tx.delete(purchases).where(eq(purchases.id, id));
      await tx
        .insert(auditLog)
        .values({ action: "void", entityType: "purchase", entityId: id, detail: `Purchase Bill #${id} voided` });
    });
    return NextResponse.json({ ok: true, data: { id } });
  });
}
