"use client";

import { useMemo, useState, useTransition } from "react";
import { Eye, FileUp, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { uploadFreelanceKycDocument } from "@/app/actions/profile";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GlassCard, GlassCardContent, GlassCardHeader } from "@/components/ui/glass-card";
import {
  FREELANCE_KYC_DOCUMENT_TYPES,
  getDocumentReviewStatusLabel,
  getDocumentStatusBadgeVariant,
  getKycGlobalStatusLabel,
  getKycStatusBadgeVariant,
  type FreelanceKycDocumentType,
  type KycSummary,
  type UserKycDocument,
} from "@/lib/kyc-documents";

type FreelanceKycDocumentsCardProps = {
  initialDocuments: UserKycDocument[];
  initialSummary: KycSummary;
};

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export function FreelanceKycDocumentsCard({
  initialDocuments,
  initialSummary,
}: FreelanceKycDocumentsCardProps) {
  const [documents, setDocuments] = useState<UserKycDocument[]>(initialDocuments);
  const [summary, setSummary] = useState<KycSummary>(initialSummary);
  const [selectedFiles, setSelectedFiles] = useState<Partial<Record<FreelanceKycDocumentType, File>>>({});
  const [inputVersions, setInputVersions] = useState<Partial<Record<FreelanceKycDocumentType, number>>>({});
  const [isPending, startTransition] = useTransition();
  const [uploadingType, setUploadingType] = useState<FreelanceKycDocumentType | null>(null);

  const documentsByType = useMemo(() => {
    return Object.fromEntries(documents.map((document) => [document.type, document])) as Partial<
      Record<FreelanceKycDocumentType, UserKycDocument>
    >;
  }, [documents]);

  const handleUpload = (type: FreelanceKycDocumentType) => {
    const file = selectedFiles[type];

    if (!file) {
      toast.error("Sélectionnez un fichier avant l'envoi.");
      return;
    }

    startTransition(async () => {
      setUploadingType(type);

      const formData = new FormData();
      formData.set("file", file);

      const result = await uploadFreelanceKycDocument(type, formData);

      if ("error" in result) {
        toast.error(result.error);
      } else {
        setDocuments(result.documents);
        setSummary(result.summary);
        setSelectedFiles((current) => ({ ...current, [type]: undefined }));
        setInputVersions((current) => ({ ...current, [type]: (current[type] ?? 0) + 1 }));
        toast.success("Document transmis au Desk.");
      }

      setUploadingType(null);
    });
  };

  return (
    <GlassCard animate delay={0.18}>
      <GlassCardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[hsl(var(--emerald-light))] text-[hsl(var(--emerald))]">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-semibold">Dossier KYC</h2>
                <p className="text-xs text-muted-foreground">
                  Déposez vos justificatifs pour validation par Le Desk.
                </p>
              </div>
            </div>
          </div>
          <Badge variant={getKycStatusBadgeVariant(summary.globalStatus)}>
            {getKycGlobalStatusLabel(summary.globalStatus)}
          </Badge>
        </div>
      </GlassCardHeader>

      <GlassCardContent className="space-y-4">
        <div className="grid gap-2 text-sm sm:grid-cols-4">
          <div className="rounded-md border border-border/50 bg-muted/40 px-3 py-2">
            <p className="text-xs text-muted-foreground">Demandés</p>
            <p className="font-medium">{summary.requiredDocuments}</p>
          </div>
          <div className="rounded-md border border-border/50 bg-muted/40 px-3 py-2">
            <p className="text-xs text-muted-foreground">Déposés</p>
            <p className="font-medium">{summary.uploadedDocuments}</p>
          </div>
          <div className="rounded-md border border-border/50 bg-muted/40 px-3 py-2">
            <p className="text-xs text-muted-foreground">Approuvés</p>
            <p className="font-medium">{summary.approvedDocuments}</p>
          </div>
          <div className="rounded-md border border-border/50 bg-muted/40 px-3 py-2">
            <p className="text-xs text-muted-foreground">À reprendre</p>
            <p className="font-medium">{summary.rejectedDocuments + summary.missingDocuments.length}</p>
          </div>
        </div>

        {summary.missingDocuments.length > 0 && (
          <div className="rounded-md border border-border/50 bg-muted/30 px-3 py-3">
            <p className="text-sm font-medium text-foreground">Pièces manquantes</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {summary.missingDocuments.map((document) => document.label).join(", ")}
            </p>
          </div>
        )}

        <div className="space-y-3">
          {FREELANCE_KYC_DOCUMENT_TYPES.map((type) => {
            const document = documentsByType[type];
            const isUploading = isPending && uploadingType === type;

            return (
              <div
                key={type}
                className="rounded-xl border border-border/60 bg-background/70 px-4 py-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      {document?.label ?? summary.missingDocuments.find((item) => item.type === type)?.label ?? type}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {document
                        ? `${document.filename} · ${dateFormatter.format(new Date(document.createdAt))}`
                        : "Aucun fichier transmis"}
                    </p>
                  </div>
                  <Badge variant={document ? getDocumentStatusBadgeVariant(document.status) : "quiet"}>
                    {document ? getDocumentReviewStatusLabel(document.status) : "Manquant"}
                  </Badge>
                </div>

                {document?.reviewReason && (
                  <div className="mt-3 rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                    Motif du rejet : {document.reviewReason}
                  </div>
                )}

                <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
                  <input
                    key={`${type}-${inputVersions[type] ?? 0}`}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-2 file:text-sm file:font-medium file:text-foreground"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      setSelectedFiles((current) => ({ ...current, [type]: file }));
                    }}
                  />
                  <div className="flex flex-wrap gap-2">
                    {document && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={`/api/documents/${document.id}`} target="_blank" rel="noreferrer">
                          <Eye className="h-4 w-4" />
                          Voir
                        </a>
                      </Button>
                    )}
                    <Button
                      variant="teal"
                      size="sm"
                      disabled={isUploading || !selectedFiles[type]}
                      onClick={() => handleUpload(type)}
                    >
                      <FileUp className="h-4 w-4" />
                      {document ? "Remplacer" : "Envoyer"}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </GlassCardContent>
    </GlassCard>
  );
}
