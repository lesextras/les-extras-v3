"use client";

/**
 * LES DEUX ÉVALUATIONS D'UNE FORMATION.
 *
 * Le référentiel national qualité demande de recueillir l'appréciation des
 * bénéficiaires (indicateur 30) et d'apprécier l'atteinte des objectifs
 * (indicateur 11). La base savait stocker une note de satisfaction depuis le
 * début — la page publique l'affichait même en « note des stagiaires » — mais
 * aucun écran ne l'a jamais demandée à personne. Quant à l'évaluation à froid,
 * celle que l'auditeur regarde en premier parce qu'elle mesure ce qui reste
 * trois mois après, elle n'existait pas du tout.
 *
 * Deux formulaires, donc, et une règle : l'évaluation à froid ne s'ouvre
 * qu'une fois la session terminée. Demander à quelqu'un ce qu'il a mis en
 * œuvre avant même d'avoir suivi la formation, c'est fabriquer une preuve
 * fausse.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { apiRequest } from "@/lib/api";
import { Field, Textarea } from "./form-fields";

const NOTES = [
  { valeur: 1, libelle: "Très insuffisant" },
  { valeur: 2, libelle: "Insuffisant" },
  { valeur: 3, libelle: "Correct" },
  { valeur: 4, libelle: "Satisfaisant" },
  { valeur: 5, libelle: "Très satisfaisant" },
];

const MISE_EN_OEUVRE = [
  { valeur: "OUI", libelle: "Oui, régulièrement" },
  { valeur: "PARTIELLEMENT", libelle: "En partie" },
  { valeur: "NON", libelle: "Pas encore" },
];

function Echelle({
  nom,
  valeur,
  onChange,
}: {
  nom: string;
  valeur: number | null;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={nom}>
      {NOTES.map((n) => {
        const actif = valeur === n.valeur;
        return (
          <button
            key={n.valeur}
            type="button"
            role="radio"
            aria-checked={actif}
            onClick={() => onChange(n.valeur)}
            className={
              actif
                ? "rounded-lg border border-primary bg-primary px-3 py-2 text-xs font-medium text-primary-foreground"
                : "rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground hover:border-primary/50 hover:text-foreground"
            }
          >
            <span className="block text-sm font-semibold">{n.valeur}</span>
            <span className="block">{n.libelle}</span>
          </button>
        );
      })}
    </div>
  );
}

export function EvaluationForm({
  inscriptionId,
  accountId,
  moment,
  apprenant,
  dejaRempli,
  ouvert = true,
}: {
  inscriptionId: string;
  accountId: string;
  moment: "chaud" | "froid";
  apprenant: string;
  dejaRempli?: boolean;
  /**
   * Faux tant que la session n'est pas passée. Le bouton reste visible mais
   * inactif : dire pourquoi c'est fermé vaut mieux que faire disparaître.
   */
  ouvert?: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState<number | null>(null);
  const [transfert, setTransfert] = useState<string>("PARTIELLEMENT");
  const [busy, setBusy] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const chaud = moment === "chaud";

  async function envoyer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (note === null) {
      setErreur("Choisissez une note.");
      return;
    }
    setBusy(true);
    setErreur(null);
    const fd = new FormData(e.currentTarget);
    const commentaire = String(fd.get("commentaire") || "").trim() || undefined;
    try {
      await apiRequest(
        `/formations/inscriptions/${inscriptionId}/evaluation-${chaud ? "chaud" : "froid"}`,
        {
          method: "POST",
          accountId,
          body: chaud
            ? {
                satisfaction: note,
                commentaire,
                resultat: String(fd.get("resultat") || "").trim() || undefined,
              }
            : { note, miseEnOeuvre: transfert, commentaire },
        },
      );
      toast({
        title: chaud ? "Évaluation de fin enregistrée" : "Évaluation à froid enregistrée",
        description: "Elle alimente le bilan qualité de la session.",
      });
      setOpen(false);
      router.refresh();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Enregistrement impossible");
    } finally {
      setBusy(false);
    }
  }

  if (!ouvert) {
    return (
      <Button size="sm" variant="ghost" disabled title="Disponible une fois la session terminée.">
        {chaud ? "Éval. à chaud" : "Éval. à froid"}
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant={dejaRempli ? "ghost" : "outline"}>
          {dejaRempli
            ? chaud
              ? "Éval. à chaud ✓"
              : "Éval. à froid ✓"
            : chaud
              ? "Éval. à chaud"
              : "Éval. à froid"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {chaud ? "Évaluation de fin de session" : "Évaluation à froid"}
          </DialogTitle>
          <DialogDescription>
            {chaud
              ? `Ce que ${apprenant} retient au sortir de la formation.`
              : `Ce que ${apprenant} en fait sur son poste, quelques mois après.`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={envoyer} className="space-y-4">
          <Field
            label={chaud ? "Satisfaction générale" : "Utilité avec le recul"}
            hint="Obligatoire — c'est la seule donnée agrégée dans le bilan qualité."
          >
            <Echelle nom="note" valeur={note} onChange={setNote} />
          </Field>

          {!chaud ? (
            <Field
              label="Les acquis ont-ils été mis en œuvre ?"
              hint="C'est la question que pose l'audit : ce qui a été appris a-t-il servi ?"
            >
              <div className="flex flex-wrap gap-2">
                {MISE_EN_OEUVRE.map((m) => {
                  const actif = transfert === m.valeur;
                  return (
                    <button
                      key={m.valeur}
                      type="button"
                      aria-pressed={actif}
                      onClick={() => setTransfert(m.valeur)}
                      className={
                        actif
                          ? "rounded-full border border-primary bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
                          : "rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-primary/50 hover:text-foreground"
                      }
                    >
                      {m.libelle}
                    </button>
                  );
                })}
              </div>
            </Field>
          ) : null}

          <Field
            label="Commentaire"
            htmlFor="commentaire"
            hint={
              chaud
                ? "Ce qui a manqué, ce qui a été utile. Repris tel quel dans le bilan."
                : "Ce qui a changé dans la pratique, ce qui bloque encore."
            }
          >
            <Textarea id="commentaire" name="commentaire" rows={3} />
          </Field>

          {chaud ? (
            <Field
              label="Atteinte des objectifs pédagogiques"
              htmlFor="resultat"
              hint="Appréciée par le formateur. Ex : « Objectifs atteints », « Partiellement — module 3 à revoir »."
            >
              <input
                id="resultat"
                name="resultat"
                maxLength={200}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Objectifs atteints"
              />
            </Field>
          ) : null}

          {erreur ? <p className="text-sm text-destructive">{erreur}</p> : null}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
