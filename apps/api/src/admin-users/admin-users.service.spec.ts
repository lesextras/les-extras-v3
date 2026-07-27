import { BadRequestException, NotFoundException } from "@nestjs/common";
import { UserRole, UserStatus } from "@prisma/client";
import { AdminUsersService } from "./admin-users.service";
import type { DocumentReviewStatusValue, FreelanceKycDocumentType } from "../users/kyc-documents";

describe("AdminUsersService", () => {
  const prisma = {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    document: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    adminActionLog: {
      create: jest.fn(),
    },
    $transaction: jest.fn((queries: Array<Promise<unknown>>) => Promise.all(queries)),
  } as any;

  let service: AdminUsersService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AdminUsersService(prisma);
  });

  it("valide un utilisateur et journalise l'action", async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      status: UserStatus.PENDING,
    });
    prisma.user.update.mockResolvedValue({});
    prisma.adminActionLog.create.mockResolvedValue({});

    await expect(service.verifyUser("user-1", "admin-1")).resolves.toEqual({ ok: true });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { status: UserStatus.VERIFIED },
    });
    expect(prisma.adminActionLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        adminId: "admin-1",
        entityType: "USER",
        entityId: "user-1",
        action: "USER_VERIFY",
        meta: {
          previousStatus: UserStatus.PENDING,
          nextStatus: UserStatus.VERIFIED,
        },
      }),
    });
  });

  it("bannit un utilisateur et journalise l'action", async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      status: UserStatus.VERIFIED,
    });
    prisma.user.update.mockResolvedValue({});
    prisma.adminActionLog.create.mockResolvedValue({});

    await expect(service.banUser("user-1", "admin-1")).resolves.toEqual({ ok: true });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { status: UserStatus.BANNED },
    });
    expect(prisma.adminActionLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        adminId: "admin-1",
        entityType: "USER",
        entityId: "user-1",
        action: "USER_BAN",
        meta: {
          previousStatus: UserStatus.VERIFIED,
          nextStatus: UserStatus.BANNED,
        },
      }),
    });
  });

  it("interdit à un admin de bannir son propre compte", async () => {
    await expect(service.banUser("admin-1", "admin-1")).rejects.toThrow(BadRequestException);
  });

  it("lève NotFoundException si l'utilisateur à valider n'existe pas", async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(service.verifyUser("missing", "admin-1")).rejects.toThrow(NotFoundException);
  });

  it("expose le statut KYC global dans la liste utilisateurs admin", async () => {
    prisma.user.findMany.mockResolvedValue([
      {
        id: "free-1",
        email: "free@test.fr",
        role: UserRole.FREELANCE,
        status: UserStatus.PENDING,
        createdAt: new Date("2026-04-20T08:00:00.000Z"),
        profile: { firstName: "Nora", lastName: "Diallo" },
        documents: [
          { type: "CV", status: "APPROVED" },
          { type: "DIPLOMA", status: "PENDING" },
        ],
      },
      {
        id: "est-1",
        email: "est@test.fr",
        role: UserRole.ESTABLISHMENT,
        status: UserStatus.VERIFIED,
        createdAt: new Date("2026-04-20T08:00:00.000Z"),
        profile: { firstName: "Luc", lastName: "Martin" },
        documents: [],
      },
    ]);

    const result = await service.listUsers({});

    expect(result[0]!.kyc).toEqual(
      expect.objectContaining({
        globalStatus: "MISSING",
        uploadedDocuments: 2,
        pendingDocuments: 1,
      }),
    );
    expect(result[1]!.kyc).toBeNull();
  });

  it("retourne les documents KYC en attente", async () => {
    prisma.document.findMany.mockResolvedValue([
      {
        id: "doc-1",
        type: "CV" as FreelanceKycDocumentType,
        filename: "cv.pdf",
        mimeType: "application/pdf",
        sizeBytes: 1200,
        status: "PENDING" as DocumentReviewStatusValue,
        updatedAt: new Date("2026-04-20T08:00:00.000Z"),
        user: {
          id: "free-1",
          email: "free@test.fr",
          status: UserStatus.PENDING,
          profile: {
            firstName: "Nora",
            lastName: "Diallo",
          },
        },
      },
    ]);

    const result = await service.listPendingKycDocuments();

    expect(prisma.document.findMany).toHaveBeenCalledWith({
      where: expect.objectContaining({
        status: "PENDING",
        serviceId: null,
        user: { role: UserRole.FREELANCE },
      }),
      orderBy: { updatedAt: "asc" },
      select: expect.any(Object),
    });
    expect(result[0]).toEqual(
      expect.objectContaining({
        id: "doc-1",
        label: "CV",
        user: expect.objectContaining({
          id: "free-1",
          name: "Nora Diallo",
        }),
      }),
    );
  });

  it("journalise l'approbation d'un document KYC", async () => {
    prisma.document.findFirst.mockResolvedValue({
      id: "doc-1",
      userId: "free-1",
      type: "RIB" as FreelanceKycDocumentType,
      status: "PENDING" as DocumentReviewStatusValue,
    });
    prisma.document.update.mockResolvedValue({});
    prisma.adminActionLog.create.mockResolvedValue({});

    await expect(
      service.reviewUserDocument("doc-1", "admin-1", {
        status: "APPROVED" as DocumentReviewStatusValue,
      }),
    ).resolves.toEqual({ ok: true });

    expect(prisma.document.update).toHaveBeenCalledWith({
      where: { id: "doc-1" },
      data: expect.objectContaining({
        status: "APPROVED",
        reviewedById: "admin-1",
        reviewReason: null,
      }),
    });
    expect(prisma.adminActionLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        adminId: "admin-1",
        entityType: "DOCUMENT",
        entityId: "doc-1",
        action: "DOCUMENT_APPROVE",
      }),
    });
  });

  it("exige un motif lors d'un rejet de document", async () => {
    await expect(
      service.reviewUserDocument("doc-1", "admin-1", {
        status: "REJECTED",
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
