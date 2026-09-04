// Mes alertes de recherche.
//
// ⚠ CE QUE CETTE PAGE RÉPARE. Le catalogue compte dix-sept fiches : la plupart
// des recherches précises n'y trouvent rien. Jusqu'ici, cette visite était
// perdue — personne ne revient vérifier un catalogue chaque semaine. Une alerte
// retourne la charge : c'est la plateforme qui écrit le jour où la fiche
// existe.
//
// ⚠ LA PAGE ACCEPTE DES CRITÈRES DANS L'ADRESSE (`?recherche=…&departement=77`)
// parce qu'on y arrive depuis une recherche du catalogue restée vide. La
// personne vient d'exprimer son besoin ; le lui redemander en repartant d'un
// formulaire vide, c'est perdre les trois quarts de ceux qui ont cliqué.
import type { Metadata } from "next";
import { requireSession, fetchApi } from "../../../_shared/server";
import { PageHeader, ErrorState } from "../../../_shared/ui";
import { Card, CardContent } from "@/components/ui/card";
import { GestionAlertes, type Alerte } from "../../../_shared/GestionAlertes";
import { trouverDepartement } from "@/lib/territoires";

export const metadata: Metadata = { title: "Mes alertes" };

export default async function AlertesPage({
  searchParams: searchParamsPromesse,
}: {
  searchParams?: Promise<{
    recherche?: string;
    category?: string;
    public?: string;
    departement?: string;
    type?: string;
  }>;
}) {
  const searchParams = await searchParamsPromesse;
  const session = await requireSession();
  const { data, error } = await fetchApi<Alerte[]>(session, "/community/alertes");

  // Un code inconnu dans l'adresse ne doit pas pré-remplir un territoire faux :
  // on le confronte au référentiel avant de le proposer.
  const depart = searchParams?.departement
    ? trouverDepartement(searchParams.departement)
    : undefined;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Mes alertes"
        subtitle="Dites-nous ce que vous cherchez. Nous écrivons le jour où ça arrive au catalogue."
      />

      {error ? (
        <ErrorState
          title="Lecture impossible"
          description="Vos alertes n'ont pas pu être chargées. Réessayez dans un instant."
        />
      ) : (
        <>
          <Card className="border-primary/25 bg-primary-soft">
            <CardContent className="space-y-1.5 p-5">
              <p className="text-sm font-semibold text-foreground">
                Un message par jour au maximum, et seulement s&apos;il y a du neuf.
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                La plupart des jours, rien n&apos;arrive et vous ne recevez rien. Une
                alerte se met en pause ou se supprime d&apos;un clic, ici, à tout moment.
              </p>
            </CardContent>
          </Card>

          <GestionAlertes
            alertes={data ?? []}
            accountId={session.account?.id}
            initiaux={{
              recherche: searchParams?.recherche,
              categorie: searchParams?.category,
              publicVise: searchParams?.public,
              departements: depart ? [depart.code] : undefined,
              type: searchParams?.type,
            }}
          />
        </>
      )}
    </div>
  );
}
