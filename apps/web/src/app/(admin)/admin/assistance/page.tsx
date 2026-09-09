// Back-office ADMIN — la messagerie interne. GET /admin/assistance.
//
// C'est la boîte de réception de l'association : les messages écrits DEPUIS un
// compte, rattachés à ce compte. À ne pas confondre avec « Demandes de
// contact », qui vient du formulaire public et n'a pas d'expéditeur connu.
import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin, fetchApi } from "../../../_shared/server";
import { PageHeader, ErrorState, EmptyState } from "../../../_shared/ui";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LIBELLE_STATUT, libelleCategorie, quand } from "../../../_shared/Assistance";

export const metadata: Metadata = { title: "Messagerie interne · Administration" };

interface FilAdmin {
  id: string;
  sujet: string;
  categorie: string;
  statut: string;
  dernierAt: string;
  nonLu?: boolean;
  account?: { id: string; name: string; type: string } | null;
  user?: { id: string; firstName?: string | null; lastName?: string | null; email: string } | null;
}

export default async function AdminAssistancePage() {
  const session = await requireAdmin();
  const { data, error } = await fetchApi<FilAdmin[]>(session, "/admin/assistance");
  const fils = data ?? [];
  const enAttente = fils.filter((f) => f.statut !== "RESOLU").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Messagerie interne"
        subtitle={`Les messages écrits depuis un compte${enAttente ? `, ${enAttente} en cours` : ""}.`}
      />

      {error ? (
        <ErrorState retryHref="/admin/assistance" />
      ) : fils.length === 0 ? (
        <EmptyState
          title="Aucun message"
          description="Personne n'a encore écrit depuis son espace."
        />
      ) : (
        <div className="space-y-3">
          {fils.map((f) => {
            const nom =
              [f.user?.firstName, f.user?.lastName].filter(Boolean).join(" ") ||
              f.user?.email ||
              "Compte supprimé";
            return (
              <Link key={f.id} href={`/admin/assistance/${f.id}`} className="block">
                <Card className="transition hover:border-primary/50">
                  <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{f.sujet}</p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {nom}
                        {f.account?.name ? ` · ${f.account.name}` : ""} ·{" "}
                        {libelleCategorie(f.categorie)} · {quand(f.dernierAt)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {f.nonLu ? <Badge>À lire</Badge> : null}
                      <Badge variant="outline">{LIBELLE_STATUT[f.statut] ?? f.statut}</Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
