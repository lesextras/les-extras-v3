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
import { CompletudeBandeau } from "../../../_shared/CompletudeFiche";
import { completude } from "@/lib/completude-fiche";
import { BookingActions } from "../../../_shared/BookingActions";
import { SERVICE_STATUS_LABEL } from "../../../_shared/format";
import type { Booking, Service } from "../../../_shared/types";

export const metadata: Metadata = { title: "Mes ateliers" };

export default async function AteliersPage() {
  const session = await requireSession();

  // UN SALARIÉ EN ATTENTE PEUT REGARDER, PAS ENCORE PUBLIER.
  //
  // Cette page lui est ouverte à dessein (voir CHEMINS_OUVERTS_SANS_RATTACHEMENT) :
  // il consulte ce qui existe pendant que sa demande chemine. Mais le serveur
  // n'ouvre `services` qu'en lecture tant qu'aucun établissement ne l'a
  // accepté — le bouton « Créer un atelier » menait donc droit à un 403.
  // C'est exactement le « bouton qui mène à un refus » que le reste du produit
  // s'interdit. On affiche l'explication à la place du bouton.
  const { data: moi } = await fetchApi<{ enAttenteRattachement?: boolean }>(
    session,
    "/auth/me",
  );
  const enAttente = moi?.enAttenteRattachement === true;

  if (session.account.type !== "FREELANCE") {
    return (
      <div className="space-y-6">
        <PageHeader title="Mes ateliers" />
        <EmptyState
          title="Réservé aux intervenants"
          description="La gestion des ateliers est disponible depuis un compte freelance. Vous pouvez réserver des ateliers dans le marketplace."
          action={
            <Button asChild>
              <Link href="/marketplace?type=services">Voir le catalogue d’ateliers</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const [services, bookings] = await Promise.all([
    fetchApi<Service[]>(session, "/services?scope=account"),
    fetchApi<Booking[]>(session, "/bookings?scope=account&kind=service"),
  ]);

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
        actions={enAttente ? null : <ServiceModal accountId={session.account.id} />}
      />

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

      <section className="space-y-4">
        <SectionTitle title="Catalogue" />
        {services.error ? (
          <ErrorState retryHref="/dashboard/ateliers" />
        ) : !services.data || services.data.length === 0 ? (
          <EmptyState
            title="Aucun atelier"
            description={
              enAttente
                ? "Vous pourrez publier vos ateliers dès qu’un établissement aura accepté votre rattachement. En attendant, le catalogue et les opportunités vous sont ouverts."
                : "Publiez votre premier atelier pour apparaître dans le catalogue et recevoir des réservations."
            }
            action={
              enAttente ? (
                <Button asChild variant="outline">
                  <Link href="/dashboard">Voir où en est mon rattachement</Link>
                </Button>
              ) : (
                <ServiceModal accountId={session.account.id} />
              )
            }
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
