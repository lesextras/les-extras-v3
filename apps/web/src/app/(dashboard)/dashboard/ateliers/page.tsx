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
import { BookingActions } from "../../../_shared/BookingActions";
import { SERVICE_STATUS_LABEL } from "../../../_shared/format";
import type { Booking, Service } from "../../../_shared/types";

export const metadata: Metadata = { title: "Mes ateliers" };

export default async function AteliersPage() {
  const session = await requireSession();

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

  const pending = (bookings.data ?? []).filter((b) => b.status === "REQUESTED");

  return (
    <div className="space-y-8">
      <PageHeader
        title="Mes ateliers"
        subtitle="Gérez votre catalogue d’interventions et vos demandes de réservation."
        actions={<ServiceModal accountId={session.account.id} />}
      />

      {pending.length > 0 ? (
        <Card className="border-secondary/30 bg-secondary/5">
          <CardHeader>
            <SectionTitle title={`Demandes à traiter (${pending.length})`} />
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
                <BookingActions bookingId={b.id} accountId={session.account.id} status={b.status} />
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
            description="Publiez votre premier atelier pour apparaître dans le catalogue et recevoir des réservations."
            action={<ServiceModal accountId={session.account.id} />}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.data.map((sv) => (
              <div key={sv.id} className="relative">
                <Badge className="absolute right-3 top-3 z-10" variant="outline">
                  {SERVICE_STATUS_LABEL[sv.status]}
                </Badge>
                <ServiceCard audience service={sv} href={`/marketplace/services/${sv.id}`} />
                {/* Une fiche publiée n'était plus modifiable ni suspendable :
                    la liste n'offrait aucune action, alors que l'API l'a
                    toujours permis. */}
                <div className="mt-2 flex justify-end">
                  <ServiceModal
                    accountId={session.account.id}
                    fiche={sv as never}
                    trigger={
                      <Button size="sm" variant="outline">
                        Modifier
                      </Button>
                    }
                  />
                </div>
              </div>
            ))}
          </div>
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
