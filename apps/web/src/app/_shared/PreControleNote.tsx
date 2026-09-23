// La note de pré-contrôle automatique, posée sous une pièce déposée.
//
// Elle dit ce qu'une lecture automatique a vu : bon type de document ou non,
// nom conforme ou non, dates. Elle n'a aucune autorité : le statut de la
// pièce reste décidé par une personne. D'où le ton — un repère, pas un verdict.
import { ScanSearch } from "lucide-react";

export interface NotePreControle {
  lisible: boolean;
  verdict: "COHERENT" | "A_VERIFIER" | "ILLISIBLE";
  typeDetecte: string | null;
  correspondAuType: boolean | null;
  nomDetecte: string | null;
  correspondAuNom: boolean | null;
  dateEmission: string | null;
  dateExpiration: string | null;
  alertes: string[];
  resume: string;
}

const STYLE: Record<NotePreControle["verdict"], { titre: string; classe: string }> = {
  COHERENT: {
    titre: "Lecture automatique : rien d’anormal",
    classe: "border-emerald-500/40 bg-emerald-500/5 text-foreground",
  },
  A_VERIFIER: {
    titre: "Lecture automatique : à regarder de près",
    classe: "border-amber-500/50 bg-amber-500/5 text-foreground",
  },
  ILLISIBLE: {
    titre: "Lecture automatique impossible",
    classe: "border-border bg-muted/40 text-foreground",
  },
};

function dateFr(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("fr-FR");
}

export function PreControleNote({
  note,
  le,
  pour = "structure",
}: {
  note: NotePreControle | null | undefined;
  le?: string | null;
  /** Qui lit la note : la structure qui valide, ou la personne qui a déposé. */
  pour?: "structure" | "intervenant";
}) {
  if (!note) return null;
  const s = STYLE[note.verdict] ?? STYLE.A_VERIFIER;
  const details = [
    note.typeDetecte ? `Document lu : ${note.typeDetecte}` : null,
    note.nomDetecte ? `Nom lu : ${note.nomDetecte}` : null,
    note.dateEmission ? `Émis le ${dateFr(note.dateEmission)}` : null,
    note.dateExpiration ? `Expire le ${dateFr(note.dateExpiration)}` : null,
  ].filter((x): x is string => Boolean(x));

  return (
    <div className={`mb-2 rounded-lg border px-3 py-2 text-xs ${s.classe}`}>
      <p className="inline-flex items-center gap-1.5 font-medium">
        <ScanSearch className="size-3.5" aria-hidden />
        {s.titre}
        {le ? (
          <span className="font-normal text-muted-foreground"> · {dateFr(le)}</span>
        ) : null}
      </p>
      {note.resume ? <p className="mt-1 text-muted-foreground">{note.resume}</p> : null}
      {details.length > 0 ? (
        <p className="mt-1 text-muted-foreground">{details.join(" · ")}</p>
      ) : null}
      {note.alertes.length > 0 ? (
        <ul className="mt-1 list-disc space-y-0.5 pl-4">
          {note.alertes.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
      ) : null}
      <p className="mt-1 text-[11px] text-muted-foreground">
        {pour === "intervenant"
          ? "Simple aide à la lecture : c’est la structure qui vérifie et valide votre pièce."
          : "Simple aide à la lecture : la validation reste votre décision."}
      </p>
    </div>
  );
}
