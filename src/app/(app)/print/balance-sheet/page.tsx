import { sql } from "drizzle-orm";
import { PrintButton } from "@/components/PrintButton";
import { db } from "@/db";
import { storeLedger, stores } from "@/db/schema";
import { getSettings } from "@/lib/settings";
import { money, toNum } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function BalanceSheetPage() {
  const settings = await getSettings();

  const balances = await db
    .select({
      storeId: storeLedger.storeId,
      credit: sql<string>`coalesce(sum(${storeLedger.credit}),0)`,
      debit: sql<string>`coalesce(sum(${storeLedger.debit}),0)`,
    })
    .from(storeLedger)
    .groupBy(storeLedger.storeId);
  const balMap = new Map(balances.map((b) => [b.storeId, { credit: toNum(b.credit), debit: toNum(b.debit) }]));

  const all = await db.select().from(stores).orderBy(stores.id);
  const rows = all
    .map((s) => {
      const b = balMap.get(s.id) ?? { credit: 0, debit: 0 };
      const closing = b.credit - b.debit;
      return {
        id: s.id,
        name: s.storeName,
        status: s.status,
        closing,
        debitCol: closing < 0 ? Math.abs(closing) : 0,
        creditCol: closing > 0 ? closing : 0,
      };
    })
    .filter((r) => Math.abs(r.closing) > 0.004)
    // Fixed (system) accounts sort last
    .sort((a, b) => Number(a.status === "Fixed") - Number(b.status === "Fixed") || a.name.localeCompare(b.name));

  const grandDebit = rows.reduce((s, r) => s + r.debitCol, 0);
  const grandCredit = rows.reduce((s, r) => s + r.creditCol, 0);
  const net = grandCredit - grandDebit;

  return (
    <div>
      <div className="flex items-center gap-2 flex-wrap no-print" style={{ marginBottom: 16 }}>
        <PrintButton label="Print balance sheet" />
      </div>

      <div className="print-sheet">
        <div style={{ textAlign: "center", borderBottom: "2px solid #111", paddingBottom: 10, marginBottom: 12 }}>
          <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: "0.07em" }}>{settings.shopName}</div>
          <div style={{ fontSize: 11 }}>{settings.shopAddress} | {settings.shopPhone}</div>
          <div className="urdu" style={{ fontSize: 18, fontWeight: 700, marginTop: 6 }}>بیلنس شیٹ</div>
          <div style={{ fontSize: 10.5 }}>
            Printed {new Date().toLocaleString("en-PK", { timeZone: settings.timezone })}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style={{ width: 44 }}>SR#</th>
              <th>STORE NAME <span className="urdu" style={{ fontSize: 12 }}>نام کھاتہ</span></th>
              <th style={{ width: 130 }}>DEBIT <span className="urdu" style={{ fontSize: 12 }}>بنام</span></th>
              <th style={{ width: 130 }}>CREDIT <span className="urdu" style={{ fontSize: 12 }}>جمع</span></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id}>
                <td className="num">{i + 1}</td>
                <td>
                  {r.name}
                  {r.status === "Fixed" && (
                    <span style={{ fontSize: 9, letterSpacing: "0.06em", color: "#777", marginLeft: 8 }}>
                      (FIXED)
                    </span>
                  )}
                </td>
                <td className="num" style={{ textAlign: "right" }}>{r.debitCol ? money(r.debitCol) : "-"}</td>
                <td className="num" style={{ textAlign: "right" }}>{r.creditCol ? money(r.creditCol) : "-"}</td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={4} style={{ textAlign: "center" }}>No accounts with a balance.</td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={2} style={{ fontWeight: 700, textAlign: "right" }}>GRAND TOTAL</td>
              <td className="num" style={{ textAlign: "right" }}>{money(grandDebit)}</td>
              <td className="num" style={{ textAlign: "right" }}>{money(grandCredit)}</td>
            </tr>
            <tr>
              <td colSpan={2} style={{ fontWeight: 700, textAlign: "right" }}>
                {settings.balanceWording.split("/")[0]?.trim() || "Net credit balance"}
              </td>
              <td className="num" style={{ textAlign: "right" }}>{money(Math.max(0, -net))}</td>
              <td className="num" style={{ textAlign: "right" }}>{money(Math.max(0, net))}</td>
            </tr>
          </tfoot>
        </table>

        <div style={{ marginTop: 12, fontSize: 10.5, color: "#444" }}>
          Closing balance = total credit (جمع) − total debit (بنام). Negative closing balances are printed in the
          Debit column, positive ones in the Credit column. Fixed system accounts are listed last.
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 52, fontSize: 11 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ borderTop: "1px solid #111", width: 180, paddingTop: 4 }}>Accountant Sign</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ borderTop: "1px solid #111", width: 180, paddingTop: 4 }}>Authorized Stamp</div>
          </div>
        </div>
      </div>
    </div>
  );
}
