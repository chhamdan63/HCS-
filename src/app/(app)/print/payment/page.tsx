import { inArray, sql } from "drizzle-orm";
import { PrintButton } from "@/components/PrintButton";
import { db } from "@/db";
import { invoiceItems, invoices } from "@/db/schema";
import { getSettings } from "@/lib/settings";
import { money, toNum } from "@/lib/money";

export const dynamic = "force-dynamic";

function voucherId(tz: string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return `#PAY-${get("month")}${get("day")}-${get("hour")}${get("minute")}${get("second")}`;
}

export default async function PaymentVoucherPage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>;
}) {
  const sp = await searchParams;
  const settings = await getSettings();
  const raw = (sp.ids ?? "").trim();

  let lines: { storeName: string; amount: number }[] = [];
  let grand = 0;
  let error: string | null = null;
  let billIds: number[] = [];

  if (raw) {
    const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);
    const numeric = parts.every((p) => /^\d+$/.test(p));
    if (!numeric) {
      error = "Bill numbers must be numeric, separated by commas (e.g. 1, 2, 3).";
    } else {
      billIds = parts.map(Number);
      const found = await db
        .select({ id: invoices.id })
        .from(invoices)
        .where(inArray(invoices.id, billIds));
      const foundIds = new Set(found.map((f) => f.id));
      const missing = billIds.filter((b) => !foundIds.has(b));
      if (missing.length) {
        error = `These bill numbers do not exist: ${missing.join(", ")}.`;
      } else {
        const grouped = await db
          .select({
            storeName: invoiceItems.storeName,
            amount: sql<string>`coalesce(sum(${invoiceItems.amount}),0)`,
          })
          .from(invoiceItems)
          .where(inArray(invoiceItems.invoiceId, billIds))
          .groupBy(invoiceItems.storeName)
          .orderBy(invoiceItems.storeName);
        lines = grouped.map((g) => ({ storeName: g.storeName, amount: toNum(g.amount) }));
        grand = lines.reduce((s, l) => s + l.amount, 0);
      }
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2 flex-wrap no-print" style={{ marginBottom: 16 }}>
        <PrintButton label="Print Voucher" disabled={!lines.length} />
      </div>

      <form className="sheet no-print" style={{ marginBottom: 18 }}>
        <div className="sheet-body">
          <label className="field-label">Bill numbers (comma separated)</label>
          <div className="flex gap-2 flex-wrap">
            <input
              className="input"
              name="ids"
              defaultValue={raw}
              placeholder="e.g. 1, 2, 3"
              style={{ maxWidth: 340 }}
            />
            <button className="btn btn-dark">Calculate</button>
          </div>
          {error && (
            <div
              style={{
                background: "var(--danger-tint)",
                color: "var(--danger)",
                border: "1px solid #fca5a5",
                padding: "9px 12px",
                borderRadius: 3,
                fontSize: 12.5,
                fontWeight: 600,
                marginTop: 12,
              }}
            >
              {error}
            </div>
          )}
          <div className="help">
            Amounts are the per-store invoice line totals for the selected bills — supplier stores on invoice
            lines, grouped by store.
          </div>
        </div>
      </form>

      <div className="print-sheet">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
          <div>
            <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: "0.07em" }}>{settings.shopName}</div>
            <div style={{ fontSize: 11 }}>{settings.shopAddress} | {settings.shopPhone}</div>
          </div>
          <div style={{ textAlign: "right", fontSize: 12 }}>
            <div style={{ fontWeight: 700 }}>Voucher {voucherId(settings.timezone)}</div>
            <div style={{ fontSize: 10.5 }}>Bills: {billIds.length ? billIds.join(", ") : "—"}</div>
          </div>
        </div>

        <div className="urdu" style={{ textAlign: "center", fontSize: 18, fontWeight: 700, margin: "12px 0" }}>
          ادائیگی واؤچر
        </div>

        <table>
          <thead>
            <tr>
              <th style={{ width: 44 }}>Sr</th>
              <th>Store / Account Name</th>
              <th style={{ width: 140 }}>Instruction No.</th>
              <th style={{ width: 130 }}>Amount</th>
              <th style={{ width: 130 }}>Sign</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l, i) => (
              <tr key={l.storeName}>
                <td className="num">{i + 1}</td>
                <td>{l.storeName}</td>
                <td />
                <td className="num" style={{ textAlign: "right" }}>{money(l.amount)}</td>
                <td />
              </tr>
            ))}
            {!lines.length && (
              <tr>
                <td colSpan={5} style={{ textAlign: "center" }}>
                  Enter bill numbers above and press Calculate to build the voucher.
                </td>
              </tr>
            )}
          </tbody>
          {lines.length > 0 && (
            <tfoot>
              <tr>
                <td colSpan={3} style={{ fontWeight: 700, textAlign: "right" }}>GRAND TOTAL</td>
                <td className="num" style={{ textAlign: "right", fontWeight: 700 }}>{money(grand)}</td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 52, fontSize: 11 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ borderTop: "1px solid #111", width: 180, paddingTop: 4 }}>Prepared by</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ borderTop: "1px solid #111", width: 180, paddingTop: 4 }}>Authorized Stamp</div>
          </div>
        </div>
      </div>
    </div>
  );
}
