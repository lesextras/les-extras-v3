import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ContratsService } from '../contrats/contrats.service';
import { contratCddPdf } from './contrat-cdd.pdf';
import { facturePdf } from './facture.pdf';
import { devisPdf } from './devis.pdf';
import { SELECT_PARTIE, figerPartie, relirePartiesFigees } from '../quotes/parties';
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

  /**
   * LE DEVIS.
   *
   * Téléchargeable des deux côtés, comme la facture : celui qui l'émet et
   * celui qui décide. Le contrôle d'accès tient dans le `where` — un compte
   * qui n'est ni le prestataire ni le client ne trouve rien, même en devinant
   * l'identifiant.
   *
   * Les identités imprimées viennent de l'instantané pris à l'envoi. Pour les
   * devis antérieurs, qui n'en ont pas, on retombe sur les profils courants :
   * c'est ce qui existait, et un document imparfait vaut mieux qu'un document
   * vide.
   */
  async devis(accountId: string, id: string) {
    const devis = await this.prisma.quote.findFirst({
      where: { id, OR: [{ providerAccountId: accountId }, { clientAccountId: accountId }] },
    });
    if (!devis) throw new NotFoundException('Devis introuvable.');

    const figees = relirePartiesFigees(devis.partiesSnapshot);
    let prestataire = figees?.provider ?? null;
    let client = figees?.client ?? null;

    if (!prestataire || !client) {
      const [p, c] = await Promise.all([
        this.prisma.account.findUnique({
          where: { id: devis.providerAccountId },
          select: SELECT_PARTIE,
        }),
        this.prisma.account.findUnique({
          where: { id: devis.clientAccountId },
          select: SELECT_PARTIE,
        }),
      ]);
      if (!p || !c) throw new NotFoundException('Parties introuvables.');
      prestataire = prestataire ?? figerPartie(p);
      client = client ?? figerPartie(c);
    }

    // La signature électronique, quand elle existe : elle remplace alors le
    // cadre à remplir à la main. On n'imprime pas une case à signer sous un
    // document déjà signé.
    const signature = await this.prisma.signature.findFirst({
      where: { documentType: 'DEVIS', documentId: id, statut: 'SIGNEE' },
      orderBy: { signeLe: 'desc' },
      select: { signataireNom: true, signataireEmail: true, signeLe: true, empreinte: true },
    });

    const pdf = await devisPdf({
      devis: {
        reference: devis.reference,
        title: devis.title,
        request: devis.request,
        message: devis.message,
        lines: (Array.isArray(devis.lines) ? devis.lines : []) as never,
        amount: devis.amount,
        totalHt: devis.totalHt,
        totalTva: devis.totalTva,
        status: devis.status,
        scheduledAt: devis.scheduledAt,
        validUntil: devis.validUntil,
        sentAt: devis.sentAt,
        createdAt: devis.createdAt,
        decidedAt: devis.decidedAt,
        acceptedByName: devis.acceptedByName,
        acceptedByRole: devis.acceptedByRole,
        refusalReason: devis.refusalReason,
      },
      prestataire,
      client,
      signature:
        signature?.signeLe != null
          ? {
              signataireNom: signature.signataireNom,
              signataireEmail: signature.signataireEmail,
              signeLe: signature.signeLe,
              empreinte: signature.empreinte,
            }
          : null,
    });
    return { pdf, nom: this.nomFichier('devis', devis.reference) };
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
            // LE DEVIS DONT CETTE FACTURE EST LA SUITE.
            //
            // C'est le devis accepté qui contractualise ; la facture ne fait
            // que constater l'exécution de ce qui y était convenu. Sans le
            // rappel de sa référence, le client qui reçoit la facture n'a
            // aucun moyen de la rattacher à l'engagement qu'il a signé — et
            // c'est précisément ce rattachement que réclame un contrôle, ou
            // un financeur qui reconstitue un dossier.
            //
            // ON EMPORTE AUSSI SON CHIFFRAGE. Le devis peut porter de la TVA ;
            // la facture, elle, n'a qu'un montant unique et imprimait par
            // defaut « TVA non applicable, art. 293 B ». Elle declarait donc
            // exoneree une taxe que le devis venait de facturer — une mention
            // fiscale fausse sur un document comptable. On reprend la
            // ventilation du devis pour que les deux pieces disent la meme
            // chose.
            quote: {
              select: {
                reference: true,
                decidedAt: true,
                lines: true,
                totalHt: true,
                totalTva: true,
              },
            },
          },
        },
        // Les deux faces d'une formation, dont aucune ne passe par un Booking :
        // l'inscription que l'organisme vend, et l'animation que le formateur
        // lui facture en retour. Sans elles, ces factures sortaient avec
        // « Prestation » pour toute désignation et aucune date d'exécution.
        inscription: {
          select: {
            session: { select: { startDate: true, formation: { select: { title: true } } } },
          },
        },
        sessionRemuneree: {
          select: { startDate: true, formation: { select: { title: true } } },
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
        vatMention: true,
        // Coordonnées bancaires de l'émetteur : c'est par elles que la facture
        // se règle. Le PDF n'est délivré qu'aux parties de la facture (le
        // contrôle d'accès se fait plus haut), et c'est la seule diffusion
        // légitime d'un IBAN — il n'a rien à faire ailleurs.
        iban: true,
        bic: true,
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

    // Désignation d'une prestation de formation. L'ordre importe : une facture
    // porte l'une OU l'autre, jamais les deux, et le sens n'est pas le même.
    // L'animation est ce que le formateur vend à l'organisme ; l'inscription
    // est ce que l'organisme vend à l'établissement.
    const prestation = facture.sessionRemuneree
      ? {
          intitule: `Animation de la formation « ${facture.sessionRemuneree.formation.title} »`,
          dateRealisation: facture.sessionRemuneree.startDate,
        }
      : facture.inscription
        ? {
            intitule: `Formation « ${facture.inscription.session.formation.title} » — inscription`,
            dateRealisation: facture.inscription.session.startDate,
          }
        : null;

    const pdf = await facturePdf({
      facture: facture as never,
      emetteur,
      client,
      prestation,
      // Mention propre à l'émetteur si renseignée (voir Account.vatMention) ;
      // sinon le défaut ci-dessous, vrai pour la grande majorité des comptes
      // (franchise en base, association non assujettie). Un émetteur assujetti
      // à la TVA doit la renseigner lui-même — afficher un taux faux serait
      // pire que ne rien afficher.
      mentionTva:
        emetteur.vatMention?.trim() ||
        'TVA non applicable, article 293 B du code général des impôts',
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
