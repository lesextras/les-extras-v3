"use client";

/**
 * L'EXPORT DE PAIE.
 *
 * Les deux exports existaient déjà côté serveur, et fonctionnaient. Le problème
 * était ailleurs : l'un vivait sous l'onglet « Congés », caché dans l'en-tête
 * d'une carte « Demandes », l'autre dans la barre d'actions de RenforTeam. Un
 * chef de service qui prépare la paie du mois ne les trouvait ni l'un ni
 * l'autre — et surtout, il ne pouvait pas choisir le mois : l'export sortait
 * toujours le mois en cours, ce qui est exactement le mauvais mois quand on
 * prépare la paie du précédent.
 *
 * Deux fichiers et non un, parce que ce sont deux natures : d'un côté les
 * salariés (heures planifiées, congés, soldes), de l'autre les intervenants
 * extérieurs (heures pointées et validées, à facturer). Les fusionner
 * produirait un fichier que ni la paie ni la compta ne saurait lire.
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "./form-fields";

/** Les douze derniers mois, du plus récent au plus ancien. */
function derniersMois(): { valeur: string; libelle: string }[] {
  const liste: { valeur: string; libelle: string }[] = [];
  const base = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(base.getFullYear(), base.getMonth() - i, 1);
    liste.push({
      valeur: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      libelle: d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" }),
    });
  }
  return liste;
}

export function ExportPaie({ compact = false }: { compact?: boolean }) {
  const mois = derniersMois();
  // Le mois précédent par défaut : on prépare la paie d'un mois écoulé, pas
  // celle d'un mois en cours dont il manque encore la moitié des heures.
  const [choisi, setChoisi] = useState(mois[1]?.valeur ?? mois[0].valeur);

  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={choisi}
          onChange={(e) => setChoisi(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          aria-label="Mois à exporter"
        >
          {mois.map((m) => (
            <option key={m.valeur} value={m.valeur}>
              {m.libelle}
            </option>
          ))}
        </select>
        <Button asChild size="sm" variant="outline">
          <a href={`/api/proxy/gta/export/evp.csv?mois=${choisi}`} download>
            Export paie (CSV)
          </a>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-xl border border-border p-4">
      <div>
        <h3 className="font-semibold text-foreground">Export pour la paie</h3>
        <p className="mt-0.5 max-w-prose text-sm text-muted-foreground">
          Deux fichiers séparés, parce que la paie et la comptabilité ne lisent pas la même chose :
          vos salariés d'un côté, les intervenants extérieurs de l'autre. Format CSV point-virgule,
          ouvrable directement dans un tableur ou importable dans votre logiciel de paie.
        </p>
      </div>

      <Field label="Mois à exporter" hint="Le mois précédent est proposé par défaut.">
        <select
          value={choisi}
          onChange={(e) => setChoisi(e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm sm:max-w-xs"
        >
          {mois.map((m) => (
            <option key={m.valeur} value={m.valeur}>
              {m.libelle}
            </option>
          ))}
        </select>
      </Field>

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline">
          <a href={`/api/proxy/gta/export/evp.csv?mois=${choisi}`} download>
            Salariés — heures et congés
          </a>
        </Button>
        <Button asChild variant="outline">
          <a href="/api/proxy/bookings/export/heures.csv" download>
            Intervenants — heures validées
          </a>
        </Button>
      </div>

      <p className="max-w-prose text-xs text-muted-foreground">
        Les heures des intervenants extérieurs sont celles qui ont été pointées puis validées : la
        fenêtre de correction de 72 h après la fin d'une intervention doit être close pour qu'elles
        soient opposables.
      </p>
    </div>
  );
}
