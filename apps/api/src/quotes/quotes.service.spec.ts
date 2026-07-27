import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { QuotesService } from "./quotes.service";

describe("QuotesService", () => {
  const prisma = {
    booking: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    quote: {
      findMany: jest.fn(),
      updateMany: jest.fn(),
      create: jest.fn(),
    },
    conversation: {
      update: jest.fn(),
    },
    message: {
      create: jest.fn(),
    },
  } as any;

  const notifications = {
    create: jest.fn(),
  };

  const conversations = {
    getOrCreateConversation: jest.fn(),
  };

  const events = {
    emitToMany: jest.fn(),
  };

  let service: QuotesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new QuotesService(
      prisma,
      notifications as any,
      events as any,
    );
  });

  it("force la TVA à 0 et garde totalTTC = subtotalHT", async () => {
    prisma.booking.findUnique.mockResolvedValue({
      id: "booking-1",
      status: "PENDING",
      freelanceId: "free-1",
      establishmentId: "est-1",
      reliefMission: null,
      service: { title: "Atelier mémoire" },
      freelance: { profile: { firstName: "Nora" } },
      establishment: { profile: { firstName: "Samir" } },
      conversation: { id: "conv-1" },
    });
    prisma.quote.create.mockResolvedValue({
      id: "quote-1",
      status: "SENT",
      subtotalHT: 120,
      vatRate: 0,
      vatAmount: 0,
      totalTTC: 120,
      lines: [],
    });

    await service.generateQuote("free-1", {
      bookingId: "booking-1",
      lines: [
        {
          description: "Séance",
          quantity: 1,
          unitPrice: 120,
        },
      ],
      vatRate: 0.2,
    });

    expect(prisma.quote.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          subtotalHT: 120,
          vatRate: 0,
          vatAmount: 0,
          totalTTC: 120,
        }),
      }),
    );
    // generateQuote sends a notification to the establishment — the amount
    // display uses toFixed(2), not "TTC" label (TVA is 0).
    expect(notifications.create).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.not.stringContaining("TTC"),
      }),
    );
    // generateQuote does NOT create system messages — that happens in acceptQuote.
    expect(prisma.message.create).not.toHaveBeenCalled();
  });

  // ── P0-1 regression: getQuotesByBooking authorization ──────────

  describe("getQuotesByBooking", () => {
    it("retourne les quotes pour l'établissement du booking", async () => {
      prisma.booking.findUnique.mockResolvedValue({
        establishmentId: "est-1",
        freelanceId: "free-1",
      });
      prisma.quote.findMany.mockResolvedValue([{ id: "q-1" }]);

      const result = await service.getQuotesByBooking("booking-1", "est-1");
      expect(result).toEqual([{ id: "q-1" }]);
    });

    it("retourne les quotes pour le freelance du booking", async () => {
      prisma.booking.findUnique.mockResolvedValue({
        establishmentId: "est-1",
        freelanceId: "free-1",
      });
      prisma.quote.findMany.mockResolvedValue([{ id: "q-1" }]);

      const result = await service.getQuotesByBooking("booking-1", "free-1");
      expect(result).toEqual([{ id: "q-1" }]);
    });

    it("lève ForbiddenException pour un utilisateur non participant (IDOR fix)", async () => {
      prisma.booking.findUnique.mockResolvedValue({
        establishmentId: "est-1",
        freelanceId: "free-1",
      });

      await expect(
        service.getQuotesByBooking("booking-1", "attacker-id"),
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.quote.findMany).not.toHaveBeenCalled();
    });

    it("lève NotFoundException si le booking n'existe pas", async () => {
      prisma.booking.findUnique.mockResolvedValue(null);

      await expect(
        service.getQuotesByBooking("ghost-id", "est-1"),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.quote.findMany).not.toHaveBeenCalled();
    });
  });
});
