import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { storeLedger } from "@/db/schema";
import { handleApi } from "@/lib/api";
import { ApiError, nonNegNumber, required, validDate } from "@/lib/validate";
import { round2 } from "@/lib/money";
import { getStore } from "@/lib/text";

export type ManualPayload = {
  id?: number;
  storeId?: number;
  transactionDate?: string;
  description?: string;
  type?: "debit" | "credit" | "Debit" | "Credit";
  amount?: number | string;
};

async function buildManual(body: ManualPayload) {
  const transactionDate = validDate(body.transactionDate);
  const storeId = Number(body.storeId);
  if (!Number.isInteger(storeId) || storeId <= 0) throw new ApiError("Please choose a store.");
  const store = await getStore(storeId);
  if (!store) throw new ApiError("The selected store does not exist.");
  const description = required(body.description, "Detail", 255);
  const amount = round2(nonNegNumber(body.amount, "Amount"));
  const type = String(body.type ?? "").toLowerCase();
  if (type !== "debit" && type !== "credit") throw new ApiError("Choose Debit (بنام) or Credit (جمع).");
  return {
    storeId,
    storeName: store.storeName,
    transactionDate,
    description,
    debit: type === "debit" ? amount : 0,
    credit: type === "credit" ? amount : 0,
    refType: "manual" as const,
    refId: null,
  };
}

export async function POST(req: Request) {
  return handleApi<ManualPayload>(req, "ledger-create", async (body) => {
    const row = await buildManual(body);
    const [created] = await db
      .insert(storeLedger)
      .values({
        ...row,
        debit: row.debit.toFixed(2),
        credit: row.credit.toFixed(2),
      })
      .returning();
    return NextResponse.json({ ok: true, data: created });
  });
}

export async function PUT(req: Request) {
  return handleApi<ManualPayload>(req, "ledger-update", async (body) => {
    const id = Number(body.id);
    if (!Number.isInteger(id) || id <= 0) throw new ApiError("Invalid transaction id.");
    const existing = await db.select().from(storeLedger).where(eq(storeLedger.id, id)).limit(1);
    if (!existing[0]) throw new ApiError("Transaction not found.", 404);
    // Server-side rule: only manual rows are editable.
    if (existing[0].refType !== "manual") {
      throw new ApiError("Only manual transactions can be edited here. Edit the source bill instead.");
    }
    const row = await buildManual(body);
    await db
      .update(storeLedger)
      .set({ ...row, debit: row.debit.toFixed(2), credit: row.credit.toFixed(2) })
      .where(eq(storeLedger.id, id));
    return NextResponse.json({ ok: true, data: { id } });
  });
}
