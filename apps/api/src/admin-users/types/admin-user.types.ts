import { UserRole, UserStatus } from "@prisma/client";
import {
  type DocumentReviewStatusValue,
  type FreelanceKycDocumentType,
  type KycGlobalStatus,
} from "../../users/kyc-documents";

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  kyc: AdminUserKycSummary | null;
};

export type AdminUserKycDocument = {
  id: string;
  type: FreelanceKycDocumentType;
  label: string;
  filename: string;
  mimeType: string | null;
  sizeBytes: number | null;
  status: DocumentReviewStatusValue;
  reviewReason: string | null;
  createdAt: string;
  reviewedAt: string | null;
  reviewedByName: string | null;
};

export type AdminUserKycSummary = {
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

export type AdminUserProfileDetails = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  jobTitle: string | null;
  bio: string | null;
  avatar: string | null;
  kyc: AdminUserKycSummary;
  documents: AdminUserKycDocument[];
};

export type PendingKycDocumentRow = {
  id: string;
  type: FreelanceKycDocumentType;
  label: string;
  filename: string;
  mimeType: string | null;
  sizeBytes: number | null;
  status: DocumentReviewStatusValue;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    status: UserStatus;
  };
};
