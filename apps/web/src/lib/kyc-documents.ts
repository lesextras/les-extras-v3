export const FREELANCE_KYC_DOCUMENT_TYPES = [
  "CV",
  "DIPLOMA",
  "AUTO_ENTREPRENEUR_CERTIFICATE",
  "DRIVER_LICENSE",
  "CRIMINAL_RECORD",
  "RIB",
] as const;

export type FreelanceKycDocumentType = (typeof FREELANCE_KYC_DOCUMENT_TYPES)[number];
export type DocumentReviewStatus = "PENDING" | "APPROVED" | "REJECTED";
export type KycGlobalStatus = "MISSING" | DocumentReviewStatus;

export type KycMissingDocument = {
  type: FreelanceKycDocumentType;
  label: string;
};

export type UserKycDocument = {
  id: string;
  type: FreelanceKycDocumentType;
  label: string;
  filename: string;
  mimeType: string | null;
  sizeBytes: number | null;
  status: DocumentReviewStatus;
  reviewReason: string | null;
  createdAt: string;
  reviewedAt: string | null;
  reviewedByName?: string | null;
};

export type KycSummary = {
  globalStatus: KycGlobalStatus;
  requiredDocuments: number;
  uploadedDocuments: number;
  approvedDocuments: number;
  pendingDocuments: number;
  rejectedDocuments: number;
  missingDocuments: KycMissingDocument[];
};

export type UserKycDocumentsPayload = {
  documents: UserKycDocument[];
  summary: KycSummary;
};

export type PendingKycDocumentRow = {
  id: string;
  type: FreelanceKycDocumentType;
  label: string;
  filename: string;
  mimeType: string | null;
  sizeBytes: number | null;
  status: DocumentReviewStatus;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    status: "PENDING" | "VERIFIED" | "BANNED";
  };
};

const KYC_STATUS_LABELS: Record<KycGlobalStatus, string> = {
  MISSING: "Pièces manquantes",
  PENDING: "En vérification",
  APPROVED: "Validé",
  REJECTED: "À corriger",
};

const DOCUMENT_STATUS_LABELS: Record<DocumentReviewStatus, string> = {
  PENDING: "En attente",
  APPROVED: "Approuvé",
  REJECTED: "Refusé",
};

export function getKycGlobalStatusLabel(status: KycGlobalStatus): string {
  return KYC_STATUS_LABELS[status];
}

export function getDocumentReviewStatusLabel(status: DocumentReviewStatus): string {
  return DOCUMENT_STATUS_LABELS[status];
}

export function getKycStatusBadgeVariant(status: KycGlobalStatus) {
  if (status === "APPROVED") return "success" as const;
  if (status === "PENDING") return "warning" as const;
  if (status === "REJECTED") return "error" as const;
  return "quiet" as const;
}

export function getDocumentStatusBadgeVariant(status: DocumentReviewStatus) {
  if (status === "APPROVED") return "success" as const;
  if (status === "REJECTED") return "error" as const;
  return "warning" as const;
}
