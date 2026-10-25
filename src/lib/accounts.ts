import { db } from "@/db";
import { stores } from "@/db/schema";
import { findStoreByName } from "./text";

/**
 * Ledger accounts referenced by invoice posting. Accounts are created on demand
 * (they are seeded as Fixed accounts, so normally they already exist).
 */
export async function accountIdByName(name: string): Promise<number> {
  const found = await findStoreByName(name);
  if (found) return found.id;
  const [row] = await db.insert(stores).values({ storeName: name, status: "Fixed" }).returning();
  return row.id;
}

export async function chargeAccountMap(): Promise<Record<string, number>> {
  const names = ["Commission", "Labour", "Thread", "Plastic Bag", "Market Fee", "Brokery"];
  const out: Record<string, number> = {};
  for (const n of names) out[n] = await accountIdByName(n);
  return out;
}

export const picCornId = () => accountIdByName("PIC CORN");
