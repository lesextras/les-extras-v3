"use client";

// Budget annuel d'ateliers : combien prévoir, et ce que ça représente par jeune.
import * as React from "react";
import Link from "next/link";
import { PiggyBank, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const euros = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(
    Number.isFinite(n) ? n : 0,
  );

export function CalculateurBudget() {
  const [jeunes, setJeunes] = React.useState(24);
  const [ateliersParMois, setAteliersParMois] = React.useState(2);
  const [mois, setMois] = React.useState(10);
  const [prixAtelier, setPrixAtelier] = React.useState(300);

  const nbAteliers = ateliersParMois * mois;
  const total = nbAteliers * prixAtelier;
  const parJeune = jeunes > 0 ? total / jeunes : 0;
  const parJeuneMois = jeunes > 0 && mois > 0 ? total / jeunes / mois : 0;

  const Champ = ({ label, valeur, setValeur, suffixe, pas = 1 }: {
    label: string; valeur: number; setValeur: (n: number) => void; suffixe?: string; pas?: number;
  }) => (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <div className="mt-1.5 flex items-center gap-2">
        <input
          type="number" min={0} step={pas} value={valeur}
          onChange={(e) => setValeur(Number(e.target.value) || 0)}
          className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        />
        {suffixe ? <span className="shrink-0 text-sm text-muted-foreground">{suffixe}</span> : null}
      </div>
    </div>
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,380px)_1fr]">
      <div className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-soft">
        <p className="inline-flex items-center gap-2 text-sm font-semibold">
          <PiggyBank className="size-4 text-primary" /> Votre établissement
        </p>
        <Champ label="Jeunes / résidents accueillis" valeur={jeunes} setValeur={setJeunes} />
        <div className="grid grid-cols-2 gap-3">
          <Champ label="Ateliers par mois" valeur={ateliersParMois} setValeur={setAteliersParMois} />
          <Champ label="Mois d'activité" valeur={mois} setValeur={setMois} />
        </div>
        <Champ label="Prix moyen d'un atelier" valeur={prixAtelier} setValeur={setPrixAtelier} suffixe="€" pas={50} />
        <p className="text-xs text-muted-foreground">
          {/* Le plancher annonce etait de 200 €, alors que le catalogue
              descend en realite bien plus bas : on surestimait le budget du
              prospect des la premiere phrase, ce qui fait fuir exactement
              ceux qu'on cherche. On renvoie desormais au catalogue plutot
              que de figer une fourchette qui vieillit mal. */}
          Les tarifs des ateliers sont libres : chaque intervenant fixe le sien, et le catalogue
          en donne le detail fiche par fiche
          selon la médiation et le nombre d'intervenants.
        </p>
      </div>

      <div className="space-y-5">
        <div className="rounded-2xl bg-primary p-6 text-primary-foreground">
          <p className="text-sm text-primary-foreground/80">Budget annuel d'interventions</p>
          <p className="mt-1 text-4xl font-bold tracking-tight [font-variant-numeric:tabular-nums]">
            {euros(total)}
          </p>
          <p className="mt-1 text-sm text-primary-foreground/80">
            {nbAteliers} ateliers sur {mois} mois
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-6">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Par jeune / an</p>
            <p className="mt-2 text-2xl font-bold [font-variant-numeric:tabular-nums]">{euros(parJeune)}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Par jeune / mois</p>
            <p className="mt-2 text-2xl font-bold [font-variant-numeric:tabular-nums]">{euros(parJeuneMois)}</p>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-sm leading-relaxed text-muted-foreground">
          Ce budget relève généralement des <strong className="font-semibold text-foreground">dépenses
          d'activités et de projet d'établissement</strong> (groupe II), et non de la masse salariale.
          Rapporté au jeune et au mois, il rend l'arbitrage plus simple à porter en réunion de direction.
        </div>
        <Button asChild>
          <Link href="/catalogue">
            Recevoir le catalogue et les tarifs
            <ArrowRight />
          </Link>
        </Button>
      </div>
    </div>
  );
}
