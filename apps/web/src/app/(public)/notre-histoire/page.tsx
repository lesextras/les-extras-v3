// Page « Notre histoire » — reprise du site historique les-extras.fr.
// Elle répond à la question que se pose tout directeur d'établissement avant
// de confier un jeune à quelqu'un : qui êtes-vous, et pourquoi vous faire
// confiance ? Sans cette page, la vitrine ne vend qu'un catalogue.
import type { Metadata } from "next";
import Link from "next/link";
import { Building2, Users, GraduationCap, Sparkles, Siren, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "../../_shared/ui";

export const metadata: Metadata = {
  title: "Notre histoire",
  description:
    "Les Extras est le dispositif de mise en relation de l’association ADéPA, créée en 2012 : éducation, prévention et animation auprès des enfants, adolescents et familles en difficulté.",
  alternates: { canonical: "/notre-histoire" },
};

const dispositifs = [
  {
    titre: "Les Extras",
    texte:
      "La plateforme qui relie les établissements médico-sociaux aux intervenants éducatifs : ateliers à réserver et renfort d’équipe.",
    icone: <Users className="size-5" />,
    href: "/ateliers",
  },
  {
    titre: "ADéPA Formation & Insertion",
    texte:
      "Le centre de formation certifié Qualiopi : parcours métier, analyse des pratiques, prévention. Finançables par les OPCO.",
    icone: <GraduationCap className="size-5" />,
    href: "/formations",
  },
  {
    titre: "Studio A2PA",
    texte:
      "Création de contenu et formation digitale : l’atelier qui donne aux jeunes et aux professionnels les outils du numérique.",
    icone: <Sparkles className="size-5" />,
    href: "https://adepa77.fr",
  },
];

export default function NotreHistoirePage() {
  return (
    <div className="space-y-14">
      <PageHeader
        title="Notre histoire"
        subtitle="Les Extras est la plateforme de mise en relation développée par l’association ADéPA — Association pour le Développement de l’Éducation Par l’Animation."
      />

      <section className="space-y-4">
        <p className="text-lg leading-relaxed text-muted-foreground">
          Association loi 1901 créée en <strong className="font-semibold text-foreground">2012</strong>, l’ADéPA
          est active dans le champ éducatif et de la solidarité en Île-de-France, au Maroc et au
          Sénégal. Depuis sa création, elle œuvre pour l’insertion sociale des enfants, des
          adolescents et des familles en difficulté, par l’éducation, la prévention et l’animation.
        </p>
      </section>

      <section className="space-y-5">
        <h2 className="text-2xl font-bold tracking-tight">Pourquoi Les Extras ?</h2>
        <p className="leading-relaxed text-muted-foreground">
          Les établissements médico-sociaux — MECS, IME, ITEP, foyers, SESSAD — font régulièrement
          face à des besoins de renfort ponctuel ou régulier : absences, remplacements, surcroîts
          d’activité. Les Extras a été conçue pour répondre à ce besoin, en permettant à ces
          établissements de réserver en ligne des intervenants éducatifs qualifiés et vérifiés, en
          toute simplicité.
        </p>
      </section>

      <section className="space-y-5">
        <h2 className="text-2xl font-bold tracking-tight">Deux piliers</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="space-y-2 p-6">
              <span className="grid size-10 place-items-center rounded-xl bg-secondary-soft text-secondary">
                <Siren className="size-5" />
              </span>
              <h3 className="pt-2 font-semibold text-foreground">SOS Renfort</h3>
              <p className="text-sm text-muted-foreground">
                Pour les besoins de remplacement urgent. Diffusion en cascade : votre équipe
                d’abord, puis les intervenants déjà venus chez vous, puis le réseau.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-2 p-6">
              <span className="grid size-10 place-items-center rounded-xl bg-primary-soft text-primary">
                <Building2 className="size-5" />
              </span>
              <h3 className="pt-2 font-semibold text-foreground">Ateliers</h3>
              <p className="text-sm text-muted-foreground">
                Un catalogue d’interventions et d’ateliers éducatifs à réserver selon vos besoins,
                avec devis chiffré, contrat et facture.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-5">
        <h2 className="text-2xl font-bold tracking-tight">Pour les professionnels</h2>
        <p className="leading-relaxed text-muted-foreground">
          Éducateurs spécialisés, moniteurs-éducateurs, AES, psychologues : vous pouvez proposer vos
          services via Les Extras et accéder à des missions près de chez vous, en toute liberté.
        </p>
        <Button asChild>
          <Link href="/register">
            Rejoindre le réseau
            <ArrowRight />
          </Link>
        </Button>
      </section>

      <section className="space-y-5">
        <h2 className="text-2xl font-bold tracking-tight">
          Une plateforme adossée à une association engagée
        </h2>
        <p className="leading-relaxed text-muted-foreground">
          Les Extras est l’un des trois dispositifs portés par ADéPA.
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          {dispositifs.map((d) => (
            <Card key={d.titre} className="h-full">
              <CardContent className="space-y-2 p-6">
                <span className="grid size-10 place-items-center rounded-xl bg-primary-soft text-primary">
                  {d.icone}
                </span>
                <h3 className="pt-2 font-semibold text-foreground">{d.titre}</h3>
                <p className="text-sm text-muted-foreground">{d.texte}</p>
                <Link
                  href={d.href}
                  className="inline-flex items-center gap-1 pt-1 text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                  En savoir plus
                  <ArrowRight className="size-3.5" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-8 text-center">
        <h2 className="text-2xl font-bold tracking-tight">Une question, un projet ?</h2>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Décrivez votre situation, un coordinateur revient vers vous sous 48 h.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild>
            <Link href="/contact">Nous contacter</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/catalogue">Recevoir le catalogue</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
