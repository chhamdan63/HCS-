import { eq } from "drizzle-orm";
import { db } from "@/db";
import { settings } from "@/db/schema";
import type { ChargeRates } from "./money";

export type AppSettings = ChargeRates & {
  shopName: string;
  shopAddress: string;
  shopPhone: string;
  agentCode: string;
  balanceWording: string;
  timezone: string;
};

export const DEFAULT_SETTINGS: AppSettings = {
  shopName: "HAMDAN COMMISSION SHOP",
  shopAddress: "29/B Grain Market, Arifwala",
  shopPhone: "0300-0070010",
  agentCode: "160018",
  commissionPercent: 0.72,
  labourPerBori: 22,
  threadPerBori: 1,
  plasticPerBori: 34.5,
  marketFeePerBori: 1.4,
  balanceWording: "Net credit balance / Net debit balance",
  timezone: "Asia/Karachi",
};

const KEY_MAP: Record<string, keyof AppSettings> = {
  shop_name: "shopName",
  shop_address: "shopAddress",
  shop_phone: "shopPhone",
  agent_code: "agentCode",
  commission_percent: "commissionPercent",
  labour_per_bori: "labourPerBori",
  thread_per_bori: "threadPerBori",
  plastic_per_bori: "plasticPerBori",
  market_fee_per_bori: "marketFeePerBori",
  balance_wording: "balanceWording",
  timezone: "timezone",
};

const NUMERIC_KEYS: (keyof AppSettings)[] = [
  "commissionPercent",
  "labourPerBori",
  "threadPerBori",
  "plasticPerBori",
  "marketFeePerBori",
];

export async function getSettings(): Promise<AppSettings> {
  const rows = await db.select().from(settings);
  const out: AppSettings = { ...DEFAULT_SETTINGS };
  for (const r of rows) {
    const key = KEY_MAP[r.settingKey];
    if (!key) continue;
    if (NUMERIC_KEYS.includes(key)) {
      const n = Number(r.settingValue);
      (out as Record<string, unknown>)[key] = Number.isFinite(n) ? n : DEFAULT_SETTINGS[key];
    } else {
      (out as Record<string, unknown>)[key] = r.settingValue;
    }
  }
  return out;
}

export async function saveSettings(partial: Partial<Record<keyof AppSettings, unknown>>) {
  const reverse: Record<string, string> = {};
  for (const [k, v] of Object.entries(KEY_MAP)) reverse[v] = k;
  for (const [key, value] of Object.entries(partial)) {
    if (value === undefined) continue;
    const settingKey = reverse[key];
    if (!settingKey) continue;
    const settingValue = String(value);
    const existing = await db.select().from(settings).where(eq(settings.settingKey, settingKey)).limit(1);
    if (existing.length) {
      await db
        .update(settings)
        .set({ settingValue, updatedAt: new Date() })
        .where(eq(settings.settingKey, settingKey));
    } else {
      await db.insert(settings).values({ settingKey, settingValue });
    }
  }
}

export function ratesFromSettings(s: AppSettings): ChargeRates {
  return {
    commissionPercent: s.commissionPercent,
    labourPerBori: s.labourPerBori,
    threadPerBori: s.threadPerBori,
    plasticPerBori: s.plasticPerBori,
    marketFeePerBori: s.marketFeePerBori,
  };
}

/** Labels shown on the invoice footer must carry the REAL current settings values. */
export function chargeLabels(s: AppSettings) {
  return {
    commission: `Commission (${s.commissionPercent}%)`,
    labour: `Labour (x${s.labourPerBori})`,
    thread: `Thread (x${s.threadPerBori})`,
    plasticBag: `Plastic Bag (x${s.plasticPerBori})`,
    marketFee: `Market Fee (x${s.marketFeePerBori})`,
    brokery: "Brokery",
  };
}
