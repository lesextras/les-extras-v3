// LE CHEMIN À TRAVERS LE CATALOGUE GRATUIT — trois niveaux, demandé par Siham
// le 4 septembre 2026.
//
// Le catalogue affichait onze parcours côte à côte, sans ordre. Or l'ordre
// compte : « Renforcer ce qui va » ne veut rien dire tant qu'on n'a pas
// compris ce qu'un comportement obtient. Cette page donne le chemin.
//
// ⚠⚠ AUCUNE OCCURRENCE DU MOT « CERTIFICAT » SUR CETTE PAGE, sauf dans le bloc
// qui explique précisément que ce n'en est pas un. La raison complète est
// écrite en tête de `lib/niveaux-formations.ts` : Qualiopi certifie la qualité
// d'un processus de formation, elle n'autorise à délivrer aucun titre. Vendre
// 20 € un document présenté comme un « certificat professionnel » serait une
// pratique commerciale trompeuse, et lourdement retenue contre un organisme
// justement certifié Qualiopi.
//
// ⚠ LES NIVEAUX NE VERROUILLENT RIEN. Aucun parcours n'est rendu inaccessible
// tant qu'un autre n'est pas fini : un professionnel qui a une crise lundi
// matin doit pouvoir ouvrir le parcours crise lundi matin. On guide, on
// n'enferme pas — même doctrine que l'indicateur de complétude des fiches.
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, GraduationCap, Layers, ShieldCheck, CircleCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "../../_shared/ui";
import { metaPublique } from "@/lib/meta";
import { NIVEAUX, CE_QUE_CE_N_EST_PAS, parcoursOuverts } from "@/lib/niveaux-formations";

export const metadata: Metadata = metaPublique({
  title: "Par où commencer : les trois niveaux",
  /**
   * ⚠ AUCUN NOMBRE DE PARCOURS DANS CETTE PHRASE, ET C'EST VOLONTAIRE. Elle
   * disait « Onze parcours gratuits » alors qu'il y en a douze en ligne depuis
   * le 4/09/2026 : un compte écrit en dur dans une métadonnée ne se remarque
   * jamais, et il est faux dès le parcours suivant. Le chiffre exact est
   * calculé plus bas, depuis `NIVEAUX` (`const total`), là où il est juste.
   */
  description:
    "Les parcours gratuits rangés en trois niveaux : les socles, l’approfondissement, l’expertise. Le chemin conseillé, et ce que chaque niveau apprend à faire.",
  path: "/parcours-de-formation",
});

const TONS = [
  { fond: "bg-primary-soft", bord: "border-primary/30", puce: "bg-primary text-primary-foreground" },
  { fond: "bg-secondary/10", bord: "border-secondary/30", puce: "bg-secondary text-white" },
  { fond: "bg-muted", bord: "border-border", puce: "bg-foreground text-background" },
];

export default function ParcoursDeFormationPage() {
  const total = NIVEAUX.reduce((n, niv) => n + parcoursOuverts(niv).length, 0);

  return (
    <div className="space-y-12">
      <PageHeader
        title="Par où commencer"
        subtitle={`Nos parcours sont gratuits et se suivent dans l’ordre que vous voulez. Mais il y a un ordre qui fait gagner du temps, et le voici : trois niveaux, ${total} parcours ouverts.`}
      />

      <section className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-start gap-3">
          <Layers className="mt-0.5 size-5 shrink-0 text-primary" />
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-foreground">
              Pourquoi un ordre, alors que tout est ouvert
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Chaque parcours enseigne une compétence et une seule. Mais certaines
              s’appuient sur d’autres&nbsp;: faire augmenter un comportement n’a pas
              de sens tant qu’on n’a pas cherché ce que le comportement gênant
              obtenait, et arriver à une réunion de scolarisation suppose de savoir
              décrire ce qu’on a vu sans y mettre d’interprétation.
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Les niveaux ne verrouillent rien. Si vous avez une situation difficile
              cette semaine, ouvrez directement le parcours qui la traite. L’ordre
              est là pour ceux qui veulent construire, pas pour barrer la route à
              ceux qui ont besoin d’une réponse aujourd’hui.
            </p>
          </div>
        </div>
      </section>

      {NIVEAUX.map((niveau, i) => {
        const ton = TONS[i] ?? TONS[2];
        const ouverts = parcoursOuverts(niveau);
        return (
          <section key={niveau.cle} className="space-y-5">
            <div className={`rounded-2xl border ${ton.bord} ${ton.fond} p-6`}>
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={`flex size-10 items-center justify-center rounded-full text-base font-bold ${ton.puce}`}
                >
                  {niveau.numero}
                </span>
                <h2 className="text-xl font-bold text-foreground sm:text-2xl">
                  Niveau {niveau.numero} · {niveau.nom}
                </h2>
                <span className="text-sm text-muted-foreground">
                  {ouverts.length} parcours ouvert{ouverts.length > 1 ? "s" : ""}
                  {niveau.parcours.length > ouverts.length
                    ? ` · ${niveau.parcours.length - ouverts.length} à venir`
                    : ""}
                </span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-foreground">{niveau.promesse}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                <strong className="text-foreground">Pour qui&nbsp;:</strong> {niveau.pourQui}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {niveau.parcours.map((p, rang) => (
                <div
                  key={p.slug}
                  className={`rounded-xl border border-border bg-card p-5 ${
                    p.aVenir ? "opacity-70" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Étape {rang + 1}
                      </p>
                      <h3 className="mt-1 text-base font-semibold text-foreground">{p.titre}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {p.competence}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4">
                    {p.aVenir ? (
                      <span className="text-xs font-medium text-muted-foreground">
                        En cours d’écriture
                      </span>
                    ) : (
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/formations/${p.slug}`}>
                          Ouvrir le parcours <ArrowRight className="ml-1 size-3.5" />
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-border bg-muted/40 p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground">
                À la sortie du niveau {niveau.numero}, vous savez
              </h3>
              <ul className="mt-3 space-y-2">
                {niveau.aLaSortie.map((a) => (
                  <li key={a} className="flex gap-2 text-sm leading-relaxed text-muted-foreground">
                    <CircleCheck className="mt-0.5 size-4 shrink-0 text-success" />
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        );
      })}

      {/* ⚠ CE BLOC EST LA LIMITE JURIDIQUE DU DISPOSITIF. Il reprend mot pour
          mot les CGV. Toute réécriture qui laisserait entendre qu'un titre est
          délivré doit être refusée : voir l'en-tête de lib/niveaux-formations.ts. */}
      <section className="rounded-2xl border border-secondary/30 bg-secondary/5 p-6">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-secondary" />
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">{CE_QUE_CE_N_EST_PAS.titre}</h2>
            <ul className="space-y-2">
              {CE_QUE_CE_N_EST_PAS.points.map((p) => (
                <li key={p} className="text-sm leading-relaxed text-muted-foreground">
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-start gap-3">
          <GraduationCap className="mt-0.5 size-5 shrink-0 text-primary" />
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-foreground">L’attestation de suivi</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Les parcours sont gratuits, du premier au dernier module, sans carte
              bancaire. Si vous souhaitez une trace écrite de ce que vous avez suivi,
              l’association délivre une <strong className="text-foreground">attestation
              de suivi</strong> à 20&nbsp;€, pour un parcours ou pour un niveau
              complet. Elle mentionne les modules suivis et leur durée.
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Elle atteste d’un suivi, elle ne confère aucun titre. C’est un document
              utile dans un entretien professionnel ou un dossier de formation
              continue, et il vaut ce qu’il dit&nbsp;: ni plus, ni moins.
            </p>
            <div className="pt-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/legal?rubrique=cgv">Lire les conditions</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <Button asChild size="lg">
          <Link href="/formations">Voir tous les parcours</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/formations/les-quatre-fonctions-d-un-comportement">
            Commencer par le niveau 1
          </Link>
        </Button>
      </div>
    </div>
  );
}
