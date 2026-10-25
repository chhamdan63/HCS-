import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { invoiceItems, purchases, storeLedger, stores, users } from "@/db/schema";
import { handleApi } from "@/lib/api";
import { ApiError, optional, required } from "@/lib/validate";
import { findStoreByName, getStore, titleCase } from "@/lib/text";

export type StoreInput = {
  storeName?: string;
  storeAddress?: string;
  storePhone?: string;
  storeBank?: string;
  status?: string;
};

function parseStore(body: StoreInput, currentName?: string, currentStatus?: string) {
  const storeName = titleCase(required(body.storeName, "Store name"));
  const storeAddress = String(body.storeAddress ?? "").trim();
  const storePhone = optional(body.storePhone, "Phone", 20);
  const storeBank = optional(body.storeBank, "Bank", 100);
  const status = body.status === "Inactive" ? "Inactive" : body.status === "Fixed" ? "Fixed" : "Active";

  if (currentStatus === "Fixed") {
    if (storeName.toLowerCase() !== String(currentName ?? "").trim().toLowerCase()) {
      throw new ApiError("Fixed accounts cannot be renamed.");
    }
    if (status !== "Fixed") throw new ApiError("Fixed accounts cannot change status.");
  }
  return { storeName, storeAddress, storePhone, storeBank, status: status as "Active" | "Inactive" | "Fixed" };
}

export async function POST(req: Request) {
  return handleApi<StoreInput>(req, "store-create", async (body) => {
    const data = parseStore(body);
    const duplicate = await findStoreByName(data.storeName);
    if (duplicate) throw new ApiError("A store with this name already exists.");
    const [row] = await db.insert(stores).values(data).returning();
    return NextResponse.json({ ok: true, data: row });
  });
}

export async function PUT(req: Request) {
  return handleApi<StoreInput & { id?: number }>(req, "store-update", async (body) => {
    const id = Number(body.id);
    if (!Number.isInteger(id) || id <= 0) throw new ApiError("Invalid store id.");
    const current = await getStore(id);
    if (!current) throw new ApiError("Store not found.", 404);
    const data = parseStore(body, current.storeName, current.status);

    const duplicate = await db
      .select({ id: stores.id })
      .from(stores)
      .where(sql`lower(${stores.storeName}) = lower(${data.storeName})`)
      .limit(1);
    if (duplicate.length && duplicate[0].id !== id) throw new ApiError("A store with this name already exists.");

    await db.transaction(async (tx) => {
      await tx.update(stores).set(data).where(eq(stores.id, id));
      // Rename cascades the denormalised display copies only (ledger uses store_id).
      if (data.storeName !== current.storeName) {
        await tx.update(storeLedger).set({ storeName: data.storeName }).where(eq(storeLedger.storeId, id));
        await tx.update(purchases).set({ storeName: data.storeName }).where(eq(purchases.storeId, id));
        await tx.update(invoiceItems).set({ storeName: data.storeName }).where(eq(invoiceItems.storeId, id));
      }
    });
    return NextResponse.json({ ok: true, data: { id, ...data } });
  });
}
