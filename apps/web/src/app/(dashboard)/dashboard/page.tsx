// Hub du tableau de bord — role-based (ESTABLISHMENT vs FREELANCE).
// KPIs + widgets renforts/ateliers dans une BentoGrid.
import Link from "next/link";
import type { Metadata } from "next";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { requireSession, fetchApi } from "../../_shared/server";
import { PageHeader, StatCard, EmptyState, SectionTitle } from "../../_shared/ui";
import { MissionCard, ServiceCard, BookingRow } from "../../_shared/cards";
import { RenfortModal } from "../../_shared/modals/RenfortModal";
import { ActionsPublication } from "../../_shared/ActionsPublication";
import {
  SuiviRattachement,
  type DemandeRattachement,
} from "../../_shared/SuiviRattachement";
import { fullName } from "../../_shared/format";
import type { Booking, Mission, Service } from "../../_shared/types";
import { AccueilParticulier } from "./AccueilParticulier";

export const metadata: Metadata = { title: "Tableau de bord" };

interface DashStats {
  activeMissions?: number;
  applications?: number;
  upcomingBookings?: number;
  revenueMonth?: number;
  unreadMessages?: number;
  fillRate?: number;
  delaiMoyenHeures?: number | null;
  /** Ce qui attend un geste de ce compte — voir `AFaire` côté API. */
  aFaire?: {
    candidaturesAExaminer?: number;
    demandesAAccepter?: number;
    aConfirmer?: number;
    aDemarrer?: number;
    aTerminer?: number;
    facturesBrouillon?: number;
  };
}

export default async function DashboardPage() {
  const session = await requireSession();

  // ⚠ LE PARTICULIER A SON PROPRE ACCUEIL (09/09/2026). Ce hub est bâti pour
  // deux métiers — chercher du renfort, ou vendre des interventions. Un parent
  // ne fait ni l'un ni l'autre : lui servir « missions publiées » et « taux de
  // remplissage » revient à lui dire que le site n'est pas pour lui. On
  // bifurque avant tous les appels, dont la plupart ne le concernent pas.
  if (session.account.type === "PARTICULIER") {
    const [moiParticulier, reservationsParticulier] = await Promise.all([
      fetchApi<{ firstName?: string | null }>(session, "/auth/me"),
      fetchApi<Booking[]>(session, "/bookings?scope=account&take=5"),
    ]);
    return (
      <AccueilParticulier
        prenom={moiParticulier.data?.firstName ?? session.user.firstName}
        reservations={reservationsParticulier.data ?? []}
      />
    );
  }

  const isEstablishment = session.account.type === "ESTABLISHMENT";

  const [moi, stats, missions, bookings, services] = await Promise.all([
    // LE PRÉNOM NE VIENT PAS DU JETON.
    //
    // Le jeton de session ne porte pas `firstName` : `session.user.firstName`
    // était donc toujours vide. Deux conséquences visibles dès la première
    // seconde d'utilisation — l'écran disait « Bonjour MECS Les Tilleuls »,
    // c'est-à-dire le nom de la structure et non celui de la personne, et la
    // case « Complétez votre profil » ne pouvait JAMAIS se cocher, quoi qu'on
    // remplisse. On accueillait le client en lui montrant qu'on n'avait rien
    // retenu de ce qu'il venait de saisir.
    fetchApi<{ firstName?: string | null; lastName?: string | null }>(session, "/auth/me"),
    fetchApi<DashStats>(session, "/dashboard/stats"),
    fetchApi<Mission[]>(session, "/missions?scope=account&take=4"),
    fetchApi<Booking[]>(session, "/bookings?scope=account&take=5"),
    fetchApi<Service[]>(session, "/services?scope=account&take=4"),
  ]);

  // Demandes de rattachement envoyées par ce compte « salarié » : leur état
  // n'était visible nulle part après l'envoi depuis le wizard (voir
  // SuiviRattachement). Comptes individuels uniquement — un établissement
  // n'envoie jamais de demande, il en reçoit.
  const rattachements = isEstablishment
    ? { data: [] as DemandeRattachement[] }
    : await fetchApi<DemandeRattachement[]>(session, "/attachment-requests/mine");

  const s = stats.data ?? {};

  // L'INTERVENANT A UN ORDRE, ET IL EST CELUI-CI : pièces, structure, ce
  // qu'il accepte, une fiche, l'encaissement. Chaque étape lit l'état réel
  // (pas une case cochée) : un dossier à 2/4 reste ouvert, une structure
  // rattachée se ferme toute seule. Quatre appels, uniquement pour lui.
  const guide =
    session.account.type === "FREELANCE"
      ? await Promise.all([
          fetchApi<{ completeness?: { total: number; valid: number; missing: number } }>(
            session,
            "/conformite/mes-documents",
          ),
          fetchApi<{ structureId?: string | null; siret?: string | null }>(
            session,
            `/accounts/${session.account.id}`,
          ),
          fetchApi<{ interets?: unknown[] }>(session, "/disponibilites/moi"),
          fetchApi<{ pret?: boolean }>(session, "/paiements/stripe/etat"),
        ])
      : null;
  // L'établissement aussi lit son compte : la structure y est, ou n'y est pas.
  const compteEtab = isEstablishment
    ? (await fetchApi<{ structureId?: string | null; siret?: string | null }>(session, `/accounts/${session.account.id}`)).data
    : undefined;
  const dossier = guide?.[0].data?.completeness;
  const compte = guide?.[1].data;
  const interets = guide?.[2].data?.interets ?? [];
  const encaissementPret = guide?.[3].data?.pret === true;

  // « Salarié » n'est pas un type de compte en base : à l'inscription, la
  // tuile crée un compte individuel comme pour un indépendant. Ce qui
  // distingue les deux dans les faits, c'est la demande de rattachement — un
  // indépendant n'en fait jamais. C'est donc elle qu'on lit, plutôt que
  // d'ajouter un champ que rien ne remplirait de façon fiable.
  const demandesRattachement = rattachements.data ?? [];
  const estSalarie = demandesRattachement.length > 0;
  const rattachementApprouve = demandesRattachement.some((d) => d.status === "APPROVED");

  return (
    <div className="space-y-8">
      <PageHeader
        title={(() => {
          // Le prénom seul : on se dit bonjour, on ne s'appelle pas par son
          // état civil complet.
          const prenom = moi.data?.firstName?.trim() || session.user.firstName?.trim();
          if (prenom) return `Bonjour ${prenom}`;
          const who = fullName(session.user.firstName, session.user.lastName);
          const name = who !== "Utilisateur" ? who : (session.account?.name ?? "");
          return name ? `Bonjour ${name}` : "Bonjour";
        })()}
        subtitle={
          isEstablishment
            ? "Pilotez vos renforts, réservations d’ateliers et votre équipe."
            : "Trouvez des missions, gérez vos ateliers et vos candidatures."
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <ActionsPublication
              accountId={session.account.id}
              accountType={session.account.type}
              role={session.account.role}
            />
            {/* « Explorer les missions » doublonnait l'entrée « Opportunités »
                du menu, qui fait la même chose en mieux (les missions y sont
                triées par correspondance avec le profil). */}
          </div>
        }
      />

      {!isEstablishment ? (
        <SuiviRattachement
          demandes={rattachements.data ?? []}
          accountId={session.account.id}
        />
      ) : null}

      {/* Onboarding : guide de démarrage, masqué une fois toutes les étapes faites. */}
      {(() => {
        const hasCatalog = isEstablishment
          ? (missions.data?.length ?? 0) > 0
          : (services.data?.length ?? 0) > 0;
        // Les étapes disent l'ordre dans lequel l'outil devient utile, pas
        // l'ordre dans lequel il a été construit. Pour un établissement :
        // d'abord son découpage, puis ses gens, et seulement ensuite un
        // renfort — publier un besoin avant d'avoir une équipe, c'est se
        // priver de la diffusion en cascade qui fait tout l'intérêt.
        const steps = isEstablishment
          ? [
              {
                done: Boolean(moi.data?.firstName ?? session.user.firstName),
                label: "Complétez votre profil",
                href: "/dashboard/account",
              },
              // Plus de « services » ni d'« équipe » à constituer (23/09/2026) :
              // les sous-comptes sont archivés et chaque collègue a son compte.
              // La structure (SIRET) est ce qui rend le devis et la facture justes.
              {
                done: Boolean(compteEtab?.structureId || compteEtab?.siret),
                label: "Rattachez votre structure (SIRET)",
                href: "/dashboard/account",
              },
              {
                done: hasCatalog,
                label: "Publiez votre premier RenforTeam",
                href: "/dashboard/renforts",
              },
            ]
          : estSalarie
            ? [
                // UN SALARIÉ N'EST PAS UN INDÉPENDANT QUI S'IGNORE.
                //
                // Techniquement, « Salarié » et « Professionnel » créent le
                // même compte : les étapes de prise en main étaient donc les
                // mêmes. On demandait à un éducateur venu simplement rejoindre
                // sa maison de créer un atelier et de candidater à des
                // missions — le métier d'un autre. C'est le profil qui arrive
                // en volume derrière chaque établissement signé, et celui qui
                // décroche le plus vite si le premier écran ne le reconnaît
                // pas. Il n'a qu'une chose à faire : se rattacher.
                {
                  done: Boolean(moi.data?.firstName ?? session.user.firstName),
                  label: "Complétez votre profil",
                  href: "/dashboard/account",
                },
                {
                  done: rattachementApprouve,
                  label: "Rejoignez votre établissement",
                  href: "/dashboard",
                },
                {
                  done: (s.applications ?? 0) > 0,
                  label: "Répondez à un renfort de votre équipe",
                  href: "/dashboard/opportunites",
                },
              ]
            : [
              {
                done: dossier !== undefined && dossier.missing === 0 && dossier.valid >= dossier.total,
                label: dossier
                  ? `Déposez vos pièces obligatoires (${dossier.valid}/${dossier.total} vérifiées)`
                  : "Déposez vos pièces obligatoires",
                href: "/dashboard/mon-dossier",
              },
              {
                done: Boolean(compte?.structureId || compte?.siret),
                label: "Renseignez votre structure (SIRET)",
                href: "/dashboard/account",
              },
              {
                done: interets.length > 0,
                label: "Dites ce que vous acceptez de faire",
                href: "/dashboard/disponibilite",
              },
              {
                done: hasCatalog,
                label: "Publiez votre première fiche",
                href: "/dashboard/ateliers",
              },
              {
                done: encaissementPret,
                label: "Reliez votre encaissement par carte",
                href: "/dashboard/encaissement",
              },
            ];
        const remaining = steps.filter((st) => !st.done).length;
        if (remaining === 0) return null;
        return (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="space-y-3 p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">Prise en main : {steps.length - remaining}/{steps.length}</p>
                <span className="text-xs text-muted-foreground">
                  {isEstablishment
                    ? "Vos services et votre équipe d’abord : c’est ce qui met des gens dans le planning."
                    : session.account.type === "FREELANCE"
                      ? "Dans cet ordre : c’est ce qui vous rend visible, puis réservable, puis payé."
                      : "Quelques étapes pour bien démarrer"}
                </span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {steps.map((st) => (
                  <Link
                    key={st.label}
                    href={st.href}
                    className={`flex items-center gap-2 rounded-lg border p-3 text-sm transition ${
                      st.done ? "border-border bg-card text-muted-foreground" : "border-primary/40 bg-card hover:bg-primary/10"
                    }`}
                  >
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs ${st.done ? "bg-success/20 text-success" : "border border-primary text-primary"}`}>
                      {st.done ? "✓" : ""}
                    </span>
                    {/* PAS DE TEXTE BARRÉ SUR UNE ÉTAPE RÉUSSIE.
                        Trois lignes barrées au premier écran, ça se lit
                        « annulé » ou « indisponible », jamais « accompli »
                        c'est la convention typographique de la rature, et
                        elle joue contre nous ici. La coche verte et la
                        couleur atténuée disent déjà que c'est fait ; le trait
                        ne fait qu'ajouter une négation. */}
                    <span className={st.done ? "" : "font-medium text-foreground"}>{st.label}</span>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* KPIs : les statistiques du compte. */}
      {(() => {
        // 21/08/2026 (demande Siham) : les statistiques s'affichent TOUJOURS.
        // Elles n'apparaissaient qu'à partir de la première activité ; un
        // compte calme n'avait donc AUCUNE statistique sur son tableau de
        // bord, et rien ne disait qu'elles existaient. Un zéro est une
        // information — « aucune candidature reçue » se pilote aussi.
        return (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {isEstablishment ? (
              <>
                <StatCard label="Renforts actifs" value={s.activeMissions ?? 0} accent="teal" />
                <StatCard label="Candidatures reçues" value={s.applications ?? 0} accent="terracotta" />
                <StatCard label="Interventions à venir" value={s.upcomingBookings ?? 0} />
                <StatCard
                  label="Taux de couverture"
                  value={`${s.fillRate ?? 0}%`}
                  hint={
                    s.delaiMoyenHeures != null
                      ? `30 derniers jours · pourvues en ${s.delaiMoyenHeures} h en moyenne`
                      : "30 derniers jours"
                  }
                />
              </>
            ) : (
              <>
                <StatCard label="Candidatures en cours" value={s.applications ?? 0} accent="teal" />
                <StatCard label="Interventions à venir" value={s.upcomingBookings ?? 0} accent="terracotta" />
                <StatCard label="Ateliers publiés" value={services.data?.length ?? 0} />
                <StatCard
                  label="Revenus du mois"
                  value={new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(s.revenueMonth ?? 0)}
                />
              </>
            )}
          </div>
        );
      })()}

      {/* BentoGrid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Colonne principale (2/3) */}
        <div className="space-y-6 lg:col-span-2">
          {isEstablishment ? (
            <Card>
              <CardHeader>
                <SectionTitle
                  title="Mes renforts"
                  action={
                    <Button asChild variant="link" size="sm">
                      <Link href="/dashboard/renforts">Tout voir</Link>
                    </Button>
                  }
                />
              </CardHeader>
              <CardContent>
                {missions.data && missions.data.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {missions.data.map((m) => (
                      <MissionCard key={m.id} mission={m} href={`/dashboard/renforts?mission=${m.id}`} />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="Aucun renfort publié"
                    description="Publiez votre premier RenforTeam pour recevoir des candidatures."
                    action={<RenfortModal accountId={session.account.id} />}
                  />
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <SectionTitle
                  title="Mes ateliers"
                  action={
                    <Button asChild variant="link" size="sm">
                      <Link href="/dashboard/ateliers">Gérer</Link>
                    </Button>
                  }
                />
              </CardHeader>
              <CardContent>
                {services.data && services.data.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {services.data.map((sv) => (
                      <ServiceCard key={sv.id} service={sv} href={`/dashboard/ateliers?service=${sv.id}`} />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="Aucun atelier"
                    description="Créez votre premier atelier pour être visible dans le catalogue."
                    action={
                      <Button asChild>
                        <Link href="/dashboard/ateliers">Créer un atelier</Link>
                      </Button>
                    }
                  />
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Colonne latérale (1/3) : activité récente */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <SectionTitle
                title="Activité récente"
                action={
                  <Button asChild variant="link" size="sm">
                    <Link href="/dashboard/planning">Planning</Link>
                  </Button>
                }
              />
            </CardHeader>
            <CardContent className="space-y-3">
              {bookings.data && bookings.data.length > 0 ? (
                bookings.data.map((b) => <BookingRow key={b.id} booking={b} />)
              ) : (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Aucune activité pour le moment.
                </p>
              )}
            </CardContent>
          </Card>

          {(() => {
            // BLOC « À FAIRE » : DES GESTES, PAS DES CHIFFRES.
            //
            // ⚠⚠ IL A ANNONCÉ « TOUT EST À JOUR » PENDANT QUE TREIZE
            // RÉSERVATIONS SUR DIX-SEPT ATTENDAIENT QUELQU'UN (mesuré le
            // 21/09/2026, avec six factures en brouillon par-dessus). Il ne
            // connaissait que quatre sources, dont « N interventions à venir »
            // — qui pointait sur le PLANNING, c'est-à-dire sur un calendrier où
            // aucun de ces gestes ne se fait.
            //
            // ⚠ CHAQUE ENTRÉE NOMME LE GESTE ET MÈNE À L'ÉCRAN QUI L'EXÉCUTE.
            // « à démarrer », « à terminer », « à émettre » se lisent comme un
            // verbe à faire ; « à venir » se lit comme une information, et une
            // information ne se raye pas d'une liste. C'est le dernier mètre du
            // chemin de l'argent : sans `COMPLETED`, `preparerFactureAtelier()`
            // n'est jamais appelée, donc aucune facture n'existe — et un
            // brouillon qu'on ne voit pas ne s'émet jamais.
            //
            // ⚠ LES COMPTEURS VIENNENT DE L'API, CÔTÉ OFFREUR (voir `AFaire`
            // dans `dashboard.controller.ts`) : le serveur réserve ces quatre
            // transitions au sollicité. Les calculer ici depuis la liste
            // tronquée `bookings` (take=5) donnerait un nombre faux, et les
            // déduire de `Booking.accountId` afficherait des boutons qui
            // mènent à un 403.
            const f = s.aFaire ?? {};
            const todos: { label: string; href: string }[] = [];
            const pousser = (n: number | undefined, label: (n: number) => string, href: string) => {
              if ((n ?? 0) > 0) todos.push({ label: label(n!), href });
            };
            const s_ = (n: number) => (n > 1 ? "s" : "");

            // L'ordre suit la machine à états : ce qui bloque le plus en amont
            // d'abord. Une candidature non examinée immobilise quelqu'un qui
            // attend une réponse ; une facture en brouillon n'immobilise que
            // de l'argent déjà gagné.
            pousser(
              f.candidaturesAExaminer,
              (n) => `${n} candidature${s_(n)} à examiner`,
              "/dashboard/renforts",
            );
            pousser(
              f.demandesAAccepter,
              (n) => `${n} demande${s_(n)} d’atelier à accepter`,
              "/dashboard/ateliers",
            );
            pousser(
              f.aConfirmer,
              (n) => `${n} réservation${s_(n)} à confirmer`,
              "/dashboard/reservations",
            );
            pousser(
              f.aDemarrer,
              (n) => `${n} intervention${s_(n)} à démarrer`,
              "/dashboard/reservations",
            );
            pousser(
              f.aTerminer,
              (n) => `${n} intervention${s_(n)} à terminer`,
              "/dashboard/reservations",
            );
            // ⚠ LA FACTURE SUIT LE MÊME FILTRE DE RÔLE QUE SON ENTRÉE DE MENU
            // (`Devis & factures`, OWNER/ADMIN/MANAGER côté établissement).
            // Annoncer « 6 factures à émettre » à un MEMBER le renverrait sur
            // un écran que son menu ne lui ouvre pas : une tâche qu'on ne peut
            // pas faire est pire qu'une tâche qu'on ne voit pas.
            const voitLaFacturation =
              !isEstablishment ||
              ["OWNER", "ADMIN", "MANAGER"].includes(session.account.role ?? "");
            if (voitLaFacturation) {
              pousser(
                f.facturesBrouillon,
                (n) => `${n} facture${s_(n)} à émettre`,
                "/dashboard/facturation",
              );
            }
            if ((s.unreadMessages ?? 0) > 0) {
              todos.push({
                label: `${s.unreadMessages} message${s.unreadMessages! > 1 ? "s" : ""} non lu${s.unreadMessages! > 1 ? "s" : ""}`,
                href: "/dashboard/inbox",
              });
            }
            if (!session.user.firstName) {
              todos.push({ label: "Compléter votre profil", href: "/dashboard/account" });
            }
            return (
              <Card className="bg-primary/5">
                <CardHeader>
                  <SectionTitle title="À faire" />
                </CardHeader>
                <CardContent className="space-y-2">
                  {todos.length > 0 ? (
                    todos.map((t) => (
                      <Button key={t.href + t.label} asChild variant="outline" className="w-full justify-between">
                        <Link href={t.href}>
                          <span>{t.label}</span>
                          <span aria-hidden>→</span>
                        </Link>
                      </Button>
                    ))
                  ) : (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                      Tout est à jour. Rien ne vous attend pour le moment.
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
