import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ContratsService } from '../contrats/contrats.service';
import { contratCddPdf } from './contrat-cdd.pdf';
import { facturePdf } from './facture.pdf';
import { propositionPdf } from './proposition.pdf';
import { emargementPdf, formationPdf } from './formation.pdf';
import { FormationsService } from '../formations/formations.service';

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
    private readonly formations: FormationsService,
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
    // La facture se télécharge des deux côtés : celui qui l'émet et celui à qui
    // elle est adressée. L'émetteur reste toujours le compte porteur de la
    // facture — c'est son SIRET qui l'engage — même quand c'est le payeur qui
    // demande le document.
    const facture = await this.prisma.invoice.findFirst({
      where: { id, OR: [{ accountId }, { payerAccountId: accountId }] },
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
      where: { id: facture.accountId },
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

    // Le client : le payeur désigné en priorité (cas d'une inscription en
    // formation, où aucune réservation ne relie les deux comptes), sinon le
    // compte à l'origine de la réservation. Sans l'un ni l'autre, on ne
    // l'invente pas — une facture sans client vaut mieux qu'un faux client.
    const clientId =
      facture.payerAccountId && facture.payerAccountId !== facture.accountId
        ? facture.payerAccountId
        : facture.booking && facture.booking.accountId !== facture.accountId
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

  /**
   * Attestation d'assiduité et certificat de réalisation.
   *
   * Le contrôle d'accès n'est pas réécrit ici : on passe par
   * `FormationsService.getInscription`, qui applique déjà la règle exacte —
   * propriétaire du programme, structure hôte, ou formateur désigné. Dupliquer
   * cette règle aurait garanti qu'elle diverge un jour.
   */
  async formation(
    accountId: string,
    userId: string,
    inscriptionId: string,
    genre: 'attestation' | 'certificat',
  ) {
    const inscription = await this.formations.getInscription(inscriptionId, accountId, userId);
    const session = inscription.session;
    const programme = session.formation;

    // Un certificat de réalisation ne se délivre que pour un programme
    // certifiant. En produire un pour une formation interne fabriquerait une
    // pièce fausse — et c'est le genre de pièce qui se retourne en contrôle.
    if (genre === 'certificat' && !programme.certifying) {
      throw new NotFoundException(
        "Cette formation n'est pas certifiante : seule l'attestation d'assiduité peut être délivrée.",
      );
    }

    const pdf = await formationPdf(
      {
        inscription: inscription as never,
        session: session as never,
        formation: programme as never,
      },
      genre,
    );
    return { pdf, nom: this.nomFichier(genre, inscriptionId.slice(-8)) };
  }

  /** Feuille d'émargement d'une session : cases à signer + récapitulatif. */
  async emargement(accountId: string, userId: string, sessionId: string) {
    // Même principe : `getSession` porte déjà le contrôle d'accès.
    const session = await this.formations.getSession(sessionId, accountId, userId);

    // `getSession` renvoie la formation en projection réduite ; la feuille a
    // besoin de la durée et de l'organisme émetteur.
    const programme = await this.prisma.formation.findUnique({
      where: { id: session.formation.id },
      select: {
        title: true,
        durationHours: true,
        ownerAccount: { select: { name: true, city: true } },
      },
    });
    if (!programme) throw new NotFoundException('Programme introuvable.');

    const pdf = await emargementPdf({
      session: { ...session, formation: programme } as never,
      inscriptions: session.inscriptions as never,
      emargements: session.emargements as never,
    });
    return { pdf, nom: this.nomFichier('emargement', sessionId.slice(-8)) };
  }
}
