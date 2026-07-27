import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  DeskRequestPriority,
  DeskRequestStatus,
  DeskRequestType,
  ReliefMissionStatus,
  UserRole,
} from "@prisma/client";
import { MailService } from "../mail/mail.service";
import { PrismaService } from "../prisma/prisma.service";
import { AssignDeskRequestDto } from "./dto/assign-desk-request.dto";
import {
  CreateDeskRequestDto,
  USER_DESK_REQUEST_TYPES,
} from "./dto/create-desk-request.dto";
import { CreateFinanceIncidentDto } from "./dto/create-finance-incident.dto";
import { SendAdminOutreachDto } from "./dto/send-admin-outreach.dto";
import { UpdateDeskRequestStatusDto } from "./dto/update-desk-request-status.dto";
import { RespondDeskRequestDto } from "./dto/respond-desk-request.dto";

const FINANCE_INCIDENT_TYPES: DeskRequestType[] = [
  DeskRequestType.PAYMENT_ISSUE,
  DeskRequestType.BOOKING_FAILURE,
  DeskRequestType.PACK_PURCHASE_FAILURE,
  DeskRequestType.MISSION_PUBLISH_FAILURE,
];

const REQUESTER_SELECT = {
  id: true,
  email: true,
  role: true,
  profile: { select: { firstName: true, lastName: true } },
};

const MISSION_SELECT = {
  id: true,
  title: true,
};

const BOOKING_SELECT = {
  id: true,
  status: true,
  paymentStatus: true,
  reliefMission: { select: { title: true } },
  service: { select: { title: true } },
  establishment: {
    select: {
      id: true,
      email: true,
      profile: { select: { firstName: true, lastName: true } },
    },
  },
};

const ANSWERED_BY_SELECT = {
  id: true,
  email: true,
  profile: { select: { firstName: true, lastName: true } },
};

const ADMIN_SELECT = ANSWERED_BY_SELECT;

function getDisplayName(user: {
  email: string;
  profile: { firstName: string; lastName: string } | null;
}) {
  if (user.profile) {
    return `${user.profile.firstName} ${user.profile.lastName}`.trim();
  }

  return user.email;
}

function getIncidentContextLabel(request: {
  mission: { title: string } | null;
  type: string;
}) {
  if (request.mission?.title) {
    return `la mission « ${request.mission.title} »`;
  }
  const labels: Record<string, string> = {
    MISSION_INFO_REQUEST: "votre demande",
    PAYMENT_ISSUE: "votre incident de paiement",
    BOOKING_FAILURE: "votre incident de réservation",
    PACK_PURCHASE_FAILURE: "votre incident d'achat de pack",
    MISSION_PUBLISH_FAILURE: "votre incident de publication de mission",
    TECHNICAL_ISSUE: "votre demande technique",
    USER_REPORT: "votre signalement",
    LITIGE: "votre litige",
  };
  return labels[request.type] ?? "votre demande";
}

@Injectable()
export class DeskService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  async findAll() {
    return this.prisma.deskRequest.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        mission: { select: MISSION_SELECT },
        booking: { select: BOOKING_SELECT },
        requester: { select: REQUESTER_SELECT },
        assignedToAdmin: { select: ADMIN_SELECT },
        answeredBy: { select: ANSWERED_BY_SELECT },
      },
    });
  }

  async findMine(requesterId: string) {
    return this.prisma.deskRequest.findMany({
      where: { requesterId },
      orderBy: { createdAt: "desc" },
      include: {
        mission: { select: MISSION_SELECT },
        booking: {
          select: {
            id: true,
            status: true,
            paymentStatus: true,
            reliefMission: { select: { title: true } },
            service: { select: { title: true } },
          },
        },
        answeredBy: { select: ANSWERED_BY_SELECT },
      },
    });
  }

  async createUserRequest(requesterId: string, dto: CreateDeskRequestDto) {
    const type = dto.type as DeskRequestType;
    if (
      !USER_DESK_REQUEST_TYPES.includes(
        dto.type as (typeof USER_DESK_REQUEST_TYPES)[number],
      )
    ) {
      throw new BadRequestException("Type de demande invalide pour ce canal");
    }

    const bookingId = dto.bookingId?.trim() || null;
    const missionId = dto.missionId?.trim() || null;

    if (bookingId) {
      const booking = await this.prisma.booking.findFirst({
        where: {
          id: bookingId,
          OR: [
            { establishmentId: requesterId },
            { freelanceId: requesterId },
            { service: { ownerId: requesterId } },
          ],
        },
        select: { id: true },
      });

      if (!booking) {
        throw new NotFoundException("Réservation liée introuvable");
      }
    }

    if (missionId) {
      const mission = await this.prisma.reliefMission.findFirst({
        where: {
          id: missionId,
          OR: [
            { establishmentId: requesterId },
            { status: ReliefMissionStatus.OPEN },
            {
              bookings: {
                some: {
                  OR: [
                    { establishmentId: requesterId },
                    { freelanceId: requesterId },
                  ],
                },
              },
            },
          ],
        },
        select: { id: true },
      });

      if (!mission) {
        throw new NotFoundException("Mission liée introuvable");
      }
    }

    return this.prisma.deskRequest.create({
      data: {
        type,
        requesterId,
        bookingId,
        missionId,
        priority: DeskRequestPriority.NORMAL,
        status: DeskRequestStatus.OPEN,
        message: dto.message.trim(),
      },
    });
  }

  async findContactBypassEvents() {
    const events = await this.prisma.contactBypassEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true,
        conversationId: true,
        blockedReason: true,
        rawExcerpt: true,
        createdAt: true,
        conversation: { select: { bookingId: true } },
        sender: {
          select: {
            ...REQUESTER_SELECT,
            role: true,
            status: true,
          },
        },
      },
    });

    return events.map((event) => ({
      id: event.id,
      conversationId: event.conversationId,
      bookingId: event.conversation?.bookingId ?? null,
      blockedReason: event.blockedReason,
      rawExcerpt: event.rawExcerpt,
      createdAt: event.createdAt.toISOString(),
      sender: {
        id: event.sender.id,
        email: event.sender.email,
        name: getDisplayName(event.sender),
        role: event.sender.role,
        status: event.sender.status,
      },
    }));
  }

  async createFinanceIncident(adminId: string, dto: CreateFinanceIncidentDto) {
    const type = dto.type as DeskRequestType;
    if (!FINANCE_INCIDENT_TYPES.includes(type)) {
      throw new BadRequestException("Type d'incident invalide pour ce canal");
    }

    const requester = await this.prisma.user.findFirst({
      where: { email: dto.requesterEmail },
      select: { id: true, role: true, email: true },
    });

    if (!requester) {
      throw new NotFoundException(`Utilisateur introuvable : ${dto.requesterEmail}`);
    }

    if (requester.role === UserRole.ADMIN) {
      throw new BadRequestException("Un admin ne peut pas être le requérant d'un incident");
    }

    const bookingId = dto.bookingId?.trim() || null;
    if (bookingId) {
      const booking = await this.prisma.booking.findFirst({
        where: {
          id: bookingId,
          OR: [
            { establishmentId: requester.id },
            { freelanceId: requester.id },
            { service: { ownerId: requester.id } },
          ],
        },
        select: { id: true },
      });

      if (!booking) {
        throw new NotFoundException("Réservation liée introuvable");
      }
    }

    const incident = await this.prisma.$transaction(async (tx) => {
      const created = await tx.deskRequest.create({
        data: {
          type,
          priority: (dto.priority as DeskRequestPriority) ?? DeskRequestPriority.NORMAL,
          message: dto.message.trim(),
          requesterId: requester.id,
          bookingId,
        },
      });

      await tx.adminActionLog.create({
        data: {
          adminId,
          entityType: "DESK_REQUEST",
          entityId: created.id,
          action: "FINANCE_INCIDENT_CREATE",
          meta: {
            type: dto.type,
            requesterEmail: requester.email,
            bookingId,
          },
        },
      });

      return created;
    });

    return incident;
  }

  async sendAdminOutreach(userId: string, adminId: string, dto: SendAdminOutreachDto) {
    if (userId === adminId) {
      throw new BadRequestException("Un admin ne peut pas s'envoyer un message Desk");
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        profile: { select: { firstName: true, lastName: true } },
      },
    });

    if (!user) {
      throw new NotFoundException("Utilisateur introuvable");
    }

    if (user.role === UserRole.ADMIN) {
      throw new BadRequestException("Le canal Desk cible uniquement les utilisateurs non-admin");
    }

    const message = dto.message.trim();
    if (message.length < 5) {
      throw new BadRequestException("Le message Desk est trop court");
    }
    const notifyByEmail = dto.notifyByEmail ?? true;
    const notificationMessage = `Message du Desk : ${message}`;

    await this.prisma.$transaction([
      this.prisma.notification.create({
        data: {
          userId: user.id,
          type: "INFO",
          message: notificationMessage,
        },
      }),
      this.prisma.adminActionLog.create({
        data: {
          adminId,
          entityType: "USER",
          entityId: user.id,
          action: "USER_OUTREACH_SEND",
          meta: {
            origin: dto.origin ?? null,
            contextId: dto.contextId ?? null,
            notifyByEmail,
            targetRole: user.role,
            targetStatus: user.status,
            messagePreview: message.slice(0, 160),
          },
        },
      }),
    ]);

    if (notifyByEmail && user.email) {
      this.mailService
        .sendAdminOutreachEmail(user.email, getDisplayName(user), message)
        .catch((error: unknown) => console.error(error));
    }

    return { ok: true };
  }

  async monitorContactBypassEvent(id: string, adminId: string) {
    const event = await this.prisma.contactBypassEvent.findUnique({
      where: { id },
      select: {
        id: true,
        senderId: true,
        blockedReason: true,
        conversationId: true,
      },
    });

    if (!event) {
      throw new NotFoundException("Événement de contournement introuvable");
    }

    await this.prisma.adminActionLog.create({
      data: {
        adminId,
        entityType: "CONTACT_BYPASS_EVENT",
        entityId: id,
        action: "CONTACT_BYPASS_MONITOR",
        meta: {
          senderId: event.senderId,
          blockedReason: event.blockedReason,
          conversationId: event.conversationId,
        },
      },
    });

    return { ok: true };
  }

  async updateStatus(id: string, adminId: string, dto: UpdateDeskRequestStatusDto) {
    const request = await this.prisma.deskRequest.findUnique({
      where: { id },
      select: { id: true, status: true },
    });
    if (!request) throw new NotFoundException("Demande introuvable");

    const [updated] = await this.prisma.$transaction([
      this.prisma.deskRequest.update({
        where: { id },
        data: { status: dto.status },
      }),
      this.prisma.adminActionLog.create({
        data: {
          adminId,
          entityType: "DESK_REQUEST",
          entityId: id,
          action: "DESK_REQUEST_STATUS_UPDATE",
          meta: {
            previousStatus: request.status,
            nextStatus: dto.status,
          },
        },
      }),
    ]);

    return updated;
  }

  async assign(id: string, adminId: string, dto: AssignDeskRequestDto) {
    const nextAssignedToAdminId = dto.adminId?.trim() || null;
    const request = await this.prisma.deskRequest.findUnique({
      where: { id },
      select: { id: true, assignedToAdminId: true },
    });
    if (!request) throw new NotFoundException("Demande introuvable");

    if (nextAssignedToAdminId) {
      const assignedAdmin = await this.prisma.user.findFirst({
        where: { id: nextAssignedToAdminId, role: UserRole.ADMIN },
        select: { id: true },
      });
      if (!assignedAdmin) throw new NotFoundException("Admin introuvable");
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.deskRequest.update({
        where: { id },
        data: { assignedToAdminId: nextAssignedToAdminId },
      }),
      this.prisma.adminActionLog.create({
        data: {
          adminId,
          entityType: "DESK_REQUEST",
          entityId: id,
          action: "DESK_REQUEST_ASSIGN",
          meta: {
            previousAssignedToAdminId: request.assignedToAdminId,
            nextAssignedToAdminId,
          },
        },
      }),
    ]);

    return updated;
  }

  async respond(id: string, adminId: string, dto: RespondDeskRequestDto) {
    const request = await this.prisma.deskRequest.findUnique({
      where: { id },
      select: {
        id: true,
        requesterId: true,
        missionId: true,
        type: true,
        status: true,
        response: true,
        mission: { select: { title: true } },
      },
    });
    if (!request) throw new NotFoundException("Demande introuvable");

    const contextLabel = getIncidentContextLabel(request);

    const [updated] = await this.prisma.$transaction([
      this.prisma.deskRequest.update({
        where: { id },
        data: {
          response: dto.response,
          answeredById: adminId,
          answeredAt: new Date(),
          status: DeskRequestStatus.ANSWERED,
        },
      }),
      this.prisma.notification.create({
        data: {
          userId: request.requesterId,
          type: "INFO",
          message: `Votre demande concernant ${contextLabel} a reçu une réponse. Consultez-la dans votre espace Mes demandes.`,
        },
      }),
      this.prisma.adminActionLog.create({
        data: {
          adminId,
          entityType: "DESK_REQUEST",
          entityId: id,
          action: "DESK_REQUEST_RESPOND",
          meta: {
            previousStatus: request.status,
            nextStatus: DeskRequestStatus.ANSWERED,
            hadExistingResponse: Boolean(request.response),
          },
        },
      }),
    ]);

    return updated;
  }
}
