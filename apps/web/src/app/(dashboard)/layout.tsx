// Layout du groupe (dashboard) : garde de session + coquille applicative.
import type { ReactNode } from "react";
import { headers } from "next/headers";
import { AppShell } from "@/components/layout";
import { resolveNavRole } from "@/lib/nav";
import { cheminOuvertSansRattachement } from "@/lib/rattachement";
import { requireSession, fetchApi } from "../_shared/server";
import { RappelVerification } from "../_shared/RappelVerification";
import { EnAttenteRattachement } from "../_shared/EnAttenteRattachement";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await requireSession();
  const role = resolveNavRole({
    globalRole: session.user.role,
    accountType: session.account.type,
  });

  // L'état de vérification n'est pas dans le jeton (il change après émission) :
  // on le lit à la source. Une requête légère, une seule fois par navigation.
  const { data: moi } = await fetchApi<{
    emailVerified?: boolean;
    email?: string;
    enAttenteRattachement?: boolean;
  }>(session, "/auth/me");
  const aConfirmer = moi?.emailVerified === false;

  // Salarié pas encore rattaché : le serveur refuse déjà tout sauf LEX et sa
  // demande. On le lui dit sur la page qu'il ouvre, au lieu de le laisser
  // buter sur une erreur — il n'a rien fait de travers, il attend une réponse.
  const chemin = headers().get("x-chemin") ?? "/dashboard";
  const enAttente =
    moi?.enAttenteRattachement === true && !cheminOuvertSansRattachement(chemin);

  const { data: demandes } = enAttente
    ? await fetchApi<
        { id: string; establishmentAccount?: { name?: string }; createdAt?: string }[]
      >(session, "/attachment-requests/mine")
    : { data: undefined };

  return (
    <AppShell
      user={session.user as any}
      accounts={session.accounts ?? [session.account]}
      activeAccount={session.account}
      role={role}
      enAttenteRattachement={moi?.enAttenteRattachement === true}
    >
      {aConfirmer ? (
        <div className="mb-6">
          <RappelVerification email={moi?.email ?? session.user.email} />
        </div>
      ) : null}
      {enAttente ? (
        <EnAttenteRattachement
          accountId={session.account.id}
          demandes={(demandes ?? [])
            .filter((d) => d.establishmentAccount?.name)
            .map((d) => ({
              id: d.id,
              nom: d.establishmentAccount!.name!,
              envoyeeLe: d.createdAt
                ? new Date(d.createdAt).toLocaleDateString("fr-FR")
                : null,
            }))}
        />
      ) : (
        children
      )}
    </AppShell>
  );
}
