import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import {
  BookingStatus,
  DeskRequestType,
  InvoiceStatus,
  PaymentStatus,
  QuoteStatus,
  ReliefMissionStatus,
  UserRole,
  UserStatus,
} from "@prisma/client";
import { AuthenticatedUser } from "../auth/types/jwt-payload.type";
import { BookingsService } from "../bookings/bookings.service";
import { PrismaService } from "../prisma/prisma.service";
import {
  AdminMissionCandidate,
  AdminMissionConversationMessage,
  AdminMissionDetail,
  AdminMissionLinkedBooking,
  AdminMissionRow,
  AdminMissionStakeholder,
  AdminMissionTimelineEvent,
  AdminServiceDetail,
  AdminServiceRow,
} from "./types/admin-offers.types";

const ACTIVE_MISSION_BOOKING_STATUSES = [
  BookingStatus.CONFIRMED,
  BookingStatus.IN_PROGRESS,
  BookingStatus.COMPLETED,
  BookingStatus.AWAITING_PAYMENT,
  BookingStatus.PAID,
] as const;

function getDisplayName(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  email: string,
  companyName?: string | null,
) {
  const name = companyName?.trim() || [firstName, lastName].filter(Boolean).join(" ").trim();
  return name || email;
}

function toMessageExcerpt(message: string, maxLength = 140) {
  const normalized = message.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
}

function isActiveMissionBooking(status: BookingStatus) {
  return ACTIVE_MISSION_BOOKING_STATUSES.includes(
    status as (typeof ACTIVE_MISSION_BOOKING_STATUSES)[number],
  );
}

function getStakeholder(
  user:
    | {
        id: string;
        email: string;
        profile?: {
          firstName?: string | null;
          lastName?: string | null;
          companyName?: string | null;
        } | null;
      }
    | null
    | undefined,
): AdminMissionStakeholder | null {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: getDisplayName(
      user.profile?.firstName,
      user.profile?.lastName,
      user.email,
      user.profile?.companyName,
    ),
  };
}

function getLatestQuote<
  T extends {
    id: string;
    status: QuoteStatus;
    totalTTC: number;
    createdAt: Date;
    acceptedAt: Date | null;
    rejectedAt?: Date | null;
  },
>(quotes: T[]) {
  return quotes[0] ?? null;
}

function getAcceptedQuote<
  T extends {
    id: string;
    status: QuoteStatus;
    totalTTC: number;
    createdAt: Date;
    acceptedAt: Date | null;
    rejectedAt?: Date | null;
  },
>(quotes: T[]) {
  return quotes.find((quote) => quote.status === QuoteStatus.ACCEPTED) ?? null;
}

function toConversationMessages(
  messages: Array<{
    id: string;
    type: "USER" | "SYSTEM";
    content: string;
    createdAt: Date;
    sender: {
      email: string;
      profile: {
        firstName: string | null;
        lastName: string | null;
        companyName?: string | null;
      } | null;
    };
  }>,
): AdminMissionConversationMessage[] {
  return messages.map((message) => ({
    id: message.id,
    type: message.type,
    contentExcerpt: toMessageExcerpt(message.content, 160),
    createdAt: message.createdAt.toISOString(),
    senderName: getDisplayName(
      message.sender.profile?.firstName,
      message.sender.profile?.lastName,
      message.sender.email,
      message.sender.profile?.companyName,
    ),
  }));
}

@Injectable()
export class AdminOffersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bookingsService: BookingsService,
  ) {}

  async getMissions(): Promise<AdminMissionRow[]> {
    const missions = await this.prisma.reliefMission.findMany({
      where: {
        status: {
          in: [ReliefMissionStatus.OPEN, ReliefMissionStatus.ASSIGNED],
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        title: true,
        address: true,
        status: true,
        createdAt: true,
        dateStart: true,
        dateEnd: true,
        hourlyRate: true,
        establishment: {
          select: {
            email: true,
            profile: {
              select: {
                companyName: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        bookings: {
          where: {
            status: {
              not: BookingStatus.CANCELLED,
            },
          },
          select: {
            id: true,
          },
        },
      },
    });

    return missions.map((mission) => ({
      id: mission.id,
      title: mission.title,
      address: mission.address,
      status: mission.status,
      createdAt: mission.createdAt.toISOString(),
      dateStart: mission.dateStart.toISOString(),
      dateEnd: mission.dateEnd.toISOString(),
      hourlyRate: mission.hourlyRate,
      establishmentName: getDisplayName(
        mission.establishment.profile?.firstName,
        mission.establishment.profile?.lastName,
        mission.establishment.email,
        mission.establishment.profile?.companyName,
      ),
      establishmentEmail: mission.establishment.email,
      candidatesCount: mission.bookings.length,
    }));
  }

  async getMissionById(missionId: string): Promise<AdminMissionDetail> {
    const mission = await this.prisma.reliefMission.findUnique({
      where: { id: missionId },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        address: true,
        city: true,
        shift: true,
        dateStart: true,
        dateEnd: true,
        hourlyRate: true,
        establishmentId: true,
        establishment: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                companyName: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        bookings: {
          orderBy: {
            createdAt: "asc",
          },
          select: {
            id: true,
            status: true,
            paymentStatus: true,
            message: true,
            scheduledAt: true,
            proposedRate: true,
            freelanceAcknowledged: true,
            createdAt: true,
            updatedAt: true,
            freelance: {
              select: {
                id: true,
                email: true,
                profile: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
            invoice: {
              select: {
                id: true,
                status: true,
                amount: true,
                invoiceNumber: true,
                createdAt: true,
                updatedAt: true,
              },
            },
            quotes: {
              orderBy: {
                createdAt: "desc",
              },
              select: {
                id: true,
                status: true,
                totalTTC: true,
                createdAt: true,
                acceptedAt: true,
                rejectedAt: true,
              },
            },
            conversation: {
              select: {
                id: true,
                createdAt: true,
                updatedAt: true,
                messages: {
                  orderBy: {
                    createdAt: "desc",
                  },
                  take: 3,
                  select: {
                    id: true,
                    type: true,
                    content: true,
                    createdAt: true,
                    sender: {
                      select: {
                        email: true,
                        profile: {
                          select: {
                            companyName: true,
                            firstName: true,
                            lastName: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        deskRequests: {
          orderBy: {
            createdAt: "asc",
          },
          select: {
            id: true,
            type: true,
            status: true,
            priority: true,
            createdAt: true,
            message: true,
            requester: {
              select: {
                id: true,
                email: true,
                profile: {
                  select: {
                    firstName: true,
                    lastName: true,
                    companyName: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!mission) {
      throw new NotFoundException("Mission not found");
    }

    const linkedBookingSource =
      mission.bookings.find((booking) => isActiveMissionBooking(booking.status)) ?? null;
    const activeBookingExists = linkedBookingSource != null;

    const candidates: AdminMissionCandidate[] = mission.bookings.map((booking) => {
      const latestQuote = getLatestQuote(booking.quotes);

      return {
        bookingId: booking.id,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        createdAt: booking.createdAt.toISOString(),
        proposedRate: booking.proposedRate ?? null,
        freelanceAcknowledged: booking.freelanceAcknowledged,
        canAssign:
          booking.status === BookingStatus.PENDING &&
          !activeBookingExists &&
          mission.status !== ReliefMissionStatus.CANCELLED &&
          mission.status !== ReliefMissionStatus.COMPLETED,
        freelance: getStakeholder(booking.freelance),
        latestQuote: latestQuote
          ? {
              id: latestQuote.id,
              status: latestQuote.status,
              totalTTC: latestQuote.totalTTC,
              createdAt: latestQuote.createdAt.toISOString(),
              acceptedAt: latestQuote.acceptedAt?.toISOString() ?? null,
            }
          : null,
      };
    });

    const linkedBooking = linkedBookingSource
      ? this.toLinkedBooking(linkedBookingSource)
      : null;
    const acceptedQuote = linkedBookingSource ? getAcceptedQuote(linkedBookingSource.quotes) : null;
    const latestLinkedQuote = linkedBookingSource ? getLatestQuote(linkedBookingSource.quotes) : null;

    return {
      id: mission.id,
      title: mission.title,
      status: mission.status,
      createdAt: mission.createdAt.toISOString(),
      updatedAt: mission.updatedAt.toISOString(),
      establishmentName: getDisplayName(
        mission.establishment.profile?.firstName,
        mission.establishment.profile?.lastName,
        mission.establishment.email,
        mission.establishment.profile?.companyName,
      ),
      establishmentEmail: mission.establishment.email,
      establishmentId: mission.establishment.id,
      address: mission.address,
      city: mission.city,
      shift: mission.shift,
      dateStart: mission.dateStart.toISOString(),
      dateEnd: mission.dateEnd.toISOString(),
      hourlyRate: mission.hourlyRate,
      candidatesCount: mission.bookings.length,
      proposedTotalTTC:
        linkedBookingSource?.invoice?.amount ??
        acceptedQuote?.totalTTC ??
        latestLinkedQuote?.totalTTC ??
        null,
      attentionItems: this.buildAttentionItems({
        missionStatus: mission.status,
        bookings: mission.bookings.map((booking) => ({
          id: booking.id,
          status: booking.status,
          paymentStatus: booking.paymentStatus,
          freelanceAcknowledged: booking.freelanceAcknowledged,
        })),
        openDeskRequestsCount: mission.deskRequests.filter(
          (deskRequest) =>
            deskRequest.status === "OPEN" || deskRequest.status === "IN_PROGRESS",
        ).length,
      }),
      assignedFreelance: getStakeholder(linkedBookingSource?.freelance),
      linkedBooking,
      candidates,
      timeline: this.buildMissionTimeline({
        mission: {
          id: mission.id,
          title: mission.title,
          status: mission.status,
          createdAt: mission.createdAt,
          updatedAt: mission.updatedAt,
        },
        bookings: mission.bookings,
        deskRequests: mission.deskRequests,
      }),
      linkedDeskRequests: mission.deskRequests.map((deskRequest) => ({
        id: deskRequest.id,
        type: deskRequest.type,
        status: deskRequest.status,
        priority: deskRequest.priority,
        createdAt: deskRequest.createdAt.toISOString(),
        messageExcerpt: toMessageExcerpt(deskRequest.message),
        requester: getStakeholder(deskRequest.requester),
      })),
    };
  }

  private toLinkedBooking(booking: {
    id: string;
    status: BookingStatus;
    paymentStatus: PaymentStatus;
    message: string | null;
    scheduledAt: Date;
    proposedRate: number | null;
    freelanceAcknowledged: boolean;
    createdAt: Date;
    invoice: {
      id: string;
      status: InvoiceStatus;
      amount: number;
      invoiceNumber: string | null;
      createdAt: Date;
      updatedAt: Date;
    } | null;
    quotes: Array<{
      id: string;
      status: QuoteStatus;
      totalTTC: number;
      createdAt: Date;
      acceptedAt: Date | null;
      rejectedAt: Date | null;
    }>;
    freelance: {
      id: string;
      email: string;
      profile: {
        firstName: string | null;
        lastName: string | null;
      } | null;
    } | null;
    conversation: {
      id: string;
      createdAt: Date;
      updatedAt: Date;
      messages: Array<{
        id: string;
        type: "USER" | "SYSTEM";
        content: string;
        createdAt: Date;
        sender: {
          email: string;
          profile: {
            firstName: string | null;
            lastName: string | null;
            companyName?: string | null;
          } | null;
        };
      }>;
    } | null;
  }): AdminMissionLinkedBooking {
    const latestQuote = getLatestQuote(booking.quotes);
    const recentMessages = booking.conversation ? toConversationMessages(booking.conversation.messages) : [];
    const lastMessage = recentMessages[0] ?? null;

    return {
      id: booking.id,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      scheduledAt: booking.scheduledAt.toISOString(),
      createdAt: booking.createdAt.toISOString(),
      message: booking.message,
      proposedRate: booking.proposedRate ?? null,
      freelanceAcknowledged: booking.freelanceAcknowledged,
      assignedFreelance: getStakeholder(booking.freelance),
      conversation: booking.conversation
        ? {
            id: booking.conversation.id,
            createdAt: booking.conversation.createdAt.toISOString(),
            lastMessageAt: lastMessage?.createdAt ?? null,
            lastMessageExcerpt: lastMessage?.contentExcerpt ?? null,
            recentMessages,
          }
        : null,
      invoice: booking.invoice
        ? {
            id: booking.invoice.id,
            status: booking.invoice.status,
            amount: booking.invoice.amount,
            invoiceNumber: booking.invoice.invoiceNumber ?? null,
            createdAt: booking.invoice.createdAt.toISOString(),
            updatedAt: booking.invoice.updatedAt.toISOString(),
          }
        : null,
      latestQuote: latestQuote
        ? {
            id: latestQuote.id,
            status: latestQuote.status,
            totalTTC: latestQuote.totalTTC,
            createdAt: latestQuote.createdAt.toISOString(),
            acceptedAt: latestQuote.acceptedAt?.toISOString() ?? null,
            rejectedAt: latestQuote.rejectedAt?.toISOString() ?? null,
          }
        : null,
    };
  }

  private buildAttentionItems(input: {
    missionStatus: ReliefMissionStatus;
    bookings: Array<{
      id: string;
      status: BookingStatus;
      paymentStatus: PaymentStatus;
      freelanceAcknowledged: boolean;
    }>;
    openDeskRequestsCount: number;
  }) {
    const items: string[] = [];
    const pendingCandidatesCount = input.bookings.filter(
      (booking) => booking.status === BookingStatus.PENDING,
    ).length;
    const activeBooking = input.bookings.find((booking) => isActiveMissionBooking(booking.status));
    const completedBooking = input.bookings.find(
      (booking) =>
        booking.status === BookingStatus.COMPLETED ||
        booking.status === BookingStatus.AWAITING_PAYMENT,
    );

    if (input.bookings.length === 0) {
      items.push("Aucune candidature reçue pour le moment.");
    }

    if (!activeBooking && pendingCandidatesCount > 0) {
      items.push(
        `${pendingCandidatesCount} candidature(s) en attente d'arbitrage avant attribution.`,
      );
    }

    if (
      activeBooking?.status === BookingStatus.CONFIRMED &&
      !activeBooking.freelanceAcknowledged
    ) {
      items.push("Le freelance assigné n'a pas encore confirmé sa venue.");
    }

    if (completedBooking && completedBooking.paymentStatus !== PaymentStatus.PAID) {
      items.push("Mission terminée, règlement encore en attente.");
    }

    if (input.openDeskRequestsCount > 0) {
      items.push(`${input.openDeskRequestsCount} ticket(s) Desk encore ouvert(s).`);
    }

    if (input.missionStatus === ReliefMissionStatus.CANCELLED) {
      items.push("Mission annulée par la plateforme.");
    }

    return items;
  }

  private buildMissionTimeline(input: {
    mission: {
      id: string;
      title: string;
      status: ReliefMissionStatus;
      createdAt: Date;
      updatedAt: Date;
    };
    bookings: Array<{
      id: string;
      status: BookingStatus;
      paymentStatus: PaymentStatus;
      createdAt: Date;
      updatedAt: Date;
      freelanceAcknowledged: boolean;
      freelance: {
        id: string;
        email: string;
        profile: {
          firstName: string | null;
          lastName: string | null;
        } | null;
      } | null;
      invoice: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
      } | null;
      quotes: Array<{
        id: string;
        status: QuoteStatus;
        totalTTC: number;
        createdAt: Date;
        acceptedAt: Date | null;
      }>;
      conversation: {
        id: string;
        createdAt: Date;
      } | null;
    }>;
    deskRequests: Array<{
      id: string;
      type: DeskRequestType;
      status: string;
      priority: string;
      createdAt: Date;
      requester?: {
        id: string;
        email: string;
        profile: {
          firstName: string | null;
          lastName: string | null;
          companyName?: string | null;
        } | null;
      } | null;
    }>;
  }): AdminMissionTimelineEvent[] {
    const events: AdminMissionTimelineEvent[] = [
      {
        id: `mission-created-${input.mission.id}`,
        type: "MISSION_CREATED",
        label: "Mission créée",
        timestamp: input.mission.createdAt.toISOString(),
      },
    ];

    input.bookings.forEach((booking) => {
      events.push({
        id: `candidate-${booking.id}`,
        type: "CANDIDATE_RECEIVED",
        label: "Candidature reçue",
        description: getStakeholder(booking.freelance)?.name ?? "Freelance en attente",
        timestamp: booking.createdAt.toISOString(),
      });

      const latestQuote = getLatestQuote(booking.quotes);
      if (latestQuote) {
        events.push({
          id: `quote-sent-${latestQuote.id}`,
          type: "QUOTE_SENT",
          label: "Devis lié à la mission",
          description: `Statut ${latestQuote.status.toLowerCase()}`,
          timestamp: latestQuote.createdAt.toISOString(),
        });
      }

      const acceptedQuote = getAcceptedQuote(booking.quotes);
      if (acceptedQuote?.acceptedAt) {
        events.push({
          id: `quote-accepted-${acceptedQuote.id}`,
          type: "QUOTE_ACCEPTED",
          label: "Devis accepté",
          timestamp: acceptedQuote.acceptedAt.toISOString(),
        });
      }

      if (isActiveMissionBooking(booking.status)) {
        events.push({
          id: `mission-assigned-${booking.id}`,
          type: "MISSION_ASSIGNED",
          label: "Mission assignée",
          description: getStakeholder(booking.freelance)?.name ?? "Freelance assigné",
          timestamp: booking.updatedAt.toISOString(),
        });

        events.push({
          id: `booking-confirmed-${booking.id}`,
          type: "BOOKING_CONFIRMED",
          label: "Booking confirmé",
          timestamp: booking.updatedAt.toISOString(),
        });
      }

      if (booking.conversation) {
        events.push({
          id: `conversation-${booking.conversation.id}`,
          type: "CONVERSATION_LINKED",
          label: "Conversation liée",
          timestamp: booking.conversation.createdAt.toISOString(),
        });
      }

      if (booking.invoice) {
        events.push({
          id: `payment-${booking.id}`,
          type: booking.paymentStatus === PaymentStatus.PAID ? "PAYMENT_PAID" : "PAYMENT_PENDING",
          label: booking.paymentStatus === PaymentStatus.PAID ? "Paiement réglé" : "Paiement en attente",
          timestamp:
            booking.paymentStatus === PaymentStatus.PAID
              ? booking.invoice.updatedAt.toISOString()
              : booking.invoice.createdAt.toISOString(),
        });
      }
    });

    input.deskRequests.forEach((deskRequest) => {
      events.push({
        id: `desk-${deskRequest.id}`,
        type: "DESK_REQUEST_OPENED",
        label: "Ticket Desk ouvert",
        description: `${deskRequest.type.toLowerCase()} / ${deskRequest.priority.toLowerCase()} / ${deskRequest.status.toLowerCase()}`,
        timestamp: deskRequest.createdAt.toISOString(),
      });
    });

    if (input.mission.status === ReliefMissionStatus.COMPLETED) {
      events.push({
        id: `mission-completed-${input.mission.id}`,
        type: "MISSION_COMPLETED",
        label: "Mission terminée",
        timestamp: input.mission.updatedAt.toISOString(),
      });
    }

    if (input.mission.status === ReliefMissionStatus.CANCELLED) {
      events.push({
        id: `mission-cancelled-${input.mission.id}`,
        type: "MISSION_CANCELLED",
        label: "Mission annulée",
        timestamp: input.mission.updatedAt.toISOString(),
      });
    }

    return events.sort(
      (left, right) => new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime(),
    );
  }

  async deleteMission(missionId: string, adminId: string): Promise<{ ok: true }> {
    const mission = await this.prisma.reliefMission.findUnique({
      where: { id: missionId },
      select: { id: true, status: true },
    });

    if (!mission) {
      throw new NotFoundException("Mission not found");
    }

    if (mission.status === ReliefMissionStatus.CANCELLED) {
      await this.prisma.adminActionLog.create({
        data: {
          adminId,
          entityType: "MISSION",
          entityId: missionId,
          action: "MISSION_DELETE",
          meta: {
            previousStatus: mission.status,
            nextStatus: ReliefMissionStatus.CANCELLED,
            alreadyCancelled: true,
          },
        },
      });
      return { ok: true };
    }

    await this.prisma.$transaction([
      this.prisma.reliefMission.update({
        where: { id: missionId },
        data: {
          status: ReliefMissionStatus.CANCELLED,
        },
      }),
      this.prisma.booking.updateMany({
        where: {
          reliefMissionId: missionId,
          status: {
            in: [BookingStatus.PENDING, BookingStatus.CONFIRMED],
          },
        },
        data: {
          status: BookingStatus.CANCELLED,
        },
      }),
      this.prisma.adminActionLog.create({
        data: {
          adminId,
          entityType: "MISSION",
          entityId: missionId,
          action: "MISSION_DELETE",
          meta: {
            previousStatus: mission.status,
            nextStatus: ReliefMissionStatus.CANCELLED,
          },
        },
      }),
    ]);

    return { ok: true };
  }

  async reassignMission(
    missionId: string,
    bookingId: string,
    adminId: string,
  ): Promise<{ ok: true }> {
    const mission = await this.prisma.reliefMission.findUnique({
      where: { id: missionId },
      select: {
        id: true,
        title: true,
        status: true,
        establishmentId: true,
        bookings: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    if (!mission) {
      throw new NotFoundException("Mission not found");
    }

    if (
      mission.status === ReliefMissionStatus.CANCELLED ||
      mission.status === ReliefMissionStatus.COMPLETED
    ) {
      throw new BadRequestException("La mission ne peut plus être arbitrée.");
    }

    const targetBooking = mission.bookings.find((booking) => booking.id === bookingId);
    if (!targetBooking) {
      throw new NotFoundException("Booking introuvable pour cette mission.");
    }

    if (targetBooking.status !== BookingStatus.PENDING) {
      throw new BadRequestException("Seule une candidature en attente peut être arbitrée.");
    }

    const hasActiveAssignment = mission.bookings.some(
      (booking) => booking.id !== bookingId && isActiveMissionBooking(booking.status),
    );
    if (hasActiveAssignment) {
      throw new BadRequestException(
        "Une attribution est déjà confirmée sur cette mission. Annulez-la proprement avant toute réattribution.",
      );
    }

    const establishmentProxy: AuthenticatedUser = {
      id: mission.establishmentId,
      email: "desk-mission-proxy@lesextras.local",
      role: UserRole.ESTABLISHMENT,
      status: UserStatus.VERIFIED,
      onboardingStep: 0,
    };

    await this.bookingsService.confirmBooking(bookingId, establishmentProxy);

    await this.prisma.adminActionLog.create({
      data: {
        adminId,
        entityType: "MISSION",
        entityId: missionId,
        action: "MISSION_REASSIGN",
        meta: {
          bookingId,
          missionTitle: mission.title,
          previousStatus: mission.status,
          nextStatus: ReliefMissionStatus.ASSIGNED,
          strategy: "PENDING_CANDIDATE_CONFIRMATION",
        },
      },
    });

    return { ok: true };
  }

  async getServices(): Promise<AdminServiceRow[]> {
    const services = await this.prisma.service.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        type: true,
        isFeatured: true,
        isHidden: true,
        createdAt: true,
        owner: {
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
    });

    return services.map((service) => ({
      id: service.id,
      title: service.title,
      description: service.description,
      price: service.price,
      type: service.type,
      isFeatured: service.isFeatured,
      isHidden: service.isHidden,
      createdAt: service.createdAt.toISOString(),
      freelanceName: getDisplayName(
        service.owner.profile?.firstName,
        service.owner.profile?.lastName,
        service.owner.email,
      ),
      freelanceEmail: service.owner.email,
    }));
  }

  async getServiceById(serviceId: string): Promise<AdminServiceDetail> {
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
      select: {
        id: true,
        title: true,
        type: true,
        price: true,
        isFeatured: true,
        isHidden: true,
        description: true,
        createdAt: true,
        owner: {
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
    });

    if (!service) {
      throw new NotFoundException("Service not found");
    }

    return {
      id: service.id,
      title: service.title,
      type: service.type,
      price: service.price,
      freelanceName: getDisplayName(
        service.owner.profile?.firstName,
        service.owner.profile?.lastName,
        service.owner.email,
      ),
      freelanceEmail: service.owner.email,
      isFeatured: service.isFeatured,
      isHidden: service.isHidden,
      description: service.description,
      createdAt: service.createdAt.toISOString(),
    };
  }

  async featureService(serviceId: string, adminId: string): Promise<{ ok: true }> {
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
      select: { id: true, isFeatured: true },
    });

    if (!service) {
      throw new NotFoundException("Service not found");
    }

    const nextIsFeatured = !service.isFeatured;

    await this.prisma.$transaction([
      this.prisma.service.update({
        where: { id: serviceId },
        data: { isFeatured: nextIsFeatured },
      }),
      this.prisma.adminActionLog.create({
        data: {
          adminId,
          entityType: "SERVICE",
          entityId: serviceId,
          action: "SERVICE_FEATURE",
          meta: {
            previousIsFeatured: service.isFeatured,
            nextIsFeatured,
          },
        },
      }),
    ]);

    return { ok: true };
  }

  async hideService(serviceId: string, adminId: string): Promise<{ ok: true }> {
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
      select: { id: true, isHidden: true },
    });

    if (!service) {
      throw new NotFoundException("Service not found");
    }

    const nextIsHidden = !service.isHidden;

    await this.prisma.$transaction([
      this.prisma.service.update({
        where: { id: serviceId },
        data: { isHidden: nextIsHidden },
      }),
      this.prisma.adminActionLog.create({
        data: {
          adminId,
          entityType: "SERVICE",
          entityId: serviceId,
          action: "SERVICE_HIDE",
          meta: {
            previousIsHidden: service.isHidden,
            nextIsHidden,
          },
        },
      }),
    ]);

    return { ok: true };
  }
}
