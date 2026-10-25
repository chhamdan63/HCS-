import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const storeStatusEnum = pgEnum("store_status", ["Active", "Inactive", "Fixed"]);
export const ledgerRefTypeEnum = pgEnum("ledger_ref_type", [
  "invoice",
  "invoice_expense",
  "purchase",
  "manual",
]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  mustChangePassword: boolean("must_change_password").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const stores = pgTable(
  "stores",
  {
    id: serial("id").primaryKey(),
    storeName: varchar("store_name", { length: 255 }).notNull(),
    storeAddress: text("store_address"),
    storePhone: varchar("store_phone", { length: 20 }),
    storeBank: varchar("store_bank", { length: 100 }),
    status: storeStatusEnum("status").notNull().default("Active"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("stores_store_name_lower_idx").on(sql`lower(${t.storeName})`),
  ],
);

export const settings = pgTable("settings", {
  settingKey: varchar("setting_key", { length: 100 }).primaryKey(),
  settingValue: text("setting_value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  invoiceDate: date("invoice_date", { mode: "string" }).notNull(),
  agentCode: varchar("agent_code", { length: 50 }).notNull(),
  biltyNo: varchar("bilty_no", { length: 50 }).notNull(),
  vehicleNo: varchar("vehicle_no", { length: 50 }).notNull(),
  permitNo: varchar("permit_no", { length: 50 }),
  corncost: numeric("corncost", { precision: 12, scale: 2, mode: "string" }).notNull().default("0"),
  commission: numeric("commission", { precision: 12, scale: 2, mode: "string" }).notNull().default("0"),
  labour: numeric("labour", { precision: 12, scale: 2, mode: "string" }).notNull().default("0"),
  thread: numeric("thread", { precision: 12, scale: 2, mode: "string" }).notNull().default("0"),
  brokery: numeric("brokery", { precision: 12, scale: 2, mode: "string" }).notNull().default("0"),
  plasticBag: numeric("plastic_bag", { precision: 12, scale: 2, mode: "string" }).notNull().default("0"),
  marketFee: numeric("market_fee", { precision: 12, scale: 2, mode: "string" }).notNull().default("0"),
  total: numeric("total", { precision: 12, scale: 2, mode: "string" }).notNull().default("0"),
  totalBori: integer("total_bori").notNull().default(0),
  totalWeight: numeric("total_weight", { precision: 12, scale: 2, mode: "string" }).notNull().default("0"),
  rateSnapshot: jsonb("rate_snapshot").notNull().default({}),
  chargeOverrides: jsonb("charge_overrides").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const invoiceItems = pgTable(
  "invoice_items",
  {
    id: serial("id").primaryKey(),
    invoiceId: integer("invoice_id")
      .notNull()
      .references(() => invoices.id, { onDelete: "cascade" }),
    storeId: integer("store_id")
      .notNull()
      .references(() => stores.id),
    storeName: varchar("store_name", { length: 255 }).notNull(),
    qtyBori: integer("qty_bori").notNull(),
    qtyKg: numeric("qty_kg", { precision: 10, scale: 2, mode: "string" }).notNull().default("0"),
    price: numeric("price", { precision: 10, scale: 2, mode: "string" }).notNull(),
    totalWeight: numeric("total_weight", { precision: 12, scale: 2, mode: "string" }).notNull(),
    amount: numeric("amount", { precision: 12, scale: 2, mode: "string" }).notNull(),
  },
  (t) => [index("invoice_items_invoice_idx").on(t.invoiceId), index("invoice_items_store_idx").on(t.storeId)],
);

export const purchases = pgTable("purchases", {
  id: serial("id").primaryKey(),
  purchaseDate: date("purchase_date", { mode: "string" }).notNull(),
  storeId: integer("store_id")
    .notNull()
    .references(() => stores.id),
  storeName: varchar("store_name", { length: 255 }).notNull(),
  totalBori: numeric("total_bori", { precision: 12, scale: 2, mode: "string" }).notNull().default("0"),
  totalWeight: numeric("total_weight", { precision: 12, scale: 2, mode: "string" }).notNull().default("0"),
  totalAmount: numeric("total_amount", { precision: 12, scale: 2, mode: "string" }).notNull().default("0"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const purchaseItems = pgTable(
  "purchase_items",
  {
    id: serial("id").primaryKey(),
    purchaseId: integer("purchase_id")
      .notNull()
      .references(() => purchases.id, { onDelete: "cascade" }),
    qtyBori: numeric("qty_bori", { precision: 10, scale: 2, mode: "string" }).notNull().default("0"),
    qtyKg: numeric("qty_kg", { precision: 10, scale: 2, mode: "string" }).notNull().default("0"),
    rate: numeric("rate", { precision: 10, scale: 2, mode: "string" }).notNull(),
    weightKg: numeric("weight_kg", { precision: 12, scale: 2, mode: "string" }).notNull(),
    amount: numeric("amount", { precision: 12, scale: 2, mode: "string" }).notNull(),
  },
  (t) => [index("purchase_items_purchase_idx").on(t.purchaseId)],
);

export const storeLedger = pgTable(
  "store_ledger",
  {
    id: serial("id").primaryKey(),
    storeId: integer("store_id")
      .notNull()
      .references(() => stores.id),
    storeName: varchar("store_name", { length: 255 }).notNull(),
    transactionDate: date("transaction_date", { mode: "string" }).notNull(),
    description: text("description").notNull(),
    debit: numeric("debit", { precision: 15, scale: 2, mode: "string" }).notNull().default("0"),
    credit: numeric("credit", { precision: 15, scale: 2, mode: "string" }).notNull().default("0"),
    refType: ledgerRefTypeEnum("ref_type").notNull(),
    refId: integer("ref_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("store_ledger_store_date_idx").on(t.storeId, t.transactionDate),
    index("store_ledger_ref_idx").on(t.refType, t.refId),
  ],
);

export const auditLog = pgTable("audit_log", {
  id: serial("id").primaryKey(),
  action: varchar("action", { length: 50 }).notNull(),
  entityType: varchar("entity_type", { length: 50 }).notNull(),
  entityId: integer("entity_id").notNull(),
  detail: text("detail"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const loginAttempts = pgTable(
  "login_attempts",
  {
    id: serial("id").primaryKey(),
    username: varchar("username", { length: 50 }).notNull(),
    ip: varchar("ip", { length: 64 }).notNull().default(""),
    success: boolean("success").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("login_attempts_user_idx").on(t.username, t.createdAt)],
);
