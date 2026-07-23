// Back-office ADMIN — Centre de formation : tous les programmes (certifiants + internes).
import type { Metadata } from "next";
import { requireAdmin, fetchApi } from "../../../_shared/server";
import { PageHeader, ErrorState, EmptyState } from "../../../_shared/ui";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Centre de formation · Administration" };

interface AdminFormation {
  id: string;
  title: string;
  type: "CERTIFIANTE" | "INTERNE";
  status: string;
  cpfEligible?: boolean;
  certifying?: boolean;
  durationHours?: number | null;
  ownerAccount?: { name?: string | null } | null;
  categoryRef?: { title?: string | null } | null;
  _count?: { sessions?: number };
}

export default async function AdminFormationsPage() {
  const session = await requireAdmin();
  const res = await fetchApi<AdminFormation[]>(session, "/admin/formations");
  const formations = Array.isArray(res.data) ? res.data : [];

  const certifiantes = formations.filter((f) => f.type === "CERTIFIANTE").length;
  const internes = formations.filter((f) => f.type === "INTERNE").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Centre de formation"
        subtitle="Programmes certifiants (Qualiopi) et formations internes des établissements."
      />

      {res.error ? (
        <ErrorState retryHref="/admin/formations" />
      ) : formations.length === 0 ? (
        <EmptyState
          title="Aucune formation"
          description="Les programmes créés par ADéPA et les formations internes apparaîtront ici."
        />
      ) : (
        <>
          <div className="flex gap-3 text-sm text-muted-foreground">
            <span>{formations.length} programme(s)</span>
            <span>· {certifiantes} certifiante(s)</span>
            <span>· {internes} interne(s)</span>
          </div>
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Programme</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Propriétaire</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3">Sessions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {formations.map((f) => (
                  <tr key={f.id}>
                    <td className="px-4 py-3 font-medium text-foreground">{f.title}</td>
                    <td className="px-4 py-3">
                      <Badge variant={f.type === "INTERNE" ? "outline" : "soft"}>
                        {f.type === "INTERNE" ? "Interne" : "Certifiante"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{f.ownerAccount?.name ?? "—"}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline">{f.status === "PUBLISHED" ? "Publiée" : f.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{f._count?.sessions ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
