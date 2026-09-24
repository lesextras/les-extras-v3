// Mes ateliers (FREELANCE) : catalogue personnel + réservations reçues.
import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { requireSession, fetchApi } from "../../../_shared/server";
import { PageHeader, EmptyState, ErrorState, SectionTitle } from "../../../_shared/ui";
import { ServiceCard, BookingRow } from "../../../_shared/cards";
import { ServiceModal } from "../../../_shared/modals/ServiceModal";
import { peutPublier } from "@/lib/publication";
import { CompletudeBandeau } from "../../../_shared/CompletudeFiche";
import { completude } from "@/lib/completude-fiche";
import { BookingActions } from "../../../_shared/BookingActions";
import { BlocParrainage } from "../../../_shared/BlocParrainage";
import { SERVICE_STATUS_LABEL } from "../../../_shared/format";
import {
  ReservationsPayees,
  type ReservationPayee,
} from "../../../_shared/ReservationsPayees";
import type { Booking, Service } from "../../../_shared/types";

export const metadata: Metadata = { title: "Mes ateliers" };

export default async function AteliersPage({
  searchParams,
}: {
  searchParams: Promise<{ publie?: string }>;
}) {
  const session = await requireSession();
  // Posé par ServiceModal juste après une mise en ligne réussie : l'encart
  // de parrainage ne s'affiche qu'à ce moment-là, et une seule fois.
  const { publie } = await searchParams;

  // Un compte = une personne (24/09/2026) : le titulaire publie. La règle
  // vit dans `lib/publication.ts`, une seule fois.
  const publicationPermise = peutPublier(session.account.role);

  if (session.account.type !== "FREELANCE") {
    return (
      <div className="space-y-6">
        <PageHeader title="Mes ateliers" />
        <EmptyState
          title="Réservé aux intervenants"
          description="La gestion des ateliers se fait depuis un compte intervenant. Depuis celui-ci, vous pouvez réserver des ateliers au catalogue."
          action={
            <Button asChild>
              <Link href="/marketplace?type=services">Voir le catalogue d’ateliers</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const [services, bookings, payees] = await Promise.all([
    fetchApi<Service[]>(session, "/services?scope=account"),
    fetchApi<Booking[]>(session, "/bookings?scope=account&kind=service"),
    // Les ateliers réglés en ligne : un tunnel à part, où l'argent est déjà
    // arrivé. Une erreur ici ne doit pas emporter la page entière — le
    // catalogue et les réservations classiques comptent davantage.
    fetchApi<ReservationPayee[]>(session, "/ateliers/reservations"),
  ]);
  const listePayees = payees.data ?? [];
  const aConfirmer = listePayees.filter((r) => r.statut === "PAYEE").length;

  // LES RÉSERVATIONS QUI DEMANDENT UN GESTE — pas seulement les nouvelles.
  //
  // ⚠ CET ÉCRAN NE MONTRAIT QUE LES « REQUESTED », ET C'ÉTAIT LE TROU LE PLUS
  // COÛTEUX DU PRODUIT. Dès qu'un intervenant acceptait une réservation, elle
  // quittait cette section et retombait en simple ligne d'historique, sans
  // aucun bouton — alors que le serveur réserve précisément à l'intervenant le
  // droit de la confirmer, de la démarrer et de la terminer (`assertOffreur`).
  //
  // Comme la facture d'atelier n'est préparée QUE par `complete()`, plus aucune
  // facture ne pouvait naître. Mesuré en production le 3/09/2026 : une seule
  // réservation terminée sur quinze, huit bloquées en « confirmée ».
  //
  // Les quatre états qui attendent quelque chose sont donc listés ensemble, dans
  // l'ordre de la machine à états. `COMPLETED` et `CANCELLED` n'y sont pas :
  // elles n'attendent plus rien et vivent dans l'historique, en bas.
  const A_TRAITER = ["REQUESTED", "ACCEPTED", "CONFIRMED", "IN_PROGRESS"] as const;
  const ETAPE: Record<string, string> = {
    REQUESTED: "Nouvelle demande, à accepter ou à décliner",
    ACCEPTED: "Acceptée, confirmez la date pour la bloquer",
    CONFIRMED: "Date bloquée, démarrez le jour de l’atelier",
    IN_PROGRESS: "En cours, marquez-la terminée pour préparer la facture",
  };
  const pending = (bookings.data ?? [])
    .filter((b) => (A_TRAITER as readonly string[]).includes(b.status))
    .sort(
      (a, z) =>
        A_TRAITER.indexOf(a.status as never) - A_TRAITER.indexOf(z.status as never),
    );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Mes ateliers"
        subtitle="Gérez votre catalogue d’interventions et vos demandes de réservation."
        actions={publicationPermise ? <ServiceModal accountId={session.account.id} /> : null}
      />

      {publie === "1" ? (
        <Card className="border-primary/30 bg-primary-soft">
          <CardHeader>
            <SectionTitle title="Votre atelier est en ligne. Et un collègue ?" />
            <p className="text-sm text-muted-foreground">
              Un intervenant qui publie grâce à vous, ce sont des points pour vous et un
              catalogue plus large pour tout le monde. Le lien ci-dessous est le vôtre.
            </p>
          </CardHeader>
          <CardContent>
            <BlocParrainage accountId={session.account.id} />
          </CardContent>
        </Card>
      ) : null}

      {pending.length > 0 ? (
        <Card className="border-secondary/30 bg-secondary/5">
          <CardHeader>
            <SectionTitle title={`Réservations à traiter (${pending.length})`} />
          </CardHeader>
          <CardContent className="space-y-3">
            {pending.map((b) => (
              <div
                key={b.id}
                id={b.id}
                className="flex flex-wrap items-start justify-between gap-3 scroll-mt-24 rounded-lg border border-border bg-card p-4"
              >
                {/* Répondre à une demande sans savoir combien de personnes on
                    accueille ni pour quel public, c'est répondre à l'aveugle.
                    L'établissement le saisissait déjà ; personne ne le lisait. */}
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-medium text-foreground">{b.service?.title ?? "Atelier"}</p>
                  {/* L'ÉTAPE, EN TOUTES LETTRES. La machine à états compte
                      quatre marches ; sans les nommer, l'intervenant ne sait
                      pas laquelle il vient de franchir ni ce qui reste. */}
                  <p className="text-xs font-medium text-primary">{ETAPE[b.status] ?? ""}</p>
                  <p className="text-xs text-muted-foreground">
                    Demandé par {b.account?.name ?? "un établissement"}
                    {b.scheduledAt
                      ? ` · pour le ${new Date(b.scheduledAt).toLocaleDateString("fr-FR")}`
                      : " · date à convenir"}
                    {b.participants
                      ? ` · ${b.participants} participant${b.participants > 1 ? "s" : ""}`
                      : ""}
                  </p>
                  {b.requestNote ? (
                    <p className="max-w-prose whitespace-pre-line rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                      {b.requestNote}
                    </p>
                  ) : null}
                </div>
                <BookingActions
                  bookingId={b.id}
                  accountId={session.account.id}
                  status={b.status}
                  contexte="atelier"
                />
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {listePayees.length > 0 ? (
        <section id="payes" className="space-y-4 scroll-mt-24">
          <SectionTitle
            title={
              aConfirmer > 0
                ? `Ateliers payés en ligne (${aConfirmer} à confirmer)`
                : "Ateliers payés en ligne"
            }
          />
          <p className="max-w-prose text-sm text-muted-foreground">
            L&apos;argent est déjà sur votre compte : ces personnes ont payé sans passer par un
            devis. Il reste à confirmer la date avec elles, ou à les rembourser si vous ne pouvez
            pas assurer l&apos;atelier.
          </p>
          <ReservationsPayees initiales={listePayees} accountId={session.account.id} />
        </section>
      ) : null}

      <section className="space-y-4">
        <SectionTitle title="Catalogue" />
        {services.error ? (
          <ErrorState retryHref="/dashboard/ateliers" />
        ) : !services.data || services.data.length === 0 ? (
          <EmptyState
            title="Aucun atelier"
            description="Publiez votre premier atelier pour apparaître dans le catalogue et recevoir des réservations."
            action={publicationPermise ? <ServiceModal accountId={session.account.id} /> : null}
          />
        ) : (
          <>
            {(() => {
              // Le rappel en tête de section : sans lui, l'information reste
              // sous la troisième carte et personne ne descend jusque-là.
              const aCompleter = services.data.filter((sv) => !completude(sv).socleComplet);
              if (aCompleter.length === 0) return null;
              return (
                <Card className="border-secondary/30 bg-secondary/5">
                  <CardContent className="p-4">
                    <p className="text-sm font-semibold text-foreground">
                      {aCompleter.length === 1
                        ? "Une de vos fiches est incomplète"
                        : `${aCompleter.length} de vos fiches sont incomplètes`}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      Elles restent en ligne, rien n'est retiré. Mais à côté d'une fiche qui
                      annonce sa durée, son nombre de participants et son déroulé, elles se font
                      moins ouvrir. Le détail de ce qui manque est sous chaque fiche.
                    </p>
                  </CardContent>
                </Card>
              );
            })()}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.data.map((sv) => (
              <div key={sv.id} className="relative">
                <Badge className="absolute right-3 top-3 z-10" variant="outline">
                  {SERVICE_STATUS_LABEL[sv.status]}
                </Badge>
                <ServiceCard audience service={sv} href={`/marketplace/services/${sv.id}`} />
                {/* CE QUI MANQUE, ÉCRIT SOUS LA FICHE.
                    Dix des treize ateliers du catalogue sont publiés sans
                    durée, sans participants, sans matériel ni créneaux, et
                    rien ne le disait jamais à leur auteur. La fiche part au
                    catalogue, elle a l'air normale dans son propre espace, et
                    c'est le visiteur qui voit la différence. */}
                <CompletudeBandeau fiche={sv} />
                {/* Une fiche publiée n'était plus modifiable ni suspendable :
                    la liste n'offrait aucune action, alors que l'API l'a
                    toujours permis. */}
                {publicationPermise ? (
                  <div className="mt-2 flex justify-end">
                    <ServiceModal
                      accountId={session.account.id}
                      fiche={sv as never}
                      trigger={
                        <Button size="sm" variant="outline">
                          Compléter la fiche
                        </Button>
                      }
                    />
                  </div>
                ) : null}
              </div>
            ))}
          </div>
          </>
        )}
      </section>

      <section className="space-y-4">
        <SectionTitle title="Historique des réservations" />
        {bookings.data && bookings.data.length > 0 ? (
          <div className="space-y-3">
            {bookings.data.map((b) => (
              <BookingRow key={b.id} booking={b} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Aucune réservation pour le moment.</p>
        )}
      </section>
    </div>
  );
}
