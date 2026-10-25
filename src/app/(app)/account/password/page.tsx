import { requireUser } from "@/lib/auth";
import { PasswordForm } from "@/components/PasswordForm";

export const dynamic = "force-dynamic";

export default async function ChangePasswordPage() {
  const user = await requireUser();
  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div className="micro">Account</div>
        <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em" }}>Change Password</h1>
        <p style={{ color: "var(--muted)", fontSize: 12.5, marginTop: 2 }}>
          Signed in as <strong>{user.username}</strong>.
        </p>
      </div>
      <PasswordForm mustChange={user.mustChangePassword} />
    </div>
  );
}
