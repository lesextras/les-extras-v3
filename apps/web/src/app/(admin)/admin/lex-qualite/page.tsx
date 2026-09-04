// Back-office ADMIN — la QUALITÉ de LEX, pas son chiffre d'affaires.
//
// ⚠ POURQUOI CET ÉCRAN (04/09/2026). `AssistantFeedback` se remplissait à
// chaque pouce haut ou bas depuis des mois, et AUCUNE requête ne le lisait
// nulle part. Exactement le même défaut que les quatre e-mails qui
// n'écrivaient qu'une ligne en base : la donnée entre, personne ne la regarde,
// et on pilote à l'intuition un produit qui coûte un crédit par appel.
//
// ⚠ À NE PAS CONFONDRE AVEC /admin/lex, qui traite l'argent (ventes de packs,
// consommation, abonnements). Ici c'est la qualité. Source : GET
// /admin/lex/qualite.
import type { Metadata } from "next";
import { Sparkles, FileText, BookOpen, Users, ThumbsUp, ThumbsDown } from "lucide-react";
import { requireAdmin, fetchApi } from "../../../_shared/server";
import { PageHeader, StatCard, ErrorState, EmptyState, SectionTitle } from "../../../_shared/ui";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "../../../_shared/format";

export const metadata: Metadata = { title: "LEX · Qualité · Administration" };

interface LigneTrame {
  trame: string;
  utiles: number;
  inutiles: number;
  documents: number;
  avis: number;
  satisfaction: number | null;
}

interface Suivi {
  moteur: { moteur: string; modele: string; surRepli: boolean; indisponible: boolean };
  usage: {
    documents: number;
    documents30j: number;
    tramesMaison: number;
    pseudonymes: number;
    avecMemoire: number;
  };
  satisfaction: { avis: number; utiles: number; taux: number | null };
  trames: LigneTrame[];
  commentaires: {
    id: string;
    trame: string;
    utile: boolean;
    comment: string | null;
    createdAt: string;
  }[];
}

/** Les intitulés lisibles. Doit suivre `AssistantTrame` côté API. */
const NOMS: Record<string, string> = {
  NOTE_OBSERVATION: "Note d'observation",
  RAPPORT_SITUATION: "Rapport de situation",
  TRANSMISSION: "Transmission",
  SYNTHESE_REUNION: "Synthèse de réunion",
  COMPTE_RENDU_ATELIER: "Compte rendu d'atelier",
  COURRIER_AUTORITE_PARENTALE: "Courrier aux parents",
  COURRIER_PARTENAIRE: "Courrier partenaire",
  BILAN_FIN_ACCOMPAGNEMENT: "Bilan de fin d'accompagnement",
};

const nom = (t: string) => NOMS[t] ?? t;

export default async function AdminLexQualitePage() {
  const session = await requireAdmin();
  const { data, error } = await fetchApi<Suivi>(session, "/admin/lex/qualite");

  if (error || !data) {
    return (
      <div className="space-y-6">
        <PageHeader title="LEX · Qualité" />
        <ErrorState
          title="Lecture impossible"
          description="Les indicateurs de LEX n'ont pas pu être chargés."
        />
      </div>
    );
  }

  const { moteur, usage, satisfaction, trames, commentaires } = data;
  const jamaisServi = usage.documents === 0;

  return (
    <div className="space-y-8">
      <PageHeader
        title="LEX · Qualité"
        subtitle="Est-ce que LEX sert, est-ce que ce qu'il rend est bon, et quelle trame réparer en premier."
      />

      {/* LE MOTEUR EN PREMIER : le reste de l'écran ne veut rien dire sans lui.
          La clé Anthropic a vécu des semaines en production sous un autre nom
          de variable, et LEX tournait sur le repli sans que rien ne l'affiche. */}
      <Card
        className={
          moteur.indisponible
            ? "border-destructive/40 bg-destructive/5"
            : moteur.surRepli
              ? "border-warning/40 bg-warning/5"
              : "border-success/30 bg-success/5"
        }
      >
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
          <p className="text-sm text-foreground">
            <span className="font-semibold">Moteur : {moteur.moteur}</span>
            <span className="text-muted-foreground"> · modèle {moteur.modele}</span>
          </p>
          <Badge variant={moteur.surRepli || moteur.indisponible ? "outline" : "secondary"}>
            {moteur.indisponible ? "à configurer" : moteur.surRepli ? "repli" : "nominal"}
          </Badge>
        </CardContent>
      </Card>

      {jamaisServi ? (
        <Card className="border-warning/40 bg-warning/5">
          <CardContent className="space-y-2 p-5">
            <p className="text-sm font-semibold text-foreground">
              Aucun écrit n&apos;a encore été enregistré.
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Tant que personne n&apos;a produit puis gardé un document, cet écran ne peut rien
              dire de la qualité, et la mémoire des situations n&apos;a rien à relire. Le premier
              écrit de bout en bout, généré, relu, enregistré, amorce les deux à la fois.
            </p>
          </CardContent>
        </Card>
      ) : null}

      <section className="space-y-4">
        <SectionTitle title="Usage" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <StatCard label="Écrits gardés" value={usage.documents} accent="teal" icon={<FileText />} />
          <StatCard label="Dont 30 derniers jours" value={usage.documents30j} icon={<Sparkles />} />
          <StatCard
            label="Écrits avec mémoire"
            value={usage.avecMemoire}
            hint="Portent une personne identifiée"
            icon={<Users />}
          />
          <StatCard label="Trames maison" value={usage.tramesMaison} icon={<BookOpen />} />
          <StatCard
            label="Personnes suivies"
            value={usage.pseudonymes}
            hint="Pseudonymes stables, aucun nom"
          />
        </div>
      </section>

      <section className="space-y-4">
        <SectionTitle title="Satisfaction" />
        {satisfaction.avis === 0 ? (
          <EmptyState
            title="Aucun avis pour l'instant"
            description="Le pouce haut ou bas sous chaque brouillon alimente cet écran."
          />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
              <StatCard
                label="Avis reçus"
                value={satisfaction.avis}
                icon={<ThumbsUp />}
              />
              <StatCard
                label="Jugés utiles"
                value={satisfaction.utiles}
                accent="teal"
              />
              <StatCard
                label="Taux de satisfaction"
                value={`${satisfaction.taux ?? 0} %`}
                accent={satisfaction.taux !== null && satisfaction.taux < 70 ? "warning" : "teal"}
              />
            </div>

            {/* ⚠ TRIÉES PAR SATISFACTION CROISSANTE, PAS PAR VOLUME. Une trame
                peu utilisée mais juste ne coûte rien. Une trame très utilisée
                et ratée abîme la confiance à chaque appel : c'est celle-là
                qu'on répare en premier, et elle doit être en haut. */}
            <Card>
              <CardContent className="divide-y divide-border p-0">
                {trames.map((t) => (
                  <div
                    key={t.trame}
                    className="flex flex-wrap items-center justify-between gap-3 px-6 py-4"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{nom(t.trame)}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.documents} écrit{t.documents > 1 ? "s" : ""} gardé
                        {t.documents > 1 ? "s" : ""}
                        {t.avis > 0 ? ` · ${t.avis} avis` : " · aucun avis"}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      {t.avis > 0 ? (
                        <span className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1 text-success">
                            <ThumbsUp className="size-3.5" /> {t.utiles}
                          </span>
                          <span className="flex items-center gap-1 text-secondary">
                            <ThumbsDown className="size-3.5" /> {t.inutiles}
                          </span>
                        </span>
                      ) : null}
                      {t.satisfaction === null ? (
                        <Badge variant="outline">pas encore noté</Badge>
                      ) : (
                        <span
                          className={`text-lg font-bold tabular-nums ${
                            t.satisfaction >= 80
                              ? "text-success"
                              : t.satisfaction >= 60
                                ? "text-foreground"
                                : "text-secondary"
                          }`}
                        >
                          {t.satisfaction} %
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </>
        )}
      </section>

      <section className="space-y-4">
        <SectionTitle title="Ce que les professionnels ont écrit" />
        {commentaires.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucun commentaire. Ce sont eux qui disent POURQUOI un écrit ne convient pas ; le
            pouce seul ne le dit jamais.
          </p>
        ) : (
          <div className="space-y-3">
            {commentaires.map((c) => (
              <Card key={c.id} className={c.utile ? "" : "border-secondary/40 bg-secondary/5"}>
                <CardContent className="space-y-1.5 p-5">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    {c.utile ? (
                      <ThumbsUp className="size-4 text-success" />
                    ) : (
                      <ThumbsDown className="size-4 text-secondary" />
                    )}
                    <span className="font-medium text-foreground">{nom(c.trame)}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(c.createdAt)}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                    {c.comment}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
