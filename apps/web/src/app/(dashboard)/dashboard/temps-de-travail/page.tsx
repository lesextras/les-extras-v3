// LES RÈGLES DE TEMPS DE TRAVAIL DE L'ÉTABLISSEMENT.
//
// Cet écran existe parce qu'un logiciel de planning ne peut pas deviner ces
// valeurs et ne doit surtout pas les inventer. Dans le médico-social, la seule
// majoration imposée par la loi est celle du 1er mai : la nuit, le dimanche et
// les dix autres jours fériés relèvent de la convention collective ou de
// l'accord d'entreprise.
//
// Tant que rien n'est renseigné, les chiffrages sortent sans majoration — et
// le disent. C'est volontaire : un zéro expliqué vaut mieux qu'un taux inventé
// qui ferait annoncer à un directeur un coût qui n'est pas le sien.
import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { requireSession, fetchApi } from "../../../_shared/server";
import { PageHeader, EmptyState, ErrorState } from "../../../_shared/ui";
import { ParametresTemps, type Parametres } from "../../../_shared/ParametresTemps";

export const metadata: Metadata = { title: "Temps de travail" };

export default async function TempsDeTravailPage() {
  const session = await requireSession();

  if (session.account.type !== "ESTABLISHMENT") {
    return (
      <div className="space-y-6">
        <PageHeader title="Temps de travail" />
        <EmptyState
          title="Réservé aux établissements"
          description="Ces règles sont celles de la convention collective d'une structure employeuse. Depuis un compte intervenant, c'est votre planning qu'il faut regarder."
          action={
            <Button asChild>
              <Link href="/dashboard/planning">Voir mon planning</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const res = await fetchApi<Parametres>(session, "/parametres-temps");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Temps de travail"
        subtitle="Les règles de votre convention, reportées une fois — puis appliquées à chaque chiffrage, chaque compteur et chaque proposition d'engagement."
      />
      {res.error || !res.data ? (
        <ErrorState retryHref="/dashboard/temps-de-travail" description={res.error} />
      ) : (
        <ParametresTemps
          initial={res.data}
          accountId={session.account.id}
          modifiable={["OWNER", "ADMIN"].includes(session.account.role)}
        />
      )}
    </div>
  );
}
