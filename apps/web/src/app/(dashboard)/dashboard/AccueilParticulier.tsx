// L'accueil d'un parent ou d'un particulier.
//
// ⚠ POURQUOI UN ÉCRAN À PART. Le tableau de bord commun est bâti pour deux
// métiers : chercher du renfort, ou vendre des interventions. Un parent ne
// fait ni l'un ni l'autre. Lui servir des cases « missions publiées », « taux
// de remplissage » et « candidatures », c'est lui dire poliment que le site
// n'est pas pour lui — alors qu'il peut réserver, payer et être aidé comme
// n'importe qui d'autre.
//
// Cet écran ne montre donc que ce qu'il peut faire, en quatre portes.
import Link from "next/link";
import { CalendarCheck, Lightbulb, Receipt, Sparkles, GraduationCap, LifeBuoy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader, SectionTitle, EmptyState } from "../../_shared/ui";
import { BookingRow } from "../../_shared/cards";
import type { Booking } from "../../_shared/types";

const PORTES = [
  {
    href: "/ateliers",
    icon: Sparkles,
    titre: "Trouver un atelier",
    texte:
      "Des interventions animées par des professionnels du médico-social, près de chez vous ou à distance.",
  },
  {
    href: "/dashboard/activites",
    icon: Lightbulb,
    titre: "Générer une activité",
    texte:
      "Décrivez l'âge et ce que vous voulez travailler : vous repartez avec une activité prête à faire.",
  },
  {
    href: "/dashboard/appui-scolaire",
    icon: GraduationCap,
    titre: "Aider aux devoirs",
    texte: "Une fiche de révision, un mémo ou des exercices, à partir de ce que vous décrivez.",
  },
  {
    href: "/gap",
    icon: LifeBuoy,
    titre: "Poser une question",
    texte:
      "Déposez une situation éducative : des professionnels du secteur y répondent, gratuitement.",
  },
];

export function AccueilParticulier({
  prenom,
  reservations,
}: {
  prenom?: string | null;
  reservations: Booking[];
}) {
  return (
    <div className="space-y-8">
      <PageHeader
        title={prenom ? `Bonjour ${prenom}` : "Bonjour"}
        subtitle="Vos réservations, vos outils, et de quoi trouver de l'aide."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {PORTES.map((p) => (
          <Link key={p.href} href={p.href} className="group">
            <Card className="h-full transition group-hover:border-primary/50">
              <CardContent className="space-y-2 p-5">
                <span className="grid size-10 place-items-center rounded-lg bg-primary-soft text-primary">
                  <p.icon className="size-5" aria-hidden />
                </span>
                <p className="font-medium text-foreground">{p.titre}</p>
                <p className="text-sm text-muted-foreground">{p.texte}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <SectionTitle title="Mes réservations" />
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard/reservations">
              <CalendarCheck className="mr-2 size-4" aria-hidden />
              Tout voir
            </Link>
          </Button>
        </div>
        {reservations.length === 0 ? (
          <EmptyState
            title="Rien de réservé pour l'instant"
            description="Parcourez le catalogue : la plupart des ateliers se réservent en deux clics, et le devis arrive avant que vous ne payiez quoi que ce soit."
            action={
              <Button asChild>
                <Link href="/ateliers">Voir les ateliers</Link>
              </Button>
            }
          />
        ) : (
          <div className="space-y-2">
            {reservations.map((b) => (
              <BookingRow key={b.id} booking={b} />
            ))}
          </div>
        )}
      </section>

      <Card>
        <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium text-foreground">Vos factures</p>
            <p className="text-sm text-muted-foreground">
              Chaque réservation donne lieu à une facture, disponible ici dès qu&apos;elle est
              émise.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/dashboard/facturation">
              <Receipt className="mr-2 size-4" aria-hidden />
              Mes factures
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
