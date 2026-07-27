import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { BookingStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateServiceDto } from "./dto/create-service.dto";
import { UpdateServiceDto } from "./dto/update-service.dto";
import { MailService } from "../mail/mail.service";
import { format } from "date-fns";

const ACTIVE_SERVICE_BOOKING_STATUSES: BookingStatus[] = [
  BookingStatus.PENDING,
  BookingStatus.QUOTE_SENT,
  BookingStatus.QUOTE_ACCEPTED,
  BookingStatus.CONFIRMED,
  BookingStatus.IN_PROGRESS,
];

const SERVICE_CAPACITY_UNAVAILABLE_MESSAGE =
  "La capacité disponible est insuffisante pour cette date.";

function getUtcDayWindow(date: Date): { start: Date; end: Date } {
  const start = new Date(date);
  start.setUTCHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  return { start, end };
}

const PUBLIC_SERVICE_OWNER_SELECT = {
  id: true,
  profile: {
    select: {
      firstName: true,
      lastName: true,
      avatar: true,
      jobTitle: true,
      bio: true,
    },
  },
};

const PUBLIC_SERVICE_LIST_SELECT = {
  id: true,
  title: true,
  description: true,
  price: true,
  type: true,
  capacity: true,
  pricingType: true,
  pricePerParticipant: true,
  durationMinutes: true,
  category: true,
  publicCible: true,
  materials: true,
  objectives: true,
  methodology: true,
  evaluation: true,
  slots: true,
  imageUrl: true,
  scheduleInfo: true,
  owner: {
    select: PUBLIC_SERVICE_OWNER_SELECT,
  },
};

const PUBLIC_SERVICE_DETAIL_SELECT = {
  ...PUBLIC_SERVICE_LIST_SELECT,
  ownerId: true,
  status: true,
  isHidden: true,
};

@Injectable()
export class ServicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  async findAll() {
    return this.prisma.service.findMany({
      where: {
        status: "ACTIVE",
        isHidden: false,
      },
      select: PUBLIC_SERVICE_LIST_SELECT,
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async findOne(id: string, requesterId: string) {
    const service = await this.prisma.service.findUnique({
      where: { id },
      select: PUBLIC_SERVICE_DETAIL_SELECT,
    });

    if (!service) {
      throw new NotFoundException("Service not found");
    }

    if ((service.status !== "ACTIVE" || service.isHidden) && service.ownerId !== requesterId) {
      throw new NotFoundException("Service not found");
    }

    const { ownerId: _ownerId, status: _status, isHidden: _isHidden, ...publicService } = service;
    return publicService;
  }

  async findMyServices(ownerId: string) {
    return this.prisma.service.findMany({
      where: { ownerId },
      include: {
        bookings: {
          select: {
            id: true,
            status: true,
            scheduledAt: true,
            nbParticipants: true,
            establishment: {
              select: {
                id: true,
                profile: { select: { firstName: true, lastName: true, companyName: true } },
              },
            },
          },
          orderBy: { scheduledAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async createService(dto: CreateServiceDto, ownerId: string) {
    return this.prisma.service.create({
      data: {
        title: dto.title,
        description: dto.description,
        price: dto.price,
        capacity: dto.capacity,
        durationMinutes: dto.durationMinutes ?? 120,
        category: dto.category,
        type: dto.type,
        status: dto.status ?? "ACTIVE",
        pricingType: dto.pricingType,
        publicCible: dto.publicCible ?? [],
        slots: dto.slots ? (dto.slots as any) : null,
        pricePerParticipant: dto.pricePerParticipant,
        materials: dto.materials,
        objectives: dto.objectives,
        methodology: dto.methodology,
        evaluation: dto.evaluation,
        imageUrl: dto.imageUrl,
        scheduleInfo: dto.scheduleInfo,
        ownerId,
      },
    });
  }

  async updateService(id: string, dto: UpdateServiceDto, ownerId: string) {
    const service = await this.prisma.service.findUnique({
      where: { id },
      select: { ownerId: true },
    });

    if (!service) throw new NotFoundException("Service not found");
    if (service.ownerId !== ownerId) throw new ForbiddenException("Not your service");

    return this.prisma.service.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.price !== undefined && { price: dto.price }),
        ...(dto.capacity !== undefined && { capacity: dto.capacity }),
        ...(dto.durationMinutes !== undefined && { durationMinutes: dto.durationMinutes }),
        ...(dto.category !== undefined && { category: dto.category }),
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.pricingType !== undefined && { pricingType: dto.pricingType }),
        ...(dto.publicCible !== undefined && { publicCible: dto.publicCible }),
        ...(dto.slots !== undefined && { slots: dto.slots as any }),
        ...(dto.pricePerParticipant !== undefined && { pricePerParticipant: dto.pricePerParticipant }),
        ...(dto.materials !== undefined && { materials: dto.materials }),
        ...(dto.objectives !== undefined && { objectives: dto.objectives }),
        ...(dto.methodology !== undefined && { methodology: dto.methodology }),
        ...(dto.evaluation !== undefined && { evaluation: dto.evaluation }),
        ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
        ...(dto.scheduleInfo !== undefined && { scheduleInfo: dto.scheduleInfo }),
        ...(dto.status !== undefined && { status: dto.status }),
      },
    });
  }

  async deleteService(id: string, ownerId: string) {
    const service = await this.prisma.service.findUnique({
      where: { id },
      select: { ownerId: true, _count: { select: { bookings: true } } },
    });

    if (!service) throw new NotFoundException("Service not found");
    if (service.ownerId !== ownerId) throw new ForbiddenException("Not your service");

    // If has bookings, archive instead of hard-delete
    if (service._count.bookings > 0) {
      return this.prisma.service.update({
        where: { id },
        data: { status: "ARCHIVED" },
      });
    }

    return this.prisma.service.delete({ where: { id } });
  }

  async duplicateService(id: string, ownerId: string) {
    const source = await this.prisma.service.findUnique({
      where: { id },
      select: {
        ownerId: true, title: true, description: true, price: true, capacity: true,
        durationMinutes: true, category: true, type: true, pricingType: true,
        publicCible: true, slots: true, pricePerParticipant: true, materials: true,
        objectives: true, methodology: true, evaluation: true, imageUrl: true, scheduleInfo: true,
      },
    });

    if (!source) throw new NotFoundException("Service not found");
    if (source.ownerId !== ownerId) throw new ForbiddenException("Not your service");

    return this.prisma.service.create({
      data: {
        title: `Copie de ${source.title}`,
        description: source.description,
        price: source.price,
        capacity: source.capacity,
        durationMinutes: source.durationMinutes,
        category: source.category,
        type: source.type,
        status: "DRAFT",
        pricingType: source.pricingType,
        publicCible: source.publicCible,
        slots: source.slots ?? undefined,
        pricePerParticipant: source.pricePerParticipant,
        materials: source.materials,
        objectives: source.objectives,
        methodology: source.methodology,
        evaluation: source.evaluation,
        imageUrl: source.imageUrl,
        scheduleInfo: source.scheduleInfo,
        ownerId,
      },
    });
  }

  async bookService(
    serviceId: string,
    requesterId: string,
    date: Date,
    message?: string,
    nbParticipants?: number,
  ) {
    const normalizedParticipants = nbParticipants ?? 1;
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
      select: {
        id: true,
        title: true,
        ownerId: true,
        status: true,
        capacity: true,
        type: true,
      },
    });

    if (!service) {
      throw new NotFoundException("Service introuvable.");
    }

    if (service.status !== "ACTIVE") {
      throw new BadRequestException(
        "Ce service n'est plus disponible à la réservation.",
      );
    }

    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException("La date de réservation est invalide.");
    }

    if (date.getTime() <= Date.now()) {
      throw new BadRequestException("La date de réservation ne peut pas être dans le passé.");
    }

    if (requesterId === service.ownerId) {
      throw new BadRequestException("Vous ne pouvez pas réserver votre propre service.");
    }

    if (!Number.isInteger(normalizedParticipants) || normalizedParticipants < 1) {
      throw new BadRequestException("Le nombre de participants doit être supérieur ou égal à 1.");
    }

    if (normalizedParticipants > service.capacity) {
      throw new BadRequestException(
        `Le nombre de participants ne peut pas dépasser la capacité maximale de ce service (${service.capacity}).`,
      );
    }

    // Block duplicate requests while a booking is still active for this service.
    const existingBooking = await this.prisma.booking.findFirst({
      where: {
        serviceId,
        establishmentId: requesterId,
        status: {
          in: ACTIVE_SERVICE_BOOKING_STATUSES,
        },
      },
      select: { id: true },
    });

    if (existingBooking) {
      throw new ConflictException(
        "Vous avez déjà une demande active pour ce service.",
      );
    }

    const { start, end } = getUtcDayWindow(date);
    const activeBookingsOnSameDate = await this.prisma.booking.findMany({
      where: {
        serviceId,
        scheduledAt: {
          gte: start,
          lt: end,
        },
        status: {
          in: ACTIVE_SERVICE_BOOKING_STATUSES,
        },
      },
      select: { nbParticipants: true },
    });

    const bookedParticipants = activeBookingsOnSameDate.reduce(
      (total, booking) => total + (booking.nbParticipants ?? 1),
      0,
    );

    if (bookedParticipants + normalizedParticipants > service.capacity) {
      throw new ConflictException(SERVICE_CAPACITY_UNAVAILABLE_MESSAGE);
    }

    const booking = await this.prisma.booking.create({
      data: {
        status: BookingStatus.PENDING,
        establishmentId: requesterId,
        freelanceId: service.ownerId,
        serviceId: service.id,
        scheduledAt: date,
        message,
        nbParticipants: normalizedParticipants,
      },
    });

    // Notify the requester asynchronously without blocking booking creation.
    const requester = await this.prisma.user.findUnique({
      where: { id: requesterId },
      select: { email: true },
    });

    if (requester?.email) {
      const dateStr = format(date, "dd/MM/yyyy");
      this.mailService
        .sendWorkshopBookingEmail(requester.email, service.title, dateStr)
        .catch((e: unknown) => console.error("workshopBookingEmail failed:", e));
    }

    return booking;
  }
}
