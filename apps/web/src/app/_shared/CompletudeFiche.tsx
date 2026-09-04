// Indicateur de complétude d'une fiche atelier — voir lib/completude-fiche.ts
// pour la doctrine (on informe, on n'interdit pas).
//
// Deux formats, un seul calcul :
//   <CompletudeBandeau>  — la barre + le compte, posée sous une carte ;
//   <CompletudeDetail>   — la liste de ce qui manque, avec la raison de chaque
//                          manque, pour l'écran qui sert à corriger.
import { completude, type FichePourCompletude } from "@/lib/completude-fiche";

function ton(p: number) {
  if (p >= 100) return { barre: "bg-emerald-500", texte: "text-emerald-600 dark:text-emerald-400" };
  if (p >= 70) return { barre: "bg-primary", texte: "text-primary" };
  return { barre: "bg-secondary", texte: "text-secondary" };
}

export function CompletudeBandeau({ fiche }: { fiche: FichePourCompletude }) {
  const c = completude(fiche);
  const t = ton(c.pourcentage);
  const manque = c.manquants.filter((m) => m.niveau === "socle");

  return (
    <div className="mt-2 rounded-lg border border-border bg-card/60 px-3 py-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          Fiche complétée
        </span>
        <span className={`text-xs font-bold ${t.texte}`}>{c.pourcentage} %</span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
        <div className={`h-full rounded-full ${t.barre}`} style={{ width: `${c.pourcentage}%` }} />
      </div>
      {manque.length > 0 ? (
        <p className="mt-1.5 text-xs leading-snug text-muted-foreground">
          Il manque : <span className="text-foreground">{manque.map((m) => m.label).join(", ")}</span>.
        </p>
      ) : (
        <p className="mt-1.5 text-xs text-muted-foreground">Rien ne manque : la fiche est complète.</p>
      )}
    </div>
  );
}

export function CompletudeDetail({ fiche }: { fiche: FichePourCompletude }) {
  const c = completude(fiche);
  const t = ton(c.pourcentage);

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-sm font-medium text-foreground">
            {c.remplis} champ{c.remplis > 1 ? "s" : ""} sur {c.total}
          </span>
          <span className={`text-lg font-bold ${t.texte}`}>{c.pourcentage} %</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
          <div className={`h-full rounded-full ${t.barre}`} style={{ width: `${c.pourcentage}%` }} />
        </div>
      </div>

      {c.manquants.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Tout est renseigné. C'est la forme dans laquelle un chef de service peut décider sans
          rappeler.
        </p>
      ) : (
        <ul className="space-y-2.5">
          {c.manquants.map((m) => (
            <li key={m.champ} className="rounded-lg border border-border bg-muted/30 px-3 py-2">
              <p className="text-sm font-semibold text-foreground">
                {m.label}
                {m.niveau === "confort" ? (
                  <span className="ml-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    facultatif
                  </span>
                ) : null}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{m.pourquoi}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
