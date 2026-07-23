// Back-office ADMIN — articles : contenu / actualités (CRUD).
import type { Metadata } from "next";
import { requireAdmin, fetchApi } from "../../../_shared/server";
import { PageHeader, ErrorState } from "../../../_shared/ui";
import { AdminArticlesManager, type AdminArticle } from "../../../_shared/AdminArticlesManager";

export const metadata: Metadata = { title: "Articles · Administration" };

interface CategoryLite { id: string; title: string }

export default async function AdminArticlesPage() {
  const session = await requireAdmin();
  const [articlesRes, categoriesRes] = await Promise.all([
    fetchApi<AdminArticle[]>(session, "/admin/articles"),
    fetchApi<CategoryLite[]>(session, "/admin/categories"),
  ]);
  const articles = Array.isArray(articlesRes.data) ? articlesRes.data : [];
  const categories = Array.isArray(categoriesRes.data)
    ? categoriesRes.data.map((c) => ({ id: c.id, title: c.title }))
    : [];

  return (
    <div className="space-y-6">
      <PageHeader title="Articles" subtitle="Publiez et gérez les actualités du site." />
      {articlesRes.error ? (
        <ErrorState retryHref="/admin/articles" />
      ) : (
        <AdminArticlesManager articles={articles} categories={categories} />
      )}
    </div>
  );
}
