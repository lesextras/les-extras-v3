import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InvoiceStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';

@Injectable()
export class InvoicesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Numéro séquentiel annuel : INV-YYYY-00001. */
  private async nextNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `INV-${year}-`;
    const count = await this.prisma.invoice.count({
      where: { number: { startsWith: prefix } },
    });
    return `${prefix}${String(count + 1).padStart(5, '0')}`;
  }

  async findAllByAccount(accountId: string) {
    return this.prisma.invoice.findMany({
      where: { accountId },
      orderBy: { createdAt: 'desc' },
      include: { booking: { select: { id: true, status: true } } },
    });
  }

  async findOne(id: string, accountId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: { booking: true },
    });
    if (!invoice) throw new NotFoundException('Facture introuvable.');
    if (invoice.accountId !== accountId) {
      throw new ForbiddenException('Facture hors de votre compte.');
    }
    return invoice;
  }

  /** Génère une facture (statut DRAFT) avec numéro unique. */
  async create(accountId: string, dto: CreateInvoiceDto) {
    if (dto.bookingId) {
      const existing = await this.prisma.invoice.findUnique({
        where: { bookingId: dto.bookingId },
      });
      if (existing) {
        throw new BadRequestException('Une facture existe déjà pour ce booking.');
      }
    }
    const number = await this.nextNumber();
    return this.prisma.invoice.create({
      data: {
        accountId,
        bookingId: dto.bookingId,
        number,
        amount: dto.amount,
        status: InvoiceStatus.DRAFT,
      },
    });
  }

  /** Émet la facture : DRAFT -> ISSUED, pose issuedAt + lien PDF (stub). */
  async issue(id: string, accountId: string) {
    const invoice = await this.findOne(id, accountId);
    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new BadRequestException('Seule une facture en brouillon peut être émise.');
    }
    return this.prisma.invoice.update({
      where: { id },
      data: {
        status: InvoiceStatus.ISSUED,
        issuedAt: new Date(),
        pdfUrl: this.pdfUrl(invoice.number),
      },
    });
  }

  async markPaid(id: string, accountId: string) {
    const invoice = await this.findOne(id, accountId);
    if (invoice.status !== InvoiceStatus.ISSUED) {
      throw new BadRequestException('Seule une facture émise peut être marquée payée.');
    }
    return this.prisma.invoice.update({
      where: { id },
      data: { status: InvoiceStatus.PAID },
    });
  }

  async cancel(id: string, accountId: string) {
    const invoice = await this.findOne(id, accountId);
    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException('Une facture payée ne peut pas être annulée.');
    }
    return this.prisma.invoice.update({
      where: { id },
      data: { status: InvoiceStatus.CANCELLED },
    });
  }

  /** Stub PDF : renvoie l'URL du document (génération réelle branchée ailleurs). */
  async getPdf(id: string, accountId: string) {
    const invoice = await this.findOne(id, accountId);
    const url = invoice.pdfUrl ?? this.pdfUrl(invoice.number);
    return { number: invoice.number, url };
  }

  private pdfUrl(number: string): string {
    return `/invoices/pdf/${number}.pdf`;
  }
}
