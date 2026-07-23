// Back-office ADMIN — Centre de formation : console de gestion des programmes
// certifiants (ADéPA, Qualiopi) et des formations internes.
import type { Metadata } from "next";
import { requireAdmin, fetchApi } from "../../../_shared/server";
import { PageHeader, ErrorState } from "../../../_shared/ui";
import {
  AdminFormationsManager,
  type AdminFormation,
} from "../../../_shared/AdminFormationsManager";

export const metadata: Metadata = { title: "Centre de formation · Administration" };

interface CategoryLite {
  id: string;
  title: string;
}

export default async function AdminFormationsPage() {
  const session = await requireAdmin();
  const [formationsRes, categoriesRes] = await Promise.all([
    fetchApi<AdminFormation[]>(session, "/admin/formations"),
    fetchApi<CategoryLite[]>(session, "/admin/categories"),
  ]);
  const formations = Array.isArray(formationsRes.data) ? formationsRes.data : [];
  const categories = Array.isArray(categoriesRes.data)
    ? categoriesRes.data.map((c) => ({ id: c.id, title: c.title }))
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Centre de formation"
        subtitle="Créez et pilotez les programmes certifiants (Qualiopi) et les formations internes."
      />
      {formationsRes.error ? (
        <ErrorState retryHref="/admin/formations" />
      ) : (
        <AdminFormationsManager formations={formations} categories={categories} />
      )}
    </div>
  );
}
