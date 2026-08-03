import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InvoiceStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { numeroSuivant, prefixeAnnee } from './numerotation';
import { MailService } from '../common/mail/mail.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';

@Injectable()
export class InvoicesService {
  private readonly logger = new Logger(InvoicesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  /** Numéro séquentiel annuel : INV-YYYY-00001. */
  /**
   * Le numéro suivant, tiré du DERNIER attribué et non du nombre de factures.
   * Voir `numerotation.ts` : une facture annulée consomme son numéro, la
   * séquence doit rester continue.
   */
  private async nextNumber(): Promise<string> {
    const annee = new Date().getFullYear();
    const derniere = await this.prisma.invoice.findFirst({
      where: { number: { startsWith: prefixeAnnee(annee) } },
      orderBy: { number: 'desc' },
      select: { number: true },
    });
    return numeroSuivant(annee, derniere?.number ?? null);
  }

  async findAllByAccount(accountId: string, take = 100) {
    return this.prisma.invoice.findMany({
      where: { accountId },
      orderBy: { createdAt: 'desc' },
      take: Math.min(200, Math.max(1, Math.trunc(Number(take) || 100))),
      include: { booking: { select: { id: true, status: true } } },
    });
  }

  /**
   * Les trois chiffres de l'en-tête : total facturé, réglé, en attente.
   *
   * L'écran de facturation appelait cette route depuis toujours ; elle
   * n'existait pas. La requête tombait sur `findOne('summary')`, échouait, et
   * l'échec était avalé — les trois cartes affichaient « 0 € » en permanence.
   * Un directeur pouvait donc croire n'avoir rien facturé de l'année.
   *
   * Les montants s'agrègent en base, pas en mémoire : la somme d'un exercice
   * ne se calcule pas en chargeant toutes les factures.
   */
  async summary(accountId: string) {
    const [emises, reglees, total] = await Promise.all([
      this.prisma.invoice.aggregate({
        where: { accountId, status: InvoiceStatus.ISSUED },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      this.prisma.invoice.aggregate({
        where: { accountId, status: InvoiceStatus.PAID },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      this.prisma.invoice.count({
        where: { accountId, status: { not: InvoiceStatus.CANCELLED } },
      }),
    ]);

    const nombre = (v: unknown) => Number(v ?? 0);
    const enAttente = nombre(emises._sum.amount);
    const paye = nombre(reglees._sum.amount);
    return {
      // Le total facturé comprend ce qui est réglé et ce qui reste dû ; les
      // factures annulées n'y figurent pas, elles n'ont jamais été dues.
      total: Math.round((enAttente + paye) * 100) / 100,
      paid: Math.round(paye * 100) / 100,
      pending: Math.round(enAttente * 100) / 100,
      invoiceCount: total,
    };
  }

  async findOne(id: string, accountId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        booking: {
          include: {
            service: { select: { title: true } },
            mission: { select: { title: true } },
          },
        },
        account: {
          select: {
            id: true,
            name: true,
            legalName: true,
            address: true,
            city: true,
            postalCode: true,
            siret: true,
            owner: { select: { email: true } },
          },
        },
      },
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

  /**
   * Émet la facture : DRAFT -> ISSUED, pose issuedAt. Notifie le compte par email
   * avec le lien vers le document imprimable (n'échoue jamais la requête).
   */
  async issue(id: string, accountId: string) {
    const invoice = await this.findOne(id, accountId);
    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new BadRequestException('Seule une facture en brouillon peut être émise.');
    }
    const updated = await this.prisma.invoice.update({
      where: { id },
      data: {
        status: InvoiceStatus.ISSUED,
        issuedAt: new Date(),
      },
    });

    try {
      const to = invoice.account?.owner?.email;
      if (to) {
        await this.mail.sendInvoiceIssued(to, {
          number: invoice.number,
          amount: updated.amount.toString(),
          url: `/documents/facture/${id}`,
        });
      }
    } catch (e) {
      this.logger.warn(
        `Email d'émission de facture non envoyé (${id}): ${(e as Error).message}`,
      );
    }

    return updated;
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
}
