import { getSettings } from "@/lib/settings";
import { SettingsForm, SettingsValues } from "@/components/SettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const s = await getSettings();
  const initial: SettingsValues = {
    shopName: s.shopName,
    shopAddress: s.shopAddress,
    shopPhone: s.shopPhone,
    agentCode: s.agentCode,
    commissionPercent: String(s.commissionPercent),
    labourPerBori: String(s.labourPerBori),
    threadPerBori: String(s.threadPerBori),
    plasticPerBori: String(s.plasticPerBori),
    marketFeePerBori: String(s.marketFeePerBori),
    balanceWording: s.balanceWording,
    timezone: s.timezone,
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div className="micro">Configuration</div>
        <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em" }}>Settings</h1>
        <p style={{ color: "var(--muted)", fontSize: 12.5, marginTop: 2 }}>
          Shop header details and the per-season charge rates used by new invoices.
        </p>
      </div>
      <SettingsForm initial={initial} />
    </div>
  );
}
