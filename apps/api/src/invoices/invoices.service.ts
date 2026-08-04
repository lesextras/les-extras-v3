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
   *
   * SCOPÉ PAR ÉMETTEUR (`accountId`) : la séquence légale (art. 242 nonies A
   * de l'annexe II au CGI) doit être continue PROPRE À CHAQUE ÉMETTEUR, pas
   * partagée entre tous les comptes de la plateforme. Un ancien comportement
   * global aurait mélangé les factures de personnes morales distinctes sous
   * une même suite de numéros — deux émetteurs différents ne peuvent
   * légalement pas partager une séquence.
   */
  private async nextNumber(accountId: string): Promise<string> {
    const annee = new Date().getFullYear();
    const derniere = await this.prisma.invoice.findFirst({
      where: { accountId, number: { startsWith: prefixeAnnee(annee) } },
      orderBy: { number: 'desc' },
      select: { number: true },
    });
    return numeroSuivant(annee, derniere?.number ?? null);
  }

  /**
   * Mes factures : celles que j'ai émises ET celles qui me sont adressées.
   *
   * Sans le second cas, l'établissement inscrit à une formation ne voyait
   * jamais la facture qui lui était pourtant destinée — et le bouton « Payer
   * en ligne », conditionné à son affichage, restait inatteignable.
   */
  async findAllByAccount(accountId: string, take = 100) {
    return this.prisma.invoice.findMany({
      where: { OR: [{ accountId }, { payerAccountId: accountId }] },
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

    /**
     * LES DOUZE DERNIERS MOIS.
     *
     * Trois totaux cumulés ne disent rien de la tendance : un intervenant qui
     * a facturé 9 000 € l'an dernier et 200 € ce trimestre lit le même chiffre
     * que celui qui monte. Or c'est précisément la question qu'on se pose en
     * ouvrant cet écran — est-ce que ça marche, en ce moment ?
     *
     * On borne à douze mois et on ne charge que deux colonnes : la date et le
     * montant. Le regroupement se fait ici parce que Prisma ne sait pas
     * grouper par mois sans requête brute, et douze mois de factures d'un
     * compte tiennent largement en mémoire.
     */
    const debut = new Date();
    debut.setMonth(debut.getMonth() - 11);
    debut.setDate(1);
    debut.setHours(0, 0, 0, 0);

    const lignes = await this.prisma.invoice.findMany({
      where: {
        accountId,
        status: { not: InvoiceStatus.CANCELLED },
        createdAt: { gte: debut },
      },
      select: { createdAt: true, amount: true, status: true },
      take: 5000,
    });

    const cumul = new Map<string, { facture: number; regle: number }>();
    for (let i = 0; i < 12; i++) {
      const d = new Date(debut);
      d.setMonth(debut.getMonth() + i);
      cumul.set(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, {
        facture: 0,
        regle: 0,
      });
    }
    for (const l of lignes) {
      const cle = `${l.createdAt.getFullYear()}-${String(l.createdAt.getMonth() + 1).padStart(2, '0')}`;
      const c = cumul.get(cle);
      if (!c) continue;
      const montant = nombre(l.amount);
      c.facture += montant;
      if (l.status === InvoiceStatus.PAID) c.regle += montant;
    }

    return {
      // Le total facturé comprend ce qui est réglé et ce qui reste dû ; les
      // factures annulées n'y figurent pas, elles n'ont jamais été dues.
      total: Math.round((enAttente + paye) * 100) / 100,
      paid: Math.round(paye * 100) / 100,
      pending: Math.round(enAttente * 100) / 100,
      invoiceCount: total,
      parMois: [...cumul.entries()].map(([mois, v]) => ({
        mois,
        facture: Math.round(v.facture * 100) / 100,
        regle: Math.round(v.regle * 100) / 100,
      })),
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
            // Le compte à l'origine de la réservation : c'est lui le client
            // quand la facture naît d'un atelier, faute de payeur explicite.
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
        },
        payer: {
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
        account: {
          select: {
            id: true,
            name: true,
            legalName: true,
            address: true,
            city: true,
            postalCode: true,
            siret: true,
            vatMention: true,
            owner: { select: { email: true } },
          },
        },
      },
    });
    if (!invoice) throw new NotFoundException('Facture introuvable.');
    // Une facture se lit des deux côtés : celui qui l'émet et celui qui la paie.
    if (invoice.accountId !== accountId && invoice.payerAccountId !== accountId) {
      throw new ForbiddenException('Facture hors de votre compte.');
    }
    return invoice;
  }

  /** Seul l'émetteur dispose du cycle de vie : émettre, encaisser, annuler. */
  private async assertEmetteur(id: string, accountId: string) {
    const invoice = await this.findOne(id, accountId);
    if (invoice.accountId !== accountId) {
      throw new ForbiddenException(
        "Cette facture vous est adressée : seul son émetteur peut la modifier.",
      );
    }
    return invoice;
  }

  /**
   * Génère une facture (statut DRAFT) avec numéro unique.
   *
   * ON NE FACTURE QUE CE QU'ON A SOI-MÊME RÉALISÉ.
   *
   * `create` ne vérifiait qu'une chose : qu'aucune facture n'existait déjà
   * pour cette réservation. N'importe quel compte pouvait donc facturer la
   * prestation d'un autre. Deux dégâts, et le second est le pire : le nom du
   * client d'autrui apparaissait sur un document comptable étranger, et
   * surtout le titulaire légitime se retrouvait DÉFINITIVEMENT empêché de
   * facturer sa propre mission, puisque le verrou d'unicité était déjà pris.
   *
   * On rétablit aussi le PAYEUR. Sur une mission de renfort, la réservation
   * appartient à l'intervenant : `booking.accountId` et `invoice.accountId`
   * étaient donc égaux, le client était déduit comme nul, et la facture
   * sortait avec un bloc « Facturé à » vide — non conforme à l'article
   * 242 nonies A du CGI — sans jamais parvenir à l'établissement.
   */
  async create(accountId: string, dto: CreateInvoiceDto) {
    let payerAccountId: string | undefined;

    if (dto.bookingId) {
      const booking = await this.prisma.booking.findUnique({
        where: { id: dto.bookingId },
        select: {
          accountId: true,
          invoice: { select: { id: true } },
          mission: { select: { accountId: true } },
          service: { select: { accountId: true } },
        },
      });
      // Un identifiant inconnu renvoyait une erreur 500 (violation de clé
      // étrangère remontée brute). On répond ce qu'il en est.
      if (!booking) throw new NotFoundException('Réservation introuvable.');
      if (booking.invoice) {
        throw new BadRequestException('Une facture existe déjà pour cette réservation.');
      }
      if (booking.accountId !== accountId) {
        throw new ForbiddenException(
          'Cette réservation ne relève pas de votre compte : vous ne pouvez pas la facturer.',
        );
      }

      // Renfort : la réservation est celle de l'intervenant, le payeur est
      // l'établissement qui a publié la mission. Atelier : la réservation est
      // celle de l'établissement, le payeur est donc ce compte-là.
      payerAccountId = booking.mission?.accountId ?? booking.service?.accountId;
      if (payerAccountId === accountId) payerAccountId = undefined;
    }

    const number = await this.nextNumber(accountId);
    return this.prisma.invoice.create({
      data: {
        accountId,
        bookingId: dto.bookingId,
        payerAccountId,
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
    const invoice = await this.assertEmetteur(id, accountId);
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
      // Une facture s'annonce à celui qui doit la régler. Elle partait jusqu'ici
      // à son émetteur, qui la connaissait déjà : personne n'était prévenu.
      const client =
        invoice.booking && invoice.booking.accountId !== invoice.accountId
          ? invoice.booking.account?.owner?.email
          : null;
      const to = invoice.payer?.owner?.email ?? client ?? invoice.account?.owner?.email;
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
    // Constater un règlement est un acte comptable de l'émetteur : c'est sa
    // séquence de facturation qui l'enregistre, pas celle du payeur.
    const invoice = await this.assertEmetteur(id, accountId);
    if (invoice.status !== InvoiceStatus.ISSUED) {
      throw new BadRequestException('Seule une facture émise peut être marquée payée.');
    }
    return this.prisma.invoice.update({
      where: { id },
      data: { status: InvoiceStatus.PAID },
    });
  }

  async cancel(id: string, accountId: string) {
    const invoice = await this.assertEmetteur(id, accountId);
    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException('Une facture payée ne peut pas être annulée.');
    }
    return this.prisma.invoice.update({
      where: { id },
      data: { status: InvoiceStatus.CANCELLED },
    });
  }
}
