export const DOCUMENT_REVIEW_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;
export type DocumentReviewStatusValue = (typeof DOCUMENT_REVIEW_STATUSES)[number];

export const FREELANCE_KYC_DOCUMENT_TYPES = [
  "CV",
  "DIPLOMA",
  "AUTO_ENTREPRENEUR_CERTIFICATE",
  "DRIVER_LICENSE",
  "CRIMINAL_RECORD",
  "RIB",
] as const;

export type FreelanceKycDocumentType = (typeof FREELANCE_KYC_DOCUMENT_TYPES)[number];
export type KycGlobalStatus = "MISSING" | DocumentReviewStatusValue;

export type KycSummary = {
  globalStatus: KycGlobalStatus;
  requiredDocuments: number;
  uploadedDocuments: number;
  approvedDocuments: number;
  pendingDocuments: number;
  rejectedDocuments: number;
  missingDocuments: Array<{
    type: FreelanceKycDocumentType;
    label: string;
  }>;
};

const KYC_LABELS: Record<FreelanceKycDocumentType, string> = {
  CV: "CV",
  DIPLOMA: "Diplôme",
  AUTO_ENTREPRENEUR_CERTIFICATE: "Attestation auto-entrepreneur",
  DRIVER_LICENSE: "Permis de conduire",
  CRIMINAL_RECORD: "Casier judiciaire",
  RIB: "RIB",
};

export function isFreelanceKycDocumentType(value: string): value is FreelanceKycDocumentType {
  return FREELANCE_KYC_DOCUMENT_TYPES.includes(value as FreelanceKycDocumentType);
}

export function getFreelanceKycDocumentLabel(type: FreelanceKycDocumentType): string {
  return KYC_LABELS[type];
}

export function buildFreelanceKycSummary(
  documents: Array<{ type: FreelanceKycDocumentType; status: DocumentReviewStatusValue }>,
): KycSummary {
  const byType = new Map<FreelanceKycDocumentType, DocumentReviewStatusValue>();

  for (const document of documents) {
    byType.set(document.type, document.status);
  }

  const missingDocuments = FREELANCE_KYC_DOCUMENT_TYPES.filter((type) => !byType.has(type)).map(
    (type) => ({
      type,
      label: getFreelanceKycDocumentLabel(type),
    }),
  );

  const statuses = [...byType.values()];
  const approvedDocuments = statuses.filter((status) => status === "APPROVED").length;
  const pendingDocuments = statuses.filter((status) => status === "PENDING").length;
  const rejectedDocuments = statuses.filter((status) => status === "REJECTED").length;

  let globalStatus: KycGlobalStatus;
  if (rejectedDocuments > 0) {
    globalStatus = "REJECTED";
  } else if (missingDocuments.length > 0) {
    globalStatus = "MISSING";
  } else if (pendingDocuments > 0) {
    globalStatus = "PENDING";
  } else {
    globalStatus = "APPROVED";
  }

  return {
    globalStatus,
    requiredDocuments: FREELANCE_KYC_DOCUMENT_TYPES.length,
    uploadedDocuments: byType.size,
    approvedDocuments,
    pendingDocuments,
    rejectedDocuments,
    missingDocuments,
  };
}
