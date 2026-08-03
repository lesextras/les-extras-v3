// Espace Formation (dashboard) — role-aware.
// ESTABLISHMENT : deux parcours mis en avant (catalogue certifiant ADéPA vs
//   formation interne via un salarié référent) + liste des formations internes.
// FREELANCE : programmes dont il est propriétaire / sessions qu'il anime.
import Link from "next/link";
import type { Metadata } from "next";
import { requireSession, fetchApi } from "../../../_shared/server";
import { PageHeader, EmptyState, ErrorState, SectionTitle } from "../../../_shared/ui";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormationInterneModal } from "../../../_shared/FormationInterneModal";

export const metadata: Metadata = { title: "Formations" };

interface FormationRow {
  id: string;
  title: string;
  type: "CERTIFIANTE" | "INTERNE";
  status: string;
  durationHours?: number | null;
  categoryRef?: { title?: string | null } | null;
  _count?: { sessions?: number };
}

function statusBadge(status: string) {
  switch (status) {
    case "PUBLISHED":
      return { label: "Publiée", variant: "success" as const };
    case "ARCHIVED":
    case "CLOSED":
      return { label: "Archivée", variant: "muted" as const };
    default:
      return { label: "Brouillon", variant: "outline" as const };
  }
}

export default async function DashboardFormationsPage() {
  const session = await requireSession();
  const isEstablishment = session.account.type === "ESTABLISHMENT";
  const res = await fetchApi<{ items: FormationRow[]; total: number }>(
    session,
    "/formations?perPage=100",
  );
  const formations = res.data?.items ?? [];

  return (
    <div className="space-y-8">
      <PageHeader
        title={isEstablishment ? "Formation" : "Mes formations"}
        subtitle={
          isEstablishment
            ? "Deux façons de faire monter vos équipes en compétences."
            : "Programmes que vous gérez et sessions que vous animez."
        }
        actions={
          !isEstablishment ? (
            <Button asChild variant="outline">
              <Link href="/marketplace/formations">Voir le catalogue</Link>
            </Button>
          ) : undefined
        }
      />

      {/* ESTABLISHMENT : les deux parcours, côte à côte. */}
      {isEstablishment ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card className="flex flex-col border-primary/25 bg-primary/5">
            <CardContent className="flex flex-1 flex-col gap-3 p-5">
              <div className="flex items-center gap-2">
                <Badge variant="soft">Certifiante</Badge>
                <Badge variant="success">Qualiopi · CPF</Badge>
              </div>
              <h3 className="font-semibold text-foreground">S’inscrire au catalogue ADéPA</h3>
              <p className="flex-1 text-sm text-muted-foreground">
                Faites former vos salariés par un formateur expert. Formations certifiantes,
                finançables (CPF, OPCO), certificat à la clé.
              </p>
              <Button asChild className="w-full sm:w-auto">
                <Link href="/marketplace/formations">Parcourir le catalogue</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="flex flex-col border-secondary/25 bg-secondary/5">
            <CardContent className="flex flex-1 flex-col gap-3 p-5">
              <div className="flex items-center gap-2">
                <Badge variant="outline">Interne</Badge>
                <Badge variant="muted">Sans Qualiopi</Badge>
              </div>
              <h3 className="font-semibold text-foreground">Former en interne</h3>
              <p className="flex-1 text-sm text-muted-foreground">
                Un salarié référent forme ses collègues. Parcours simplifié, attestation de fin
                de formation délivrée par votre établissement.
              </p>
              <FormationInterneModal
                accountId={session.account.id}
                trigger={<Button variant="secondary" className="w-full sm:w-auto">Créer une formation interne</Button>}
              />
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Liste des formations. */}
      <div className="space-y-4">
        <SectionTitle
          title={isEstablishment ? "Mes formations internes" : "Mes programmes & sessions"}
          action={
            isEstablishment && formations.length > 0 ? (
              <FormationInterneModal
                accountId={session.account.id}
                trigger={<Button size="sm" variant="outline">Nouvelle formation interne</Button>}
              />
            ) : undefined
          }
        />

        {res.error ? (
          <ErrorState retryHref="/dashboard/formations" />
        ) : formations.length === 0 ? (
          <EmptyState
            title={isEstablishment ? "Aucune formation interne" : "Aucune formation"}
            description={
              isEstablishment
                ? "Créez votre première formation interne et désignez un salarié formateur, ou inscrivez vos équipes au catalogue certifiant."
                : "Vous n’animez encore aucune session. Elles apparaîtront ici une fois programmées."
            }
            action={
              isEstablishment ? (
                <FormationInterneModal accountId={session.account.id} />
              ) : (
                <Button asChild variant="outline">
                  <Link href="/marketplace/formations">Voir le catalogue</Link>
                </Button>
              )
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {formations.map((f) => {
              const st = statusBadge(f.status);
              const sessions = f._count?.sessions ?? 0;
              return (
                <Card key={f.id} className="flex h-full flex-col">
                  <CardHeader className="space-y-2 pb-0">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={f.type === "INTERNE" ? "outline" : "soft"}>
                        {f.type === "INTERNE" ? "Interne" : "Certifiante"}
                      </Badge>
                      <Badge variant={st.variant}>{st.label}</Badge>
                    </div>
                    <h3 className="font-semibold text-foreground">{f.title}</h3>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col justify-between gap-3 pt-3">
                    <p className="text-xs text-muted-foreground">
                      {f.durationHours ? `${f.durationHours} h · ` : ""}
                      {sessions} session{sessions > 1 ? "s" : ""}
                      {f.categoryRef?.title ? ` · ${f.categoryRef.title}` : ""}
                    </p>
                    <Button asChild variant="link" size="sm" className="justify-start px-0">
                      <Link href={`/marketplace/formations/${f.id}`}>Ouvrir la fiche →</Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
