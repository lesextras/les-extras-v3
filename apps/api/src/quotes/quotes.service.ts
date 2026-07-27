import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateQuoteDto, RejectQuoteDto } from './dto/quotes.dto';
import { EventsService } from '../events/events.service';
import type { OrderEvent } from '../events/events.types';
import PDFDocument from 'pdfkit';
import type { AuthenticatedUser } from '../auth/types/jwt-payload.type';
import {
  calculateMissionPlanningHours,
  coerceMissionPlanning,
} from '../missions/mission-slots';

@Injectable()
export class QuotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly events: EventsService,
  ) {}

  /**
   * Generate a quote for a booking. Only the assigned freelance can do this.
   */
  async generateQuote(freelanceId: string, dto: CreateQuoteDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: dto.bookingId },
      include: {
        reliefMission: true,
        service: true,
        freelance: { include: { profile: true } },
        establishment: { include: { profile: true } },
      },
    });

    if (!booking) throw new NotFoundException('Booking introuvable.');
    if (booking.freelanceId !== freelanceId) {
      throw new ForbiddenException('Seul le freelance assigné peut créer un devis.');
    }
    if (booking.status !== 'PENDING' && booking.status !== 'QUOTE_SENT') {
      throw new BadRequestException('Un devis ne peut être envoyé qu\'à ce stade.');
    }

    // Mark any existing SENT quotes as REVISED
    await this.prisma.quote.updateMany({
      where: { bookingId: dto.bookingId, status: 'SENT' },
      data: { status: 'REVISED' },
    });

    const vatRate = 0;
    const lines = dto.lines.map((line) => {
      const totalHT = Math.round(line.quantity * line.unitPrice * 100) / 100;
      return { ...line, unit: line.unit ?? 'heure', totalHT };
    });
    const subtotalHT = Math.round(lines.reduce((sum, l) => sum + l.totalHT, 0) * 100) / 100;
    const vatAmount = Math.round(subtotalHT * vatRate * 100) / 100;
    const totalTTC = Math.round((subtotalHT + vatAmount) * 100) / 100;

    const quote = await this.prisma.quote.create({
      data: {
        bookingId: dto.bookingId,
        issuedBy: freelanceId,
        status: 'SENT',
        subtotalHT,
        vatRate,
        vatAmount,
        totalTTC,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
        conditions: dto.conditions,
        notes: dto.notes,
        lines: { create: lines },
      },
      include: { lines: true },
    });

    // Update booking status
    await this.prisma.booking.update({
      where: { id: dto.bookingId },
      data: { status: 'QUOTE_SENT' },
    });

    // Notify establishment
    await this.notifications.create({
      userId: booking.establishmentId,
      message: `Nouveau devis reçu (${totalTTC.toFixed(2)} €) — en attente de validation`,
      type: 'INFO',
    });

    // SSE event
    const sseEvent: OrderEvent = {
      type: 'QUOTE_SENT',
      bookingId: dto.bookingId,
      payload: { quoteId: quote.id, totalTTC },
      timestamp: new Date().toISOString(),
    };
    this.events.emitToMany([booking.establishmentId, freelanceId], sseEvent);

    return quote;
  }

  /**
   * Accept a quote. Only the requester of the booking can do this.
   */
  async acceptQuote(quoteId: string, requesterId: string) {
    const quote = await this.prisma.quote.findUnique({
      where: { id: quoteId },
      include: {
        booking: {
          include: {
            conversation: true,
            freelance: { include: { profile: true } },
            establishment: { include: { profile: true } },
          },
        },
      },
    });

    if (!quote) throw new NotFoundException('Devis introuvable.');
    if (quote.booking.establishmentId !== requesterId) {
      throw new ForbiddenException('Seul le demandeur peut accepter ce devis.');
    }
    if (quote.status !== 'SENT') {
      throw new BadRequestException('Ce devis ne peut plus être accepté.');
    }

    const now = new Date();
    await this.prisma.quote.update({
      where: { id: quoteId },
      data: { status: 'ACCEPTED', acceptedAt: now },
    });

    await this.prisma.booking.update({
      where: { id: quote.bookingId },
      data: { status: 'QUOTE_ACCEPTED' },
    });

    // System message
    if (quote.booking.conversation) {
      const estName = quote.booking.establishment?.profile?.firstName ?? 'Le demandeur';
      await this.prisma.message.create({
        data: {
          conversationId: quote.booking.conversation.id,
          senderId: requesterId,
          receiverId: quote.booking.freelanceId ?? requesterId,
          content: `✅ ${estName} a accepté le devis de ${quote.totalTTC.toFixed(2)} €`,
          type: 'SYSTEM',
          metadata: { quoteId, event: 'QUOTE_ACCEPTED' },
        },
      });
    }

    // Notify freelance
    if (quote.booking.freelanceId) {
      await this.notifications.create({
        userId: quote.booking.freelanceId,
        message: `Votre devis a été accepté (${quote.totalTTC.toFixed(2)} €)`,
        type: 'SUCCESS',
      });
    }

    // SSE event
    const userIds = [quote.booking.establishmentId, quote.booking.freelanceId].filter(Boolean) as string[];
    this.events.emitToMany(userIds, {
      type: 'QUOTE_ACCEPTED',
      bookingId: quote.bookingId,
      payload: { quoteId },
      timestamp: new Date().toISOString(),
    });

    return quote;
  }

  /**
   * Reject a quote. Only the requester can do this.
   */
  async rejectQuote(quoteId: string, requesterId: string, dto?: RejectQuoteDto) {
    const quote = await this.prisma.quote.findUnique({
      where: { id: quoteId },
      include: {
        booking: {
          include: {
            conversation: true,
            establishment: { include: { profile: true } },
          },
        },
      },
    });

    if (!quote) throw new NotFoundException('Devis introuvable.');
    if (quote.booking.establishmentId !== requesterId) {
      throw new ForbiddenException('Seul le demandeur peut refuser ce devis.');
    }
    if (quote.status !== 'SENT') {
      throw new BadRequestException('Ce devis ne peut plus être refusé.');
    }

    const now = new Date();
    await this.prisma.quote.update({
      where: { id: quoteId },
      data: { status: 'REJECTED', rejectedAt: now },
    });

    // Booking goes back to PENDING so freelance can revise
    await this.prisma.booking.update({
      where: { id: quote.bookingId },
      data: { status: 'PENDING' },
    });

    // System message
    if (quote.booking.conversation) {
      const estName = quote.booking.establishment?.profile?.firstName ?? 'Le demandeur';
      const reasonSuffix = dto?.reason ? ` — Motif : ${dto.reason}` : '';
      await this.prisma.message.create({
        data: {
          conversationId: quote.booking.conversation.id,
          senderId: requesterId,
          receiverId: quote.booking.freelanceId ?? requesterId,
          content: `❌ ${estName} a refusé le devis${reasonSuffix}`,
          type: 'SYSTEM',
          metadata: { quoteId, event: 'QUOTE_REJECTED', reason: dto?.reason },
        },
      });
    }

    // Notify freelance
    if (quote.booking.freelanceId) {
      await this.notifications.create({
        userId: quote.booking.freelanceId,
        message: `Votre devis a été refusé${dto?.reason ? ` — ${dto.reason}` : ''}`,
        type: 'WARNING',
      });
    }

    // SSE event
    const rejectUserIds = [quote.booking.establishmentId, quote.booking.freelanceId].filter(Boolean) as string[];
    this.events.emitToMany(rejectUserIds, {
      type: 'QUOTE_REJECTED',
      bookingId: quote.bookingId,
      payload: { quoteId, reason: dto?.reason },
      timestamp: new Date().toISOString(),
    });

    return quote;
  }

  /**
   * Get all quotes for a booking, ordered newest first.
   * Only the establishment or the assigned freelance can access these.
   */
  async getQuotesByBooking(bookingId: string, requesterId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      select: { establishmentId: true, freelanceId: true },
    });

    if (!booking) throw new NotFoundException('Booking introuvable.');

    const isParty =
      booking.establishmentId === requesterId ||
      booking.freelanceId === requesterId;

    if (!isParty) throw new ForbiddenException('Accès refusé.');

    return this.prisma.quote.findMany({
      where: { bookingId },
      include: { lines: true, issuer: { include: { profile: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get quote prefill data based on booking type.
   */
  async getQuotePrefill(bookingId: string, freelanceId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { reliefMission: true, service: true },
    });

    if (!booking) throw new NotFoundException('Booking introuvable.');
    if (booking.freelanceId !== freelanceId) {
      throw new ForbiddenException('Accès refusé.');
    }

    // Relief Mission: hours × hourlyRate
    if (booking.reliefMission) {
      const mission = booking.reliefMission;
      const planning = coerceMissionPlanning(mission.slots);
      const hours =
        calculateMissionPlanningHours(planning) ??
        Math.max(
          1,
          Math.round(
            ((mission.dateEnd.getTime() - mission.dateStart.getTime()) / (1000 * 60 * 60)) * 100,
          ) / 100,
        );

      return {
        lines: [
          {
            description: `${mission.title}${mission.shift ? ` — ${mission.shift}` : ''}`,
            quantity: hours,
            unitPrice: mission.hourlyRate,
            unit: 'heure',
          },
        ],
      };
    }

    // Service: depends on pricingType
    if (booking.service) {
      const svc = booking.service;
      if (svc.pricingType === 'SESSION') {
        return {
          lines: [
            {
              description: svc.title,
              quantity: 1,
              unitPrice: svc.price,
              unit: 'séance',
            },
          ],
        };
      }
      if (svc.pricingType === 'PER_PARTICIPANT' && svc.pricePerParticipant) {
        return {
          lines: [
            {
              description: `${svc.title} — par participant`,
              quantity: booking.nbParticipants ?? svc.capacity,
              unitPrice: svc.pricePerParticipant,
              unit: 'participant',
            },
          ],
        };
      }
      // QUOTE type: empty lines for manual fill
      return { lines: [] };
    }

    return { lines: [] };
  }

  /**
   * Generate a PDF for a quote.
   */
  async generateQuotePdf(quoteId: string, user: AuthenticatedUser): Promise<Buffer> {
    const quote = await this.prisma.quote.findUnique({
      where: { id: quoteId },
      include: {
        lines: true,
        issuer: { include: { profile: true } },
        booking: {
          include: {
            reliefMission: true,
            service: true,
            freelance: { include: { profile: true } },
            establishment: { include: { profile: true } },
          },
        },
      },
    });

    if (!quote) throw new NotFoundException('Devis introuvable.');

    const { booking } = quote;
    const isParty = booking.establishmentId === user.id || booking.freelanceId === user.id;
    if (!isParty) throw new ForbiddenException('Accès refusé.');

    return new Promise((resolve) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      // Header
      doc.fontSize(20).text('DEVIS', { align: 'center' });
      doc.moveDown();

      const refId = quote.id.substring(0, 8).toUpperCase();
      doc.fontSize(12).text(`Référence: DEV-${refId}`);
      doc.text(`Date: ${quote.createdAt.toLocaleDateString('fr-FR')}`);
      doc.text(`Statut: ${quote.status === 'ACCEPTED' ? 'ACCEPTÉ' : quote.status === 'REJECTED' ? 'REFUSÉ' : 'ENVOYÉ'}`);
      if (quote.validUntil) {
        doc.text(`Valide jusqu'au: ${quote.validUntil.toLocaleDateString('fr-FR')}`);
      }
      doc.moveDown();

      // Parties
      const estabProfile = booking.establishment?.profile;
      const freelanceProfile = booking.freelance?.profile;
      doc.text(`Client: ${estabProfile ? `${estabProfile.firstName} ${estabProfile.lastName}` : booking.establishment?.email ?? 'N/A'}`);
      doc.text(`Prestataire: ${freelanceProfile ? `${freelanceProfile.firstName} ${freelanceProfile.lastName}` : booking.freelance?.email ?? 'N/A'}`);
      doc.moveDown();

      // Subject
      const title = booking.reliefMission?.title ?? booking.service?.title ?? 'Prestation';
      doc.text(`Objet: ${title}`);
      doc.moveDown();

      // Lines table
      doc.font('Helvetica-Bold');
      doc.text('Description', 50, doc.y, { width: 220, continued: false });
      const headerY = doc.y - 14;
      doc.text('Qté', 280, headerY, { width: 50, align: 'right' });
      doc.text('P.U.', 340, headerY, { width: 60, align: 'right' });
      doc.text('Montant', 410, headerY, { width: 80, align: 'right' });
      doc.font('Helvetica');
      doc.moveDown(0.5);

      for (const line of quote.lines) {
        const lineY = doc.y;
        doc.text(line.description, 50, lineY, { width: 220 });
        doc.text(String(line.quantity), 280, lineY, { width: 50, align: 'right' });
        doc.text(`${line.unitPrice.toFixed(2)} €`, 340, lineY, { width: 60, align: 'right' });
        doc.text(`${line.totalHT.toFixed(2)} €`, 410, lineY, { width: 80, align: 'right' });
        doc.moveDown(0.3);
      }

      doc.moveDown();

      // Total (TVA 0% — subtotalHT === totalTTC)
      doc.font('Helvetica-Bold');
      doc.text(`Montant: ${quote.totalTTC.toFixed(2)} €`, { align: 'right' });
      doc.font('Helvetica');

      // Conditions
      if (quote.conditions) {
        doc.moveDown();
        doc.fontSize(10).text('Conditions:', { underline: true });
        doc.fontSize(10).text(quote.conditions);
      }

      if (quote.notes) {
        doc.moveDown();
        doc.fontSize(10).text('Notes:', { underline: true });
        doc.fontSize(10).text(quote.notes);
      }

      doc.end();
    });
  }
}
