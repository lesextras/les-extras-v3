// Layout du back-office admin : garde rôle global ADMIN + coquille applicative.
import type { ReactNode } from "react";
import { AppShell } from "@/components/layout";
import { requireAdmin } from "../_shared/server";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await requireAdmin();
  return (
    <AppShell
      user={session.user as any}
      accounts={session.accounts ?? [session.account]}
      activeAccount={session.account}
      role="ADMIN"
    >
      {children}
    </AppShell>
  );
}
