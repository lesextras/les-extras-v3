import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, UserRole } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { UpdateOnboardingDto } from "./dto/update-onboarding.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { MAX_STEP_BY_ROLE } from "../common/constants";
import { BuyCreditsDto, CreditPackType } from "./dto/buy-credits.dto";
import {
    buildFreelanceKycSummary,
    type DocumentReviewStatusValue,
    FREELANCE_KYC_DOCUMENT_TYPES,
    getFreelanceKycDocumentLabel,
    isFreelanceKycDocumentType,
    type FreelanceKycDocumentType,
    type KycSummary,
} from "./kyc-documents";

export const CREDIT_PACKS: Record<CreditPackType, { amount: number; credits: number }> = {
    [CreditPackType.STARTER]: { amount: 150, credits: 1 },
    [CreditPackType.PRO]: { amount: 400, credits: 3 },
    [CreditPackType.ENTERPRISE]: { amount: 600, credits: 5 },
};

export type CreditPurchaseHistoryItem = {
    id: string;
    amount: number;
    creditsAdded: number;
    createdAt: Date;
};

export type UserKycDocumentRow = {
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
};

export type UserKycDocumentsPayload = {
    documents: UserKycDocumentRow[];
    summary: KycSummary;
};

export type UserKycDocumentFilePayload = {
    filename: string;
    mimeType: string | null;
    storagePath: string;
};

function mapUserKycDocument(document: {
    id: string;
    type: FreelanceKycDocumentType;
    filename: string;
    mimeType: string | null;
    sizeBytes: number | null;
    status: DocumentReviewStatusValue;
    reviewReason: string | null;
    updatedAt: Date;
    reviewedAt: Date | null;
}): UserKycDocumentRow {
    return {
        id: document.id,
        type: document.type,
        label: getFreelanceKycDocumentLabel(document.type),
        filename: document.filename,
        mimeType: document.mimeType,
        sizeBytes: document.sizeBytes,
        status: document.status,
        reviewReason: document.reviewReason,
        createdAt: document.updatedAt.toISOString(),
        reviewedAt: document.reviewedAt?.toISOString() ?? null,
    };
}

@Injectable()
export class UsersService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Persiste les données d'un step wizard ET met à jour onboardingStep.
     * Les alias établissement (establishmentName → companyName, etc.) sont
     * résolus ici pour que le Profile soit toujours cohérent.
     */
    async updateOnboardingStep(userId: string, dto: UpdateOnboardingDto) {
        const { step, contactName, establishmentName, establishmentType, isAvailable, ...rest } = dto as any;

        // ── Résolution des alias wizard ──────────────────────────
        const profileFields: Record<string, unknown> = { ...rest };

        if (establishmentName) profileFields.companyName = establishmentName;

        // Le type d'établissement (IME, MECS…) va dans jobTitle
        if (establishmentType) profileFields.jobTitle = establishmentType;

        // contactName "Jean Dupont" → firstName="Jean" lastName="Dupont"
        if (contactName) {
            const parts = (contactName as string).trim().split(/\s+/);
            profileFields.firstName = parts[0] ?? "";
            profileFields.lastName = (parts.slice(1).join(" ") || parts[0]) ?? "";
        }

        // Exclure les champs undefined pour ne pas écraser avec null
        Object.keys(profileFields).forEach((k) => {
            if (profileFields[k] === undefined) delete profileFields[k];
        });

        try {
            return await this.prisma.$transaction(async (tx) => {
            const user = await tx.user.update({
                where: { id: userId },
                data: {
                    onboardingStep: step,
                    ...(typeof isAvailable === "boolean" ? { isAvailable } : {}),
                },
            });

            // Upsert Profile — crée le profil s'il n'existe pas encore
            if (Object.keys(profileFields).length > 0) {
                await tx.profile.upsert({
                    where: { userId },
                    create: {
                            userId,
                            firstName: (profileFields.firstName as string) ?? "",
                            lastName: (profileFields.lastName as string) ?? "",
                            skills: (profileFields.skills as string[] | undefined) ?? [],
                            ...profileFields,
                        },
                        update: profileFields,
                });
            }

            return user;
        });
        } catch (err) {
            if (err instanceof Prisma.PrismaClientKnownRequestError) {
                if (err.code === "P2025") throw new NotFoundException("Utilisateur introuvable");
                if (err.code === "P2002") throw new BadRequestException("Donnees en conflit");
            }
            throw err;
        }
    }

    async completeOnboarding(userId: string, role: string) {
        const userRole = role as keyof typeof MAX_STEP_BY_ROLE;
        const maxStep = MAX_STEP_BY_ROLE[userRole] || 4;

        return this.prisma.user.update({
            where: { id: userId },
            data: { onboardingStep: maxStep },
        });
    }
    /**
     * Retourne l'utilisateur courant avec son profil.
     * Utilisé par GET /users/me.
     */
    async getMe(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                role: true,
                status: true,
                onboardingStep: true,
                isAvailable: true,
                createdAt: true,
                profile: true,
            },
        });
        if (!user) throw new NotFoundException("Utilisateur introuvable");
        return user;
    }

    async getMyKycDocuments(userId: string): Promise<UserKycDocumentsPayload> {
        const user = await (this.prisma.user.findUnique as any)({
            where: { id: userId },
            select: {
                id: true,
                role: true,
                documents: {
                    where: {
                        userId,
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
                    },
                },
            },
        });

        if (!user) {
            throw new NotFoundException("Utilisateur introuvable");
        }

        if (user.role !== UserRole.FREELANCE) {
            throw new BadRequestException("Le KYC documentaire est réservé aux freelances");
        }

        const documents = user.documents.map((document: any) =>
            mapUserKycDocument({
                ...document,
                type: document.type as FreelanceKycDocumentType,
            }),
        );

        return {
            documents,
            summary: buildFreelanceKycSummary(
                documents.map((document: UserKycDocumentRow) => ({
                    type: document.type,
                    status: document.status,
                })),
            ),
        };
    }

    async upsertFreelanceDocument(
        userId: string,
        documentType: string,
        file: Express.Multer.File,
    ): Promise<UserKycDocumentsPayload> {
        if (!file) {
            throw new BadRequestException("Aucun fichier fourni");
        }

        if (!isFreelanceKycDocumentType(documentType)) {
            throw new BadRequestException("Type de document KYC invalide");
        }

        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                role: true,
            },
        });

        if (!user) {
            throw new NotFoundException("Utilisateur introuvable");
        }

        if (user.role !== UserRole.FREELANCE) {
            throw new BadRequestException("Le KYC documentaire est réservé aux freelances");
        }

        const existing = await (this.prisma.document.findFirst as any)({
            where: {
                userId,
                serviceId: null,
                type: documentType,
            },
            orderBy: {
                updatedAt: "desc",
            },
            select: {
                id: true,
            },
        });

        const relativeStoragePath = file.path.replace(/\\/g, "/");

        if (existing) {
            await (this.prisma.document.update as any)({
                where: { id: existing.id },
                data: {
                    filename: file.originalname,
                    mimeType: file.mimetype,
                    sizeBytes: file.size,
                    storagePath: relativeStoragePath,
                    status: "PENDING",
                    reviewedAt: null,
                    reviewedById: null,
                    reviewReason: null,
                    url: `/users/me/documents/${existing.id}/file`,
                },
            });
        } else {
            const created = await (this.prisma.document.create as any)({
                data: {
                    type: documentType,
                    status: "PENDING",
                    url: "",
                    storagePath: relativeStoragePath,
                    filename: file.originalname,
                    mimeType: file.mimetype,
                    sizeBytes: file.size,
                    userId,
                },
                select: { id: true },
            });

            await (this.prisma.document.update as any)({
                where: { id: created.id },
                data: {
                    url: `/users/me/documents/${created.id}/file`,
                },
            });
        }

        return this.getMyKycDocuments(userId);
    }

    async getMyKycDocumentFile(userId: string, documentId: string): Promise<UserKycDocumentFilePayload> {
        const document = await (this.prisma.document.findFirst as any)({
            where: {
                id: documentId,
                userId,
                serviceId: null,
                type: {
                    in: [...FREELANCE_KYC_DOCUMENT_TYPES],
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

    async getCredits(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                profile: {
                    select: {
                        availableCredits: true,
                    },
                },
            },
        });

        if (!user) {
            throw new NotFoundException("Utilisateur introuvable");
        }

        return {
            availableCredits: user.profile?.availableCredits ?? 0,
        };
    }

    async getCreditHistory(userId: string): Promise<CreditPurchaseHistoryItem[]> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true },
        });

        if (!user) {
            throw new NotFoundException("Utilisateur introuvable");
        }

        return this.prisma.packPurchase.findMany({
            where: { establishmentId: userId },
            orderBy: { createdAt: "desc" },
            take: 10,
            select: {
                id: true,
                amount: true,
                creditsAdded: true,
                createdAt: true,
            },
        });
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async buyCredits(_userId: string, _dto: BuyCreditsDto) {
        // SECURITY: No payment gateway is integrated. Credits MUST NOT be
        // granted without a verified payment event from a webhook (e.g. Stripe).
        // Re-implement this method behind a verified Stripe webhook handler
        // before enabling in production. The implementation skeleton is preserved
        // below in CREDIT_PACKS and in git history.
        throw new BadRequestException(
            "L'achat de crédits en ligne n'est pas encore disponible. Contactez l'équipe Les Extras pour obtenir un pack.",
        );
    }

    /**
     * Met à jour le profil de l'utilisateur courant.
     * Utilisé par PATCH /users/me.
     */
    async updateMe(userId: string, dto: UpdateProfileDto) {
        const { isAvailable, ...profileFields } = dto;

        // Exclure les champs undefined
        const cleanProfile: Record<string, unknown> = {};
        Object.entries(profileFields).forEach(([k, v]) => {
            if (v !== undefined) cleanProfile[k] = v;
        });

        try {
            return await this.prisma.$transaction(async (tx) => {
            if (typeof isAvailable === "boolean") {
                await tx.user.update({
                    where: { id: userId },
                    data: { isAvailable },
                });
            }

            if (Object.keys(cleanProfile).length > 0) {
                await tx.profile.upsert({
                    where: { userId },
                    create: {
                        userId,
                        firstName: (cleanProfile.firstName as string) ?? "",
                        lastName: (cleanProfile.lastName as string) ?? "",
                        skills: (cleanProfile.skills as string[] | undefined) ?? [],
                        ...cleanProfile,
                    },
                    update: cleanProfile,
                });
            }

            return this.getMe(userId);
        });
        } catch (err) {
            if (err instanceof Prisma.PrismaClientKnownRequestError) {
                if (err.code === "P2025") throw new NotFoundException("Utilisateur introuvable");
                if (err.code === "P2002") throw new BadRequestException("Donnees en conflit");
            }
            throw err;
        }
    }

    async findAllFreelances() {
        return this.prisma.user.findMany({
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
    }

    async findFreelanceById(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id, role: "FREELANCE" },
            select: {
                id: true,
                isAvailable: true,
                profile: {
                    select: {
                        firstName: true,
                        lastName: true,
                        avatar: true,
                        jobTitle: true,
                        bio: true,
                        city: true,
                        skills: true,
                        // siret intentionally excluded — business identifier is private PII
                        availableDays: true,
                    },
                },
                reviewsReceived: {
                    include: {
                        author: {
                            select: {
                                id: true,
                                profile: { select: { firstName: true, lastName: true, avatar: true, companyName: true } },
                            },
                        },
                    },
                    orderBy: { createdAt: "desc" },
                    take: 20,
                },
                ownerServices: {
                    where: { status: "ACTIVE" },
                    take: 10,
                },
            },
        });
        if (!user) throw new NotFoundException("Freelance introuvable");
        return user;
    }

    /**
     * Checks if a freelance is currently on a confirmed/assigned mission.
     */
    async isCurrentlyBusy(userId: string): Promise<boolean> {
        const now = new Date();
        const activeMissionBooking = await this.prisma.booking.findFirst({
            where: {
                freelanceId: userId,
                status: { in: ["CONFIRMED", "IN_PROGRESS"] },
                reliefMission: {
                    dateStart: { lte: now },
                    dateEnd: { gte: now },
                },
            },
        });
        return !!activeMissionBooking;
    }

    /**
     * Returns availability data for the current user.
     */
    async getAvailability(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                isAvailable: true,
                profile: { select: { availableDays: true } },
            },
        });
        if (!user) throw new NotFoundException("Utilisateur introuvable");

        const isCurrentlyBusy = await this.isCurrentlyBusy(userId);

        return {
            isAvailable: user.isAvailable,
            availableDays: user.profile?.availableDays ?? [],
            isCurrentlyBusy,
        };
    }
}

