// Layout marketplace : authentifié, réutilise la coquille applicative.
import type { ReactNode } from "react";
import { AppShell } from "@/components/layout";
import { resolveNavRole } from "@/lib/nav";
import { requireSession, sansCompte } from "../_shared/server";

export default async function MarketplaceLayout({ children }: { children: ReactNode }) {
  const session = await requireSession();
  const role = resolveNavRole({
    globalRole: session.user.role,
    accountType: session.account.type,
  });

  // Le menu doit dire la même chose des deux côtés de la porte : une personne
  // sans compte voit ici le même menu réduit que dans le tableau de bord.
  return (
    <AppShell
      user={session.user as any}
      accounts={session.accounts ?? [session.account]}
      activeAccount={session.account}
      role={role}
      sansCompte={sansCompte(session)}
    >
      {children}
    </AppShell>
  );
}
