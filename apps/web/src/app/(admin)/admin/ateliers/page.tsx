// Back-office ADMIN — ateliers : GET /admin/services + modération.
import type { Metadata } from "next";
import { requireAdmin, fetchApi } from "../../../_shared/server";
import { PageHeader, ErrorState } from "../../../_shared/ui";
import { AdminServicesTable } from "../../../_shared/AdminServicesTable";
import type { Service } from "../../../_shared/types";

export const metadata: Metadata = { title: "Ateliers · Administration" };

export default async function AdminServicesPage() {
  const session = await requireAdmin();
  const accountId = session.account?.id;

  const res = await fetchApi<Service[]>(session, "/admin/services");
  const services = Array.isArray(res.data) ? res.data : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ateliers"
        subtitle="Le catalogue complet des ateliers et interventions, avec modération."
      />
      {res.error ? (
        <ErrorState retryHref="/admin/ateliers" />
      ) : (
        <AdminServicesTable services={services} accountId={accountId} />
      )}
    </div>
  );
}
