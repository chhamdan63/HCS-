import { NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { auditLog, invoiceItems, invoices, storeLedger, stores } from "@/db/schema";
import { handleApi } from "@/lib/api";
import { ApiError, nonNegNumber, optional, required, validDate } from "@/lib/validate";
import { ChargeOverrides, computeInvoiceTotals, round2, toNum } from "@/lib/money";
import { getSettings, ratesFromSettings } from "@/lib/settings";
import { chargeAccountMap, picCornId } from "@/lib/accounts";
import { invoiceLedgerRows, replaceLedgerForRef } from "@/lib/ledger";

export type InvoicePayload = {
  id?: number;
  invoiceDate?: string;
  agentCode?: string;
  biltyNo?: string;
  vehicleNo?: string;
  permitNo?: string;
  brokery?: number | string;
  lines?: { storeId?: number; qtyBori?: number | string; qtyKg?: number | string; rate?: number | string }[];
  overrides?: ChargeOverrides;
  recalculate?: boolean;
};

async function buildInvoice(body: InvoicePayload, existingId?: number) {
  const invoiceDate = validDate(body.invoiceDate);
  const agentCode = optional(body.agentCode, "Agent code", 50) || "160018";
  const biltyNo = required(body.biltyNo, "Bilty no.", 50);
  const vehicleNo = required(body.vehicleNo, "Vehicle no.", 50);
  const permitNo = optional(body.permitNo, "Permit number", 50);

  const raw = Array.isArray(body.lines) ? body.lines : [];
  if (!raw.length) throw new ApiError("Add at least one item line.");

  // A valid line = an existing store + (bori > 0 OR kg > 0) + rate > 0
  const candidates = raw.filter(
    (l) => Number(l.storeId) > 0 && (toNum(l.qtyBori) > 0 || toNum(l.qtyKg) > 0) && toNum(l.rate) > 0,
  );
  if (!candidates.length) {
    throw new ApiError("Each line needs a store, a quantity (bori or kg) and a rate above zero.");
  }
  for (const l of candidates) {
    if (toNum(l.qtyBori) < 0 || toNum(l.qtyKg) < 0 || toNum(l.rate) < 0) {
      throw new ApiError("Negative quantities or rates are not allowed.");
    }
    if (!Number.isInteger(toNum(l.qtyBori))) throw new ApiError("Bori must be a whole number.");
  }

  const ids = Array.from(new Set(candidates.map((l) => Number(l.storeId))));
  const rows = await db.select().from(stores).where(inArray(stores.id, ids));
  const byId = new Map(rows.map((r) => [r.id, r]));
  // When editing, a store already used on the invoice stays valid even if it is now Inactive.
  let usedOnInvoice = new Set<number>();
  if (existingId) {
    const prev = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, existingId));
    usedOnInvoice = new Set(prev.map((p) => p.storeId));
  }
  for (const l of candidates) {
    const store = byId.get(Number(l.storeId));
    if (!store) throw new ApiError("One of the selected stores no longer exists.");
    if (store.status !== "Active" && !usedOnInvoice.has(store.id)) {
      throw new ApiError(`Store "${store.storeName}" is not active and cannot be added to a bill.`);
    }
  }

  const settings = await getSettings();
  let rates = ratesFromSettings(settings);
  let snapshot: Record<string, unknown> = { ...rates };

  if (existingId) {
    const prev = await db.select().from(invoices).where(eq(invoices.id, existingId)).limit(1);
    if (!prev[0]) throw new ApiError("Invoice not found.", 404);
    const snap = (prev[0].rateSnapshot ?? {}) as Record<string, unknown>;
    if (body.recalculate === true) {
      snapshot = {
        ...rates,
        shopName: settings.shopName,
        shopAddress: settings.shopAddress,
        shopPhone: settings.shopPhone,
        agentCode,
      };
    } else {
      // Editing an old invoice keeps its own rate snapshot.
      rates = {
        commissionPercent: toNum(snap.commissionPercent, settings.commissionPercent),
        labourPerBori: toNum(snap.labourPerBori, settings.labourPerBori),
        threadPerBori: toNum(snap.threadPerBori, settings.threadPerBori),
        plasticPerBori: toNum(snap.plasticPerBori, settings.plasticPerBori),
        marketFeePerBori: toNum(snap.marketFeePerBori, settings.marketFeePerBori),
      };
      snapshot = { ...snap, ...rates };
    }
  } else {
    snapshot = {
      ...rates,
      shopName: settings.shopName,
      shopAddress: settings.shopAddress,
      shopPhone: settings.shopPhone,
      agentCode,
    };
  }

  // optional per-invoice manual override of each charge
  const overrides: ChargeOverrides = {};
  const o = body.overrides ?? {};
  for (const key of ["commission", "labour", "thread", "plasticBag", "marketFee"] as const) {
    const v = (o as Record<string, unknown>)[key];
    if (v !== undefined && v !== null && v !== "") overrides[key] = nonNegNumber(v, `Override ${key}`);
  }

  const totals = computeInvoiceTotals(
    candidates.map((l) => ({ qtyBori: toNum(l.qtyBori), qtyKg: toNum(l.qtyKg), rate: toNum(l.rate) })),
    rates,
    overrides,
    nonNegNumber(body.brokery ?? 0, "Brokery"),
  );

  return {
    invoiceDate,
    agentCode,
    biltyNo,
    vehicleNo,
    permitNo,
    snapshot,
    overrides,
    totals,
    lines: candidates.map((l, i) => ({
      storeId: Number(l.storeId),
      storeName: byId.get(Number(l.storeId))!.storeName,
      qtyBori: totals.lines[i].qtyBori,
      qtyKg: totals.lines[i].qtyKg,
      rate: totals.lines[i].rate,
      weight: totals.lines[i].weight,
      amount: totals.lines[i].amount,
    })),
  };
}

async function writeInvoice(tx: any, inv: Awaited<ReturnType<typeof buildInvoice>>, id: number | null) {
  const values = {
    invoiceDate: inv.invoiceDate,
    agentCode: inv.agentCode,
    biltyNo: inv.biltyNo,
    vehicleNo: inv.vehicleNo,
    permitNo: inv.permitNo || null,
    corncost: inv.totals.corncost.toFixed(2),
    commission: inv.totals.commission.toFixed(2),
    labour: inv.totals.labour.toFixed(2),
    thread: inv.totals.thread.toFixed(2),
    brokery: inv.totals.brokery.toFixed(2),
    plasticBag: inv.totals.plasticBag.toFixed(2),
    marketFee: inv.totals.marketFee.toFixed(2),
    total: inv.totals.total.toFixed(2),
    totalBori: inv.totals.totalBori,
    totalWeight: inv.totals.totalWeight.toFixed(2),
    rateSnapshot: inv.snapshot,
    chargeOverrides: inv.overrides,
    updatedAt: new Date(),
  };
  const invoiceId = id ?? (await tx.insert(invoices).values(values).returning())[0].id;
  if (id) await tx.update(invoices).set(values).where(eq(invoices.id, id));

  await tx.delete(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));
  await tx.insert(invoiceItems).values(
    inv.lines.map((l) => ({
      invoiceId,
      storeId: l.storeId,
      storeName: l.storeName,
      qtyBori: l.qtyBori,
      qtyKg: l.qtyKg.toFixed(2),
      price: l.rate.toFixed(2),
      totalWeight: l.weight.toFixed(2),
      amount: l.amount.toFixed(2),
    })),
  );

  const chargeIds = await chargeAccountMap();
  const picId = await picCornId();
  const ledgerRows = invoiceLedgerRows({
    invoiceId,
    date: inv.invoiceDate,
    vehicleNo: inv.vehicleNo,
    picCornId: picId,
    net: inv.totals.total,
    charges: [
      { account: "Commission", amount: inv.totals.commission, storeId: chargeIds["Commission"] },
      { account: "Labour", amount: inv.totals.labour, storeId: chargeIds["Labour"] },
      { account: "Thread", amount: inv.totals.thread, storeId: chargeIds["Thread"] },
      { account: "Plastic Bag", amount: inv.totals.plasticBag, storeId: chargeIds["Plastic Bag"] },
      { account: "Market Fee", amount: inv.totals.marketFee, storeId: chargeIds["Market Fee"] },
      { account: "Brokery", amount: inv.totals.brokery, storeId: chargeIds["Brokery"] },
    ],
  });
  await replaceLedgerForRef(tx, "invoice", invoiceId, ledgerRows.filter((r) => r.refType === "invoice"));
  await replaceLedgerForRef(
    tx,
    "invoice_expense",
    invoiceId,
    ledgerRows.filter((r) => r.refType === "invoice_expense"),
  );
  return invoiceId;
}

export async function POST(req: Request) {
  return handleApi<InvoicePayload>(req, "invoice-create", async (body) => {
    const inv = await buildInvoice(body);
    const id = await db.transaction((tx) => writeInvoice(tx, inv, null));
    return NextResponse.json({ ok: true, data: { id, total: inv.totals.total } });
  });
}

export async function PUT(req: Request) {
  return handleApi<InvoicePayload>(req, "invoice-update", async (body) => {
    const id = Number(body.id);
    if (!Number.isInteger(id) || id <= 0) throw new ApiError("Invalid invoice id.");
    const inv = await buildInvoice(body, id);
    await db.transaction((tx) => writeInvoice(tx, inv, id));
    return NextResponse.json({ ok: true, data: { id, total: inv.totals.total } });
  });
}

export async function DELETE(req: Request) {
  return handleApi<{ id?: number }>(req, "invoice-void", async (body) => {
    const id = Number(body.id);
    if (!Number.isInteger(id) || id <= 0) throw new ApiError("Invalid invoice id.");
    await db.transaction(async (tx) => {
      await tx
        .delete(storeLedger)
        .where(and(eq(storeLedger.refType, "invoice"), eq(storeLedger.refId, id)));
      await tx
        .delete(storeLedger)
        .where(and(eq(storeLedger.refType, "invoice_expense"), eq(storeLedger.refId, id)));
      await tx.delete(invoices).where(eq(invoices.id, id));
      await tx
        .insert(auditLog)
        .values({ action: "void", entityType: "invoice", entityId: id, detail: `Invoice #${id} voided` });
    });
    return NextResponse.json({ ok: true, data: { id } });
  });
}
