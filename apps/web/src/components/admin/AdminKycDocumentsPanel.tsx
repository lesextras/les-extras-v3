"use client";

import { useTransition } from "react";
import { Eye, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { reviewUserDocument } from "@/app/actions/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getDocumentReviewStatusLabel,
  getDocumentStatusBadgeVariant,
  getKycGlobalStatusLabel,
  getKycStatusBadgeVariant,
  type KycSummary,
  type UserKycDocument,
} from "@/lib/kyc-documents";

type AdminKycDocumentsPanelProps = {
  documents: UserKycDocument[];
  kyc: KycSummary;
  onRefresh: () => Promise<void> | void;
};

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export function AdminKycDocumentsPanel({
  documents,
  kyc,
  onRefresh,
}: AdminKycDocumentsPanelProps) {
  const [isPending, startTransition] = useTransition();

  const handleApprove = (documentId: string) => {
    startTransition(async () => {
      try {
        await reviewUserDocument(documentId, "APPROVED");
        toast.success("Document approuvé.");
        await onRefresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Validation impossible.");
      }
    });
  };

  const handleReject = (document: UserKycDocument) => {
    const reason = window.prompt("Motif du rejet", document.reviewReason ?? "");
    if (!reason?.trim()) {
      toast.error("Un motif de rejet est requis.");
      return;
    }

    startTransition(async () => {
      try {
        await reviewUserDocument(document.id, "REJECTED", reason.trim());
        toast.success("Document rejeté.");
        await onRefresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Rejet impossible.");
      }
    });
  };

  return (
    <div className="space-y-3 rounded-md border border-border/50 bg-muted/30 px-3 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">Contrôle KYC</p>
          <p className="text-xs text-muted-foreground">
            Vérification des documents sensibles du freelance.
          </p>
        </div>
        <Badge variant={getKycStatusBadgeVariant(kyc.globalStatus)}>
          {getKycGlobalStatusLabel(kyc.globalStatus)}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-md border border-border/50 bg-background/70 px-3 py-2">
          <p className="text-xs text-muted-foreground">Déposés</p>
          <p className="font-medium text-foreground">{kyc.uploadedDocuments}/{kyc.requiredDocuments}</p>
        </div>
        <div className="rounded-md border border-border/50 bg-background/70 px-3 py-2">
          <p className="text-xs text-muted-foreground">En attente</p>
          <p className="font-medium text-foreground">{kyc.pendingDocuments}</p>
        </div>
      </div>

      {kyc.missingDocuments.length > 0 && (
        <div className="rounded-md border border-border/50 bg-background/70 px-3 py-3 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Pièces manquantes :</span>{" "}
          {kyc.missingDocuments.map((document) => document.label).join(", ")}
        </div>
      )}

      <div className="space-y-2">
        {documents.length > 0 ? (
          documents.map((document) => (
            <div
              key={document.id}
              className="rounded-md border border-border/50 bg-background/70 px-3 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">{document.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {document.filename} · {dateFormatter.format(new Date(document.createdAt))}
                  </p>
                  {document.reviewedByName && document.reviewedAt && (
                    <p className="text-[11px] text-muted-foreground">
                      Revu par {document.reviewedByName} le{" "}
                      {dateFormatter.format(new Date(document.reviewedAt))}
                    </p>
                  )}
                </div>
                <Badge variant={getDocumentStatusBadgeVariant(document.status)}>
                  {getDocumentReviewStatusLabel(document.status)}
                </Badge>
              </div>

              {document.reviewReason && (
                <div className="mt-2 rounded-md border border-destructive/20 bg-destructive/5 px-2 py-2 text-xs text-destructive">
                  Motif : {document.reviewReason}
                </div>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="outline" size="sm" asChild>
                  <a href={`/api/admin/documents/${document.id}`} target="_blank" rel="noreferrer">
                    <Eye className="h-4 w-4" />
                    Ouvrir
                  </a>
                </Button>
                <Button
                  variant="teal-soft"
                  size="sm"
                  disabled={isPending || document.status === "APPROVED"}
                  onClick={() => handleApprove(document.id)}
                >
                  <ShieldCheck className="h-4 w-4" />
                  Approuver
                </Button>
                <Button
                  variant="danger-soft"
                  size="sm"
                  disabled={isPending}
                  onClick={() => handleReject(document)}
                >
                  Rejeter
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-md border border-border/50 bg-background/70 px-3 py-3 text-xs text-muted-foreground">
            Aucun document KYC transmis pour le moment.
          </div>
        )}
      </div>
    </div>
  );
}
