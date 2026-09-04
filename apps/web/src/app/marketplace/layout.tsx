// Layout marketplace : authentifié, réutilise la coquille applicative.
import type { ReactNode } from "react";
import { AppShell } from "@/components/layout";
import { resolveNavRole } from "@/lib/nav";
import { requireSession, fetchApi } from "../_shared/server";

export default async function MarketplaceLayout({ children }: { children: ReactNode }) {
  const session = await requireSession();
  const role = resolveNavRole({
    globalRole: session.user.role,
    accountType: session.account.type,
  });

  // ⚠ LE MENU RÉDUIT NE TENAIT QUE SUR /dashboard.
  //
  // Un salarié en attente de rattachement voit, dans le tableau de bord, un
  // menu de cinq entrées : ce qui lui est réellement ouvert. Il lui suffisait
  // de cliquer sur le catalogue — servi par CE layout — pour retrouver les
  // quinze entrées du menu freelance complet, dont douze mènent à un refus du
  // serveur. Le menu doit dire la même chose des deux côtés de la porte.
  const { data: moi } = await fetchApi<{ enAttenteRattachement?: boolean }>(
    session,
    "/auth/me",
  );

  return (
    <AppShell
      user={session.user as any}
      accounts={session.accounts ?? [session.account]}
      activeAccount={session.account}
      role={role}
      enAttenteRattachement={moi?.enAttenteRattachement === true}
    >
      {children}
    </AppShell>
  );
}
