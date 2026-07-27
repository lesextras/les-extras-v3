import { Test, TestingModule } from "@nestjs/testing";
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { ConversationsService } from "./conversations.service";
import { PrismaService } from "../prisma/prisma.service";
import { MailService } from "../mail/mail.service";
import { EventsService } from "../events/events.service";

const mockPrismaService = {
  booking: {
    findFirst: jest.fn(),
  },
  conversation: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  message: {
    findMany: jest.fn(),
    create: jest.fn(),
    updateMany: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
  contactBypassEvent: {
    create: jest.fn(),
  },
};

describe("ConversationsService", () => {
  let service: ConversationsService;
  let prisma: typeof mockPrismaService;
  let mailService: MailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConversationsService,
        { provide: PrismaService, useValue: mockPrismaService },
        {
          provide: MailService,
          useValue: {
            sendMessageNotificationEmail: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: EventsService,
          useValue: {
            emit: jest.fn(),
            emitToMany: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ConversationsService>(ConversationsService);
    prisma = module.get(PrismaService);
    mailService = module.get<MailService>(MailService);

    jest.clearAllMocks();
  });

  describe("sendMessage", () => {
    it("crée une conversation si elle n'existe pas et envoie le message", async () => {
      prisma.booking.findFirst.mockResolvedValue({ id: "booking-1" });
      prisma.user.findUnique
        .mockResolvedValueOnce({ id: "user-2", email: "receiver@example.com" })
        .mockResolvedValueOnce({
          id: "user-1",
          email: "sender@example.com",
          profile: { firstName: "Aya" },
        });
      prisma.conversation.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ bookingId: null });
      prisma.conversation.create.mockResolvedValue({ id: "conv-1" });
      prisma.message.create.mockResolvedValue({ id: "msg-1", content: "hello" });

      await service.sendMessage("user-1", { receiverId: "user-2", content: "hello" });

      expect(prisma.conversation.create).toHaveBeenCalledWith({
        data: {
          participantAId: "user-1",
          participantBId: "user-2",
        },
      });
      expect(prisma.message.create).toHaveBeenCalledWith({
        data: {
          content: "hello",
          senderId: "user-1",
          receiverId: "user-2",
          conversationId: "conv-1",
        },
      });
      expect(mailService.sendMessageNotificationEmail).toHaveBeenCalledWith(
        "receiver@example.com",
        "Aya",
      );
    });

    it("bloque l'envoi si aucun achat validé ne relie les deux utilisateurs", async () => {
      prisma.booking.findFirst.mockResolvedValue(null);

      await expect(
        service.sendMessage("user-1", { receiverId: "user-2", content: "Bonjour" }),
      ).rejects.toThrow(ForbiddenException);
    });

    it("lève NotFoundException si le destinataire n'existe pas", async () => {
      prisma.booking.findFirst.mockResolvedValue({ id: "booking-1" });
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.sendMessage("user-1", { receiverId: "ghost", content: "test" }),
      ).rejects.toThrow(NotFoundException);
    });

    it.each([
      [
        "EMAIL",
        "contactez-moi sur jo@example.com",
        "Le partage d'adresse email n'est pas autorisé dans la messagerie.",
      ],
      [
        "PHONE",
        "appelez-moi au +33 6 12 34 56 78",
        "Le partage de numéro de téléphone n'est pas autorisé dans la messagerie.",
      ],
      [
        "WHATSAPP",
        "on passe sur whatsapp ?",
        "Le partage de coordonnées de messagerie externe n'est pas autorisé.",
      ],
      [
        "TELEGRAM",
        "écris-moi sur telegram",
        "Le partage de coordonnées de messagerie externe n'est pas autorisé.",
      ],
      [
        "EXTERNAL_URL",
        "voici mon site https://example.com",
        "Le partage de lien externe n'est pas autorisé dans la messagerie.",
      ],
    ])(
      "bloque et journalise une tentative %s",
      async (blockedReason, content, expectedMessage) => {
        prisma.booking.findFirst.mockResolvedValue({ id: "booking-1" });
        prisma.user.findUnique.mockResolvedValue({ id: "user-2", email: "receiver@example.com" });
        prisma.conversation.findUnique.mockResolvedValue({ id: "conv-existing" });
        prisma.contactBypassEvent.create.mockResolvedValue({ id: "event-1" });

        await expect(
          service.sendMessage("user-1", { receiverId: "user-2", content }),
        ).rejects.toThrow(new BadRequestException(expectedMessage));

        expect(prisma.contactBypassEvent.create).toHaveBeenCalledWith({
          data: {
            conversationId: "conv-existing",
            senderId: "user-1",
            blockedReason,
            rawExcerpt: content.trim().slice(0, 240),
          },
        });
        expect(prisma.message.create).not.toHaveBeenCalled();
        expect(prisma.conversation.create).not.toHaveBeenCalled();
      },
    );
  });

  describe("findMessages", () => {
    it("retourne les messages si l'utilisateur fait partie de la conversation", async () => {
      prisma.conversation.findUnique.mockResolvedValue({
        id: "conv-1",
        participantAId: "user-1",
        participantBId: "user-2",
      });
      prisma.message.findMany.mockResolvedValue([{ id: "msg-1" }]);

      const messages = await service.findMessages("conv-1", "user-1");
      expect(messages).toHaveLength(1);
    });

    it("lève ForbiddenException si l'utilisateur n'a pas accès à la conversation", async () => {
      prisma.conversation.findUnique.mockResolvedValue({
        id: "conv-1",
        participantAId: "user-1",
        participantBId: "user-2",
      });

      await expect(service.findMessages("conv-1", "hacker")).rejects.toThrow(ForbiddenException);
    });
  });
});
