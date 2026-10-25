import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { Flash } from "@/components/Flash";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <AppShell username={user.username}>
      <Suspense fallback={null}>
        <Flash />
      </Suspense>
      {children}
    </AppShell>
  );
}
