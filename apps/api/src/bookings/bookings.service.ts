import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { randomUUID } from "crypto";
import {
  BookingStatus,
  InvoiceStatus,
  Prisma,
  ReliefMissionStatus,
  ServiceType,
  UserRole,
} from "@prisma/client";
import { AuthenticatedUser } from "../auth/types/jwt-payload.type";
import { PrismaService } from "../prisma/prisma.service";
import { CancelBookingLineDto } from "./dto/cancel-booking-line.dto";
import { ActionBookingDto } from "./dto/action-booking.dto";
import {
  BookingDetails,
  BookingLine,
  BookingLineStatus,
  BookingLineType,
  BookingsPageData,
  OrderTrackerData,
  TimelineEvent,
} from "./types/bookings.types";
import { NotificationsService } from "../notifications/notifications.service";
import { MailService } from "../mail/mail.service";
import { ConversationsService } from "../conversations/conversations.service";
import { format } from "date-fns";
import {
  calculateMissionPlanningHours,
  coerceMissionPlanning,
  normalizeMissionPlanning,
} from "../missions/mission-slots";

const UNKNOWN_COUNTERPART = "À confirmer";
const SERVICE_ADDRESS_PLACEHOLDER = "Adresse non renseignée";
const CONTACT_DETAILS_LOCKED = "Coordonnées disponibles après confirmation";
const OPERATING_FEE_RATE = 0.10;
const FREELANCE_VALIDATED_MISSION_CANCEL_MESSAGE =
  "Pour annuler une mission déjà validée, contactez Le Desk.";
const DIRECT_CONTACT_ALLOWED_STATUSES = new Set<BookingStatus>([
  BookingStatus.CONFIRMED,
  BookingStatus.IN_PROGRESS,
  BookingStatus.COMPLETED,
  BookingStatus.AWAITING_PAYMENT,
  BookingStatus.PAID,
]);

const NEXT_STEP_STATUSES = new Set<BookingLineStatus>([
  "PENDING",
  "CONFIRMED",
  "PAID",
  "ASSIGNED",
  "COMPLETED",
]);

function normalizeMissionStatus(status: ReliefMissionStatus): BookingLineStatus {
  if (status === ReliefMissionStatus.OPEN) {
    return "PENDING";
  }

  if (status === ReliefMissionStatus.ASSIGNED) {
    return "ASSIGNED";
  }

  if (status === ReliefMissionStatus.COMPLETED) {
    return "COMPLETED";
  }

  return "CANCELLED";
}

function sortLinesByDate(lines: BookingLine[]): BookingLine[] {
  return [...lines].sort(
    (left, right) => new Date(left.date).getTime() - new Date(right.date).getTime(),
  );
}

function pickNextStep(lines: BookingLine[]): BookingLine | null {
  const now = new Date();
  return (
    lines.find(
      (line) =>
        new Date(line.date) > now &&
        line.status !== "CANCELLED" &&
        NEXT_STEP_STATUSES.has(line.status),
    ) ?? null
  );
}

function parseLineType(value: string): BookingLineType {
  if (value === "MISSION" || value === "SERVICE_BOOKING") {
    return value;
  }

  throw new BadRequestException("lineType must be MISSION or SERVICE_BOOKING");
}

function getServiceTypeLabel(type?: ServiceType | null): "Atelier" | "Formation" {
  return type === "TRAINING" ? "Formation" : "Atelier";
}

function hasConfirmedEngagement(status?: BookingStatus | null): boolean {
  return status ? DIRECT_CONTACT_ALLOWED_STATUSES.has(status) : false;
}

function getDirectContactValue(
  email: string | null | undefined,
  allowDirectContact: boolean,
): string {
  if (!allowDirectContact) {
    return CONTACT_DETAILS_LOCKED;
  }

  return email ?? UNKNOWN_COUNTERPART;
}

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly mailService: MailService,
    private readonly conversations: ConversationsService,
  ) { }

  async claimOpenMissionForFreelance(
    missionId: string,
    freelanceId: string,
    input: { motivation?: string; proposedRate?: number } = {},
  ) {
    const booking = await this.prisma.$transaction(async (tx) => {
      const claimedMission = await tx.reliefMission.updateMany({
        where: {
          id: missionId,
          status: ReliefMissionStatus.OPEN,
        },
        data: {
          status: ReliefMissionStatus.ASSIGNED,
        },
      });

      if (claimedMission.count === 0) {
        const existingMission = await tx.reliefMission.findUnique({
          where: { id: missionId },
          select: { id: true },
        });

        if (!existingMission) {
          throw new NotFoundException("Mission introuvable");
        }

        throw new ConflictException("Cette mission est déjà prise.");
      }

      const mission = await tx.reliefMission.findUnique({
        where: { id: missionId },
        include: {
          establishment: {
            select: { role: true },
          },
        },
      });

      if (!mission) {
        throw new NotFoundException("Mission introuvable");
      }

      if (mission.establishment?.role === UserRole.ESTABLISHMENT) {
        await this.consumeOneCreditOrThrow(tx, mission.establishmentId);
      }

      const createdBooking = await tx.booking.create({
        data: {
          status: BookingStatus.CONFIRMED,
          establishmentId: mission.establishmentId,
          freelanceId,
          reliefMissionId: mission.id,
          scheduledAt: mission.dateStart,
          message: input.motivation,
          proposedRate: input.proposedRate,
        },
      });

      await tx.booking.updateMany({
        where: {
          reliefMissionId: mission.id,
          id: { not: createdBooking.id },
          status: BookingStatus.PENDING,
        },
        data: { status: BookingStatus.CANCELLED },
      });

      await this.createInvoiceOnConfirmation(tx, {
        ...createdBooking,
        reliefMission: mission,
        service: null,
        invoice: null,
        quotes: [],
      });

      return {
        ...createdBooking,
        reliefMission: mission,
        service: null,
      };
    });

    await this.runMissionConfirmationSideEffects(booking);

    return {
      id: booking.id,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      message: booking.message,
      scheduledAt: booking.scheduledAt,
      proposedRate: booking.proposedRate,
      freelanceAcknowledged: booking.freelanceAcknowledged,
      nbParticipants: booking.nbParticipants,
      establishmentId: booking.establishmentId,
      freelanceId: booking.freelanceId,
      reliefMissionId: booking.reliefMissionId,
      serviceId: booking.serviceId,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
    };
  }

  private calculateMissionAmount(
    source: { dateStart: Date; dateEnd: Date; hourlyRate: number; slots?: unknown },
  ): number {
    const hours =
      calculateMissionPlanningHours(source.slots) ??
      Math.max(
        1,
        Math.round(
          ((source.dateEnd.getTime() - source.dateStart.getTime()) / (1000 * 60 * 60)) * 100,
        ) / 100,
      );

    const subtotal = hours * source.hourlyRate;
    return Math.round(subtotal * (1 + OPERATING_FEE_RATE) * 100) / 100;
  }

  private getMissionPlanningSummary(
    source: { dateStart: Date; dateEnd: Date; slots?: unknown },
    now = new Date(),
  ) {
    const planning = normalizeMissionPlanning(coerceMissionPlanning(source.slots));
    const firstLine = planning[0] ?? null;
    const nextLine = planning.find((line) => line.start.getTime() >= now.getTime()) ?? null;

    return {
      planning,
      firstLine,
      nextLine,
      lineDate: nextLine?.start ?? firstLine?.start ?? source.dateStart,
    };
  }

  private generateInvoiceNumber(now = new Date()): string {
    const uniqueSuffix = randomUUID().slice(0, 8).toUpperCase();
    return `LE-${format(now, "yyyyMM")}-${uniqueSuffix}`;
  }

  private async consumeOneCreditOrThrow(
    tx: Prisma.TransactionClient,
    requesterId: string,
  ): Promise<void> {
    const result = await tx.profile.updateMany({
      where: {
        userId: requesterId,
        availableCredits: {
          gte: 1,
        },
      },
      data: {
        availableCredits: {
          decrement: 1,
        },
      },
    });

    if (result.count > 0) {
      return;
    }

    const requester = await tx.user.findUnique({
      where: { id: requesterId },
      select: { id: true },
    });

    if (!requester) {
      throw new NotFoundException("Compte demandeur introuvable.");
    }

    throw new BadRequestException(
      "Crédits insuffisants pour valider cette réservation. Ajoutez un pack avant de continuer.",
    );
  }

  private calculateServiceAmount(
    service: {
      title: string;
      price: number;
      pricingType: string;
      pricePerParticipant?: number | null;
    },
    nbParticipants?: number | null,
    acceptedQuoteTotal?: number | null,
  ): number {
    if (service.pricingType === "PER_PARTICIPANT") {
      if (service.pricePerParticipant == null) {
        throw new BadRequestException("Le tarif par participant est manquant pour ce service.");
      }

      return Math.round(service.pricePerParticipant * (nbParticipants ?? 1) * 100) / 100;
    }

    if (service.pricingType === "QUOTE") {
      if (acceptedQuoteTotal == null) {
        throw new BadRequestException(
          "Le devis accepté est requis avant de valider cette réservation.",
        );
      }

      return Math.round(acceptedQuoteTotal * 100) / 100;
    }

    return Math.round(service.price * 100) / 100;
  }

  private async createInvoiceOnConfirmation(
    tx: Prisma.TransactionClient,
    booking: {
      id: string;
      nbParticipants?: number | null;
      invoice?: { id: string } | null;
      reliefMission?: {
        dateStart: Date;
        dateEnd: Date;
        hourlyRate: number;
        slots?: unknown;
      } | null;
      service?: {
        title: string;
        price: number;
        pricingType: string;
        pricePerParticipant?: number | null;
      } | null;
      quotes?: Array<{ totalTTC: number }>;
    },
  ): Promise<void> {
    if (booking.invoice) {
      return;
    }

    const amount = booking.reliefMission
      ? this.calculateMissionAmount(booking.reliefMission)
      : booking.service
        ? this.calculateServiceAmount(
            booking.service,
            booking.nbParticipants,
            booking.quotes?.[0]?.totalTTC,
          )
        : null;

    if (amount == null) {
      throw new BadRequestException("Impossible de générer la facture pour cette réservation.");
    }

    await tx.invoice.create({
      data: {
        bookingId: booking.id,
        amount,
        invoiceNumber: this.generateInvoiceNumber(),
        status: InvoiceStatus.UNPAID,
      },
    });
  }

  private getBookingDisplayTitle(booking: {
    reliefMission?: { title: string } | null;
    service?: { title: string } | null;
  }): string {
    return booking.reliefMission?.title ?? booking.service?.title ?? "Réservation";
  }

  private getBookingKindLabel(booking: {
    reliefMission?: unknown;
    service?: { type?: ServiceType | null } | null;
  }): string {
    if (booking.reliefMission) {
      return "mission";
    }

    return booking.service?.type === "TRAINING" ? "formation" : "atelier";
  }

  private async runMissionConfirmationSideEffects(booking: {
    id: string;
    establishmentId: string;
    freelanceId?: string | null;
    reliefMissionId?: string | null;
    reliefMission?: { title: string; dateStart: Date } | null;
  }): Promise<void> {
    try {
      await this.runMissionConfirmationSideEffectsUnsafe(booking);
    } catch (error) {
      console.error("runMissionConfirmationSideEffects failed", {
        bookingId: booking.id,
        reliefMissionId: booking.reliefMissionId,
        error: error instanceof Error ? error.message : error,
      });
    }
  }

  private async runMissionConfirmationSideEffectsUnsafe(booking: {
    id: string;
    establishmentId: string;
    freelanceId?: string | null;
    reliefMissionId?: string | null;
    reliefMission?: { title: string; dateStart: Date } | null;
  }): Promise<void> {
    if (booking.reliefMissionId && booking.freelanceId) {
      const freelance = await this.prisma.user.findUnique({
        where: { id: booking.freelanceId },
        include: { profile: true },
      });
      const establishment = await this.prisma.user.findUnique({
        where: { id: booking.establishmentId },
        include: { profile: true },
      });
      const missionTitle = booking.reliefMission?.title ?? "Mission";

      await this.notifications.create({
        userId: booking.freelanceId,
        message: `Vous avez été recruté pour la mission "${missionTitle}" !`,
        type: "SUCCESS",
      });

      if (freelance?.email && establishment) {
        const missionDateStr = booking.reliefMission?.dateStart
          ? format(booking.reliefMission.dateStart, "dd/MM/yyyy")
          : "prochainement";
        const estabName =
          establishment.profile?.companyName ??
          establishment.email.split("@").at(0) ??
          establishment.email;
        this.mailService
          .sendMissionConfirmedEmail(freelance.email, missionDateStr, estabName)
          .catch((e) => console.error(e));
      }

      const missionConversation = await this.conversations.getOrCreateConversation(
        booking.freelanceId,
        booking.establishmentId,
      );
      await this.prisma.conversation.updateMany({
        where: { id: missionConversation.id, bookingId: null },
        data: { bookingId: booking.id },
      });
    }

    if (!booking.reliefMissionId) {
      return;
    }

    const rejectedBookings = await this.prisma.booking.findMany({
      where: {
        reliefMissionId: booking.reliefMissionId,
        id: { not: booking.id },
        status: BookingStatus.CANCELLED,
        freelanceId: { not: null },
      },
      include: {
        freelance: { include: { profile: true } },
      },
    });

    const missionTitle = booking.reliefMission?.title ?? "Mission";

    for (const rejected of rejectedBookings) {
      if (!rejected.freelanceId) continue;

      await this.notifications.create({
        userId: rejected.freelanceId,
        message: `Votre candidature pour la mission "${missionTitle}" n'a pas été retenue.`,
        type: "WARNING",
      });

      if (rejected.freelance?.email) {
        const firstName =
          rejected.freelance?.profile?.firstName ??
          rejected.freelance?.email.split("@").at(0) ??
          "Freelance";
        this.mailService
          .sendCandidatureDeclinedEmail(rejected.freelance.email, missionTitle, firstName)
          .catch((e) => console.error(e));
      }
    }
  }

  async getBookingsPageData(user: AuthenticatedUser): Promise<BookingsPageData> {
    const lines: BookingLine[] = [];

    if (user.role === UserRole.ESTABLISHMENT) {
      const [missions, serviceBookings] = await this.prisma.$transaction([
        this.prisma.reliefMission.findMany({
          where: {
            establishmentId: user.id,
          },
          orderBy: {
            dateStart: "asc",
          },
          select: {
            id: true,
            title: true,
            dateStart: true,
            dateEnd: true,
            slots: true,
            hourlyRate: true,
            address: true,
            status: true,
            bookings: {
              orderBy: {
                createdAt: "desc",
              },
              select: {
                id: true,
                status: true,
                freelance: {
                  select: {
                    email: true,
                  },
                },
                reviews: {
                  where: { authorId: user.id },
                  select: { id: true },
                  take: 1,
                },
                invoice: {
                  select: { id: true },
                },
              },
            },
          },
        }),
        this.prisma.booking.findMany({
          where: {
            establishmentId: user.id,
            serviceId: {
              not: null,
            },
          },
          orderBy: {
            scheduledAt: "asc",
          },
          select: {
            id: true,
            status: true,
            scheduledAt: true,
            freelance: {
              select: {
                email: true,
              },
            },
            service: {
              select: {
                title: true,
                price: true,
                type: true,
                owner: {
                  select: {
                    email: true,
                  },
                },
              },
            },
            reviews: {
              where: { authorId: user.id },
              select: { id: true },
              take: 1,
            },
            invoice: {
              select: { id: true },
            },
          },
        }),
      ]);

      for (const mission of missions) {
        const confirmedBooking = mission.bookings.find(
          (booking) =>
            hasConfirmedEngagement(booking.status) && Boolean(booking.freelance?.email),
        );
        const interlocutor = getDirectContactValue(
          confirmedBooking?.freelance?.email,
          Boolean(confirmedBooking),
        );
        const planning = this.getMissionPlanningSummary(mission);

        lines.push({
          lineId: mission.id,
          lineType: "MISSION",
          date: planning.lineDate.toISOString(),
          typeLabel: "Mission SOS",
          interlocutor,
          status: normalizeMissionStatus(mission.status),
          address: mission.address,
          contactEmail: interlocutor,
          relatedBookingId: confirmedBooking?.id,
          title: mission.title,
          amount: this.calculateMissionAmount(mission),
          viewerSide: "REQUESTER",
          hasReview: (confirmedBooking?.reviews?.length ?? 0) > 0,
          invoiceUrl: confirmedBooking?.invoice ? `/invoices/${confirmedBooking.invoice.id}/download` : undefined,
        });
      }

      for (const booking of serviceBookings) {
        const allowDirectContact = hasConfirmedEngagement(booking.status);
        const interlocutor =
          getDirectContactValue(
            booking.service?.owner.email ?? booking.freelance?.email,
            allowDirectContact,
          );

        lines.push({
          lineId: booking.id,
          lineType: "SERVICE_BOOKING",
          date: booking.scheduledAt.toISOString(),
          typeLabel: getServiceTypeLabel(booking.service?.type),
          interlocutor,
          status: booking.status,
          address: SERVICE_ADDRESS_PLACEHOLDER,
          contactEmail: interlocutor,
          viewerSide: "REQUESTER",
          relatedBookingId: booking.id,
          title: booking.service?.title,
          amount: booking.service?.price,
          hasReview: (booking.reviews?.length ?? 0) > 0,
          invoiceUrl: booking.invoice ? `/invoices/${booking.invoice.id}/download` : undefined,
        });
      }
    } else {
      const [missionBookings, serviceBookings] = await this.prisma.$transaction([
        this.prisma.booking.findMany({
          where: {
            freelanceId: user.id,
            reliefMissionId: {
              not: null,
            },
          },
          orderBy: {
            scheduledAt: "asc",
          },
          select: {
            id: true,
            status: true,
            reliefMission: {
              select: {
                id: true,
                title: true,
                dateStart: true,
                dateEnd: true,
                slots: true,
                hourlyRate: true,
                address: true,
                status: true,
                establishment: {
                  select: {
                    email: true,
                  },
                },
              },
            },
            reviews: {
              where: { authorId: user.id },
              select: { id: true },
              take: 1,
            },
            invoice: {
              select: { id: true },
            },
          },
        }),
        this.prisma.booking.findMany({
          where: {
            serviceId: {
              not: null,
            },
            OR: [
              { freelanceId: user.id },
              { establishmentId: user.id },
            ],
          },
          orderBy: {
            scheduledAt: "asc",
          },
          select: {
            id: true,
            establishmentId: true,
            status: true,
            scheduledAt: true,
            establishment: {
              select: {
                email: true,
              },
            },
            service: {
              select: {
                title: true,
                price: true,
                type: true,
                owner: {
                  select: {
                    email: true,
                  },
                },
              },
            },
            reviews: {
              where: { authorId: user.id },
              select: { id: true },
              take: 1,
            },
            invoice: {
              select: { id: true },
            },
          },
        }),
      ]);

      for (const mb of missionBookings) {
        if (!mb.reliefMission) {
          continue;
        }

        const allowDirectContact = hasConfirmedEngagement(mb.status);
        const interlocutor = getDirectContactValue(
          mb.reliefMission.establishment.email,
          allowDirectContact,
        );
        const planning = this.getMissionPlanningSummary(mb.reliefMission);

        lines.push({
          lineId: mb.reliefMission.id,
          lineType: "MISSION",
          date: planning.lineDate.toISOString(),
          typeLabel: "Mission SOS",
          interlocutor,
          status: mb.status,
          address: mb.reliefMission.address,
          contactEmail: interlocutor,
          relatedBookingId: mb.id,
          title: mb.reliefMission.title,
          amount: this.calculateMissionAmount(mb.reliefMission),
          viewerSide: "PROVIDER",
          hasReview: (mb.reviews?.length ?? 0) > 0,
          invoiceUrl: mb.invoice ? `/invoices/${mb.invoice.id}/download` : undefined,
        });
      }

      for (const booking of serviceBookings) {
        const isRequester = booking.establishmentId === user.id;
        const allowDirectContact = hasConfirmedEngagement(booking.status);
        const interlocutor = isRequester
          ? getDirectContactValue(booking.service?.owner.email, allowDirectContact)
          : getDirectContactValue(booking.establishment.email, allowDirectContact);
        lines.push({
          lineId: booking.id,
          lineType: "SERVICE_BOOKING",
          date: booking.scheduledAt.toISOString(),
          typeLabel: getServiceTypeLabel(booking.service?.type),
          interlocutor,
          status: booking.status,
          address: SERVICE_ADDRESS_PLACEHOLDER,
          contactEmail: interlocutor,
          viewerSide: isRequester ? "REQUESTER" : "PROVIDER",
          relatedBookingId: booking.id,
          title: booking.service?.title,
          amount: booking.service?.price,
          hasReview: (booking.reviews?.length ?? 0) > 0,
          invoiceUrl: booking.invoice ? `/invoices/${booking.invoice.id}/download` : undefined,
        });
      }
    }

    const sortedLines = sortLinesByDate(lines);
    return {
      lines: sortedLines,
      nextStep: pickNextStep(sortedLines),
    };
  }

  async cancelBookingLine(
    input: CancelBookingLineDto,
    user: AuthenticatedUser,
  ): Promise<{ ok: true }> {
    if (input.lineType === "MISSION") {
      const mission = await this.prisma.reliefMission.findUnique({
        where: { id: input.lineId },
        select: {
          id: true,
          establishmentId: true,
        },
      });

      if (!mission) {
        throw new NotFoundException("Mission not found");
      }

      if (user.role === UserRole.ESTABLISHMENT && mission.establishmentId !== user.id) {
        throw new ForbiddenException("You cannot cancel this mission");
      }

      if (user.role === UserRole.FREELANCE) {
        // A freelance can only withdraw their own application, not cancel the whole mission
        const freelanceBooking = await this.prisma.booking.findFirst({
          where: {
            reliefMissionId: input.lineId,
            freelanceId: user.id,
            status: {
              in: [
                BookingStatus.PENDING,
                BookingStatus.CONFIRMED,
                BookingStatus.IN_PROGRESS,
              ],
            },
          },
          select: { id: true, status: true },
        });

        if (!freelanceBooking) {
          throw new ForbiddenException("You cannot cancel this mission");
        }

        if (freelanceBooking.status !== BookingStatus.PENDING) {
          throw new BadRequestException(FREELANCE_VALIDATED_MISSION_CANCEL_MESSAGE);
        }

        await this.prisma.booking.update({
          where: { id: freelanceBooking.id },
          data: { status: BookingStatus.CANCELLED },
        });

        return { ok: true };
      }

      // ESTABLISHMENT: cancel the whole mission and all pending/confirmed bookings.
      // If a CONFIRMED booking existed, one credit was previously consumed — refund it.
      await this.prisma.$transaction(async (tx) => {
        // Check for a confirmed booking BEFORE cancelling, to know if a credit refund is due.
        // At most one booking per mission can ever be CONFIRMED.
        const confirmedBooking = await tx.booking.findFirst({
          where: {
            reliefMissionId: input.lineId,
            status: BookingStatus.CONFIRMED,
          },
          select: { id: true },
        });

        await tx.reliefMission.update({
          where: { id: input.lineId },
          data: { status: ReliefMissionStatus.CANCELLED },
        });

        await tx.booking.updateMany({
          where: {
            reliefMissionId: input.lineId,
            status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
          },
          data: { status: BookingStatus.CANCELLED },
        });

        if (confirmedBooking) {
          // One credit was consumed when this booking was confirmed — refund it.
          await tx.profile.updateMany({
            where: { userId: user.id },
            data: { availableCredits: { increment: 1 } },
          });
        }
      });

      return { ok: true };
    }

    // Refus d'une candidature individuelle par bookingId (usage établissement)
    if (input.lineType === "BOOKING") {
      if (user.role !== UserRole.ESTABLISHMENT) {
        throw new ForbiddenException("Seul un établissement peut refuser une candidature");
      }

      const booking = await this.prisma.booking.findUnique({
        where: { id: input.lineId },
        select: {
          id: true,
          status: true,
          freelanceId: true,
          reliefMission: { select: { establishmentId: true } },
        },
      });

      if (!booking) {
        throw new NotFoundException("Candidature introuvable");
      }

      if (booking.reliefMission?.establishmentId !== user.id) {
        throw new ForbiddenException("Vous ne pouvez pas refuser cette candidature");
      }

      if (booking.status !== BookingStatus.PENDING) {
        throw new BadRequestException(
          "Seules les candidatures en attente peuvent être refusées",
        );
      }

      await this.prisma.booking.update({
        where: { id: input.lineId },
        data: { status: BookingStatus.CANCELLED },
      });

      return { ok: true };
    }

    const booking = await this.prisma.booking.findUnique({
      where: { id: input.lineId },
      select: {
        id: true,
        status: true,
        establishmentId: true,
        freelanceId: true,
      },
    });

    if (!booking) {
      throw new NotFoundException("Réservation introuvable.");
    }

    if (booking.establishmentId !== user.id && booking.freelanceId !== user.id) {
      throw new ForbiddenException("You cannot cancel this booking");
    }

    if (
      user.role === UserRole.FREELANCE &&
      (booking.status === BookingStatus.CONFIRMED ||
        booking.status === BookingStatus.IN_PROGRESS)
    ) {
      throw new BadRequestException(FREELANCE_VALIDATED_MISSION_CANCEL_MESSAGE);
    }

    await this.prisma.booking.update({
      where: { id: input.lineId },
      data: {
        status: BookingStatus.CANCELLED,
      },
    });

    return { ok: true };
  }

  async getBookingLineDetails(
    lineTypeRaw: string,
    lineId: string,
    user: AuthenticatedUser,
  ): Promise<BookingDetails> {
    const lineType = parseLineType(lineTypeRaw);

    if (lineType === "MISSION") {
      const mission = await this.prisma.reliefMission.findUnique({
        where: { id: lineId },
        select: {
          establishmentId: true,
          address: true,
          title: true,
          dateStart: true,
          dateEnd: true,
          slots: true,
          shift: true,
          hourlyRate: true,
          exactAddress: true,
          accessInstructions: true,
          hasTransmissions: true,
          transmissionTime: true,
          perks: true,
          establishment: {
            select: {
              email: true,
              profile: { select: { firstName: true, lastName: true, phone: true, companyName: true } },
            },
          },
          bookings: {
            orderBy: {
              createdAt: "desc",
            },
            select: {
              id: true,
              status: true,
              freelanceId: true,
              freelanceAcknowledged: true,
              freelance: {
                select: {
                  email: true,
                  profile: { select: { firstName: true, lastName: true, phone: true } },
                },
              },
            },
          },
        },
      });

      if (!mission) {
        throw new NotFoundException("Mission not found");
      }

      if (user.role === UserRole.ESTABLISHMENT && mission.establishmentId !== user.id) {
        throw new ForbiddenException("You cannot view this mission");
      }

      if (user.role === UserRole.FREELANCE) {
        const isParticipant = mission.bookings.some((booking) => booking.freelanceId === user.id);
        if (!isParticipant) {
          throw new ForbiddenException("You cannot view this mission");
        }
      }

      const confirmedBooking = mission.bookings.find(
        (booking) =>
          hasConfirmedEngagement(booking.status) && Boolean(booking.freelance?.email),
      );

      const allowMissionDirectContact =
        user.role === UserRole.ESTABLISHMENT
          ? Boolean(confirmedBooking)
          : Boolean(
              confirmedBooking &&
              confirmedBooking.freelanceId === user.id &&
              hasConfirmedEngagement(confirmedBooking.status),
            );

      const contactEmail =
        user.role === UserRole.ESTABLISHMENT
          ? getDirectContactValue(confirmedBooking?.freelance?.email, allowMissionDirectContact)
          : getDirectContactValue(mission.establishment.email, allowMissionDirectContact);

      // Check if the freelance is the confirmed one (for terrain info visibility)
      const isConfirmedFreelance =
        user.role === UserRole.FREELANCE &&
        confirmedBooking?.freelanceId === user.id &&
        hasConfirmedEngagement(confirmedBooking?.status);

      const details: BookingDetails = {
        address: mission.address,
        contactEmail,
        missionTitle: mission.title,
        dateStart: mission.dateStart.toISOString(),
        dateEnd: mission.dateEnd.toISOString(),
        planning: coerceMissionPlanning(mission.slots),
        shift: mission.shift ?? undefined,
        hourlyRate: mission.hourlyRate,
      };

      // Expose terrain/contact details only to confirmed parties
      if (allowMissionDirectContact) {
        const counterProfile = user.role === UserRole.ESTABLISHMENT
          ? confirmedBooking?.freelance?.profile
          : mission.establishment.profile;

        details.contactName = counterProfile
          ? `${counterProfile.firstName ?? ''} ${counterProfile.lastName ?? ''}`.trim()
          : undefined;
        details.contactPhone = counterProfile?.phone ?? undefined;
        details.accessInstructions = mission.accessInstructions ?? undefined;
        details.hasTransmissions = mission.hasTransmissions ?? undefined;
        details.transmissionTime = mission.transmissionTime ?? undefined;
        details.perks = mission.perks;
      }

      if (isConfirmedFreelance) {
        details.freelanceAcknowledged = confirmedBooking?.freelanceAcknowledged ?? false;
      }

      return details;
    }

    const booking = await this.prisma.booking.findUnique({
      where: { id: lineId },
      select: {
        establishmentId: true,
        freelanceId: true,
        status: true,
        establishment: {
          select: {
            email: true,
          },
        },
        service: {
          select: {
            ownerId: true,
            owner: {
              select: {
                email: true,
              },
            },
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException("Booking not found");
    }

    const isEstablishmentOwner = booking.establishmentId === user.id;
    const isFreelanceOwner = booking.freelanceId === user.id || booking.service?.ownerId === user.id;

    if (!isEstablishmentOwner && !isFreelanceOwner) {
      throw new ForbiddenException("You cannot view this booking");
    }

    const allowServiceDirectContact = hasConfirmedEngagement(booking.status);
    const contactEmail = isEstablishmentOwner
      ? getDirectContactValue(booking.service?.owner.email, allowServiceDirectContact)
      : getDirectContactValue(booking.establishment.email, allowServiceDirectContact);

    return {
      address: SERVICE_ADDRESS_PLACEHOLDER,
      contactEmail,
    };
  }

  async confirmBooking(
    bookingId: string,
    user: AuthenticatedUser,
  ): Promise<{ ok: true }> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        reliefMission: true,
        service: true,
        establishment: {
          select: { role: true },
        },
        invoice: {
          select: {
            id: true,
          },
        },
        quotes: {
          where: {
            status: "ACCEPTED",
          },
          orderBy: {
            acceptedAt: "desc",
          },
          take: 1,
          select: {
            totalTTC: true,
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException("Booking not found");
    }

    const isMissionEstablishment =
      booking.reliefMission && booking.reliefMission.establishmentId === user.id;
    const isServiceOwner =
      booking.service && booking.service.ownerId === user.id;

    if (!isMissionEstablishment && !isServiceOwner) {
      throw new ForbiddenException("Vous ne pouvez pas valider cette réservation.");
    }

    const canConfirmMission =
      booking.reliefMissionId != null && booking.status === BookingStatus.PENDING;
    const canConfirmService =
      booking.service != null &&
      (booking.status === BookingStatus.PENDING ||
        booking.status === BookingStatus.QUOTE_ACCEPTED);

    if (!canConfirmMission && !canConfirmService) {
      throw new BadRequestException("La réservation ne peut pas être validée à ce stade.");
    }

    const requesterId = booking.establishmentId;
    // Credits are only consumed when the requester is an ESTABLISHMENT.
    // A FREELANCE booking a service from another freelance bypasses credit deduction.
    const shouldConsumeCredit = booking.establishment?.role === UserRole.ESTABLISHMENT;

    if (booking.reliefMissionId) {
      const reliefMissionId = booking.reliefMissionId;

      await this.prisma.$transaction(async (tx) => {
        if (shouldConsumeCredit) {
          await this.consumeOneCreditOrThrow(tx, requesterId);
        }

        await tx.booking.update({
          where: { id: bookingId },
          data: { status: "CONFIRMED" },
        });

        await tx.reliefMission.update({
          where: { id: reliefMissionId },
          data: { status: ReliefMissionStatus.ASSIGNED },
        });

        await tx.booking.updateMany({
          where: {
            reliefMissionId,
            id: { not: bookingId },
            status: "PENDING",
          },
          data: { status: "CANCELLED" },
        });

        await this.createInvoiceOnConfirmation(tx, booking);
      });
    } else {
      await this.prisma.$transaction(async (tx) => {
        if (shouldConsumeCredit) {
          await this.consumeOneCreditOrThrow(tx, requesterId);
        }

        await tx.booking.update({
          where: { id: bookingId },
          data: { status: "CONFIRMED" },
        });

        await this.createInvoiceOnConfirmation(tx, booking);
      });
    }

    if (booking.reliefMissionId) {
      await this.runMissionConfirmationSideEffects(booking);
    } else if (booking.service) {
      if (booking.freelanceId) {
        const serviceConversation = await this.conversations.getOrCreateConversation(booking.freelanceId, booking.establishmentId);
        await this.prisma.conversation.updateMany({
          where: { id: serviceConversation.id, bookingId: null },
          data: { bookingId: bookingId },
        });
      }

      await this.notifications.create({
        userId: booking.establishmentId,
        message: `Votre réservation pour "${booking.service.title}" est confirmée. 1 crédit a été consommé et la facture est disponible.`,
        type: "SUCCESS",
      });
    }

    return { ok: true };
  }

  async completeBooking(
    bookingId: string,
    user: AuthenticatedUser,
  ): Promise<{ ok: true }> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        reliefMission: true,
        service: true,
        invoice: true,
      },
    });

    if (!booking) {
      throw new NotFoundException("Réservation introuvable.");
    }

    // Authorization: only the mission's establishment, the service owner,
    // or the booking's establishment may mark a booking as complete.
    const isMissionEstablishment =
      booking.reliefMission && booking.reliefMission.establishmentId === user.id;

    if (!isMissionEstablishment) {
      if (booking.service) {
        if (booking.service.ownerId !== user.id) {
          throw new ForbiddenException("Vous ne pouvez pas terminer cette réservation.");
        }
      } else {
        if (booking.establishmentId !== user.id) {
          throw new ForbiddenException("Vous ne pouvez pas terminer cette réservation.");
        }
      }
    }

    if (booking.status !== "CONFIRMED") {
      throw new BadRequestException("La réservation doit être confirmée avant d'être terminée.");
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.COMPLETED },
      });

      if (booking.reliefMissionId) {
        await tx.reliefMission.update({
          where: { id: booking.reliefMissionId },
          data: { status: ReliefMissionStatus.COMPLETED },
        });
      }
    });

    const bookingTitle = this.getBookingDisplayTitle(booking);
    const bookingKind = this.getBookingKindLabel(booking);
    const missionDateStr = booking.reliefMission?.dateStart
      ? format(booking.reliefMission.dateStart, "dd/MM/yyyy")
      : "récemment";

    if (booking.freelanceId && booking.reliefMission) {
      const freelance = await this.prisma.user.findUnique({ where: { id: booking.freelanceId } });

      await this.notifications.create({
        userId: booking.freelanceId,
        message: `La mission "${bookingTitle}" a été marquée comme terminée. Le paiement sera traité prochainement.`,
        type: "INFO",
      });

      if (freelance?.email) {
        this.mailService.sendMissionCompletedEmail(freelance.email, missionDateStr).catch(e => console.error(e));
        this.mailService.sendReviewInvitationEmail(freelance.email, bookingTitle).catch(e => console.error(e));
      }
    }

    const establishment = await this.prisma.user.findUnique({ where: { id: booking.establishmentId } });
    await this.notifications.create({
      userId: booking.establishmentId,
      message: `Le ${bookingKind} "${bookingTitle}" est marqué comme terminé. Vous pouvez finaliser le règlement si nécessaire.`,
      type: "INFO",
    });

    if (establishment?.email) {
      this.mailService.sendReviewInvitationEmail(establishment.email, bookingTitle).catch(e => console.error(e));
    }

    return { ok: true };
  }

  async markPaymentSettled(
    bookingId: string,
    user: AuthenticatedUser,
  ): Promise<{ ok: true }> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        reliefMission: true,
        service: true,
        invoice: true,
      },
    });

    if (!booking) throw new NotFoundException("Réservation introuvable.");

    if (booking.establishmentId !== user.id) {
      throw new ForbiddenException("Seul le demandeur peut valider le règlement manuel.");
    }

    if (booking.status !== BookingStatus.COMPLETED) {
      throw new BadRequestException("La réservation doit être terminée avant le suivi du règlement.");
    }

    await this.prisma.booking.update({
      where: { id: bookingId },
      data: { paymentStatus: "PAID", status: "PAID" },
    });

    // Notify Freelance
    if (booking.freelanceId) {
      await this.notifications.create({
        userId: booking.freelanceId,
        message: `Le paiement de votre réservation a été marqué comme réglé par le demandeur.`,
        type: "SUCCESS",
      });
    }

    // Sync Invoice status to PAID
    if (booking.invoice) {
      await this.prisma.invoice.update({
        where: { id: booking.invoice.id },
        data: { status: InvoiceStatus.PAID },
      });
    }

    return { ok: true };
  }

  async acknowledgeBooking(
    bookingId: string,
    user: AuthenticatedUser,
  ): Promise<{ ok: true }> {
    if (user.role !== UserRole.FREELANCE) {
      throw new ForbiddenException("Only a freelance can acknowledge a booking");
    }

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        status: true,
        freelanceId: true,
        freelanceAcknowledged: true,
        establishmentId: true,
        reliefMission: { select: { title: true } },
      },
    });

    if (!booking) {
      throw new NotFoundException("Booking not found");
    }

    if (booking.freelanceId !== user.id) {
      throw new ForbiddenException("This is not your booking");
    }

    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new BadRequestException("Booking must be confirmed to acknowledge");
    }

    // Idempotent — do nothing if already acknowledged
    if (!booking.freelanceAcknowledged) {
      await this.prisma.booking.update({
        where: { id: bookingId },
        data: { freelanceAcknowledged: true },
      });

      const missionTitle = booking.reliefMission?.title ?? 'Mission';

      await this.notifications.create({
        userId: booking.establishmentId,
        message: `Le freelance a confirmé sa venue pour la mission "${missionTitle}".`,
        type: "SUCCESS",
      });
    }

    return { ok: true };
  }

  // ── Order Tracker ──

  async getOrderTracker(
    bookingId: string,
    user: AuthenticatedUser,
  ): Promise<OrderTrackerData> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        establishment: {
          include: { profile: true },
        },
        freelance: {
          include: { profile: true },
        },
        reliefMission: true,
        service: true,
        invoice: true,
        reviews: {
          where: { authorId: user.id },
          take: 1,
          select: { id: true, rating: true, comment: true, createdAt: true },
        },
        quotes: {
          orderBy: { createdAt: "desc" },
          include: {
            lines: true,
            issuer: { include: { profile: true } },
          },
        },
        conversation: {
          include: {
            messages: {
              orderBy: { createdAt: "asc" },
              select: {
                id: true,
                content: true,
                senderId: true,
                type: true,
                metadata: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException("Booking not found");
    }

    // Access control: only the two parties
    const isRequester = booking.establishmentId === user.id;
    const isProvider = booking.freelanceId === user.id;
    if (!isRequester && !isProvider) {
      throw new ForbiddenException("You cannot view this order");
    }

    const allowDirectContact = hasConfirmedEngagement(booking.status);

    // Build participants
    const requester = this.toParticipant(
      booking.establishment,
      booking.establishment.role,
      allowDirectContact,
    );
    const provider = booking.freelance
      ? this.toParticipant(booking.freelance, booking.freelance.role, allowDirectContact)
      : { id: "", email: CONTACT_DETAILS_LOCKED, role: "FREELANCE" };

    // Build quotes
    const quotes = booking.quotes.map((q) => {
      const issuerProfile = q.issuer.profile;
      const issuerName = issuerProfile
        ? `${issuerProfile.firstName} ${issuerProfile.lastName}`.trim()
        : q.issuer.email;
      return {
        id: q.id,
        status: q.status,
        subtotalHT: q.subtotalHT,
        vatRate: q.vatRate,
        vatAmount: q.vatAmount,
        totalTTC: q.totalTTC,
        validUntil: q.validUntil?.toISOString(),
        conditions: q.conditions ?? undefined,
        notes: q.notes ?? undefined,
        createdAt: q.createdAt.toISOString(),
        acceptedAt: q.acceptedAt?.toISOString(),
        rejectedAt: q.rejectedAt?.toISOString(),
        issuer: { id: q.issuedBy, name: issuerName },
        lines: q.lines.map((l) => ({
          id: l.id,
          description: l.description,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          unit: l.unit,
          totalHT: l.totalHT,
        })),
      };
    });

    // Build conversation
    const conversation = booking.conversation
      ? {
          id: booking.conversation.id,
          messages: booking.conversation.messages.map((m) => ({
            id: m.id,
            content: m.content,
            senderId: m.senderId,
            type: m.type,
            metadata: m.metadata ?? undefined,
            createdAt: m.createdAt.toISOString(),
          })),
        }
      : undefined;

    // Build invoice
    const invoice = booking.invoice
      ? {
          id: booking.invoice.id,
          amount: booking.invoice.amount,
          status: booking.invoice.status,
          invoiceNumber: booking.invoice.invoiceNumber ?? undefined,
          createdAt: booking.invoice.createdAt.toISOString(),
        }
      : undefined;

    // Build mission/service
    const mission = booking.reliefMission
      ? {
          id: booking.reliefMission.id,
          title: booking.reliefMission.title,
          dateStart: booking.reliefMission.dateStart.toISOString(),
          dateEnd: booking.reliefMission.dateEnd.toISOString(),
          address: booking.reliefMission.address,
          hourlyRate: booking.reliefMission.hourlyRate,
          shift: booking.reliefMission.shift ?? undefined,
          description: booking.reliefMission.description ?? undefined,
          planning: coerceMissionPlanning(booking.reliefMission.slots),
          slots: coerceMissionPlanning(booking.reliefMission.slots),
        }
      : undefined;

    const service = booking.service
      ? {
          id: booking.service.id,
          title: booking.service.title,
          description: booking.service.description ?? undefined,
          price: booking.service.price,
          durationMinutes: booking.service.durationMinutes,
          pricingType: booking.service.pricingType,
          pricePerParticipant: booking.service.pricePerParticipant ?? undefined,
        }
      : undefined;

    // Build review
    const userReview = booking.reviews?.[0] ?? null;
    const review = userReview
      ? {
          id: userReview.id,
          rating: userReview.rating,
          comment: userReview.comment ?? undefined,
          createdAt: userReview.createdAt.toISOString(),
        }
      : undefined;

    // Build timeline
    const timeline = this.buildTimeline(booking, quotes, userReview);

    return {
      booking: {
        id: booking.id,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        message: booking.message ?? undefined,
        scheduledAt: booking.scheduledAt.toISOString(),
        nbParticipants: booking.nbParticipants ?? undefined,
        createdAt: booking.createdAt.toISOString(),
      },
      mission,
      service,
      requester,
      provider,
      freelance: provider,
      establishment: requester,
      conversation,
      quotes,
      timeline,
      invoice,
      review,
    };
  }

  private toParticipant(
    user: { id: string; email: string; profile?: { firstName: string; lastName: string; companyName?: string | null; avatar?: string | null; phone?: string | null } | null },
    role: string,
    allowDirectContact: boolean,
  ) {
    return {
      id: user.id,
      email: getDirectContactValue(user.email, allowDirectContact),
      role,
      firstName: user.profile?.firstName,
      lastName: user.profile?.lastName,
      companyName: user.profile?.companyName ?? undefined,
      avatar: user.profile?.avatar ?? undefined,
      phone: allowDirectContact ? (user.profile?.phone ?? undefined) : undefined,
    };
  }

  private buildTimeline(
    booking: { createdAt: Date; status: string; invoice?: { createdAt: Date } | null },
    quotes: { id: string; status: string; createdAt: string; acceptedAt?: string; rejectedAt?: string; issuer: { id: string; name: string } }[],
    review?: { createdAt: Date } | null,
  ): TimelineEvent[] {
    const events: TimelineEvent[] = [];

    // 1. Booking created
    events.push({
      id: "tl-created",
      type: "CREATED",
      label: "Commande créée",
      timestamp: booking.createdAt.toISOString(),
    });

    // 2. Quote events (oldest first → reverse since quotes are desc)
    const sortedQuotes = [...quotes].reverse();
    for (const q of sortedQuotes) {
      events.push({
        id: `tl-quote-sent-${q.id}`,
        type: "QUOTE_SENT",
        label: "Devis envoyé",
        actor: { id: q.issuer.id, name: q.issuer.name, role: "FREELANCE" },
        timestamp: q.createdAt,
      });

      if (q.status === "ACCEPTED" && q.acceptedAt) {
        events.push({
          id: `tl-quote-accepted-${q.id}`,
          type: "QUOTE_ACCEPTED",
          label: "Devis accepté",
          timestamp: q.acceptedAt,
        });
      }

      if (q.status === "REJECTED" && q.rejectedAt) {
        events.push({
          id: `tl-quote-rejected-${q.id}`,
          type: "QUOTE_REJECTED",
          label: "Devis refusé",
          timestamp: q.rejectedAt,
        });
      }
    }

    // 3. Status-derived events (only add if booking reached that status)
    const statusOrder: { status: string; type: TimelineEvent["type"]; label: string }[] = [
      { status: "CONFIRMED", type: "CONFIRMED", label: "Confirmé" },
      { status: "IN_PROGRESS", type: "IN_PROGRESS", label: "En cours" },
      { status: "COMPLETED", type: "COMPLETED", label: "Terminé" },
      { status: "PAID", type: "PAID", label: "Payé" },
      { status: "CANCELLED", type: "CANCELLED", label: "Annulé" },
    ];

    for (const s of statusOrder) {
      if (booking.status === s.status) {
        // Current status — push only the current and all "before" statuses that logically preceded it
        events.push({
          id: `tl-status-${s.status}`,
          type: s.type,
          label: s.label,
          timestamp: new Date().toISOString(), // approximation — we don't track status change dates on the booking
        });
        break;
      }
    }

    // 4. Invoice generated
    if (booking.invoice) {
      events.push({
        id: "tl-invoice",
        type: "INVOICE_GENERATED",
        label: "Facture générée",
        timestamp: booking.invoice.createdAt.toISOString(),
      });
    }

    // 5. Review submitted
    if (review) {
      events.push({
        id: "tl-review",
        type: "REVIEW_SUBMITTED",
        label: "Avis envoyé",
        timestamp: review.createdAt.toISOString(),
      });
    }

    // Sort by timestamp
    events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return events;
  }
}
