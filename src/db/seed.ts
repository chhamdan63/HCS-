import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { invoiceItems, invoices, purchaseItems, purchases, settings, storeLedger, stores, users } from "@/db/schema";
import { hashPassword } from "@/lib/auth";
import { computeInvoiceTotals, computePurchaseLines } from "@/lib/money";
import { DEFAULT_SETTINGS, getSettings, ratesFromSettings } from "@/lib/settings";
import { FIXED_ACCOUNT_NAMES, invoiceLedgerRows, purchaseLedgerRow } from "@/lib/ledger";

function today(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

/**
 * Idempotent seed: settings, the nine Fixed (system) accounts and the owner login.
 * The seeded password must be changed on first login.
 */
export async function ensureSeed() {
  // 1. settings
  for (const [key, value] of Object.entries({
    shop_name: DEFAULT_SETTINGS.shopName,
    shop_address: DEFAULT_SETTINGS.shopAddress,
    shop_phone: DEFAULT_SETTINGS.shopPhone,
    agent_code: DEFAULT_SETTINGS.agentCode,
    commission_percent: String(DEFAULT_SETTINGS.commissionPercent),
    labour_per_bori: String(DEFAULT_SETTINGS.labourPerBori),
    thread_per_bori: String(DEFAULT_SETTINGS.threadPerBori),
    plastic_per_bori: String(DEFAULT_SETTINGS.plasticPerBori),
    market_fee_per_bori: String(DEFAULT_SETTINGS.marketFeePerBori),
    balance_wording: DEFAULT_SETTINGS.balanceWording,
    timezone: DEFAULT_SETTINGS.timezone,
  })) {
    await db
      .insert(settings)
      .values({ settingKey: key, settingValue: value })
      .onConflictDoNothing({ target: settings.settingKey });
  }

  // 2. fixed accounts (cannot be renamed or deleted)
  for (const name of FIXED_ACCOUNT_NAMES) {
    const existing = await db
      .select({ id: stores.id })
      .from(stores)
      .where(sql`lower(${stores.storeName}) = lower(${name})`)
      .limit(1);
    if (!existing.length) {
      await db.insert(stores).values({ storeName: name, status: "Fixed" });
    }
  }

  // 3. owner login
  const userRows = await db.select().from(users).where(eq(users.username, "hamdan")).limit(1);
  if (!userRows.length) {
    const password = process.env.SEED_ADMIN_PASSWORD || "hamdan@2026";
    await db.insert(users).values({
      username: "hamdan",
      passwordHash: hashPassword(password),
      mustChangePassword: true,
    });
  }

  // 4. one active trading store
  const hamdan = await db
    .select({ id: stores.id })
    .from(stores)
    .where(sql`lower(${stores.storeName}) = lower(${"Hamdan Afzal Ch"})`)
    .limit(1);
  if (!hamdan.length) {
    await db.insert(stores).values({ storeName: "Hamdan Afzal Ch", status: "Active" });
  }
}

async function storeIdByName(name: string): Promise<number> {
  const rows = await db
    .select({ id: stores.id, name: stores.storeName })
    .from(stores)
    .where(sql`lower(${stores.storeName}) = lower(${name})`)
    .limit(1);
  if (!rows[0]) throw new Error(`store ${name} missing`);
  return rows[0].id;
}

/** Small demo set so every report has values: 2 suppliers, 2 purchases, 2 invoices, 3 payments. */
export async function ensureDemo() {
  const s = await getSettings();
  const seeded = await db
    .select()
    .from(settings)
    .where(eq(settings.settingKey, "demo_seeded"))
    .limit(1);
  if (seeded.length) return;

  const suppliers = ["Al-Madina Traders", "Chaudhry Grain Store"];
  for (const name of suppliers) {
    const exists = await db
      .select({ id: stores.id })
      .from(stores)
      .where(sql`lower(${stores.storeName}) = lower(${name})`)
      .limit(1);
    if (!exists.length) {
      await db.insert(stores).values({
        storeName: name,
        storeAddress: "Grain Market, Arifwala",
        storePhone: "0300-1234567",
        status: "Active",
      });
    }
  }

  const alMadina = await storeIdByName("Al-Madina Traders");
  const chaudhry = await storeIdByName("Chaudhry Grain Store");
  const picCorn = await storeIdByName("PIC CORN");
  const chargeIds: Record<string, number> = {};
  for (const n of ["Commission", "Labour", "Thread", "Plastic Bag", "Market Fee", "Brokery"]) {
    chargeIds[n] = await storeIdByName(n);
  }

  // ---- purchases
  const purchaseSpecs = [
    {
      date: today(-3),
      storeId: alMadina,
      storeName: "Al-Madina Traders",
      rows: [
        { qtyBori: 40, qtyKg: 0, rate: 2350 },
        { qtyBori: 25, qtyKg: 15, rate: 2330 },
      ],
    },
    {
      date: today(-1),
      storeId: chaudhry,
      storeName: "Chaudhry Grain Store",
      rows: [{ qtyBori: 60, qtyKg: 30, rate: 2380 }],
    },
  ];

  for (const spec of purchaseSpecs) {
    const lines = computePurchaseLines(spec.rows);
    const totalAmount = lines.reduce((a, l) => a + l.amount, 0);
    const totalBori = lines.reduce((a, l) => a + l.qtyBori, 0);
    const totalWeight = lines.reduce((a, l) => a + l.weightKg, 0);
    await db.transaction(async (tx) => {
      const [hdr] = await tx
        .insert(purchases)
        .values({
          purchaseDate: spec.date,
          storeId: spec.storeId,
          storeName: spec.storeName,
          totalBori: totalBori.toFixed(2),
          totalWeight: totalWeight.toFixed(2),
          totalAmount: totalAmount.toFixed(2),
        })
        .returning();
      await tx.insert(purchaseItems).values(
        lines.map((l) => ({
          purchaseId: hdr.id,
          qtyBori: l.qtyBori.toFixed(2),
          qtyKg: l.qtyKg.toFixed(2),
          rate: l.rate.toFixed(2),
          weightKg: l.weightKg.toFixed(2),
          amount: l.amount.toFixed(2),
        })),
      );
      await tx.insert(storeLedger).values(
        purchaseLedgerRow({
          storeId: spec.storeId,
          storeName: spec.storeName,
          date: spec.date,
          purchaseId: hdr.id,
          totalAmount,
        }) as any,
      );
    });
  }

  // ---- invoices
  const invoiceSpecs = [
    {
      date: today(-2),
      vehicle: "LES-14-2201",
      bilty: "BT-1024",
      permit: null,
      lines: [
        { storeId: alMadina, qtyBori: 5, qtyKg: 0, rate: 2400 },
        { storeId: chaudhry, qtyBori: 3, qtyKg: 20, rate: 2300 },
      ],
    },
    {
      date: today(0),
      vehicle: "LES-14-7788",
      bilty: "BT-1025",
      permit: "PM-4471",
      lines: [
        { storeId: alMadina, qtyBori: 12, qtyKg: 0, rate: 2420 },
        { storeId: chaudhry, qtyBori: 8, qtyKg: 25, rate: 2380 },
      ],
    },
  ];

  for (const spec of invoiceSpecs) {
    const storeNames: Record<number, string> = {};
    for (const l of spec.lines) {
      const rows = await db.select().from(stores).where(eq(stores.id, l.storeId)).limit(1);
      storeNames[l.storeId] = rows[0].storeName;
    }
    const totals = computeInvoiceTotals(spec.lines, ratesFromSettings(s), {}, 0);
    await db.transaction(async (tx) => {
      const [hdr] = await tx
        .insert(invoices)
        .values({
          invoiceDate: spec.date,
          agentCode: s.agentCode,
          biltyNo: spec.bilty,
          vehicleNo: spec.vehicle,
          permitNo: spec.permit,
          corncost: totals.corncost.toFixed(2),
          commission: totals.commission.toFixed(2),
          labour: totals.labour.toFixed(2),
          thread: totals.thread.toFixed(2),
          brokery: totals.brokery.toFixed(2),
          plasticBag: totals.plasticBag.toFixed(2),
          marketFee: totals.marketFee.toFixed(2),
          total: totals.total.toFixed(2),
          totalBori: totals.totalBori,
          totalWeight: totals.totalWeight.toFixed(2),
          rateSnapshot: {
            ...ratesFromSettings(s),
            shopName: s.shopName,
            shopAddress: s.shopAddress,
            shopPhone: s.shopPhone,
            agentCode: s.agentCode,
          },
          chargeOverrides: {},
        })
        .returning();
      await tx.insert(invoiceItems).values(
        totals.lines.map((l, i) => ({
          invoiceId: hdr.id,
          storeId: spec.lines[i].storeId,
          storeName: storeNames[spec.lines[i].storeId],
          qtyBori: l.qtyBori,
          qtyKg: l.qtyKg.toFixed(2),
          price: l.rate.toFixed(2),
          totalWeight: l.weight.toFixed(2),
          amount: l.amount.toFixed(2),
        })),
      );
      const rows = invoiceLedgerRows({
        invoiceId: hdr.id,
        date: spec.date,
        vehicleNo: spec.vehicle,
        picCornId: picCorn,
        net: totals.total,
        charges: [
          { account: "Commission", amount: totals.commission, storeId: chargeIds["Commission"] },
          { account: "Labour", amount: totals.labour, storeId: chargeIds["Labour"] },
          { account: "Thread", amount: totals.thread, storeId: chargeIds["Thread"] },
          { account: "Plastic Bag", amount: totals.plasticBag, storeId: chargeIds["Plastic Bag"] },
          { account: "Market Fee", amount: totals.marketFee, storeId: chargeIds["Market Fee"] },
          { account: "Brokery", amount: totals.brokery, storeId: chargeIds["Brokery"] },
        ],
      });
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
    });
  }

  // ---- manual payments
  const manualRows = [
    { storeId: alMadina, storeName: "Al-Madina Traders", date: today(-2), desc: "Cash payment received", credit: 25000, debit: 0 },
    { storeId: chaudhry, storeName: "Chaudhry Grain Store", date: today(-1), desc: "Cheque #442101 issued", debit: 18000, credit: 0 },
    { storeId: alMadina, storeName: "Al-Madina Traders", date: today(0), desc: "Cash payment received", credit: 12000, debit: 0 },
  ];
  await db.insert(storeLedger).values(
    manualRows.map((r) => ({
      storeId: r.storeId,
      storeName: r.storeName,
      transactionDate: r.date,
      description: r.desc,
      debit: r.debit.toFixed(2),
      credit: r.credit.toFixed(2),
      refType: "manual" as const,
      refId: null,
    })),
  );

  await db.insert(settings).values({ settingKey: "demo_seeded", settingValue: "1" });
}

export async function runSeed() {
  await ensureSeed();
  if (process.env.SEED_DEMO_DATA !== "0") await ensureDemo();
}
