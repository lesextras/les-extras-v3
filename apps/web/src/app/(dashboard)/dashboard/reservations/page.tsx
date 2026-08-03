// MES RÉSERVATIONS — la vue qui manquait.
//
// L'API savait déjà répondre : GET /bookings renvoie tout ce à quoi le compte
// participe, comme client ET comme prestataire. Mais aucune page du tableau de
// bord ne l'appelait : seul l'administrateur voyait les réservations. Un
// établissement pouvait donc réserver un atelier, inscrire un salarié à une
// formation, faire venir un renfort — et ne plus jamais retrouver la trace de
// ce qu'il avait commandé.
//
// Trois familles, parce qu'elles ne se lisent pas de la même façon :
//   • renforts   — un remplacement, avec un contrat à signer ;
//   • ateliers   — une intervention ponctuelle, avec une date ;
//   • formations — une inscription nominative à une session.
import type { Metadata } from "next";
import Link from "next/link";
import { CalendarCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireSession, fetchApi } from "../../../_shared/server";
import { PageHeader, SectionTitle, EmptyState, ErrorState } from "../../../_shared/ui";
import { formatDate } from "../../../_shared/format";

export const metadata: Metadata = { title: "Mes réservations" };

interface Booking {
  id: string;
  accountId: string;
  status: string;
  scheduledAt?: string | null;
  participants?: number | null;
  requestNote?: string | null;
  totalAmount?: string | number | null;
  createdAt: string;
  mission?: { id: string; title: string; accountId: string; startDate?: string | null } | null;
  service?: { id: string; title: string; accountId: string } | null;
  account?: { id: string; name: string; type: string } | null;
}

interface Inscription {
  id: string;
  status: string;
  financing: string;
  learnerName?: string | null;
  learner?: { firstName?: string | null; lastName?: string | null } | null;
  attestationUrl?: string | null;
  createdAt: string;
  session?: {
    id: string;
    startDate: string;
    endDate?: string | null;
    location?: string | null;
    formation?: { id: string; title: string; slug: string; certifying: boolean; city?: string | null } | null;
  } | null;
}

const ETAT: Record<string, string> = {
  REQUESTED: "Demandée",
  ACCEPTED: "Acceptée",
  CONFIRMED: "Confirmée",
  IN_PROGRESS: "En cours",
  COMPLETED: "Terminée",
  CANCELLED: "Annulée",
  REFUSED: "Refusée",
  PENDING: "En attente",
  VALIDATED: "Validée",
  PRESENT: "Présent",
  ABSENT: "Absent",
};

function ton(status: string): "default" | "secondary" | "outline" | "destructive" {
  if (["COMPLETED", "CONFIRMED", "VALIDATED", "PRESENT"].includes(status)) return "default";
  if (["CANCELLED", "REFUSED", "ABSENT"].includes(status)) return "destructive";
  if (["ACCEPTED", "IN_PROGRESS"].includes(status)) return "secondary";
  return "outline";
}

const euros = (v: string | number | null | undefined) =>
  v == null ? null : Number(v).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });

/** Une ligne de réservation, quel que soit le type. */
function Ligne({
  ancre,
  titre,
  href,
  statut,
  quand,
  contrepartie,
  montant,
  role,
  participants,
  note,
}: {
  /**
   * Identifiant de la réservation, posé en ancre HTML. Les notifications et les
   * mails pointent vers `/dashboard/reservations#<id>` : sans cette ancre, le
   * lien ouvre bien la page mais laisse le lecteur chercher sa ligne dans la
   * liste. Avec elle, le navigateur l'amène dessus.
   */
  ancre?: string;
  titre: string;
  href?: string;
  statut: string;
  quand?: string | null;
  contrepartie?: string | null;
  montant?: string | null;
  role: "client" | "prestataire";
  participants?: number | null;
  note?: string | null;
}) {
  return (
    <Card id={ancre} className="scroll-mt-24 target:ring-2 target:ring-primary">
      <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
        <div className="min-w-0">
          <p className="truncate font-semibold">
            {href ? (
              <Link href={href} className="hover:underline">
                {titre}
              </Link>
            ) : (
              titre
            )}
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {quand ? formatDate(quand) : "Date à convenir"}
            {contrepartie ? ` · ${contrepartie}` : ""}
            {/* Dire de quel côté on est évite la confusion des comptes qui
                achètent ET vendent : un établissement peut faire les deux. */}
            {role === "prestataire" ? " · vous intervenez" : " · vous réservez"}
            {participants ? ` · ${participants} participant${participants > 1 ? "s" : ""}` : ""}
          </p>
          {/* Les précisions du demandeur — public accueilli, objectifs,
              contraintes — décident souvent de l'acceptation. Les saisir puis
              ne jamais les montrer revenait à les perdre. */}
          {note ? (
            <p className="mt-2 max-w-prose whitespace-pre-line rounded-md bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
              {note}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {montant && <span className="text-sm font-semibold">{montant}</span>}
          <Badge variant={ton(statut)}>{ETAT[statut] ?? statut}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}

export default async function ReservationsPage() {
  const session = await requireSession();
  const accountId = session.account.id;

  const [resBookings, resInscriptions] = await Promise.all([
    fetchApi<Booking[]>(session, "/bookings"),
    fetchApi<Inscription[]>(session, "/formations/mes-inscriptions"),
  ]);

  if (resBookings.error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Mes réservations" subtitle="Tout ce que vous avez réservé, et tout ce qu'on vous a réservé." />
        <ErrorState description={resBookings.error} />
      </div>
    );
  }

  const bookings = resBookings.data ?? [];
  // Une inscription en échec ne doit pas faire disparaître les réservations :
  // on affiche ce qu'on a, et la section formations reste simplement vide.
  const inscriptions = resInscriptions.data ?? [];

  const renforts = bookings.filter((b) => b.mission);
  const ateliers = bookings.filter((b) => b.service);
  const total = renforts.length + ateliers.length + inscriptions.length;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Mes réservations"
        subtitle="Renforts, ateliers et formations — ce que vous avez réservé comme ce que vous animez, au même endroit."
      />

      {total === 0 ? (
        <EmptyState
          icon={<CalendarCheck className="size-6" />}
          title="Aucune réservation pour l'instant"
          description="Dès qu'un renfort est pourvu, qu'un atelier est réservé ou qu'un salarié est inscrit à une formation, tout apparaît ici."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button asChild>
                <Link href="/ateliers">Voir le catalogue d’ateliers</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/dashboard/renforts">Publier un renfort</Link>
              </Button>
            </div>
          }
        />
      ) : null}

      {renforts.length > 0 && (
        <section className="space-y-3">
          <SectionTitle title={`SOS Renfort — ${renforts.length}`} />
          {renforts.map((b) => (
            <Ligne
              key={b.id}
              ancre={b.id}
              titre={b.mission?.title ?? "Renfort"}
              href={`/documents/contrat/${b.id}`}
              statut={b.status}
              quand={b.scheduledAt ?? b.mission?.startDate ?? null}
              contrepartie={b.account?.name}
              montant={euros(b.totalAmount)}
              role={b.mission?.accountId === accountId ? "client" : "prestataire"}
            />
          ))}
        </section>
      )}

      {ateliers.length > 0 && (
        <section className="space-y-3">
          <SectionTitle title={`Ateliers — ${ateliers.length}`} />
          {ateliers.map((b) => (
            <Ligne
              key={b.id}
              ancre={b.id}
              participants={b.participants ?? null}
              note={b.requestNote ?? null}
              titre={b.service?.title ?? "Atelier"}
              href={`/documents/contrat/${b.id}`}
              statut={b.status}
              quand={b.scheduledAt}
              contrepartie={b.account?.name}
              montant={euros(b.totalAmount)}
              role={b.service?.accountId === accountId ? "prestataire" : "client"}
            />
          ))}
        </section>
      )}

      {inscriptions.length > 0 && (
        <section className="space-y-3">
          <SectionTitle
            title={`Formations — ${inscriptions.length} inscription${inscriptions.length > 1 ? "s" : ""}`}
          />
          {inscriptions.map((i) => {
            const apprenant =
              i.learnerName ??
              [i.learner?.firstName, i.learner?.lastName].filter(Boolean).join(" ") ??
              null;
            return (
              <Ligne
                key={i.id}
                ancre={i.id}
                titre={i.session?.formation?.title ?? "Formation"}
                href={i.session?.formation?.slug ? `/formations/${i.session.formation.slug}` : undefined}
                statut={i.status}
                quand={i.session?.startDate}
                contrepartie={apprenant ? `pour ${apprenant}` : null}
                role="client"
              />
            );
          })}
        </section>
      )}
    </div>
  );
}
