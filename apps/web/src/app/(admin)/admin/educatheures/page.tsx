// Back-office ADMIN — Éducat'heures : ateliers à visée éducative (catégorie Formation).
import type { Metadata } from "next";
import { requireAdmin, fetchApi } from "../../../_shared/server";
import { PageHeader, ErrorState } from "../../../_shared/ui";
import { AdminServicesTable } from "../../../_shared/AdminServicesTable";
import type { Service } from "../../../_shared/types";

export const metadata: Metadata = { title: "Éducat'heures · Administration" };

export default async function AdminEducatheuresPage() {
  const session = await requireAdmin();
  const accountId = session.account?.id;
  const res = await fetchApi<Service[]>(session, "/admin/services");
  const all = Array.isArray(res.data) ? res.data : [];
  // Éducat'heures ≈ interventions éducatives / de formation.
  const educatheures = all.filter((s) => s.category === "FORMATION" || s.category === "ATELIER");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Éducat’heures"
        subtitle="Interventions éducatives et de formation proposées sur la plateforme."
      />
      {res.error ? (
        <ErrorState retryHref="/admin/educatheures" />
      ) : (
        <AdminServicesTable services={educatheures} accountId={accountId} />
      )}
    </div>
  );
}
