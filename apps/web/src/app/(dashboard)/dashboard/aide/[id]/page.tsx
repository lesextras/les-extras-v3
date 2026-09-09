// Un échange avec l'équipe.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireSession, fetchApi } from "../../../../_shared/server";
import { PageHeader } from "../../../../_shared/ui";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FilMessages,
  LIBELLE_STATUT,
  libelleCategorie,
  type FilAssistance,
} from "../../../../_shared/Assistance";

export const metadata: Metadata = { title: "Aide" };

export default async function FilAidePage({
  params: paramsPromesse,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await paramsPromesse;
  const session = await requireSession();
  const { data } = await fetchApi<FilAssistance>(session, `/assistance/${id}`);
  if (!data) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/dashboard/aide"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Tous mes échanges
      </Link>

      <PageHeader title={data.sujet} subtitle={libelleCategorie(data.categorie)} />

      <div>
        <Badge variant="outline">{LIBELLE_STATUT[data.statut] ?? data.statut}</Badge>
      </div>

      <Card>
        <CardContent className="pt-6">
          <FilMessages
            fil={data}
            chemin={`/assistance/${id}/messages`}
            accountId={session.account.id}
          />
        </CardContent>
      </Card>
    </div>
  );
}
