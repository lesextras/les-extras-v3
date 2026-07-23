// Back-office ADMIN — Conformité Qualiopi (7 critères / 32 indicateurs).
import type { Metadata } from "next";
import { requireAdmin, fetchApi } from "../../../_shared/server";
import { PageHeader, ErrorState } from "../../../_shared/ui";
import { QualiopiMatrix } from "../../../_shared/QualiopiMatrix";

export const metadata: Metadata = { title: "Conformité Qualiopi · Administration" };

interface Conformite {
  total: number;
  summary: Record<string, number>;
  criteria: unknown[];
}

export default async function AdminQualiopiPage() {
  const session = await requireAdmin();
  const res = await fetchApi<Conformite>(session, "/admin/qualiopi");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Conformité Qualiopi"
        subtitle="Pilotez les 7 critères et 32 indicateurs du Référentiel National Qualité. Déposez et validez vos preuves avant l'audit de surveillance."
      />
      {res.error || !res.data ? (
        <ErrorState retryHref="/admin/qualiopi" />
      ) : (
        <QualiopiMatrix data={res.data as never} />
      )}
    </div>
  );
}
