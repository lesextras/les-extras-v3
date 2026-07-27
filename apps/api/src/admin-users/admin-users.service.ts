import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, UserRole, UserStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { ListAdminUsersQueryDto } from "./dto/list-admin-users-query.dto";
import { ReviewUserDocumentDto } from "./dto/review-user-document.dto";
import {
  buildFreelanceKycSummary,
  FREELANCE_KYC_DOCUMENT_TYPES,
  getFreelanceKycDocumentLabel,
  isFreelanceKycDocumentType,
  type FreelanceKycDocumentType,
} from "../users/kyc-documents";
import {
  AdminUserProfileDetails,
  AdminUserRow,
  PendingKycDocumentRow,
} from "./types/admin-user.types";

function formatUserName(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  email: string,
): string {
  const rawName = [firstName, lastName].filter(Boolean).join(" ").trim();
  return rawName || email;
}

function formatUserDisplayName(user: {
  email: string;
  profile: { firstName: string | null; lastName: string | null } | null;
}) {
  return formatUserName(user.profile?.firstName, user.profile?.lastName, user.email);
}

@Injectable()
export class AdminUsersService {
  constructor(private readonly prisma: PrismaService) {}

  async listUsers(query: ListAdminUsersQueryDto): Promise<AdminUserRow[]> {
    const where: Prisma.UserWhereInput = {};
    const search = query.search?.trim();

    if (search) {
      where.email = {
        contains: search,
        mode: "insensitive",
      };
    }

    if (query.role && query.role !== "ALL") {
      where.role = query.role;
    }

    const users = await this.prisma.user.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        profile: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        documents: {
          where: {
            serviceId: null,
            type: {
              in: [...FREELANCE_KYC_DOCUMENT_TYPES],
            },
          },
          select: {
            type: true,
            status: true,
          },
        },
      },
    });

    return users.map((user) => ({
      id: user.id,
      name: formatUserName(user.profile?.firstName, user.profile?.lastName, user.email),
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt.toISOString(),
      kyc:
        user.role === UserRole.FREELANCE
          ? buildFreelanceKycSummary(
              user.documents
                .filter((document: any) => isFreelanceKycDocumentType(document.type))
                .map((document: any) => ({
                  type: document.type,
                  status: document.status,
                })),
            )
          : null,
    }));
  }

  async getUserById(userId: string): Promise<AdminUserProfileDetails> {
    const user = await (this.prisma.user.findUnique as any)({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        profile: {
          select: {
            firstName: true,
            lastName: true,
            jobTitle: true,
            bio: true,
            avatar: true,
          },
        },
        documents: {
          where: {
            serviceId: null,
            type: {
              in: [...FREELANCE_KYC_DOCUMENT_TYPES],
            },
          },
          orderBy: {
            updatedAt: "desc",
          },
          select: {
            id: true,
            type: true,
            filename: true,
            mimeType: true,
            sizeBytes: true,
            status: true,
            reviewReason: true,
            updatedAt: true,
            reviewedAt: true,
            reviewedBy: {
              select: {
                email: true,
                profile: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const documents = user.documents.map((document: any) => ({
      id: document.id,
      type: document.type,
      label: getFreelanceKycDocumentLabel(document.type as FreelanceKycDocumentType),
      filename: document.filename,
      mimeType: document.mimeType,
      sizeBytes: document.sizeBytes,
      status: document.status,
      reviewReason: document.reviewReason,
      createdAt: document.updatedAt.toISOString(),
      reviewedAt: document.reviewedAt?.toISOString() ?? null,
      reviewedByName: document.reviewedBy ? formatUserDisplayName(document.reviewedBy) : null,
    }));

    const kyc = buildFreelanceKycSummary(
      documents
        .filter((document: any) => isFreelanceKycDocumentType(document.type))
        .map((document: any) => ({
          type: document.type,
          status: document.status,
        })),
    );

    return {
      id: user.id,
      name: formatUserName(user.profile?.firstName, user.profile?.lastName, user.email),
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt.toISOString(),
      jobTitle: user.profile?.jobTitle ?? null,
      bio: user.profile?.bio ?? null,
      avatar: user.profile?.avatar ?? null,
      kyc,
      documents,
    };
  }

  async listPendingKycDocuments(): Promise<PendingKycDocumentRow[]> {
    const documents = await (this.prisma.document.findMany as any)({
      where: {
        status: "PENDING",
        serviceId: null,
        user: {
          role: UserRole.FREELANCE,
        },
        type: {
          in: [...FREELANCE_KYC_DOCUMENT_TYPES],
        },
      },
      orderBy: {
        updatedAt: "asc",
      },
      select: {
        id: true,
        type: true,
        filename: true,
        mimeType: true,
        sizeBytes: true,
        status: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            email: true,
            status: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    return documents.map((document: any) => ({
      id: document.id,
      type: document.type,
      label: getFreelanceKycDocumentLabel(document.type as FreelanceKycDocumentType),
      filename: document.filename,
      mimeType: document.mimeType,
      sizeBytes: document.sizeBytes,
      status: document.status,
      createdAt: document.updatedAt.toISOString(),
      user: {
        id: document.user!.id,
        name: formatUserDisplayName(document.user!),
        email: document.user!.email,
        status: document.user!.status,
      },
    }));
  }

  async reviewUserDocument(
    documentId: string,
    adminId: string,
    dto: ReviewUserDocumentDto,
  ): Promise<{ ok: true }> {
    if (dto.status === "PENDING") {
      throw new BadRequestException("Un document doit être approuvé ou rejeté");
    }

    if (dto.status === "REJECTED" && !dto.reviewReason?.trim()) {
      throw new BadRequestException("Un motif de rejet est obligatoire");
    }

    const document = await (this.prisma.document.findFirst as any)({
      where: {
        id: documentId,
        serviceId: null,
        type: {
          in: [...FREELANCE_KYC_DOCUMENT_TYPES],
        },
        user: {
          role: UserRole.FREELANCE,
        },
      },
      select: {
        id: true,
        userId: true,
        type: true,
        status: true,
      },
    });

    if (!document || !isFreelanceKycDocumentType(document.type)) {
      throw new NotFoundException("Document KYC introuvable");
      }

    const nextReason = dto.status === "REJECTED" ? dto.reviewReason!.trim() : null;

    await this.prisma.$transaction([
      (this.prisma.document.update as any)({
        where: { id: documentId },
        data: {
          status: dto.status,
          reviewedAt: new Date(),
          reviewedById: adminId,
          reviewReason: nextReason,
        },
      }),
      this.prisma.adminActionLog.create({
        data: {
          adminId,
          entityType: "DOCUMENT",
          entityId: documentId,
          action:
            dto.status === "APPROVED"
              ? "DOCUMENT_APPROVE"
              : "DOCUMENT_REJECT",
          meta: {
            userId: document.userId,
            type: document.type,
            previousStatus: document.status,
            nextStatus: dto.status,
            reviewReason: nextReason,
          },
        },
      }),
    ]);

    return { ok: true };
  }

  async getAdminDocumentFile(documentId: string) {
    const document = await (this.prisma.document.findFirst as any)({
      where: {
        id: documentId,
        serviceId: null,
        type: {
          in: [...FREELANCE_KYC_DOCUMENT_TYPES],
        },
        user: {
          role: UserRole.FREELANCE,
        },
      },
      select: {
        filename: true,
        mimeType: true,
        storagePath: true,
      },
    });

    if (!document?.storagePath) {
      throw new NotFoundException("Document introuvable");
    }

    return {
      filename: document.filename,
      mimeType: document.mimeType,
      storagePath: document.storagePath,
    };
  }

  async verifyUser(userId: string, adminId: string): Promise<{ ok: true }> {
    const existing = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, status: true },
    });

    if (!existing) {
      throw new NotFoundException("User not found");
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: {
          status: UserStatus.VERIFIED,
        },
      }),
      this.prisma.adminActionLog.create({
        data: {
          adminId,
          entityType: "USER",
          entityId: userId,
          action: "USER_VERIFY",
          meta: {
            previousStatus: existing.status,
            nextStatus: UserStatus.VERIFIED,
          },
        },
      }),
    ]);

    return { ok: true };
  }

  async banUser(userId: string, actorId: string): Promise<{ ok: true }> {
    if (userId === actorId) {
      throw new BadRequestException("You cannot ban your own account");
    }

    const existing = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, status: true },
    });

    if (!existing) {
      throw new NotFoundException("User not found");
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: {
          status: UserStatus.BANNED,
        },
      }),
      this.prisma.adminActionLog.create({
        data: {
          adminId: actorId,
          entityType: "USER",
          entityId: userId,
          action: "USER_BAN",
          meta: {
            previousStatus: existing.status,
            nextStatus: UserStatus.BANNED,
          },
        },
      }),
    ]);

    return { ok: true };
  }
}
