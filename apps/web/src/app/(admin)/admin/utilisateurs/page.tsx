// Back-office ADMIN — utilisateurs : GET /admin/users + bannir/débannir.
import type { Metadata } from "next";
import { requireAdmin, fetchApi } from "../../../_shared/server";
import { PageHeader, ErrorState } from "../../../_shared/ui";
import { AdminUsersTable, type AdminUser } from "../../../_shared/AdminUsersTable";

export const metadata: Metadata = { title: "Utilisateurs · Administration" };

export default async function AdminUsersPage() {
  const session = await requireAdmin();
  const accountId = session.account?.id;

  const res = await fetchApi<AdminUser[]>(session, "/admin/users");
  const users = Array.isArray(res.data) ? res.data : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Utilisateurs"
        subtitle="Gérez les comptes, vérifiez les statuts et modérez les accès."
      />
      {res.error ? (
        <ErrorState retryHref="/admin/utilisateurs" />
      ) : (
        <AdminUsersTable users={users} accountId={accountId} />
      )}
    </div>
  );
}
