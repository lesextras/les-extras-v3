// Layout du groupe (dashboard) : garde de session + coquille applicative.
import type { ReactNode } from "react";
import { AppShell } from "@/components/layout";
import { resolveNavRole } from "@/lib/nav";
import { requireSession } from "../_shared/server";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await requireSession();
  const role = resolveNavRole({
    globalRole: session.user.role,
    accountType: session.account.type,
  });
  return (
    <AppShell
      user={session.user as any}
      accounts={session.accounts ?? [session.account]}
      activeAccount={session.account}
      role={role}
    >
      {children}
    </AppShell>
  );
}
