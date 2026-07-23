// Back-office ADMIN — missions : GET /admin/missions + modération.
import type { Metadata } from "next";
import { requireAdmin, fetchApi } from "../../../_shared/server";
import { PageHeader, ErrorState } from "../../../_shared/ui";
import { AdminMissionsTable } from "../../../_shared/AdminMissionsTable";
import type { Mission } from "../../../_shared/types";

export const metadata: Metadata = { title: "Missions · Administration" };

export default async function AdminMissionsPage() {
  const session = await requireAdmin();
  const accountId = session.account?.id;

  const res = await fetchApi<Mission[]>(session, "/admin/missions");
  const missions = Array.isArray(res.data) ? res.data : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Missions"
        subtitle="Toutes les missions de renfort de la plateforme, avec modération."
      />
      {res.error ? (
        <ErrorState retryHref="/admin/missions" />
      ) : (
        <AdminMissionsTable missions={missions} accountId={accountId} />
      )}
    </div>
  );
}
