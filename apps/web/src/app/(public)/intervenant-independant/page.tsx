import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  Clock,
  Coins,
  FileText,
  MapPin,
  Sparkles,
  X,
} from "lucide-react";
import { metaPublique } from "@/lib/meta";
import { VILLES } from "../renfort/donnees";

export const metadata: Metadata = metaPublique({
  title: "Rejoindre le réseau d'intervenants",
  description:
    "Éducateurs, AES, psychologues, thérapeutes indépendants : référencez-vous gratuitement auprès des établissements médico-sociaux. Zéro commission.",
  path: "/intervenant-independant",
});

const ZERO = [
  "Frais d’inscription",
  "Abonnement mensuel",
  "Frais de mise en relation",
  "Commission sur vos honoraires",
  "Coefficient d’agence sur votre taux",
];

const INCLUS = [
  "Contrat à double signature, généré automatiquement",
  "Planning partagé, pointage et validation des heures",
  "Facture PDF éditée à la fin de la mission",
  "Messagerie interne rattachée à chaque mission",
  "Coffre-fort de conformité avec alertes d’échéance",
  "15 générations offertes par mois sur LEX, l’assistant IA",
];

/**
 * CE QU'IL FAUT FOURNIR — la question n° 1 d'un professionnel, et elle
 * n'avait aucune réponse sur cette page.
 *
 * On ne l'invente pas : c'est EXACTEMENT la liste que le module de conformité
 * exige (`ConformiteService.REQUIRED_TYPES`), et la raison de chaque pièce est
 * celle qui est écrite dans son code. Le permis et l'attestation
 * d'auto-entrepreneur en ont été retirés à dessein : une obligation qui ne
 * vaut pas pour tout le monde n'est pas une obligation.
 */
const PIECES = [
  {
    quoi: "Une pièce d'identité",
    pourquoi: "Elle est demandée par tout établissement qui vous fait intervenir.",
  },
  {
    quoi: "Votre diplôme d'État",
    pourquoi: "C'est lui qui vous place devant sur les besoins de votre métier.",
  },
  {
    quoi: "Le bulletin n° 3 de votre casier judiciaire",
    pourquoi:
      "Obligatoire pour intervenir auprès de publics vulnérables (art. L. 133-6 du code de l'action sociale et des familles). Il se demande en ligne, gratuitement.",
  },
  {
    quoi: "Un RIB",
    pourquoi: "Pour être payé, simplement.",
  },
];

const METIERS = [
  "Éducateur spécialisé",
  "Moniteur-éducateur",
  "AES / AMP",
  "Éducateur de jeunes enfants",
  "Psychologue",
  "Chef de service",
  "Animateur",
  "Art-thérapeute",
  "Formateur",
];

export default function IntervenantIndependantPage() {
  return (
    <div className="section">
      <div className="mx-auto max-w-2xl text-center">
        <span className="eyebrow">
          <Sparkles className="size-3.5" aria-hidden />
          Intervenant indépendant
        </span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground text-balance md:text-4xl">
          Vendez vos ateliers et vos formations aux établissements, sans intermédiaire
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
La plateforme de l’association ADéPA : MECS, IME, ITEP, SESSAD et EHPAD d’un côté,
          professionnels indépendants de l’autre. Vous publiez, ils réservent, vous facturez
          votre tarif, sans commission.
        </p>
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-2xl border border-success/30 bg-success/5 p-6 md:p-7">
          <p className="text-sm font-semibold uppercase tracking-wide text-success">
            Zéro commission
          </p>
          <p className="mt-2 text-xl font-semibold text-foreground">
            Vous fixez votre tarif. Vous touchez 100 %.
          </p>
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
L’association se finance sur les formations Qualiopi et les crédits LEX, jamais sur la
            rémunération de celui qui fait le travail.
          </p>
          <ul className="mt-5 space-y-2">
            {ZERO.map((item) => (
              <li key={item} className="flex items-start gap-2 text-[15px] text-muted-foreground">
                <X className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border bg-card p-6 md:p-7">
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Ce que la plateforme fait à votre place
          </p>
          <ul className="mt-5 space-y-2">
            {INCLUS.map((item) => (
              <li key={item} className="flex items-start gap-2 text-[15px] text-foreground">
                <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
            Le temps que vous ne passez pas sur un contrat ou une facture est du temps facturable.
          </p>
        </section>
      </div>

      <section className="mt-6 rounded-2xl border bg-card p-6 md:p-7">
        <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          <FileText className="size-4" aria-hidden />
          Métiers concernés
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {METIERS.map((m) => (
            <span key={m} className="rounded-full border px-3 py-1 text-sm text-muted-foreground">
              {m}
            </span>
          ))}
        </div>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
Liste non limitative : si vous intervenez dans le secteur, votre métier a sa place.
        </p>
      </section>

      {/* ── Ce qu'il faut fournir, et combien de temps ça prend ────────────
          Trois questions restaient sans réponse sur cette page, et ce sont
          les trois seules que se pose un professionnel avant de créer un
          compte : de quoi ai-je besoin, combien de temps ça me coûte, et
          où est-ce que ça se passe. Tout ce qui suit est lu dans le produit
          lui-même : rien n'est annoncé qui ne soit vérifiable. */}
      <section className="mt-16">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          Ce dont vous avez besoin pour commencer
        </h2>
        <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">
Quatre pièces, déposées une fois. Exigées non pas pour créer le compte ou publier,
          mais quand un établissement vous engage. La plateforme suit leurs échéances.
        </p>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {PIECES.map((p) => (
            <li key={p.quoi} className="rounded-xl border border-border bg-card p-5">
              <p className="flex items-start gap-2 font-semibold text-foreground">
                <BadgeCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                {p.quoi}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{p.pourquoi}</p>
            </li>
          ))}
        </ul>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="flex items-center gap-2 font-semibold text-foreground">
              <Clock className="size-4 text-primary" aria-hidden />
              Le temps que ça prend
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
Créer le compte : sept champs. Publier une fiche : un titre et une description
              suffisent, le reste se complète quand vous voulez.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="flex items-center gap-2 font-semibold text-foreground">
              <MapPin className="size-4 text-primary" aria-hidden />
              Où interviennent nos établissements
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
Melun, et le réseau se construit d’abord en Île-de-France :{" "}
              {VILLES.map((v) => v.nom).join(", ")}. Vous pouvez vous référencer ailleurs, mais
              c’est là que les demandes arrivent.
            </p>
          </div>
        </div>
      </section>

      {/* ── Les deux dispositifs, et lequel s'applique quand ────────────────
          RenforTeam promet « un vrai bulletin de paie » ; cette page promet
          « vous facturez, vous gardez 100 % ». Les deux sont vrais, ce sont
          deux dispositifs différents : mais rien ne l'expliquait, et un
          éducateur qui lisait les deux pages ne savait pas ce qu'il signait. */}
      <section className="mt-16">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          Deux façons de travailler, et elles ne se signent pas pareil
        </h2>
        <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">
La seule distinction qui change votre statut sur une intervention. Vous pouvez faire
          les deux.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border-2 border-primary/30 bg-primary-soft/20 p-6">
            <p className="text-lg font-semibold text-foreground">Vos ateliers et vos formations</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
Un établissement réserve votre offre. Vous intervenez{" "}
              <strong>en tant qu’indépendant</strong>, sous votre SIRET, et vous facturez en
              direct. Devis, contrat et facture sont générés, rien n’est prélevé.
            </p>
            <p className="mt-3 text-sm font-medium text-foreground">
              Il vous faut donc un statut d’indépendant.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-6">
            <p className="text-lg font-semibold text-foreground">RenforTeam</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
Vous acceptez une mission et l’établissement vous{" "}
              <strong>embauche en CDD</strong> : salarié le temps du remplacement, vrai bulletin
              de paie. Rien à facturer, aucun statut d’indépendant.
            </p>
            <p className="mt-3 text-sm">
              <Link href="/renforteam" className="font-medium underline underline-offset-2">
                Comment fonctionne RenforTeam
              </Link>
            </p>
          </div>
        </div>
      </section>

      <div className="mt-10 flex flex-col items-center gap-3 text-center">
        <Link
          href="/register"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-[15px] font-semibold text-primary-foreground"
        >
          Créer mon compte intervenant
          <ArrowRight className="size-4" aria-hidden />
        </Link>
        <p className="text-sm text-muted-foreground">
          Gratuit, sans engagement. Choisissez le profil <strong>Professionnel</strong> à l’inscription.
        </p>
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Coins className="size-4" aria-hidden />
          <Link href="/frais-de-service" className="underline underline-offset-2">
            Le détail de ce qui est gratuit et de ce qui est payant
          </Link>
        </p>
      </div>
    </div>
  );
}
