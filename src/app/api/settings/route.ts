import { NextResponse } from "next/server";
import { handleApi } from "@/lib/api";
import { saveSettings, AppSettings } from "@/lib/settings";
import { nonNegNumber, optional } from "@/lib/validate";

export async function POST(req: Request) {
  return handleApi<Partial<AppSettings>>(req, "settings-save", async (body) => {
    await saveSettings({
      shopName: optional(body.shopName, "Shop name", 255),
      shopAddress: optional(body.shopAddress, "Address", 255),
      shopPhone: optional(body.shopPhone, "Phone", 20),
      agentCode: optional(body.agentCode, "Agent code", 50),
      balanceWording: optional(body.balanceWording, "Wording", 255),
      timezone: optional(body.timezone, "Timezone", 60) || "Asia/Karachi",
      commissionPercent: nonNegNumber(body.commissionPercent, "Commission %"),
      labourPerBori: nonNegNumber(body.labourPerBori, "Labour per bori"),
      threadPerBori: nonNegNumber(body.threadPerBori, "Thread per bori"),
      plasticPerBori: nonNegNumber(body.plasticPerBori, "Plastic bag per bori"),
      marketFeePerBori: nonNegNumber(body.marketFeePerBori, "Market fee per bori"),
    });
    return NextResponse.json({ ok: true, data: { saved: true } });
  });
}
