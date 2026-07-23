// Espace Formation (dashboard) — role-aware.
// ESTABLISHMENT : formations internes (parcours B) + sollicitation d'un salarié.
// FREELANCE : programmes dont il est propriétaire / sessions animées.
import Link from "next/link";
import type { Metadata } from "next";
import { requireSession, fetchApi } from "../../../_shared/server";
import { PageHeader, EmptyState } from "../../../_shared/ui";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormationInterneModal } from "../../../_shared/FormationInterneModal";

export const metadata: Metadata = { title: "Formations · Les Extras" };

interface FormationRow {
  id: string;
  title: string;
  type: "CERTIFIANTE" | "INTERNE";
  status: string;
  durationHours?: number | null;
  categoryRef?: { title?: string | null } | null;
  _count?: { sessions?: number };
}

export default async function DashboardFormationsPage() {
  const session = await requireSession();
  const isEstablishment = session.account.type === "ESTABLISHMENT";
  const res = await fetchApi<FormationRow[]>(session, "/formations");
  const formations = Array.isArray(res.data) ? res.data : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEstablishment ? "Formation interne" : "Mes formations"}
        subtitle={
          isEstablishment
            ? "Faites monter vos équipes en compétences via un salarié référent — sans Qualiopi."
            : "Programmes que vous gérez et sessions que vous animez."
        }
        actions={
          isEstablishment ? (
            <FormationInterneModal accountId={session.account.id} />
          ) : (
            <Button asChild variant="outline">
              <Link href="/marketplace/formations">Voir le catalogue</Link>
            </Button>
          )
        }
      />

      {formations.length === 0 ? (
        <EmptyState
          title={isEstablishment ? "Aucune formation interne" : "Aucune formation"}
          description={
            isEstablishment
              ? "Créez votre première formation interne et désignez un salarié formateur."
              : "Vous n’animez encore aucune session."
          }
          action={
            isEstablishment ? <FormationInterneModal accountId={session.account.id} /> : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {formations.map((f) => (
            <Card key={f.id} className="h-full">
              <CardContent className="space-y-3 p-5">
                <div className="flex flex-wrap gap-2">
                  <Badge variant={f.type === "INTERNE" ? "outline" : "soft"}>
                    {f.type === "INTERNE" ? "Interne" : "Certifiante"}
                  </Badge>
                  <Badge variant="outline">{f.status === "PUBLISHED" ? "Publiée" : "Brouillon"}</Badge>
                </div>
                <h3 className="font-semibold text-foreground">{f.title}</h3>
                <p className="text-xs text-muted-foreground">
                  {f.durationHours ? `${f.durationHours} h · ` : ""}
                  {f._count?.sessions ?? 0} session(s)
                </p>
                <Button asChild variant="link" size="sm" className="px-0">
                  <Link href={`/marketplace/formations/${f.id}`}>Ouvrir la fiche →</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
