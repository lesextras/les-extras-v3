// Back-office ADMIN — un échange de la messagerie interne.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAdmin, fetchApi } from "../../../../_shared/server";
import { PageHeader } from "../../../../_shared/ui";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FilMessages,
  LIBELLE_STATUT,
  libelleCategorie,
  type FilAssistance,
} from "../../../../_shared/Assistance";
import { StatutAssistance } from "../../../../_shared/StatutAssistance";

export const metadata: Metadata = { title: "Messagerie interne · Administration" };

interface FilAdmin extends FilAssistance {
  account?: { id: string; name: string; type: string } | null;
  user?: { id: string; firstName?: string | null; lastName?: string | null; email: string } | null;
}

export default async function AdminFilAssistancePage({
  params: paramsPromesse,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await paramsPromesse;
  const session = await requireAdmin();
  const { data } = await fetchApi<FilAdmin>(session, `/admin/assistance/${id}`);
  if (!data) notFound();

  const nom =
    [data.user?.firstName, data.user?.lastName].filter(Boolean).join(" ") ||
    data.user?.email ||
    "Compte supprimé";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/admin/assistance"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Tous les échanges
      </Link>

      <PageHeader
        title={data.sujet}
        subtitle={`${nom}${data.user?.email ? ` · ${data.user.email}` : ""}${
          data.account?.name ? ` · ${data.account.name}` : ""
        } · ${libelleCategorie(data.categorie)}`}
      />

      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="outline">{LIBELLE_STATUT[data.statut] ?? data.statut}</Badge>
        <StatutAssistance id={id} statut={data.statut} />
      </div>

      <Card>
        <CardContent className="pt-6">
          <FilMessages
            fil={data}
            chemin={`/admin/assistance/${id}/messages`}
            cotePlateforme
          />
        </CardContent>
      </Card>
    </div>
  );
}
