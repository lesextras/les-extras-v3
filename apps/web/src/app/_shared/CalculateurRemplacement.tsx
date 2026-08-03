"use client";

// Comparateur « freelance vs intérim » : le coût réel d'un remplacement.
// Tous les paramètres sont modifiables — les valeurs par défaut sont des
// ordres de grandeur du secteur, à ajuster avec vos propres chiffres.
import * as React from "react";
import { Calculator, Info, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const euros = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(
    Number.isFinite(n) ? n : 0,
  );

export function CalculateurRemplacement() {
  // Valeurs par défaut COHÉRENTES entre elles : avec un brut de 14 €/h et un
  // coefficient d'agence de 1,95, l'heure d'intérim revient à ~27,30 €. Un
  // tarif d'intervenant par défaut à 26 €/h (ordre de grandeur du secteur,
  // modifiable) garde la comparaison crédible ; l'ancien défaut à 32 €/h
  // faisait conclure au premier regard que l'intérim était moins cher — le
  // contraire de ce que l'outil illustre.
  const [heures, setHeures] = React.useState(35);
  const [semaines, setSemaines] = React.useState(4);
  const [tauxHoraireBrut, setTauxHoraireBrut] = React.useState(14);
  const [coefInterim, setCoefInterim] = React.useState(1.95);
  const [tarifFreelance, setTarifFreelance] = React.useState(26);
  const [heuresAdmin, setHeuresAdmin] = React.useState(3);
  const [coutHeureAdmin, setCoutHeureAdmin] = React.useState(28);

  const totalHeures = heures * semaines;

  // Intérim : le coefficient de facturation s'applique au brut horaire et
  // couvre charges, IFM, congés payés et marge de l'agence.
  const coutInterim = totalHeures * tauxHoraireBrut * coefInterim;

  // Freelance via la plateforme : tarif négocié direct, 0 % de commission
  // prélevée sur l'intervenant, et l'administratif est automatisé.
  const coutFreelance = totalHeures * tarifFreelance;
  const coutAdminInterim = heuresAdmin * coutHeureAdmin;
  const totalInterim = coutInterim + coutAdminInterim;
  const ecart = totalInterim - coutFreelance;
  const pourcent = totalInterim > 0 ? Math.round((ecart / totalInterim) * 100) : 0;

  const Champ = ({ label, valeur, setValeur, suffixe, pas = 1, aide }: {
    label: string; valeur: number; setValeur: (n: number) => void;
    suffixe?: string; pas?: number; aide?: string;
  }) => (
    <div>
      <label className="text-sm font-medium text-foreground">{label}</label>
      <div className="mt-1.5 flex items-center gap-2">
        <input
          type="number"
          step={pas}
          min={0}
          value={valeur}
          onChange={(e) => setValeur(Number(e.target.value) || 0)}
          className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        />
        {suffixe ? <span className="shrink-0 text-sm text-muted-foreground">{suffixe}</span> : null}
      </div>
      {aide ? <p className="mt-1 text-xs text-muted-foreground">{aide}</p> : null}
    </div>
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,400px)_1fr]">
      {/* Paramètres */}
      <div className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-soft">
        <p className="inline-flex items-center gap-2 text-sm font-semibold">
          <Calculator className="size-4 text-primary" /> Vos paramètres
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Champ label="Heures / semaine" valeur={heures} setValeur={setHeures} suffixe="h" />
          <Champ label="Durée" valeur={semaines} setValeur={setSemaines} suffixe="sem." />
        </div>
        <Champ
          label="Taux horaire brut du poste"
          valeur={tauxHoraireBrut}
          setValeur={setTauxHoraireBrut}
          suffixe="€/h"
          pas={0.5}
          aide="Le brut que vous verseriez à un salarié sur ce poste."
        />
        <Champ
          label="Coefficient de facturation de l'agence"
          valeur={coefInterim}
          setValeur={setCoefInterim}
          suffixe="×"
          pas={0.05}
          aide="Multiplicateur appliqué au brut (charges, IFM, congés, marge). Demandez le vôtre à votre agence."
        />
        <Champ
          label="Tarif horaire de l'intervenant indépendant"
          valeur={tarifFreelance}
          setValeur={setTarifFreelance}
          suffixe="€/h"
          pas={1}
          aide="Tarif négocié en direct, tout compris, facturé par l'intervenant."
        />
        <div className="grid grid-cols-2 gap-3">
          <Champ label="Heures admin. évitées" valeur={heuresAdmin} setValeur={setHeuresAdmin} suffixe="h" />
          <Champ label="Coût horaire chargé" valeur={coutHeureAdmin} setValeur={setCoutHeureAdmin} suffixe="€/h" />
        </div>
        <p className="text-xs text-muted-foreground">
          Recherche, appels, contrat, suivi de facture : le temps de votre équipe a un coût.
        </p>
      </div>

      {/* Résultat */}
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Agence d'intérim
            </p>
            <p className="mt-2 text-3xl font-bold tracking-tight [font-variant-numeric:tabular-nums]">
              {euros(totalInterim)}
            </p>
            <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">
              <li>{totalHeures} h × {euros(tauxHoraireBrut)} × {coefInterim} = {euros(coutInterim)}</li>
              <li>Temps administratif : {euros(coutAdminInterim)}</li>
            </ul>
          </div>
          <div className="rounded-2xl border-2 border-primary/40 bg-primary-soft/40 p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              Intervenant indépendant · Les Extras
            </p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-primary [font-variant-numeric:tabular-nums]">
              {euros(coutFreelance)}
            </p>
            <ul className="mt-4 space-y-1.5 text-sm text-foreground/75">
              <li>{totalHeures} h × {euros(tarifFreelance)} = {euros(coutFreelance)}</li>
              <li>Contrat, facture et suivi générés : 0 h</li>
            </ul>
          </div>
        </div>

        <div className="rounded-2xl bg-primary p-6 text-primary-foreground">
          <p className="text-sm text-primary-foreground/80">Écart estimé sur cette mission</p>
          <p className="mt-1 text-4xl font-bold tracking-tight [font-variant-numeric:tabular-nums]">
            {ecart >= 0 ? euros(ecart) : `+ ${euros(-ecart)}`}
          </p>
          <p className="mt-1 text-sm text-primary-foreground/80">
            {ecart >= 0
              ? `soit ${pourcent} % de moins qu'en passant par une agence`
              : "l'intérim reste moins cher avec ces paramètres — ajustez le tarif ou le coefficient"}
          </p>
          <Button asChild variant="secondary" className="mt-5">
            <Link href="/register">
              Publier un besoin de renfort
              <ArrowRight />
            </Link>
          </Button>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <p className="inline-flex items-center gap-1.5 text-sm font-semibold">
            <Info className="size-4 text-primary" /> Comment lire ce calcul
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Les valeurs par défaut sont des <strong className="font-semibold text-foreground">ordres de grandeur</strong> :
            remplacez-les par vos chiffres réels (votre coefficient d'agence figure sur vos contrats).
            Le calcul compare des coûts directs ; il n'intègre ni la continuité de l'accompagnement,
            ni la connaissance des jeunes par un intervenant déjà venu — deux avantages
            difficiles à chiffrer mais bien réels.
          </p>
        </div>
      </div>
    </div>
  );
}
