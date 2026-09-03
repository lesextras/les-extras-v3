"use client";

// Formulaire d'avis — POST /community/retour-experience
//
// ⚠ UNE SEULE QUESTION EST OBLIGATOIRE : la note globale. Les trois autres sont
// facultatives, et le formulaire le dit. Un questionnaire qui exige quatre
// réponses ne se remplit pas ; une réponse partielle vaut infiniment mieux
// qu'un onglet fermé, et c'est même la règle qui décide du taux de retour.
//
// ⚠ LES DEUX NOTES DÉTAILLÉES SONT SÉPARÉES, ET C'EST TOUT L'INTÉRÊT. « Le
// site » et « la procédure pour proposer ses services » sont deux problèmes
// distincts avec deux réponses distinctes. Une note globale unique dit qu'on
// plaît ou qu'on déplaît ; elle ne dit jamais où ça coince.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { apiRequest } from "@/lib/api";
import { lancerConfettis } from "@/lib/confetti";
import { Field, Textarea } from "./form-fields";

const ECHELLE = [1, 2, 3, 4, 5];
const LEGENDES: Record<number, string> = {
  1: "Très insatisfait",
  2: "Insatisfait",
  3: "Correct",
  4: "Satisfait",
  5: "Très satisfait",
};

function Notes({
  valeur,
  onChange,
  nom,
}: {
  valeur: number | null;
  onChange: (n: number) => void;
  nom: string;
}) {
  return (
    <div>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={nom}>
        {ECHELLE.map((n) => {
          const actif = valeur === n;
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={actif}
              aria-label={`${n} sur 5 — ${LEGENDES[n]}`}
              onClick={() => onChange(n)}
              className={
                actif
                  ? "size-11 rounded-lg border border-primary bg-primary text-base font-semibold text-primary-foreground"
                  : "size-11 rounded-lg border border-border text-base font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
              }
            >
              {n}
            </button>
          );
        })}
      </div>
      {/* La légende n'apparaît qu'une fois la note choisie : cinq libellés
          affichés en permanence sous chaque question, c'est trois fois plus de
          texte que de questions. */}
      <p className="mt-1.5 h-4 text-xs text-muted-foreground">
        {valeur ? LEGENDES[valeur] : ""}
      </p>
    </div>
  );
}

export function FormulaireAvis({ accountId }: { accountId?: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [globale, setGlobale] = useState<number | null>(null);
  const [site, setSite] = useState<number | null>(null);
  const [depot, setDepot] = useState<number | null>(null);
  const [probleme, setProbleme] = useState("");
  const [commentaire, setCommentaire] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [fait, setFait] = useState(false);

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    if (!globale) {
      setErreur("Donnez au moins une note globale — c'est la seule question obligatoire.");
      return;
    }
    setEnvoi(true);
    setErreur(null);
    try {
      await apiRequest("/community/retour-experience", {
        method: "POST",
        accountId,
        body: {
          noteGlobale: globale,
          noteSite: site ?? undefined,
          noteDepot: depot ?? undefined,
          probleme: probleme.trim() || undefined,
          commentaire: commentaire.trim() || undefined,
          source: "PREMIER_ATELIER",
        },
      });
      lancerConfettis();
      setFait(true);
      toast({
        title: "Merci — c'est enregistré",
        description: probleme.trim()
          ? "Le problème que vous signalez est remonté à l'association ; il est traité dans la journée."
          : "Votre avis est lu par l'association.",
      });
      router.refresh();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "L'envoi n'a pas abouti.");
    } finally {
      setEnvoi(false);
    }
  }

  if (fait) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <p className="text-base font-semibold text-foreground">Merci.</p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          C&apos;est enregistré. Si vous avez signalé un problème, il est remonté
          tel quel à l&apos;association — vous pouvez être rappelé à ce sujet.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={envoyer} className="space-y-7 rounded-xl border border-border bg-card p-6">
      <Field label="Dans l'ensemble, êtes-vous satisfait des Extras ?" required>
        <Notes valeur={globale} onChange={setGlobale} nom="Satisfaction générale" />
      </Field>

      <Field
        label="Le site lui-même"
        hint="Facultatif. Est-ce clair, trouve-t-on ce qu'on cherche ?"
      >
        <Notes valeur={site} onChange={setSite} nom="Le site" />
      </Field>

      <Field
        label="La procédure pour proposer vos services"
        hint="Facultatif. Le dépôt de votre fiche, les pièces demandées, les délais."
      >
        <Notes valeur={depot} onChange={setDepot} nom="Procédure de dépôt" />
      </Field>

      <Field
        label="Avez-vous rencontré un problème précis ?"
        hint="Une page qui ne répond pas, un bouton sans effet, une étape où vous avez été bloqué. C'est ce que nous corrigeons en premier."
      >
        <Textarea
          rows={3}
          value={probleme}
          onChange={(e) => setProbleme(e.target.value)}
          placeholder="Ex : impossible d'ajouter une photo depuis mon téléphone."
        />
      </Field>

      <Field label="Autre chose à nous dire ?" hint="Facultatif.">
        <Textarea
          rows={3}
          value={commentaire}
          onChange={(e) => setCommentaire(e.target.value)}
          placeholder="Ce qui vous a plu, ce qui manque, ce que vous attendez de nous."
        />
      </Field>

      {erreur ? <p className="text-sm text-destructive">{erreur}</p> : null}

      <Button type="submit" size="lg" disabled={envoi}>
        {envoi ? "Envoi…" : "Envoyer mon avis"}
      </Button>
    </form>
  );
}
