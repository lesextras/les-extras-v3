import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Coins, Info, Receipt, Sparkles, Users, X } from "lucide-react";
import { metaPublique } from "@/lib/meta";

export const metadata: Metadata = metaPublique({
  title: "Ce qui est gratuit, ce qui est payant",
  description:
    "Mise en relation et contractualisation gratuites, sans commission, des deux côtés. Seuls se paient les formations Qualiopi et LEX, l’assistant IA.",
  path: "/frais-de-service",
});

// Une page dédiée plutôt qu'un paragraphe sur l'accueil : « combien ça coûte »
// est la deuxième question posée, elle mérite une URL qu'on puisse envoyer par
// e-mail à une direction, et un contenu qui ne se lit pas entre deux sections.

const GRATUIT = [
  "RenforTeam : publication, candidatures, jusqu’au CDD généré",
  "Ateliers : catalogue, réservation, devis, contrat et facture",
  "Planning partagé, pointage et validation des heures",
  "Messagerie interne rattachée aux missions",
  "Coffre-fort de conformité et alertes d’échéance",
  "Publier ses services et candidater, côté intervenant",
];

const PAYANT = [
  {
    icone: Users,
    titre: "Vous commandez une formation Qualiopi",
    prix: "Sur devis — facturée par l’association",
    detail:
      "C’est le seul service facturé par l’association ADéPA, sous sa certification Qualiopi et finançable OPCO. Elle fait appel aux formateurs du réseau Les Extras ; vous recevez un devis avant, une facture après.",
  },
  {
    icone: Sparkles,
    titre: "Vous utilisez LEX, l’assistant IA",
    prix: "À crédits — un crédit par génération",
    detail:
      "Écrits professionnels, activités, fiches pré-remplies : chaque génération consomme un crédit. 15 générations offertes chaque mois, sans carte bancaire et sans date de fin ; au-delà, packs ou abonnement à dotation mensuelle. Les tarifs sont affichés dans votre espace ; le bot d’aide reste gratuit.",
  },
];

export default function FraisPage() {
  return (
    <div className="section">
      <div className="mx-auto max-w-2xl text-center">
        <span className="eyebrow">
          <Coins className="size-3.5" aria-hidden />
          Frais de service
        </span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground text-balance md:text-4xl">
          Ce qui est gratuit, ce qui est payant
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
          Pas d’abonnement obligatoire, pas d’engagement, pas de frais d’entrée. Et
          aucune commission prélevée sur les intervenants.
        </p>
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-2xl border border-success/30 bg-success/5 p-6 md:p-7">
          <p className="text-sm font-semibold uppercase tracking-wide text-success">
            Gratuit, pour toujours
          </p>
          <p className="mt-2 text-xl font-semibold text-foreground">
            Toute la mise en relation et la contractualisation
          </p>
          <ul className="mt-5 space-y-2.5">
            {GRATUIT.map((g) => (
              <li key={g} className="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground">
                <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                {g}
              </li>
            ))}
          </ul>
          <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
            Sans limite de durée et sans nombre d’utilisateurs imposé. Un renfort ou un
            atelier se paie à son intervenant, à son tarif — la plateforme n’ajoute rien.
          </p>
        </section>

        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Vous payez dans deux cas seulement
          </p>
          {PAYANT.map((p, i) => {
            const Icone = p.icone;
            return (
              <section
                key={p.titre}
                className={`animate-fade-in-up ${["stagger-1", "stagger-2"][i]} rounded-xl border border-border bg-card p-5 md:p-6`}
              >
                <div className="flex items-start gap-3.5">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Icone className="size-5" aria-hidden />
                  </span>
                  <div>
                    <p className="font-semibold text-foreground">{p.titre}</p>
                    <p className="mt-0.5 text-sm font-medium text-primary">{p.prix}</p>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {p.detail}
                    </p>
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      </div>

      <section className="mt-12 rounded-2xl border border-secondary/30 bg-secondary/5 p-6 md:p-8">
        <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-secondary">
              Côté intervenant
            </p>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              Zéro commission sur ce que vous facturez
            </p>
            <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
              Vous touchez 100 % de votre prix. C’est le parti pris du modèle associatif :
              l’association se finance sur les formations Qualiopi qu’elle facture et sur
              les crédits LEX, jamais sur la rémunération de celui qui fait le travail.
            </p>
          </div>
          <div className="grid size-28 shrink-0 place-items-center rounded-2xl bg-background ring-1 ring-inset ring-secondary/25 md:size-32">
            <span className="text-4xl font-bold text-secondary md:text-5xl">0 %</span>
          </div>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-semibold text-foreground">Ce que vous ne payez pas</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            "Frais d’inscription",
            "Abonnement mensuel obligatoire",
            "Frais de mise en relation",
            "Coefficient d’agence sur le salaire",
          ].map((n) => (
            <div
              key={n}
              className="flex items-start gap-2 rounded-xl border border-border bg-card p-4 text-sm leading-relaxed text-muted-foreground"
            >
              <X className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
              {n}
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12 rounded-xl border border-border bg-card p-6">
        <h2 className="flex items-center gap-2 font-semibold text-foreground">
          <Receipt className="size-4 text-primary" aria-hidden />
          Comment ça arrive dans votre comptabilité
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Chaque prestation donne lieu à un contrat à double signature, une déclaration
          d’heures validée et une facture PDF. La commission y figure en clair, sur une
          ligne distincte. Les factures sont téléchargeables à tout moment et payables en
          ligne.
        </p>
        <p className="mt-3 flex items-start gap-2 text-sm leading-relaxed text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
          Les formations portées par la certification Qualiopi de l’association sont
          finançables par votre OPCO. Le numéro de déclaration d’activité figure sur la
          convention.
        </p>
      </section>

      <div className="mt-12 flex flex-wrap justify-center gap-3">
        <Link
          href="/register"
          className="inline-flex h-11 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90"
        >
          Créer un compte gratuit
        </Link>
        <Link
          href="/demo"
          className="inline-flex h-11 items-center gap-1.5 rounded-lg border border-border px-5 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
        >
          Demander une démo
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
