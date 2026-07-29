// Espace de rédaction : chaque compte et sous-compte publie ses actualités.
import type { Metadata } from "next";
import { requireSession, fetchApi } from "../../../_shared/server";
import { PageHeader } from "../../../_shared/ui";
import {
  ArticlesManager,
  type ArticleRow,
  type LinkedinStatus,
} from "../../../_shared/ArticlesManager";

export const metadata: Metadata = { title: "Mes publications" };

export default async function DashboardActualitesPage() {
  const session = await requireSession();
  const [liste, linkedin] = await Promise.all([
    fetchApi<ArticleRow[]>(session, "/articles"),
    fetchApi<LinkedinStatus>(session, "/articles/linkedin/status"),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mes publications"
        subtitle="Écrivez pour l’Édublog : une actualité pour raconter un temps fort, un article de fond pour partager une méthode. Tout est visible de tous et référencé sur Google."
      />
      <ArticlesManager
        initial={liste.data ?? []}
        linkedin={linkedin.data ?? { configured: false, connected: false }}
        accountId={session.account.id}
      />
    </div>
  );
}
