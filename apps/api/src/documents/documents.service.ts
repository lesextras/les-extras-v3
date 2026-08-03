import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ContratsService } from '../contrats/contrats.service';
import { contratCddPdf } from './contrat-cdd.pdf';
import { facturePdf } from './facture.pdf';
import { propositionPdf } from './proposition.pdf';

/**
 * Assemble les données puis délègue le dessin.
 *
 * Le service ne connaît rien à la mise en page, et les modules de mise en page
 * ne connaissent rien à Prisma : on peut changer l'un sans toucher l'autre, et
 * les fonctions de dessin se testent sans base de données.
 *
 * Chaque chargement passe par `accountId` : on ne rend jamais la pièce d'un
 * autre établissement, même si l'identifiant est deviné.
 */
@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly contrats: ContratsService,
  ) {}

  /** Nom de fichier lisible et triable : type, référence, date. */
  private nomFichier(type: string, reference: string): string {
    const jour = new Date().toISOString().slice(0, 10);
    const propre = reference.replace(/[^a-zA-Z0-9_-]+/g, '-');
    return `${type}-${propre}-${jour}.pdf`;
  }

  async contratCdd(accountId: string, id: string) {
    // On réutilise `get` du service des contrats : c'est lui qui produit la
    // synthèse (essai, précarité, carence, échéances). Le PDF et l'écran
    // affichent donc EXACTEMENT les mêmes chiffres — il n'y a qu'un calcul.
    const { contrat, synthese } = await this.contrats.get(accountId, id);

    const employeur = await this.prisma.account.findUnique({
      where: { id: accountId },
      select: {
        name: true,
        legalName: true,
        siret: true,
        address: true,
        postalCode: true,
        city: true,
      },
    });
    if (!employeur) throw new NotFoundException('Établissement introuvable.');

    const pdf = await contratCddPdf({
      contrat: contrat as never,
      employeur,
      synthese: synthese as never,
    });
    return { pdf, nom: this.nomFichier('contrat-cdd', id.slice(-8)) };
  }

  /**
   * La proposition d'engagement d'un renfort pourvu. Elle réutilise le même
   * chiffrage que l'écran : il n'existe qu'un calcul, donc le papier et
   * l'écran ne peuvent pas diverger.
   */
  async proposition(accountId: string, bookingId: string) {
    const donnees = await this.contrats.proposition(accountId, bookingId);
    const pdf = await propositionPdf(donnees as never);
    return { pdf, nom: this.nomFichier('proposition', bookingId.slice(-8)) };
  }

  async facture(accountId: string, id: string) {
    const facture = await this.prisma.invoice.findFirst({
      where: { id, accountId },
      include: {
        booking: {
          select: {
            id: true,
            scheduledAt: true,
            completedAt: true,
            accountId: true,
            mission: { select: { title: true, accountId: true } },
            service: { select: { title: true, accountId: true } },
          },
        },
      },
    });
    if (!facture) throw new NotFoundException('Facture introuvable.');

    const emetteur = await this.prisma.account.findUnique({
      where: { id: accountId },
      select: {
        name: true,
        legalName: true,
        siret: true,
        address: true,
        postalCode: true,
        city: true,
        contactEmail: true,
      },
    });
    if (!emetteur) throw new NotFoundException('Émetteur introuvable.');

    // Le client est le compte à l'origine de la réservation, quand il diffère
    // de l'émetteur. Sans réservation rattachée, on ne l'invente pas.
    const clientId =
      facture.booking && facture.booking.accountId !== accountId
        ? facture.booking.accountId
        : null;
    const client = clientId
      ? await this.prisma.account.findUnique({
          where: { id: clientId },
          select: {
            name: true,
            legalName: true,
            siret: true,
            address: true,
            postalCode: true,
            city: true,
          },
        })
      : null;

    const pdf = await facturePdf({
      facture: facture as never,
      emetteur,
      client,
      // Mention par défaut, vraie pour une association non assujettie. À rendre
      // configurable par compte le jour où un émetteur assujetti facture ici :
      // afficher un taux faux serait pire que ne rien afficher.
      mentionTva: 'TVA non applicable, article 293 B du code général des impôts',
    });
    return { pdf, nom: this.nomFichier('facture', facture.number) };
  }
}
