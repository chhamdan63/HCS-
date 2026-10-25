import { and, eq } from "drizzle-orm";
import type { PgTransaction } from "drizzle-orm/pg-core";
import { auditLog, invoiceItems, storeLedger } from "@/db/schema";

export type Tx = PgTransaction<any, any, any>;

export const CHARGE_ACCOUNTS = [
  "Commission",
  "Labour",
  "Thread",
  "Plastic Bag",
  "Market Fee",
  "Brokery",
] as const;
export type ChargeAccount = (typeof CHARGE_ACCOUNTS)[number];

export const FIXED_ACCOUNT_NAMES = [
  "PIC CORN",
  "Commission",
  "Labour",
  "Bardana",
  "Thread",
  "Market Fee",
  "Expenses",
  "Plastic Bag",
  "Brokery",
];

export type LedgerRow = {
  storeId: number;
  storeName: string;
  transactionDate: string;
  description: string;
  debit: number;
  credit: number;
  refType: "invoice" | "invoice_expense" | "purchase" | "manual";
  refId: number;
};

/**
 * EDIT of a purchase/invoice: inside one transaction delete ONLY the ledger rows
 * matching (ref_type, ref_id) and re-insert them. Never matched by description text.
 */
export async function replaceLedgerForRef(tx: Tx, refType: LedgerRow["refType"], refId: number, rows: LedgerRow[]) {
  await tx
    .delete(storeLedger)
    .where(and(eq(storeLedger.refType, refType), eq(storeLedger.refId, refId)));
  if (rows.length) {
    await tx.insert(storeLedger).values(
      rows.map((r) => ({
        storeId: r.storeId,
        storeName: r.storeName,
        transactionDate: r.transactionDate,
        description: r.description,
        debit: r.debit.toFixed(2),
        credit: r.credit.toFixed(2),
        refType: r.refType,
        refId: r.refId,
      })),
    );
  }
}

export function purchaseLedgerRow(input: {
  storeId: number;
  storeName: string;
  date: string;
  purchaseId: number;
  totalAmount: number;
}): LedgerRow {
  return {
    storeId: input.storeId,
    storeName: input.storeName,
    transactionDate: input.date,
    // Displayed description format kept from the original app.
    description: `Purchase Bill #${input.purchaseId}`,
    debit: 0,
    credit: input.totalAmount,
    refType: "purchase",
    refId: input.purchaseId,
  };
}

export function invoiceLedgerRows(input: {
  invoiceId: number;
  date: string;
  vehicleNo: string;
  picCornId: number;
  net: number;
  charges: { account: ChargeAccount; amount: number; storeId: number }[];
}): LedgerRow[] {
  const rows: LedgerRow[] = [
    {
      storeId: input.picCornId,
      storeName: "PIC CORN",
      transactionDate: input.date,
      description: `Invoice #${input.invoiceId} | Vehicle: ${input.vehicleNo}`,
      debit: input.net,
      credit: 0,
      refType: "invoice",
      refId: input.invoiceId,
    },
  ];
  for (const c of input.charges) {
    if (c.amount <= 0) continue;
    rows.push({
      storeId: c.storeId,
      storeName: c.account,
      transactionDate: input.date,
      description: `Expense for Invoice #${input.invoiceId}`,
      debit: 0,
      credit: c.amount,
      refType: "invoice_expense",
      refId: input.invoiceId,
    });
  }
  return rows;
}

export async function writeAudit(
  tx: Tx,
  action: string,
  entityType: string,
  entityId: number,
  detail: string,
) {
  await tx.insert(auditLog).values({ action, entityType, entityId, detail });
}

export async function storeBalances(tx: Tx | typeof import("@/db").db) {
  return tx.select().from(storeLedger);
}

export async function voidInvoice(invoiceId: number) {
  const { db } = await import("@/db");
  const { invoices } = await import("@/db/schema");
  return db.transaction(async (tx) => {
    const items = await tx.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));
    await tx.delete(storeLedger).where(and(eq(storeLedger.refType, "invoice"), eq(storeLedger.refId, invoiceId)));
    await tx
      .delete(storeLedger)
      .where(and(eq(storeLedger.refType, "invoice_expense"), eq(storeLedger.refId, invoiceId)));
    await tx.delete(invoices).where(eq(invoices.id, invoiceId));
    await writeAudit(tx, "void", "invoice", invoiceId, `Invoice #${invoiceId} voided (${items.length} lines)`);
  });
}
