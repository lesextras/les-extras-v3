// Layout du groupe (dashboard) : garde de session + coquille applicative.
import type { ReactNode } from "react";
import { headers } from "next/headers";
import { AppShell } from "@/components/layout";
import { resolveNavRole } from "@/lib/nav";
import { requireSession, fetchApi, sansCompte } from "../_shared/server";
import { ConfirmationRequise } from "../_shared/ConfirmationRequise";
import { InvitationParrainage } from "../_shared/InvitationParrainage";
import { SansCompte } from "../_shared/SansCompte";

/**
 * Ce qu'une personne sans compte peut encore ouvrir : ses données
 * personnelles (art. 12 RGPD, le droit d'accès et d'effacement ne dépend pas
 * d'un compte). Tout le reste parle au nom d'un compte qu'elle n'a pas.
 */
const OUVERT_SANS_COMPTE = ["/dashboard/donnees-personnelles"];

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await requireSession();
  const role = resolveNavRole({
    globalRole: session.user.role,
    accountType: session.account.type,
  });

  // L'état de vérification n'est pas dans le jeton (il change après émission) :
  // on le lit à la source. Une requête légère, une seule fois par navigation.
  // `firstName` est lu ici et passé plus bas : le jeton de session ne le porte
  // pas, et l'écran sans compte dit « Bonjour » comme tous les autres tableaux
  // de bord.
  const { data: moi } = await fetchApi<{
    emailVerified?: boolean;
    email?: string;
    firstName?: string | null;
    lastName?: string | null;
  }>(session, "/auth/me");
  const aConfirmer = moi?.emailVerified === false;

  // Adresse jamais confirmée : l'espace reste fermé. Un écran dédié, sans
  // menu, avec le renvoi du lien et la déconnexion. Rien d'autre ne se charge.
  if (aConfirmer) {
    return <ConfirmationRequise email={moi?.email ?? session.user.email} />;
  }

  // UN COMPTE = UNE PERSONNE (24/09/2026). Sans compte à elle, la personne
  // voit un seul écran : celui qui lui permet de créer le sien. L'administration
  // de la plateforme garde ses pages (elle n'a pas de compte « tenant »).
  const chemin = (await headers()).get("x-chemin") ?? "/dashboard";
  const aucunCompte = sansCompte(session);
  const ecranSansCompte =
    aucunCompte &&
    session.user.role !== "ADMIN" &&
    !OUVERT_SANS_COMPTE.some((ouvert) => chemin === ouvert || chemin.startsWith(`${ouvert}/`));

  const prenom = moi?.firstName?.trim() || session.user.firstName?.trim() || null;
  const nomComplet = [moi?.firstName ?? session.user.firstName, moi?.lastName ?? session.user.lastName]
    .filter(Boolean)
    .join(" ");

  return (
    <AppShell
      user={session.user as any}
      accounts={session.accounts ?? [session.account]}
      activeAccount={session.account}
      role={role}
      sansCompte={aucunCompte}
    >
      {/* L'invitation à parrainer, une fois par compte. Montée ici et non sur
          une page précise : le parrainage ne dépend d'aucun écran. Sans
          compte, il n'y a rien à faire vivre, donc rien à recommander. */}
      {!aucunCompte ? <InvitationParrainage accountId={session.account.id} /> : null}

      {ecranSansCompte ? <SansCompte prenom={prenom} nomComplet={nomComplet} /> : children}
    </AppShell>
  );
}
