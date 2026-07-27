import { BadRequestException, NotFoundException } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { CREDIT_PACKS, UsersService } from "./users.service";
import { CreditPackType } from "./dto/buy-credits.dto";
import type { DocumentReviewStatusValue, FreelanceKycDocumentType } from "./kyc-documents";

describe("UsersService", () => {
  const prisma = {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    document: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    profile: {
      upsert: jest.fn(),
    },
    packPurchase: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  } as any;

  let service: UsersService;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation((callback: (tx: typeof prisma) => unknown) => callback(prisma));
    service = new UsersService(prisma);
  });

  describe("buyCredits", () => {
    // P0-3: buyCredits is blocked until a payment gateway is integrated.
    // All calls must return BadRequestException with a clear message.

    it("bloque l'achat en attente d'intégration du gateway de paiement", async () => {
      await expect(
        service.buyCredits("est-1", { packType: CreditPackType.PRO }),
      ).rejects.toThrow(BadRequestException);
      // No DB operations must be performed
      expect(prisma.packPurchase.create).not.toHaveBeenCalled();
      expect(prisma.profile.upsert).not.toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("conserve les montants et crédits validés pour chaque pack (pour l'intégration future)", () => {
      expect(CREDIT_PACKS).toEqual({
        [CreditPackType.STARTER]: { amount: 150, credits: 1 },
        [CreditPackType.PRO]: { amount: 400, credits: 3 },
        [CreditPackType.ENTERPRISE]: { amount: 600, credits: 5 },
      });
    });
  });

  describe("getCredits", () => {
    it("retourne le solde de crédits du profil", async () => {
      prisma.user.findUnique.mockResolvedValue({
        profile: {
          availableCredits: 2,
        },
      });

      await expect(service.getCredits("user-1")).resolves.toEqual({
        availableCredits: 2,
      });
    });

    it("retourne 0 si le profil existe sans crédits initialisés", async () => {
      prisma.user.findUnique.mockResolvedValue({
        profile: null,
      });

      await expect(service.getCredits("user-1")).resolves.toEqual({
        availableCredits: 0,
      });
    });
  });

  describe("getCreditHistory", () => {
    it("retourne les 10 derniers achats du solde", async () => {
      const createdAt = new Date("2026-04-18T10:00:00.000Z");
      prisma.user.findUnique.mockResolvedValue({ id: "est-1" });
      prisma.packPurchase.findMany.mockResolvedValue([
        {
          id: "purchase-1",
          amount: 400,
          creditsAdded: 3,
          createdAt,
        },
      ]);

      const result = await service.getCreditHistory("est-1");

      expect(prisma.packPurchase.findMany).toHaveBeenCalledWith({
        where: { establishmentId: "est-1" },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          amount: true,
          creditsAdded: true,
          createdAt: true,
        },
      });
      expect(result).toEqual([
        {
          id: "purchase-1",
          amount: 400,
          creditsAdded: 3,
          createdAt,
        },
      ]);
    });

    it("rejette la lecture si l'utilisateur n'existe pas", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getCreditHistory("missing-user")).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.packPurchase.findMany).not.toHaveBeenCalled();
    });
  });

  describe("findAllFreelances", () => {
    it("retourne uniquement les freelances VERIFIED pour l'annuaire", async () => {
      const freelances = [
        {
          id: "free-verified",
          email: "verified@example.com",
          role: "FREELANCE",
          status: "VERIFIED",
          profile: null,
        },
      ];
      prisma.user.findMany.mockResolvedValue(freelances);

      await expect(service.findAllFreelances()).resolves.toEqual(freelances);

      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: {
          role: "FREELANCE",
          status: "VERIFIED",
        },
        select: {
          id: true,
          profile: {
            select: {
              firstName: true,
              lastName: true,
              avatar: true,
              jobTitle: true,
              city: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    });
  });

  describe("getMyKycDocuments", () => {
    it("retourne les documents KYC du freelance avec la synthèse", async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: "free-1",
        role: UserRole.FREELANCE,
        documents: [
          {
            id: "doc-1",
            type: "CV" as FreelanceKycDocumentType,
            filename: "cv.pdf",
            mimeType: "application/pdf",
            sizeBytes: 1200,
            status: "PENDING" as DocumentReviewStatusValue,
            reviewReason: null,
            updatedAt: new Date("2026-04-20T09:00:00.000Z"),
            reviewedAt: null,
          },
        ],
      });

      const result = await service.getMyKycDocuments("free-1");

      expect(result.documents).toHaveLength(1);
      expect(result.documents[0]).toEqual(
        expect.objectContaining({
          id: "doc-1",
          type: "CV" as FreelanceKycDocumentType,
          label: "CV",
          filename: "cv.pdf",
          status: "PENDING" as DocumentReviewStatusValue,
        }),
      );
      expect(result.summary.globalStatus).toBe("MISSING");
      expect(result.summary.uploadedDocuments).toBe(1);
    });
  });

  describe("upsertFreelanceDocument", () => {
    const file = {
      originalname: "rib.pdf",
      mimetype: "application/pdf",
      size: 4096,
      path: "private-uploads\\kyc\\rib.pdf",
    } as Express.Multer.File;

    it("remplace un document existant et le repasse en attente", async () => {
      prisma.user.findUnique.mockResolvedValue({ id: "free-1", role: UserRole.FREELANCE });
      prisma.document.findFirst.mockResolvedValue({ id: "doc-1" });
      prisma.document.update.mockResolvedValue({});

      const getMyKycDocumentsSpy = jest
        .spyOn(service, "getMyKycDocuments")
        .mockResolvedValue({ documents: [], summary: {} as any });

      await service.upsertFreelanceDocument("free-1", "RIB", file);

      expect(prisma.document.update).toHaveBeenCalledWith({
        where: { id: "doc-1" },
        data: expect.objectContaining({
          filename: "rib.pdf",
          mimeType: "application/pdf",
          sizeBytes: 4096,
          status: "PENDING",
          reviewedAt: null,
          reviewedById: null,
          reviewReason: null,
          url: "/users/me/documents/doc-1/file",
        }),
      });
      expect(getMyKycDocumentsSpy).toHaveBeenCalledWith("free-1");
    });

    it("crée un document s'il n'existe pas encore", async () => {
      prisma.user.findUnique.mockResolvedValue({ id: "free-1", role: UserRole.FREELANCE });
      prisma.document.findFirst.mockResolvedValue(null);
      prisma.document.create.mockResolvedValue({ id: "doc-new" });
      prisma.document.update.mockResolvedValue({});

      const getMyKycDocumentsSpy = jest
        .spyOn(service, "getMyKycDocuments")
        .mockResolvedValue({ documents: [], summary: {} as any });

      await service.upsertFreelanceDocument("free-1", "CV", file);

      expect(prisma.document.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: "CV",
          userId: "free-1",
          status: "PENDING",
          filename: "rib.pdf",
        }),
        select: { id: true },
      });
      expect(prisma.document.update).toHaveBeenCalledWith({
        where: { id: "doc-new" },
        data: { url: "/users/me/documents/doc-new/file" },
      });
      expect(getMyKycDocumentsSpy).toHaveBeenCalledWith("free-1");
    });

    it("rejette un type de document invalide", async () => {
      await expect(
        service.upsertFreelanceDocument("free-1", "INVALID", file),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
