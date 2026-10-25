import Link from "next/link";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { PrintButton } from "@/components/PrintButton";
import { db } from "@/db";
import { invoiceItems, invoices } from "@/db/schema";
import { getSettings } from "@/lib/settings";
import { money, num, toNum } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function PrintBillPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invoiceId = Number(id);
  if (!Number.isInteger(invoiceId) || invoiceId <= 0) notFound();

  const hdr = (await db.select().from(invoices).where(eq(invoices.id, invoiceId)).limit(1))[0];
  if (!hdr) notFound();
  const items = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId)).orderBy(invoiceItems.id);
  const settings = await getSettings();

  const charges = [
    { label: "Commission", value: toNum(hdr.commission) },
    { label: "Labour", value: toNum(hdr.labour) },
    { label: "Plastic Bags", value: toNum(hdr.plasticBag) },
    { label: "Market Fee", value: toNum(hdr.marketFee) },
    { label: "Thread", value: toNum(hdr.thread) },
    { label: "Brokery", value: toNum(hdr.brokery) },
  ];
  const totalExp = charges.reduce((s, c) => s + c.value, 0);

  return (
    <div>
      <div className="flex items-center gap-2 flex-wrap no-print" style={{ marginBottom: 16 }}>
        <Link href="/invoices" className="btn btn-ghost">
          <ArrowLeft size={15} /> Back to invoices
        </Link>
        <Link href={`/invoices/${hdr.id}/edit`} className="btn btn-ghost">
          <Pencil size={15} /> Edit bill
        </Link>
        <PrintButton label="Print bill" />
      </div>

      <div className="print-sheet">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "0.08em" }}>{settings.shopName}</div>
            <div style={{ fontSize: 11.5, marginTop: 3 }}>
              {settings.shopAddress} | {settings.shopPhone}
            </div>
          </div>
          <div style={{ fontSize: 12, whiteSpace: "nowrap" }}>
            R No: <span style={{ borderBottom: "1px solid #111", display: "inline-block", width: 90 }} />
          </div>
        </div>

        <div className="rule-double" style={{ margin: "10px 0 12px" }} />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, fontSize: 11, marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase", color: "#555" }}>Bill No</div>
            <div style={{ fontWeight: 700 }}>#{hdr.id}</div>
          </div>
          <div>
            <div style={{ fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase", color: "#555" }}>Agent Code</div>
            <div style={{ fontWeight: 700 }}>{hdr.agentCode}</div>
          </div>
          <div>
            <div style={{ fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase", color: "#555" }}>Truck No</div>
            <div style={{ fontWeight: 700 }}>{hdr.vehicleNo.toUpperCase()}</div>
          </div>
          <div>
            <div style={{ fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase", color: "#555" }}>Permit No</div>
            <div style={{ fontWeight: 700 }}>{hdr.permitNo || "---"}</div>
          </div>
          <div>
            <div style={{ fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase", color: "#555" }}>Date</div>
            <div style={{ fontWeight: 700 }}>{hdr.invoiceDate}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style={{ width: "38%" }}>Description</th>
              <th>Bags</th>
              <th>Weight</th>
              <th>Rate</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id}>
                <td>{it.storeName}</td>
                <td className="num" style={{ textAlign: "right" }}>{num(it.qtyBori, 0)}</td>
                <td className="num" style={{ textAlign: "right" }}>{num(toNum(it.totalWeight))}</td>
                <td className="num" style={{ textAlign: "right" }}>{money(it.price)}</td>
                <td className="num" style={{ textAlign: "right" }}>{money(it.amount)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td style={{ fontWeight: 700 }}>TOTAL</td>
              <td className="num" style={{ textAlign: "right" }}>{num(hdr.totalBori, 0)}</td>
              <td className="num" style={{ textAlign: "right" }}>{num(toNum(hdr.totalWeight))}</td>
              <td />
              <td className="num" style={{ textAlign: "right" }}>{money(hdr.corncost)}</td>
            </tr>
          </tfoot>
        </table>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 18 }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 700, marginBottom: 5 }}>
              Expenses Breakdown
            </div>
            <table>
              <tbody>
                {charges.map((c) => (
                  <tr key={c.label}>
                    <td>{c.label}</td>
                    <td className="num" style={{ textAlign: "right", width: 110 }}>{money(c.value)}</td>
                  </tr>
                ))}
                <tr>
                  <td style={{ fontWeight: 700 }}>Total Exp</td>
                  <td className="num" style={{ textAlign: "right", fontWeight: 700 }}>{money(totalExp)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div>
            <div style={{ fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 700, marginBottom: 5 }}>
              Final Total
            </div>
            <table>
              <tbody>
                <tr>
                  <td>Corn Cost</td>
                  <td className="num" style={{ textAlign: "right", width: 130 }}>{money(hdr.corncost)}</td>
                </tr>
                <tr>
                  <td>Expenses (+)</td>
                  <td className="num" style={{ textAlign: "right" }}>{money(totalExp)}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 700, background: "#f1f1ee" }}>NET PAYABLE Rs.</td>
                  <td className="num" style={{ textAlign: "right", fontWeight: 700, fontSize: 14, background: "#f1f1ee" }}>
                    {money(hdr.total)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 46, fontSize: 11 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ borderTop: "1px solid #111", width: 170, paddingTop: 4 }}>Representative sign</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ borderTop: "1px solid #111", width: 170, paddingTop: 4 }}>Agent Sign</div>
          </div>
        </div>

        <div style={{ marginTop: 18, fontSize: 9, color: "#666", textAlign: "center" }}>
          Rates on this bill are frozen in the invoice record. 1 bori = 70 kg · rate quoted per 40 kg.
        </div>
      </div>
    </div>
  );
}
