// Back-office ADMIN — utilisateurs : CRUD complet (créer, éditer rôle/statut, bannir, supprimer).
import type { Metadata } from "next";
import { requireAdmin, fetchApi } from "../../../_shared/server";
import { PageHeader, ErrorState } from "../../../_shared/ui";
import { AdminUsersManager, type AdminUser } from "../../../_shared/AdminUsersManager";

export const metadata: Metadata = { title: "Utilisateurs · Administration" };

export default async function AdminUsersPage() {
  const session = await requireAdmin();
  const res = await fetchApi<AdminUser[]>(session, "/admin/users");
  const users = Array.isArray(res.data) ? res.data : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Utilisateurs"
        subtitle="Créez, éditez les rôles, modérez et supprimez les comptes."
      />
      {res.error ? (
        <ErrorState retryHref="/admin/utilisateurs" />
      ) : (
        <AdminUsersManager users={users} />
      )}
    </div>
  );
}
