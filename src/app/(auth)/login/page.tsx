import { ShopMark } from "@/components/ShopMark";
import { LoginForm } from "@/components/LoginForm";
import { issueFormToken } from "@/lib/validate";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  const csrfToken = issueFormToken();
  return (
    <div className="login-split">
      <div className="login-art" style={{ position: "relative" }}>
        <img className="login-art-img" src="/images/counter.jpg" alt="Commission shop counter with ledger and maize sacks" />
        <div className="login-art-scrim" />
        <div style={{ position: "absolute", inset: 0, padding: "42px 46px", display: "flex", flexDirection: "column" }}>
          <div className="flex items-center gap-3">
            <ShopMark size={40} tone="#34d399" />
            <div>
              <div style={{ color: "#fff", fontWeight: 700, letterSpacing: "0.06em", fontSize: 16 }}>
                HAMDAN COMMISSION SHOP
              </div>
              <div className="micro" style={{ color: "#a7f3d0" }}>
                29/B Grain Market, Arifwala
              </div>
            </div>
          </div>
          <div style={{ marginTop: "auto", maxWidth: 460 }}>
            <div className="micro" style={{ color: "#a7f3d0" }}>
              Ledger · Purchases · Bills · Vouchers
            </div>
            <h1
              style={{
                color: "#fff",
                fontSize: 38,
                lineHeight: 1.12,
                fontWeight: 700,
                letterSpacing: "-0.02em",
                marginTop: 10,
              }}
            >
              Every bori, every rupee,
              <br />
              in one ruled book.
            </h1>
            <p style={{ color: "#e2e8f0", fontSize: 13.5, marginTop: 12, lineHeight: 1.7 }}>
              Commission agent accounts for the maize trade — purchase bills, PIC CORN invoices, store
              ledger, balance sheet and payment vouchers. Print-ready A4 paperwork, exactly like the shop
              counter.
            </p>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px 24px",
          background: "var(--page)",
        }}
      >
        <div style={{ width: "100%", maxWidth: 380 }}>
          <div className="micro">Restricted · Owner access</div>
          <h2 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em", margin: "8px 0 4px" }}>
            Hamdan Commission Shop
          </h2>
          <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 26 }}>
            Sign in to the shop portal. All pages require an account.
          </p>
          <LoginForm csrfToken={csrfToken} />
          <p className="help" style={{ marginTop: 22, borderTop: "1px solid var(--paper-edge)", paddingTop: 14 }}>
            Session times out after 45 minutes of inactivity. Five failed attempts lock the login for 10
            minutes. The seeded owner account must change its password on first sign in.
          </p>
        </div>
      </div>
    </div>
  );
}
