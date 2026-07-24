// Back-office ADMIN — demandes de contact (formulaire public). GET /admin/contacts.
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
import { formatDate } from "../../../_shared/format";
import { ContactStatusButton } from "../../../_shared/ContactStatusButton";

export const metadata: Metadata = { title: "Demandes de contact · Administration" };

interface ContactRequest {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  type?: string | null;
  content: string;
  status: string;
  createdAt: string;
}

export default async function AdminContactsPage() {
  const session = await requireAdmin();
  const res = await fetchApi<{ items: ContactRequest[]; newCount: number }>(session, "/admin/contacts");
  const items = res.data?.items ?? [];
  const newCount = res.data?.newCount ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Demandes de contact"
        subtitle={`Messages reçus via le formulaire public${newCount ? ` — ${newCount} en attente` : ""}.`}
      />
      {res.error ? (
        <ErrorState retryHref="/admin/contacts" />
      ) : items.length === 0 ? (
        <EmptyState title="Aucune demande" description="Aucun message n’a encore été reçu via le formulaire de contact." />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Sujet</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {formatDate(c.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-foreground">{c.name}</div>
                        <div className="text-xs text-muted-foreground">
                          <a href={`mailto:${c.email}`} className="hover:underline">
                            {c.email}
                          </a>
                          {c.phone ? ` · ${c.phone}` : ""}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{c.type ?? "—"}</TableCell>
                      <TableCell className="max-w-md">
                        <p className="whitespace-pre-wrap text-sm text-muted-foreground">{c.content}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant={c.status === "HANDLED" ? "secondary" : "default"}>
                          {c.status === "HANDLED" ? "Traité" : "Nouveau"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <ContactStatusButton id={c.id} status={c.status} />
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
