// Back-office ADMIN — catégories : taxonomie éditable (CRUD).
import type { Metadata } from "next";
import { requireAdmin, fetchApi } from "../../../_shared/server";
import { PageHeader, ErrorState } from "../../../_shared/ui";
import { AdminCategoriesManager, type AdminCategory } from "../../../_shared/AdminCategoriesManager";

export const metadata: Metadata = { title: "Catégories · Administration" };

export default async function AdminCategoriesPage() {
  const session = await requireAdmin();
  const res = await fetchApi<AdminCategory[]>(session, "/admin/categories");
  const categories = Array.isArray(res.data) ? res.data : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Catégories"
        subtitle="Gérez la taxonomie des articles, missions et ateliers."
      />
      {res.error ? (
        <ErrorState retryHref="/admin/categories" />
      ) : (
        <AdminCategoriesManager categories={categories} />
      )}
    </div>
  );
}
