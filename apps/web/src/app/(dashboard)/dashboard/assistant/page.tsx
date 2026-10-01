// LEX — page du tableau de bord.
//
// ⚠ DEPUIS LE 01/10/2026 (décision de Siham), le premier écran est
// `LexQuotidien` : trois tâches, « Que voulez-vous terminer ? ». L'ancien
// studio complet (trames maison, export Word, mémoire des situations, mes
// documents) reste là, entier, derrière `?mode=complet`. Aucun code retiré.
import type { Metadata } from "next";
import Link from "next/link";
import { estAdherent, requireSession } from "../../../_shared/server";
import { PageHeader } from "../../../_shared/ui";
import { AssistantStudio } from "../../../_shared/AssistantStudio";
import { AdherentGate } from "../../../_shared/AdherentGate";
import { LexQuotidien, type PreremplissageLex } from "../../../_shared/LexQuotidien";
import { CHAMPS_PREREMPLISSABLES } from "@/lib/lex-taches";

export const metadata: Metadata = { title: "LEX · Vos activités et vos écrits" };

type Params = Record<string, string | string[] | undefined>;

function un(v: string | string[] | undefined): string | undefined {
  const s = Array.isArray(v) ? v[0] : v;
  return s ? s.slice(0, 300) : undefined;
}

export default async function AssistantPage({ searchParams }: { searchParams: Promise<Params> }) {
  const session = await requireSession();
  const adherent = await estAdherent(session);
  const params = await searchParams;

  if (!adherent) {
    return (
      <AdherentGate
        titre="LEX : vos activités et vos écrits du quotidien"
        description="Préparer une activité, améliorer un écrit, transformer vos notes en compte rendu. Votre solde du mois est utilisé : un pack ou un abonnement prend le relais."
        benefices={[
          "Trois tâches simples, pour tous les métiers de l’éducation, de l’animation, du social et des associations",
          "Noms retirés avant l’envoi, rien n’est inventé : ce qui manque est signalé",
          "Vous relisez et validez : vous restez l’auteur",
          "Le mode complet garde vos trames maison et l’export Word et PDF",
        ]}
      />
    );
  }

  if (un(params.mode) === "complet") {
    return (
      <div className="space-y-6">
        <PageHeader
          title="LEX · Mode complet"
          subtitle="Vos notes brutes deviennent des écrits professionnels : notes, rapports, transmissions, courriers aux parents et aux partenaires. Déposez un de vos écrits : LEX apprend votre trame et rédige dedans, puis vous téléchargez en Word ou en PDF."
        />
        <p className="text-sm">
          <Link href="/dashboard/assistant" className="font-semibold text-primary hover:underline">
            ← Revenir aux trois tâches
          </Link>
        </p>
        <AssistantStudio
          peutPublier /* plus de rôles sur Les Extras (24/09/2026) */
        />
      </div>
    );
  }

  // Seuls des réglages génériques peuvent arriver par l'adresse : jamais de notes.
  const valeurs: Record<string, string> = {};
  for (const c of CHAMPS_PREREMPLISSABLES) {
    const v = un(params[c]);
    if (v) valeurs[c] = v;
  }
  const prerempli: PreremplissageLex = {
    tache: un(params.tache),
    outil: un(params.outil),
    metier: un(params.metier),
    valeurs,
  };

  return <LexQuotidien prerempli={prerempli} />;
}
