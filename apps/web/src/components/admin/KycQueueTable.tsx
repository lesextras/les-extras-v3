"use client";

import { useMemo, useState, useTransition } from "react";
import { Eye, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { reviewUserDocument, type AdminUserStatus } from "@/app/actions/admin";
import { DataTableShell } from "@/components/data/DataTableShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import {
  getDocumentReviewStatusLabel,
  getDocumentStatusBadgeVariant,
  type PendingKycDocumentRow,
} from "@/lib/kyc-documents";

type KycQueueTableProps = {
  initialDocuments: PendingKycDocumentRow[];
};

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function getUserStatusVariant(status: AdminUserStatus) {
  if (status === "VERIFIED") return "success" as const;
  if (status === "BANNED") return "error" as const;
  return "warning" as const;
}

export function KycQueueTable({ initialDocuments }: KycQueueTableProps) {
  const [documents, setDocuments] = useState(initialDocuments);
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  const filteredDocuments = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return documents;
    }

    return documents.filter((document) =>
      `${document.user.name} ${document.user.email} ${document.label}`
        .toLowerCase()
        .includes(normalizedSearch),
    );
  }, [documents, search]);

  const handleReview = (documentId: string, status: "APPROVED" | "REJECTED", reviewReason?: string) => {
    startTransition(async () => {
      try {
        await reviewUserDocument(documentId, status, reviewReason);
        setDocuments((current) => current.filter((document) => document.id !== documentId));
        toast.success(status === "APPROVED" ? "Document approuvé." : "Document rejeté.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Action impossible.");
      }
    });
  };

  const handleReject = (documentId: string) => {
    const reason = window.prompt("Motif du rejet");
    if (!reason?.trim()) {
      toast.error("Un motif de rejet est requis.");
      return;
    }

    handleReview(documentId, "REJECTED", reason.trim());
  };

  return (
    <DataTableShell
      columns={["Freelance", "Document", "Fichier", "Déposé", "Statut", "Actions"]}
      emptyTitle="Aucun document en attente"
      emptyDescription="La file KYC du Desk est vide pour le moment."
      filterSlot={
        <input
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground md:max-w-sm"
          placeholder="Rechercher un freelance ou un document…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      }
    >
      {filteredDocuments.map((document) => (
        <TableRow key={document.id}>
          <TableCell className="max-w-[220px]">
            <p className="font-medium text-foreground">{document.user.name}</p>
            <p className="truncate text-xs text-muted-foreground">{document.user.email}</p>
            <Badge className="mt-2" variant={getUserStatusVariant(document.user.status)}>
              {document.user.status}
            </Badge>
          </TableCell>
          <TableCell className="font-medium text-foreground">{document.label}</TableCell>
          <TableCell className="max-w-[220px]">
            <p className="truncate text-sm text-foreground">{document.filename}</p>
          </TableCell>
          <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
            {dateFormatter.format(new Date(document.createdAt))}
          </TableCell>
          <TableCell>
            <Badge variant={getDocumentStatusBadgeVariant(document.status)}>
              {getDocumentReviewStatusLabel(document.status)}
            </Badge>
          </TableCell>
          <TableCell className="min-w-[250px]">
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href={`/api/admin/documents/${document.id}`} target="_blank" rel="noreferrer">
                  <Eye className="h-4 w-4" />
                  Ouvrir
                </a>
              </Button>
              <Button
                variant="teal-soft"
                size="sm"
                disabled={isPending}
                onClick={() => handleReview(document.id, "APPROVED")}
              >
                <ShieldCheck className="h-4 w-4" />
                Approuver
              </Button>
              <Button
                variant="danger-soft"
                size="sm"
                disabled={isPending}
                onClick={() => handleReject(document.id)}
              >
                Rejeter
              </Button>
            </div>
          </TableCell>
        </TableRow>
      ))}
    </DataTableShell>
  );
}
