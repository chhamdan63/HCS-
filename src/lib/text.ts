import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { stores } from "@/db/schema";

/** "hamdan afzal ch" -> "Hamdan Afzal Ch" (names are trimmed + title-cased on save). */
export function titleCase(input: string): string {
  const s = String(input ?? "").trim().replace(/\s+/g, " ");
  return s
    .split(" ")
    .map((w) =>
      w
        .split("-")
        .map((part) =>
          part
            ? part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
            : part,
        )
        .join("-"),
    )
    .join(" ");
}

export async function findStoreByName(name: string) {
  const rows = await db
    .select()
    .from(stores)
    .where(sql`lower(${stores.storeName}) = lower(${name})`)
    .limit(1);
  return rows[0] ?? null;
}

export async function getStore(id: number) {
  const rows = await db.select().from(stores).where(eq(stores.id, id)).limit(1);
  return rows[0] ?? null;
}
