import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Coins, Info, Receipt, Sparkles, Users, X } from "lucide-react";
import { metaPublique } from "@/lib/meta";
import { renfortSalarieVisible } from "@/lib/offre";

export const metadata: Metadata = metaPublique({
  title: "Ce qui est gratuit, ce qui est payant",
  description:
    "Logiciel gratuit des deux côtés. Ateliers : 0 % de commission. Formations Qualiopi : sur devis. RenforTeam : 15 % de frais de gestion.",
  path: "/frais-de-service",
});

// Une page dédiée plutôt qu'un paragraphe sur l'accueil : « combien ça coûte »
// est la deuxième question posée, elle mérite une URL qu'on puisse envoyer par
// e-mail à une direction, et un contenu qui ne se lit pas entre deux sections.

const GRATUIT = [
  // ⚠ « jusqu'au CDD généré » : l'étape finale décrite ici n'existe plus en
  // ligne depuis le 19/09/2026 (voir `@/lib/offre`).
  renfortSalarieVisible()
    ? "RenforTeam : publication, candidatures, jusqu’au CDD généré"
    : "RenforTeam : demande, mise en relation, devis et feuille de mission",
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
    prix: "Sur devis, facturée par l’association",
    detail:
      "C’est le seul service facturé par l’association ADéPA, sous sa certification Qualiopi et finançable OPCO. Elle fait appel aux formateurs du réseau Les Extras ; vous recevez un devis avant, une facture après.",
  },
  {
    icone: Sparkles,
    titre: "Vous utilisez LEX, l’assistant IA",
    prix: "À crédits, un crédit par génération",
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
        {/*
          ⚠⚠ C'EST LA PAGE QU'UNE DIRECTION RESSORT EN CAS DE LITIGE. Elle ne
          peut pas être approximative d'un mot.

          Décision de Siham, 21/09/2026 : RenforTeam est commissionné. Il n'y a
          donc plus UNE règle tarifaire mais DEUX, et la page doit les séparer
          dès le chapeau plutôt que de laisser découvrir la seconde sur une
          facture.

          ⚠ 15 %, ARRÊTÉ LE 21/09/2026 (voir `lib/commission.ts` pour le taux,
          son calcul et le relevé des grilles concurrentes). Le chiffre est
          écrit ici, sur l'accueil, sur /renforteam et dans les CGU : les
          quatre bougent ensemble ou pas du tout.
        */}
        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
          Pas d’abonnement obligatoire, pas d’engagement, pas de frais d’entrée. Sur les
          ateliers, aucune commission n’est prélevée sur l’intervenant. Une formation est
          délivrée sous le Qualiopi de l’association&nbsp;: sa part est fixée sur devis.
          Sur un renfort RenforTeam, 15&nbsp;% de frais de gestion s’ajoutent à son tarif&nbsp;:
          c’est l’association qui vérifie chaque professionnel avant de l’envoyer.
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
            atelier se paie à son intervenant, à son tarif : la plateforme n’ajoute rien.
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
              Zéro commission sur vos ateliers
            </p>
            <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
              Vous touchez 100 % de votre prix. Vous réservez et facturez en direct,
              l’association ne s’interpose pas.
            </p>
            <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
              <strong className="font-semibold text-foreground">Une formation est différente.</strong>{" "}
              Elle est délivrée sous la certification Qualiopi de l’association, qui la facture
              et vous fait intervenir&nbsp;: sa commission est fixée sur devis, avant tout
              engagement.
            </p>
            <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
              <strong className="font-semibold text-foreground">RenforTeam est différent.</strong>{" "}
              L’association y vérifie chaque professionnel de l’éducation spécialisée avant de
              l’envoyer chez quelqu’un, encaisse la prestation et vous reverse. Ce travail de
              sélection se paie&nbsp;: <strong className="font-semibold text-foreground">15&nbsp;%
              de frais de gestion</strong>, <em>ajoutés</em> au tarif de l’intervenant et payés
              par le demandeur. Rien n’est prélevé sur vous, et la ligne figure sur le devis avant
              que quiconque ne l’accepte. À titre de comparaison, une plateforme d’indépendants
              comme Brigad prélève 10&nbsp;% à l’entreprise et 15&nbsp;% au professionnel, et
              l’intérim applique un coefficient de 1,9 à 2,2 sur le salaire.
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
        {/*
          Deux affirmations fausses corrigées ici.
          1. « La commission y figure en clair, sur une ligne distincte » : il n’y a
             aucune ligne de commission sur les factures, parce qu’il n’y a aucune
             commission, COMMISSION_DEFAUT vaut 0 (src/lib/commission.ts). Annoncer
             une ligne qui n’existe pas fait douter du document reçu.
          2. « payables en ligne » : `createInvoiceCheckout`
             (apps/api/src/billing/billing.service.ts) refuse les factures émises par
             un intervenant et ne laisse passer que celles de l’association. Une
             facture d’atelier se règle par virement, d’établissement à intervenant.
        */}
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Chaque prestation donne lieu à un contrat à double signature, une déclaration
          d’heures validée et une facture PDF. La facture porte le tarif de l’intervenant,
          sans ligne de frais : il n’y en a pas. Elle est téléchargeable à tout moment et
          se règle par virement, directement à l’intervenant qui l’a émise.
        </p>
        {/*
          « Le numéro de déclaration d’activité figure sur la convention » : le
          logiciel ne produit aucune convention de formation. Les seules pièces
          générées sont l’attestation d’assiduité, le certificat de réalisation et la
          feuille d’émargement (apps/api/src/documents/documents.controller.ts).
          Le numéro est rattaché ici à ce qui existe réellement.
        */}
        <p className="mt-3 flex items-start gap-2 text-sm leading-relaxed text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
          Les formations portées par la certification Qualiopi de l’association sont
          finançables par votre OPCO. Le numéro de déclaration d’activité de l’association
          figure dans les mentions légales du site, ainsi que sur les attestations
          d’assiduité et les certificats de réalisation délivrés.
        </p>
      </section>

      <div className="mt-12 flex flex-wrap justify-center gap-3">
        <Link
          href="/register"
          className="inline-flex h-11 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90"
        >
          Créer un compte
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
