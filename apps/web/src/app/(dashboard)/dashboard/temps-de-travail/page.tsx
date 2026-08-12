// LE TEMPS DE TRAVAIL DE L'ÉTABLISSEMENT — un seul écran (12/08/2026).
//
// « Congés & compteurs » et « Temps de travail » vivaient à deux adresses.
// C'est le même sujet et souvent le même geste : on ouvre les règles pour
// comprendre un compteur, on ouvre le compteur pour appliquer une règle. Deux
// entrées de menu pour un aller-retour permanent, c'est une entrée de trop.
//
// L'écran se lit de haut en bas dans l'ordre où l'on travaille : ce qui est
// déjà planifié (le document d'équipe), puis les demandes et les soldes, puis
// les règles qui servent aux deux.
//
// `/dashboard/conges` redirige ici (voir next.config.mjs) : les liens déjà
// envoyés continuent de fonctionner.
import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { requireSession, fetchApi } from "../../../_shared/server";
import { PageHeader, EmptyState, ErrorState } from "../../../_shared/ui";
import { ParametresTemps, type Parametres } from "../../../_shared/ParametresTemps";
import { GestionConges } from "../../../_shared/GestionConges";
import { PlanningEquipe } from "../../../_shared/PlanningEquipe";

export const metadata: Metadata = { title: "Temps de travail & congés" };

export default async function TempsDeTravailPage() {
  const session = await requireSession();

  if (session.account.type !== "ESTABLISHMENT") {
    return (
      <div className="space-y-6">
        <PageHeader title="Temps de travail & congés" />
        <EmptyState
          title="Réservé aux établissements"
          description="Ces règles et ces compteurs sont ceux d'une structure employeuse. Depuis un compte intervenant, c'est votre planning qu'il faut regarder."
          action={
            <Button asChild>
              <Link href="/dashboard/planning">Voir mon planning</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const canDecide = ["OWNER", "ADMIN", "MANAGER"].includes(session.account.role);
  const { data, error } = await fetchApi<Parametres>(session, "/temps-travail");

  return (
    <div className="space-y-8">
      <PageHeader
        title="Temps de travail & congés"
        subtitle={
          canDecide
            ? "Le planning déjà posé, les demandes d'absence à trancher, les soldes, et les règles de votre convention qui servent aux chiffrages."
            : "Posez vos demandes d'absence : vos responsables sont prévenus et décident depuis cette même page."
        }
      />

      {/* Ce qui est déjà planifié : on part du réel avant de parler de règles. */}
      {canDecide ? <PlanningEquipe /> : null}

      <GestionConges accountId={session.account.id} canDecide={canDecide} />

      {/* Les règles ne concernent que ceux qui peuvent les changer. Elles
          restent en bas : on les consulte, on ne les manipule pas tous les
          jours — et elles engagent la convention collective. */}
      {canDecide ? (
        error ? (
          <ErrorState description={error} />
        ) : data ? (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Les règles de votre convention</h2>
              <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                Un logiciel ne peut pas deviner ces valeurs et ne doit pas les inventer. Dans le
                médico-social, la seule majoration imposée par la loi est celle du 1<sup>er</sup> mai :
                la nuit, le dimanche et les dix autres jours fériés relèvent de votre convention
                collective ou de votre accord d’entreprise. Tant que rien n’est renseigné, les
                chiffrages sortent sans majoration — et le disent.
              </p>
            </div>
            <ParametresTemps
              initial={data}
              accountId={session.account.id}
              modifiable={["OWNER", "ADMIN"].includes(session.account.role)}
            />
          </div>
        ) : null
      ) : null}
    </div>
  );
}
