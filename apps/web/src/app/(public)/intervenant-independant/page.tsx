import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Coins, FileText, Globe, Sparkles, X } from "lucide-react";

export const metadata: Metadata = {
  title: "Intervenant indépendant - rejoindre le réseau Les Extras",
  description:
    "Éducateurs, moniteurs-éducateurs, AES, psychologues, thérapeutes et formateurs indépendants : référencez-vous gratuitement auprès des établissements médico-sociaux. Zéro commission, contrat et facture générés par la plateforme.",
  alternates: { canonical: "/intervenant-independant" },
};

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
          Les Extras est la plateforme de l’association ADéPA. Elle rassemble les établissements
          médico-sociaux - MECS, IME, ITEP, SESSAD, EHPAD - aux professionnels indépendants du
          secteur. Vous y publiez vos ateliers et vos formations, les établissements réservent en ligne, et vous facturez votre tarif sans qu’aucune commission soit prélevée.
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
            C’est le parti pris du modèle associatif : l’association se finance sur les formations
            Qualiopi qu’elle facture et sur les crédits LEX, jamais sur la rémunération de celui qui
            fait le travail.
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
          <Globe className="size-4" aria-hidden />
          Votre profil est public
        </p>
        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
          Vos ateliers et votre présentation apparaissent sur la page{" "}
          <Link href="/intervenants" className="underline underline-offset-2">
            Les intervenants du réseau
          </Link>
          , consultable par les établissements et indexée par les moteurs de recherche. Si vous n’avez
          pas de site, cette page en tient lieu.
        </p>
      </section>

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
          Cette liste n’est pas limitative : si vous intervenez auprès d’établissements du secteur,
          votre métier a sa place dans le réseau.
        </p>
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
