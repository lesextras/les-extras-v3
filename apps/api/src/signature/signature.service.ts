import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StatutSignature, TypeDocumentSigne } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../common/mail/mail.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  dossierPreuve,
  empreinte,
  genererCode,
  hacherCode,
  TENTATIVES_MAX,
  VALIDITE_CODE_MINUTES,
  verifier,
} from './signature';

/**
 * LA SIGNATURE ÉLECTRONIQUE.
 *
 * Ce que ce service met en place est une signature électronique SIMPLE
 * assortie d'un faisceau de preuves — c'est dit sans détour dans le dossier
 * remis au signataire, et c'est la seule chose honnête à faire.
 *
 * Le procédé tient en quatre temps : on fige l'empreinte du document, on
 * envoie un code à usage unique sur un canal distinct, on vérifie ce code en
 * recalculant l'empreinte, et on journalise chaque étape sans jamais rien
 * effacer.
 *
 * ── Sur le passage à la signature avancée ──────────────────────────────────
 *
 * Le champ `prestataire` et la variable d'environnement SIGNATURE_PRESTATAIRE
 * préparent la délégation à un tiers de confiance. Tant qu'aucune clé n'est
 * configurée, le module fonctionne en interne et le dit. Le jour où
 * l'association souscrit un abonnement, elle renseigne la clé dans ses
 * variables d'environnement : rien d'autre ne change dans le logiciel.
 *
 * Aucune clé n'est écrite dans le code ni dans ce dépôt.
 */
@Injectable()
export class SignatureService {
  private readonly logger = new Logger(SignatureService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly notifications: NotificationsService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Le prestataire configuré, s'il y en a un.
   * Absent : on signe en interne. C'est un état de fonctionnement normal, pas
   * une panne — et l'écran le dit au signataire.
   */
  private get prestataire(): string | null {
    const nom = (this.config.get<string>('SIGNATURE_PRESTATAIRE') ?? '').trim();
    if (!nom) return null;
    const cle = (this.config.get<string>(`${nom.toUpperCase()}_API_KEY`) ?? '').trim();
    if (!cle) {
      // Un prestataire annoncé sans clé serait pire que pas de prestataire :
      // on croirait signer chez un tiers de confiance alors que non.
      this.logger.warn(
        `SIGNATURE_PRESTATAIRE="${nom}" est déclaré mais ${nom.toUpperCase()}_API_KEY est absente. On reste en signature interne.`,
      );
      return null;
    }
    return nom;
  }

  private async journal(
    signatureId: string,
    type: string,
    detail?: string | null,
    trace?: { ip?: string | null; userAgent?: string | null },
  ) {
    await this.prisma.signatureEvenement.create({
      data: {
        signatureId,
        type,
        detail: detail ?? null,
        ip: trace?.ip ?? null,
        userAgent: trace?.userAgent?.slice(0, 300) ?? null,
      },
    });
  }

  /**
   * Le texte canonique d'un document, celui dont on prend l'empreinte.
   *
   * Ce n'est pas le PDF : un PDF embarque une date de génération et des
   * identifiants internes qui changent à chaque rendu, l'empreinte ne serait
   * jamais deux fois la même. On prend donc les champs qui font le contenu
   * juridique, dans un ordre fixe. Ajouter un champ ici change les empreintes
   * futures, jamais les signatures déjà recueillies.
   */
  private async texteCanonique(type: TypeDocumentSigne, id: string): Promise<string | null> {
    if (type === 'CONTRAT_CDD') {
      const c = await this.prisma.contratCDD.findUnique({ where: { id } });
      if (!c) return null;
      return [
        'CONTRAT_CDD',
        c.id,
        c.userId,
        c.motif,
        c.salarieRemplaceNom ?? '',
        c.dateDebut.toISOString(),
        c.dateFin?.toISOString() ?? '',
        String(c.dureeMinimaleJours ?? ''),
        c.poste ?? '',
        c.qualification ?? '',
        c.conventionCollective ?? '',
        String(c.remunerationBrute ?? ''),
        c.remunerationDetail ?? '',
        c.caisseRetraiteComplementaire ?? '',
        c.organismePrevoyance ?? '',
        String(c.periodeEssaiJours ?? ''),
      ].join('\n');
    }

    const b = await this.prisma.booking.findUnique({
      where: { id },
      include: { mission: true, service: true },
    });
    if (!b) return null;
    return [
      type,
      b.id,
      b.accountId,
      b.mission?.title ?? b.service?.title ?? '',
      b.scheduledAt?.toISOString() ?? '',
      String(b.totalAmount ?? ''),
      String(b.participants ?? ''),
    ].join('\n');
  }

  /** Ouvre une demande de signature et envoie le premier code. */
  async demander(
    accountId: string,
    dto: {
      documentType: TypeDocumentSigne;
      documentId: string;
      signataireNom: string;
      signataireEmail: string;
      userId?: string;
    },
  ) {
    const texte = await this.texteCanonique(dto.documentType, dto.documentId);
    if (!texte) throw new NotFoundException('Document introuvable.');

    // Une demande déjà signée ne se rouvre pas : ce serait effacer une preuve.
    const dejaSignee = await this.prisma.signature.findFirst({
      where: {
        documentType: dto.documentType,
        documentId: dto.documentId,
        signataireEmail: dto.signataireEmail,
        statut: StatutSignature.SIGNEE,
      },
    });
    if (dejaSignee) {
      throw new BadRequestException('Cette personne a déjà signé ce document.');
    }

    // Une demande en cours est réutilisée plutôt que dupliquée : deux
    // demandes ouvertes pour le même document brouilleraient la preuve.
    const enCours = await this.prisma.signature.findFirst({
      where: {
        documentType: dto.documentType,
        documentId: dto.documentId,
        signataireEmail: dto.signataireEmail,
        statut: StatutSignature.EN_ATTENTE,
      },
    });

    const signature =
      enCours ??
      (await this.prisma.signature.create({
        data: {
          documentType: dto.documentType,
          documentId: dto.documentId,
          accountId,
          userId: dto.userId ?? null,
          signataireNom: dto.signataireNom,
          signataireEmail: dto.signataireEmail.toLowerCase().trim(),
          empreinte: empreinte(texte),
          prestataire: this.prestataire,
        },
      }));

    if (!enCours) {
      await this.journal(signature.id, 'DEMANDE', `Empreinte ${signature.empreinte.slice(0, 16)}…`);
    } else {
      // Le document a pu bouger entre la première demande et celle-ci : on
      // refige l'empreinte, sinon la signature porterait sur un texte périmé.
      await this.prisma.signature.update({
        where: { id: signature.id },
        data: { empreinte: empreinte(texte) },
      });
    }

    await this.envoyerCode(signature.id);
    return this.lire(accountId, signature.id);
  }

  /** Génère un code, le hache, l'enregistre et l'envoie par courriel. */
  async envoyerCode(signatureId: string) {
    const s = await this.prisma.signature.findUnique({ where: { id: signatureId } });
    if (!s) throw new NotFoundException('Demande de signature introuvable.');
    if (s.statut !== StatutSignature.EN_ATTENTE) {
      throw new BadRequestException("Cette demande n'est plus en attente de signature.");
    }

    const code = genererCode();
    await this.prisma.signature.update({
      where: { id: signatureId },
      data: {
        // Le code n'existe en clair que le temps de cet appel. Ni la base ni
        // les journaux ne le voient.
        codeHache: hacherCode(code, signatureId),
        codeExpireLe: new Date(Date.now() + VALIDITE_CODE_MINUTES * 60_000),
        tentatives: 0,
      },
    });

    const libelle =
      s.documentType === 'CONTRAT_CDD'
        ? 'votre contrat à durée déterminée'
        : s.documentType === 'PROPOSITION'
          ? "une proposition d'engagement"
          : 'un devis';

    await this.mail
      .sendCodeSignature(s.signataireEmail, {
        code,
        document: libelle,
        minutes: VALIDITE_CODE_MINUTES,
        nomSignataire: s.signataireNom,
      })
      .catch((e) => this.logger.error(`Envoi du code impossible : ${e}`));

    await this.journal(signatureId, 'CODE_ENVOYE', `Adressé à ${s.signataireEmail}`);
    return { envoye: true, expireDansMinutes: VALIDITE_CODE_MINUTES };
  }

  /**
   * Le moment de vérité.
   *
   * L'empreinte est RECALCULÉE ici, pas relue : si le contrat a été modifié
   * entre la demande et la signature, on refuse. C'est ce qui garantit le
   * lien entre la signature et l'acte — sans quoi on saurait que quelqu'un a
   * cliqué, pas sur quoi.
   */
  async signer(
    signatureId: string,
    code: string,
    trace: { ip?: string | null; userAgent?: string | null },
  ) {
    const s = await this.prisma.signature.findUnique({ where: { id: signatureId } });
    if (!s) throw new NotFoundException('Demande de signature introuvable.');

    const texte = await this.texteCanonique(s.documentType, s.documentId);
    if (!texte) throw new NotFoundException('Document introuvable.');

    const r = verifier(
      {
        statut: s.statut,
        codeHache: s.codeHache,
        codeExpireLe: s.codeExpireLe,
        tentatives: s.tentatives,
        empreinte: s.empreinte,
      },
      code,
      signatureId,
      empreinte(texte),
    );

    if (!r.ok) {
      if (r.echec === 'CODE_ERRONE') {
        await this.prisma.signature.update({
          where: { id: signatureId },
          data: { tentatives: { increment: 1 } },
        });
        await this.journal(
          signatureId,
          'CODE_ERRONE',
          `Tentative ${s.tentatives + 1}/${TENTATIVES_MAX}`,
          trace,
        );
      } else if (r.echec === 'DOCUMENT_MODIFIE') {
        await this.journal(signatureId, 'DOCUMENT_MODIFIE', 'Empreinte non concordante', trace);
      }
      throw new BadRequestException(r.message ?? 'Signature refusée.');
    }

    await this.prisma.signature.update({
      where: { id: signatureId },
      data: {
        statut: StatutSignature.SIGNEE,
        signeLe: new Date(),
        ip: trace.ip ?? null,
        userAgent: trace.userAgent?.slice(0, 300) ?? null,
        // Le code est effacé : il a servi, il ne doit plus exister.
        codeHache: null,
        codeExpireLe: null,
      },
    });
    await this.journal(signatureId, 'SIGNEE', null, trace);

    // Le document porte lui aussi la marque de la signature, pour que les
    // écrans existants la voient sans interroger ce module.
    await this.reporterSurLeDocument(s.documentType, s.documentId, s.userId, s.accountId);

    return this.dossier(signatureId);
  }

  /**
   * Répercute la signature sur le document.
   *
   * On distingue le salarié de l'employeur : sur un CDD, ce sont deux
   * signatures distinctes, et l'article L. 1242-13 fait courir un délai de
   * deux jours ouvrables pour la transmission au salarié.
   */
  private async reporterSurLeDocument(
    type: TypeDocumentSigne,
    documentId: string,
    userId: string | null,
    accountId: string,
  ) {
    if (type !== 'CONTRAT_CDD') return;
    const c = await this.prisma.contratCDD.findUnique({ where: { id: documentId } });
    if (!c) return;
    const estSalarie = userId !== null && userId === c.userId;
    await this.prisma.contratCDD.update({
      where: { id: documentId },
      data: estSalarie ? { signeSalarieLe: new Date() } : { signeEmployeurLe: new Date() },
    });

    if (estSalarie) {
      const compte = await this.prisma.account.findUnique({
        where: { id: accountId },
        select: { ownerId: true },
      });
      if (compte) {
        await this.notifications
          .create(compte.ownerId, {
            type: 'CONTRAT_SIGNE',
            title: 'Contrat signé par le salarié',
            body: `Le contrat ${documentId.slice(-8).toUpperCase()} vient d'être signé.`,
            link: `/dashboard/contrats/${documentId}`,
          })
          .catch(() => undefined);
      }
    }
  }

  /** Le signataire renonce. C'est un refus, pas une annulation. */
  async refuser(signatureId: string, motif: string | undefined, trace: { ip?: string | null; userAgent?: string | null }) {
    const s = await this.prisma.signature.findUnique({ where: { id: signatureId } });
    if (!s) throw new NotFoundException('Demande de signature introuvable.');
    if (s.statut !== StatutSignature.EN_ATTENTE) {
      throw new BadRequestException("Cette demande n'est plus en attente.");
    }
    await this.prisma.signature.update({
      where: { id: signatureId },
      data: {
        statut: StatutSignature.REFUSEE,
        refuseLe: new Date(),
        motifRefus: motif?.trim() || null,
        codeHache: null,
      },
    });
    await this.journal(signatureId, 'REFUSEE', motif ?? null, trace);
    return { refusee: true };
  }

  /** L'établissement retire sa demande. */
  async annuler(accountId: string, signatureId: string) {
    const s = await this.prisma.signature.findFirst({ where: { id: signatureId, accountId } });
    if (!s) throw new NotFoundException('Demande de signature introuvable.');
    if (s.statut === StatutSignature.SIGNEE) {
      throw new ForbiddenException(
        "Une signature recueillie ne s'annule pas : ce serait effacer une preuve. Établissez un avenant ou un nouveau document.",
      );
    }
    await this.prisma.signature.update({
      where: { id: signatureId },
      data: { statut: StatutSignature.ANNULEE, codeHache: null },
    });
    await this.journal(signatureId, 'ANNULEE');
    return { annulee: true };
  }

  async lire(accountId: string, signatureId: string) {
    const s = await this.prisma.signature.findFirst({
      where: { id: signatureId, accountId },
      include: { evenements: { orderBy: { createdAt: 'asc' } } },
    });
    if (!s) throw new NotFoundException('Demande de signature introuvable.');
    // Le code haché ne sort jamais de la couche de données.
    const { codeHache: _ignore, ...reste } = s;
    return { ...reste, prestataireActif: this.prestataire };
  }

  /** Les signatures d'un document, pour l'afficher à côté. */
  async pourDocument(accountId: string, type: TypeDocumentSigne, documentId: string) {
    const liste = await this.prisma.signature.findMany({
      where: { accountId, documentType: type, documentId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        signataireNom: true,
        signataireEmail: true,
        statut: true,
        signeLe: true,
        refuseLe: true,
        motifRefus: true,
        empreinte: true,
        prestataire: true,
        createdAt: true,
      },
    });
    return { items: liste, prestataireActif: this.prestataire };
  }

  /** Le dossier de preuve complet, tel qu'il sera imprimé. */
  async dossier(signatureId: string) {
    const s = await this.prisma.signature.findUnique({
      where: { id: signatureId },
      include: { evenements: { orderBy: { createdAt: 'asc' } } },
    });
    if (!s) throw new NotFoundException('Demande de signature introuvable.');
    return dossierPreuve({
      id: s.id,
      documentType: s.documentType,
      documentId: s.documentId,
      empreinte: s.empreinte,
      signataireNom: s.signataireNom,
      signataireEmail: s.signataireEmail,
      statut: s.statut,
      signeLe: s.signeLe,
      ip: s.ip,
      userAgent: s.userAgent,
      prestataire: s.prestataire,
      evenements: s.evenements,
    });
  }
}
