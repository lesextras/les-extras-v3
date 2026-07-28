import type { Metadata } from "next";
import Link from "next/link";
import { Calculator, PiggyBank, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Outils gratuits pour les établissements médico-sociaux",
  description:
    "Calculateurs gratuits : coût d'un remplacement (intérim vs indépendant), budget annuel d'ateliers éducatifs. Sans inscription.",
  alternates: { canonical: "/outils" },
};

const OUTILS = [
  {
    href: "/outils/cout-remplacement",
    titre: "Coût d'un remplacement",
    texte: "Agence d'intérim contre intervenant indépendant : comparez sur vos chiffres réels, coefficient de facturation inclus.",
    icone: Calculator,
  },
  {
    href: "/outils/budget-ateliers",
    titre: "Budget annuel d'ateliers",
    texte: "Coût total, coût par jeune, coût par jeune et par mois — les chiffres qui font passer un arbitrage en direction.",
    icone: PiggyBank,
  },
];

export default function OutilsPage() {
  return (
    <div className="space-y-8">
      <div className="max-w-3xl">
        <span className="eyebrow">Gratuit · sans inscription</span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">Nos outils</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Des calculateurs simples pour préparer vos arbitrages budgétaires. Aucune donnée
          n'est enregistrée : tout se calcule dans votre navigateur.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {OUTILS.map((o) => {
          const Icone = o.icone;
          return (
            <Link
              key={o.href}
              href={o.href}
              className="group rounded-2xl border border-border bg-card p-7 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-card"
            >
              <span className="grid size-11 place-items-center rounded-xl bg-primary-soft text-primary">
                <Icone className="size-5" />
              </span>
              <h2 className="mt-4 text-xl font-semibold">{o.titre}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{o.texte}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                Ouvrir l'outil
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
