"use client";

// Simulateur d'économies — l'équivalent du calculateur Hublo, version honnête :
// tous les chiffres viennent des saisies du visiteur, aucun benchmark inventé.
// On compare simplement SES chiffres (intérim / coordination) au modèle
// Les-Extras (0 % de commission sur les missions).
import { useState } from "react";

function euros(n: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(Math.max(0, Math.round(n)));
}

function Champ({
  label,
  suffixe,
  value,
  onChange,
  min = 0,
  max = 10000,
  step = 1,
}: {
  label: string;
  suffixe: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-muted-foreground">{label}</span>
      <span className="flex items-center gap-2">
        <input
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          step={step}
          value={Number.isFinite(value) ? value : ""}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <span className="shrink-0 text-xs text-muted-foreground">{suffixe}</span>
      </span>
    </label>
  );
}

export function Calculateur() {
  // Valeurs de départ volontairement modestes : le visiteur les remplace par les siennes.
  const [missionsParMois, setMissionsParMois] = useState(4);
  const [dureeMission, setDureeMission] = useState(8);
  const [tauxHoraire, setTauxHoraire] = useState(25);
  const [commissionActuelle, setCommissionActuelle] = useState(20);
  const [heuresCoordination, setHeuresCoordination] = useState(2);
  const [coutHoraireCadre, setCoutHoraireCadre] = useState(30);

  const missionsParAn = missionsParMois * 12;
  const coutPrestationAnnuel = missionsParAn * dureeMission * tauxHoraire;
  // Ce que coûte la commission de l'intermédiaire actuel (agence, plateforme commissionnée).
  const commissionAnnuelle = coutPrestationAnnuel * (commissionActuelle / 100);
  // Ce que coûte le temps de coordination (appels, messages, relances) au tarif du cadre.
  const coordinationAnnuelle = missionsParAn * heuresCoordination * coutHoraireCadre;

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <h2 className="text-base font-semibold text-foreground">Vos chiffres</h2>
        <Champ label="Missions de renfort par mois" suffixe="missions" value={missionsParMois} onChange={setMissionsParMois} max={500} />
        <Champ label="Durée moyenne d'une mission" suffixe="heures" value={dureeMission} onChange={setDureeMission} max={24} step={0.5} />
        <Champ label="Taux horaire versé à l'intervenant" suffixe="€ / h" value={tauxHoraire} onChange={setTauxHoraire} max={200} step={0.5} />
        <Champ
          label="Commission ou majoration de votre intermédiaire actuel (agence, plateforme)"
          suffixe="%"
          value={commissionActuelle}
          onChange={setCommissionActuelle}
          max={100}
        />
        <Champ
          label="Temps de coordination par mission (appels, messages, relances)"
          suffixe="heures"
          value={heuresCoordination}
          onChange={setHeuresCoordination}
          max={40}
          step={0.5}
        />
        <Champ label="Coût horaire du cadre qui coordonne" suffixe="€ / h" value={coutHoraireCadre} onChange={setCoutHoraireCadre} max={200} />
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">
            Commission versée chaque année à votre intermédiaire actuel
          </p>
          <p className="mt-1 text-3xl font-semibold text-foreground">{euros(commissionAnnuelle)}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Sur Les-Extras, la commission sur les missions de renfort est de 0 % : l'établissement
            paie la prestation, pas l'intermédiaire.
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">
            Coût annuel du temps de coordination, à vos propres chiffres
          </p>
          <p className="mt-1 text-3xl font-semibold text-foreground">{euros(coordinationAnnuelle)}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            La cascade de diffusion, les candidatures en un clic, le contrat généré automatiquement
            et le pointage intégré réduisent ce temps — la part exacte dépend de votre organisation,
            nous ne l'estimons pas à votre place.
          </p>
        </div>
        <div className="rounded-2xl border border-[#156d6b]/40 bg-[#156d6b]/10 p-6">
          <p className="text-sm font-medium text-foreground">
            Enjeu annuel total, calculé uniquement à partir de vos saisies
          </p>
          <p className="mt-1 text-3xl font-semibold text-foreground">
            {euros(commissionAnnuelle + coordinationAnnuelle)}
          </p>
          <a
            href="/demo"
            className="mt-4 inline-block rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90"
          >
            Voir comment ça marche — demander une démo
          </a>
        </div>
      </div>
    </div>
  );
}
