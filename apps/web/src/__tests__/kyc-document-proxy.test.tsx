import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AdminKycDocumentsPanel } from "@/components/admin/AdminKycDocumentsPanel";
import { KycQueueTable } from "@/components/admin/KycQueueTable";
import type { KycSummary, PendingKycDocumentRow, UserKycDocument } from "@/lib/kyc-documents";

vi.mock("@/app/actions/admin", () => ({
  reviewUserDocument: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const document: UserKycDocument = {
  id: "doc-1",
  type: "CV",
  label: "CV",
  filename: "cv.pdf",
  mimeType: "application/pdf",
  sizeBytes: 1200,
  status: "PENDING",
  reviewReason: null,
  createdAt: "2026-04-20T10:00:00.000Z",
  reviewedAt: null,
  reviewedByName: null,
};

const kyc: KycSummary = {
  globalStatus: "PENDING",
  requiredDocuments: 6,
  uploadedDocuments: 1,
  approvedDocuments: 0,
  pendingDocuments: 1,
  rejectedDocuments: 0,
  missingDocuments: [],
};

const pendingDocument: PendingKycDocumentRow = {
  ...document,
  user: {
    id: "free-1",
    name: "Aya Benali",
    email: "aya@example.com",
    status: "PENDING",
  },
};

describe("KYC document access", () => {
  it("ouvre les documents depuis le proxy admin Next dans la fiche utilisateur", () => {
    render(
      <AdminKycDocumentsPanel
        documents={[document]}
        kyc={kyc}
        onRefresh={() => undefined}
      />,
    );

    expect(screen.getByRole("link", { name: /ouvrir/i })).toHaveAttribute(
      "href",
      "/api/admin/documents/doc-1",
    );
  });

  it("ouvre les documents depuis le proxy admin Next dans la file KYC", () => {
    render(<KycQueueTable initialDocuments={[pendingDocument]} />);

    expect(screen.getByRole("link", { name: /ouvrir/i })).toHaveAttribute(
      "href",
      "/api/admin/documents/doc-1",
    );
  });
});
