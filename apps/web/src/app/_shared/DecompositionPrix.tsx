// Décomposition du prix, affichée telle quelle aux deux parties : l'intervenant
// voit qu'il touche 100 % de son tarif, l'établissement voit exactement ce qu'il
// paie et pourquoi. Aucun chiffre caché des deux côtés.
import { decomposerPrix, COMMISSION_DEFAUT } from "@/lib/commission";

const euros = (v: number) =>
  v.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });

export function DecompositionPrix({
  tarifIntervenant,
  taux = COMMISSION_DEFAUT,
  vue,
}: {
  /** Montant net revenant à l'intervenant. */
  tarifIntervenant: number;
  taux?: number;
  /** Point de vue : change uniquement les libellés et l'accent mis. */
  vue: "intervenant" | "etablissement";
}) {
  const d = decomposerPrix(tarifIntervenant, taux);
  const pct = Math.round(d.tauxCommission * 100);

  return (
    <div className="rounded-xl border border-border bg-muted/30 p-4">
      <dl className="space-y-2 text-sm">
        <div className="flex items-baseline justify-between gap-4">
          <dt className={vue === "intervenant" ? "font-medium text-foreground" : "text-muted-foreground"}>
            {vue === "intervenant" ? "Vous percevez" : "Part intervenant"}
          </dt>
          <dd
            className={
              vue === "intervenant"
                ? "text-lg font-bold tabular-nums text-foreground"
                : "tabular-nums text-foreground"
            }
          >
            {euros(d.tarifIntervenant)}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-muted-foreground">Frais de gestion ADéPA ({pct} %)</dt>
          <dd className="tabular-nums text-muted-foreground">+ {euros(d.commission)}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4 border-t border-border pt-2">
          <dt className={vue === "etablissement" ? "font-medium text-foreground" : "text-muted-foreground"}>
            {vue === "etablissement" ? "Vous payez" : "Facturé à l'établissement"}
          </dt>
          <dd
            className={
              vue === "etablissement"
                ? "text-lg font-bold tabular-nums text-foreground"
                : "tabular-nums font-medium text-foreground"
            }
          >
            {euros(d.prixClientHt)}
          </dd>
        </div>
      </dl>
      <p className="mt-3 text-xs text-muted-foreground">
        {vue === "intervenant"
          ? `Rien n'est prélevé sur votre tarif : les ${pct} % sont ajoutés au prix client. Vous facturez l'association, l'association facture l'établissement — une seule facture pour lui, aucune démarche de plus pour vous.`
          : `Les frais de gestion couvrent le contrat, la facturation unique, l'assurance et la vérification des pièces obligatoires. À titre de comparaison, une agence d'intérim applique un coefficient de 1,9 à 2,2 sur le salaire brut.`}
      </p>
    </div>
  );
}
