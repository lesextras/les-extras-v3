// Layout du groupe (dashboard) : garde de session + coquille applicative.
import type { ReactNode } from "react";
import { AppShell } from "@/components/layout";
import { resolveNavRole } from "@/lib/nav";
import { requireSession, fetchApi } from "../_shared/server";
import { RappelVerification } from "../_shared/RappelVerification";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await requireSession();
  const role = resolveNavRole({
    globalRole: session.user.role,
    accountType: session.account.type,
  });

  // L'état de vérification n'est pas dans le jeton (il change après émission) :
  // on le lit à la source. Une requête légère, une seule fois par navigation.
  const { data: moi } = await fetchApi<{ emailVerified?: boolean; email?: string }>(
    session,
    "/auth/me",
  );
  const aConfirmer = moi?.emailVerified === false;

  return (
    <AppShell
      user={session.user as any}
      accounts={session.accounts ?? [session.account]}
      activeAccount={session.account}
      role={role}
    >
      {aConfirmer ? (
        <div className="mb-6">
          <RappelVerification email={moi?.email ?? session.user.email} />
        </div>
      ) : null}
      {children}
    </AppShell>
  );
}
