/**
 * Business math for the commission shop.
 * All money is handled as decimal numbers rounded to 2 dp on the server.
 * 1 bori = 70 kg. Rates are quoted per 40 kg (maund).
 */

export const KG_PER_BORI = 70;
export const RATE_UNIT_KG = 40;

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function toNum(v: unknown, fallback = 0): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : fallback;
  if (typeof v === "string") {
    const cleaned = v.replace(/,/g, "").trim();
    if (cleaned === "") return fallback;
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : fallback;
  }
  return fallback;
}

/** weight_kg = bori * 70 + kg */
export function lineWeight(bori: number, kg: number): number {
  return round2(toNum(bori) * KG_PER_BORI + toNum(kg));
}

/** amount = weight_kg / 40 * rate */
export function lineAmount(weightKg: number, rate: number): number {
  return round2((toNum(weightKg) / RATE_UNIT_KG) * toNum(rate));
}

export function computeLine(bori: number, kg: number, rate: number) {
  const weight = lineWeight(bori, kg);
  return { weight, amount: lineAmount(weight, rate) };
}

export type ChargeRates = {
  commissionPercent: number;
  labourPerBori: number;
  threadPerBori: number;
  plasticPerBori: number;
  marketFeePerBori: number;
};

export type ChargeOverrides = Partial<{
  commission: number;
  labour: number;
  thread: number;
  plasticBag: number;
  marketFee: number;
  brokery: number;
}>;

export type LineInput = { qtyBori: number; qtyKg: number; rate: number };

export type InvoiceTotals = {
  corncost: number;
  totalBori: number;
  totalWeight: number;
  commission: number;
  labour: number;
  thread: number;
  plasticBag: number;
  marketFee: number;
  brokery: number;
  total: number;
  lines: { qtyBori: number; qtyKg: number; rate: number; weight: number; amount: number }[];
};

/**
 * Invoice header math. Charges are ADDED on top of the gross corn cost:
 * NET PAYABLE = gross + commission + labour + thread + plastic_bag + market_fee + brokery
 */
export function computeInvoiceTotals(
  lines: LineInput[],
  rates: ChargeRates,
  overrides: ChargeOverrides = {},
  brokeryInput = 0,
): InvoiceTotals {
  const computed = lines.map((l) => {
    const { weight, amount } = computeLine(l.qtyBori, l.qtyKg, l.rate);
    return { qtyBori: toNum(l.qtyBori), qtyKg: toNum(l.qtyKg), rate: toNum(l.rate), weight, amount };
  });
  const corncost = round2(computed.reduce((s, l) => s + l.amount, 0));
  const totalBori = computed.reduce((s, l) => s + l.qtyBori, 0);
  const totalWeight = round2(computed.reduce((s, l) => s + l.weight, 0));

  const pick = (key: keyof ChargeOverrides, calc: number) =>
    overrides[key] !== undefined && overrides[key] !== null ? round2(toNum(overrides[key])) : round2(calc);

  const commission = pick("commission", (corncost * toNum(rates.commissionPercent)) / 100);
  const labour = pick("labour", totalBori * toNum(rates.labourPerBori));
  const thread = pick("thread", totalBori * toNum(rates.threadPerBori));
  const plasticBag = pick("plasticBag", totalBori * toNum(rates.plasticPerBori));
  const marketFee = pick("marketFee", totalBori * toNum(rates.marketFeePerBori));
  const brokery = overrides.brokery !== undefined && overrides.brokery !== null
    ? round2(toNum(overrides.brokery))
    : round2(toNum(brokeryInput));

  const total = round2(corncost + commission + labour + thread + plasticBag + marketFee + brokery);

  return {
    corncost,
    totalBori,
    totalWeight,
    commission,
    labour,
    thread,
    plasticBag,
    marketFee,
    brokery,
    total,
    lines: computed,
  };
}

/** Purchase line: same weight/amount rule as invoices. */
export function computePurchaseLines(rows: { qtyBori: number; qtyKg: number; rate: number }[]) {
  return rows.map((r) => {
    const { weight, amount } = computeLine(r.qtyBori, r.qtyKg, r.rate);
    return { qtyBori: toNum(r.qtyBori), qtyKg: toNum(r.qtyKg), rate: toNum(r.rate), weightKg: weight, amount };
  });
}

export function money(n: number | string): string {
  const v = typeof n === "string" ? toNum(n) : n;
  return v.toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function num(n: number | string, dp = 2): string {
  const v = typeof n === "string" ? toNum(n) : n;
  return v.toLocaleString("en-PK", { minimumFractionDigits: 0, maximumFractionDigits: dp });
}
