// Bloc « Outils gratuits » de l'accueil. Le calculateur de coût d'un
// remplacement est mis en avant : c'est l'outil qui porte l'argument
// commercial le plus fort (intérim vs indépendant), et le seul qui produit un
// chiffre qu'un directeur peut emmener en réunion de budget.
import Link from "next/link";
import { ArrowRight, Calculator, PiggyBank, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

const SECONDAIRES = [
  {
    href: "/outils/budget-ateliers",
    titre: "Budget annuel d'ateliers",
    texte:
      "Coût total, coût par jeune, coût par jeune et par mois — les trois chiffres qui font passer un arbitrage en direction.",
    icone: PiggyBank,
  },
];

export function BlocOutils() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
      {/* Mise en avant : le comparateur intérim / indépendant */}
      <Link
        href="/outils/cout-remplacement"
        className="group relative bloc-nuit overflow-hidden rounded-3xl bg-[hsl(222,22%,13%)] p-8 ring-1 ring-border transition-all duration-300 hover:-translate-y-1 hover:shadow-card md:p-10"
      >
        <div className="absolute inset-0 bg-grid opacity-10" aria-hidden />
        <div
          className="absolute -right-20 -top-20 size-64 rounded-full bg-primary/20 blur-3xl"
          aria-hidden
        />
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
            <Calculator className="size-3.5" />
            Le plus utilisé
          </span>
          <h3 className="mt-5 text-2xl font-bold tracking-tight md:text-3xl">
            Combien vous coûte vraiment un remplacement ?
          </h3>
          <p className="mt-3 max-w-xl leading-relaxed text-muted-foreground">
            Une agence d&apos;intérim applique un coefficient de 1,9 à 2,2 sur le salaire brut. Un
            intervenant indépendant, non. Entrez vos chiffres réels — salaire, durée, charges — et
            l&apos;écart apparaît en euros, poste par poste.
          </p>
          <ul className="mt-5 space-y-1.5 text-sm text-muted-foreground">
            <li>· Comparaison intérim / indépendant sur la même mission</li>
            <li>· Coefficient de facturation ajustable à votre grille</li>
            <li>· Résultat exportable pour votre réunion de budget</li>
          </ul>
          <span className="mt-7 inline-flex items-center gap-2 font-semibold text-primary">
            Faire le calcul
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </Link>

      {/* Colonne secondaire */}
      <div className="flex flex-col gap-4">
        {SECONDAIRES.map((o) => {
          const Icone = o.icone;
          return (
            <Link
              key={o.href}
              href={o.href}
              className="group flex-1 rounded-3xl border border-border bg-card p-7 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-card"
            >
              <span className="grid size-11 place-items-center rounded-xl bg-primary-soft text-accent-foreground">
                <Icone className="size-5" />
              </span>
              <h3 className="mt-4 text-lg font-semibold">{o.titre}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{o.texte}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                Ouvrir l&apos;outil
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          );
        })}

        <div className="rounded-3xl border border-dashed border-border p-7">
          <span className="grid size-11 place-items-center rounded-xl bg-muted text-muted-foreground">
            <Lock className="size-5" />
          </span>
          <h3 className="mt-4 text-lg font-semibold">Aucune inscription, aucune donnée gardée</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Tout se calcule dans votre navigateur. Rien n&apos;est envoyé, rien n&apos;est
            enregistré, et nous ne vous rappellerons pas à cause d&apos;un calcul.
          </p>
          <Button asChild variant="outline" size="sm" className="mt-5">
            <Link href="/outils">
              Voir tous les outils
              <ArrowRight />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
