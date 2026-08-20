// « Proposer mes services » — un salarié d'établissement crée son compte
// intervenant et reprend ses fiches. C'est le principal levier de croissance du
// réseau : les intervenants les plus proches sont déjà dans les murs.
import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { requireSession, fetchApi } from "../../../_shared/server";
import { PageHeader, SectionTitle } from "../../../_shared/ui";
import { DevenirIntervenant, type FicheImportable } from "../../../_shared/DevenirIntervenant";

export const metadata: Metadata = { title: "Proposer mes services" };

const AVANTAGES = [
  {
    titre: "Vous gardez 100 % de votre tarif",
    detail:
      "L'établissement paie exactement votre tarif : rien n'est prélevé sur vous, rien ne lui est ajouté.",
  },
  {
    // Le texte annonçait « vous facturez l'association, l'association facture
    // l'établissement ». C'est faux, et un intervenant qui l'aurait suivi
    // aurait adressé sa facture à une association qui ne l'attend pas : la
    // contractualisation d'un atelier se noue entre lui et l'établissement, en
    // direct. La plateforme n'est qu'un outil — elle met le document en forme
    // et le numérote, sous le SIRET de l'intervenant.
    titre: "Aucune démarche administrative de plus",
    detail:
      "Devis, contrat et facture sont préparés depuis votre compte, à votre nom et sous votre SIRET. Vous facturez l'établissement en direct.",
  },
  {
    titre: "Publier est gratuit",
    detail:
      "Mettre en ligne vos ateliers, candidater aux missions de renfort, animer une formation : rien n'est facturé, sans commission. Seul LEX (l'assistant IA) se paie, à crédits.",
  },
];

export default async function DevenirIntervenantPage() {
  const session = await requireSession();
  const accountId = session.account.id;
  const { data } = await fetchApi<FicheImportable[]>(
    session,
    `/accounts/${accountId}/fiches-importables`,
  );

  const nomParDefaut =
    [session.user.firstName, session.user.lastName].filter(Boolean).join(" ") || "";

  return (
    <div className="space-y-8">
      <PageHeader
        title="Proposer mes services en mon nom"
        subtitle="Vous intervenez déjà auprès de publics accompagnés. Vous pouvez proposer les mêmes interventions à d'autres structures, en votre nom, sans quitter votre poste."
      />

      <section className="space-y-4">
        <SectionTitle title="Ce que ça change pour vous" />
        <ul className="grid gap-3 sm:grid-cols-3">
          {AVANTAGES.map((a) => (
            <li key={a.titre}>
              <Card className="h-full">
                <CardContent className="pt-6">
                  <p className="font-medium">{a.titre}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{a.detail}</p>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-4">
        <SectionTitle title="Créer mon compte intervenant" />
        <DevenirIntervenant
          sourceAccountId={accountId}
          fiches={data ?? []}
          nomParDefaut={nomParDefaut}
        />
      </section>

      <p className="text-sm text-muted-foreground">
        Une fois le compte créé, basculez d&apos;un espace à l&apos;autre depuis le sélecteur de
        compte en haut de page. Vos deux activités restent séparées :{" "}
        <Link href="/dashboard/account" className="text-primary hover:underline">
          gérer mes comptes
        </Link>
        .
      </p>
    </div>
  );
}
