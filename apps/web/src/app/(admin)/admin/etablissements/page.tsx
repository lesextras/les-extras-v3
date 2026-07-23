// Back-office ADMIN — comptes / organisations : liste + édition des fiches.
import type { Metadata } from "next";
import { requireAdmin, fetchApi } from "../../../_shared/server";
import { PageHeader, ErrorState } from "../../../_shared/ui";
import { AdminAccountsTable, type AdminAccount } from "../../../_shared/AdminAccountsTable";

export const metadata: Metadata = { title: "Comptes & sous-comptes · Administration" };

export default async function AdminAccountsPage() {
  const session = await requireAdmin();
  const res = await fetchApi<AdminAccount[]>(session, "/admin/accounts");
  const accounts = Array.isArray(res.data) ? res.data : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Comptes & sous-comptes"
        subtitle="Tous les comptes (établissements et freelances) avec, dépliés, les sous-comptes rattachés et leurs rôles."
      />
      {res.error ? (
        <ErrorState retryHref="/admin/etablissements" />
      ) : (
        <AdminAccountsTable accounts={accounts} />
      )}
    </div>
  );
}
