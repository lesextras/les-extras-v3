// Back-office ADMIN — Journal d'audit : traçabilité des actions sensibles.
// GET /admin/audit (liste paginée, la plus récente en premier).
import type { Metadata } from "next";
import { requireAdmin, fetchApi } from "../../../_shared/server";
import { PageHeader, ErrorState, EmptyState } from "../../../_shared/ui";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "../../../_shared/format";

export const metadata: Metadata = { title: "Journal d’audit · Administration" };

interface AuditActor {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
}

interface AuditAccount {
  id: string;
  name: string;
  type?: string | null;
}

interface AuditEntry {
  id: string;
  createdAt: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  summary: string;
  ip?: string | null;
  actor?: AuditActor | null;
  account?: AuditAccount | null;
}

interface AuditPage {
  items: AuditEntry[];
  total: number;
  page: number;
  perPage: number;
  pages: number;
}

/** Nom affichable de l'auteur, ou « Système » pour une action automatique. */
function actorLabel(actor?: AuditActor | null): string {
  if (!actor) return "Système";
  const name = [actor.firstName, actor.lastName].filter(Boolean).join(" ").trim();
  return name || actor.email;
}

export default async function AdminJournalPage() {
  const session = await requireAdmin();
  const res = await fetchApi<AuditPage>(session, "/admin/audit?perPage=100");
  const entries = res.data?.items ?? [];
  const total = res.data?.total ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Journal d’audit"
        subtitle={
          total
            ? `Traçabilité des actions sensibles — ${total} entrée${total > 1 ? "s" : ""} enregistrée${total > 1 ? "s" : ""}.`
            : "Traçabilité des actions sensibles réalisées sur la plateforme (validation d’heures, documents, modération)."
        }
      />
      {res.error ? (
        <ErrorState retryHref="/admin/journal" />
      ) : entries.length === 0 ? (
        <EmptyState
          title="Aucune action enregistrée"
          description="Le journal se remplit automatiquement dès qu’une action sensible est réalisée sur la plateforme."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Auteur</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Résumé</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {formatDateTime(entry.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-foreground">{actorLabel(entry.actor)}</div>
                        {entry.account?.name ? (
                          <div className="text-xs text-muted-foreground">{entry.account.name}</div>
                        ) : null}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge variant="secondary" className="font-mono text-[11px]">
                          {entry.action}
                        </Badge>
                        <div className="mt-1 text-xs text-muted-foreground">{entry.entityType}</div>
                      </TableCell>
                      <TableCell className="max-w-xl">
                        <p className="text-sm text-foreground">{entry.summary}</p>
                        {entry.ip ? (
                          <p className="mt-1 text-xs text-muted-foreground">IP : {entry.ip}</p>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
