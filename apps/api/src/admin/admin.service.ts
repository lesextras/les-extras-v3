import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import {
  BookingStatus,
  FormationStatus,
  FormationType,
  InvitationStatus,
  MissionStatus,
  Prisma,
  SessionStatus,
  UserStatus,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto, UpdateUserDto } from './dto/user-admin.dto';
import { randomBytes } from 'crypto';
import { ImportListingDto } from './dto/import-catalog.dto';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ConformiteService } from '../conformite/conformite.service';
import { MailService } from '../common/mail/mail.service';
import { QueryUsersDto } from './dto/query-users.dto';
import { BanUserDto } from './dto/ban-user.dto';
import { ModerateMissionDto, ModerateServiceDto } from './dto/moderate.dto';
import { UpdateCategoryDto } from './dto/category-admin.dto';
import { AuditService } from '../common/audit/audit.service';
import { MOIS_AVANT_SUPPRESSION, dansNMois, motifDeBlocage } from '../common/suppression-compte';
import { UpdateArticleDto } from './dto/article-admin.dto';
import {
  CreateFormationAdminDto,
  UpdateFormationAdminDto,
  CreateSessionAdminDto,
  UpdateSessionAdminDto,
} from './dto/formation-admin.dto';
import { DEPARTEMENTS } from '../common/territoires';
import { refuserPublicationTest, sansTitreTest } from '../common/donnees-test';

/**
 * Hypothèse d'économie moyenne réalisée sur une mission de renfort pourvue
 * « en direct » via la plateforme, comparée au recours à une agence d'intérim.
 * 250 € = estimation prudente de la marge d'agence + frais de gestion évités
 * sur une mission courte. Constante volontairement simple et ajustable ; sert
 * uniquement d'ordre de grandeur pédagogique dans les statistiques ROI.
 */
const AVG_INTERIM_SAVINGS_EUR = 250;

/** Pagination par défaut / maximale du journal d'audit. */
const AUDIT_DEFAULT_PER_PAGE = 50;
const AUDIT_MAX_PER_PAGE = 200;

/** Convertit un paramètre de date en Date valide, ou `undefined` si inexploitable. */
function parseAuditDate(value?: string): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly conformite: ConformiteService,
    private readonly audit: AuditService,
    private readonly mail: MailService,
  ) {}

  /**
   * SUIVI DES E-MAILS — l'écran qui manquait pour piloter.
   *
   * Trois séquences partent toutes seules (bienvenue à l'inscription,
   * activation le lendemain, tunnel d'accueil tous les trois jours) plus le
   * rendez-vous du lundi et l'alerte d'inscription. `MailService.send()` ne
   * lève jamais — c'est ce qui protège les parcours — mais du coup **un envoi
   * qui échoue ne se voyait nulle part**, sinon dans les journaux du
   * conteneur. Autant dire nulle part pour qui pilote depuis un navigateur.
   *
   * Cette méthode réunit deux choses de nature différente, et il faut le
   * savoir en la lisant :
   *  - l'état du TRANSPORT et le journal des envois, tenus en mémoire par
   *    `MailService` : remis à zéro à chaque redémarrage, ils répondent à
   *    « est-ce que ça part en ce moment ? » ;
   *  - l'avancement du TUNNEL, lu en base : lui est durable, et répond à
   *    « où en sont les inscrits ? ».
   */

  /**
   * LES COURRIELS, VUS DEPUIS LE PILOTAGE : ce qui est parti, ce qui a échoué,
   * et ce que les campagnes ont donné.
   *
   * ⚠ TROIS SOURCES, ET AUCUNE NE SE SUFFIT.
   *  - Le journal durable `EmailEnvoye` répond à « est-ce que mes mails
   *    partent ? ». Il remplace le compteur en mémoire de `MailService`, qui
   *    repartait à zéro à chaque redéploiement, donc plusieurs fois par jour.
   *  - Brevo répond à « est-ce qu'ils sont LUS ? ». Un envoi réussi n'est pas
   *    une ouverture, et c'est exactement la différence entre croire que la
   *    campagne marche et le savoir.
   *  - Le tunnel d'accueil garde sa propre lecture, plus bas dans l'écran.
   *
   * Brevo est interrogé en direct, sans rien stocker : ses chiffres bougent
   * pendant des jours après un envoi, et une copie locale serait fausse le
   * lendemain. Une panne de leur côté n'empêche pas d'afficher le reste.
   */
  private async courrielsTransactionnels() {
    const jour = 86_400_000;
    const il7j = new Date(Date.now() - 7 * jour);
    const il30j = new Date(Date.now() - 30 * jour);

    const [envoyes7j, echecs7j, envoyes30j, echecs30j, parVoie, derniersEchecs] =
      await Promise.all([
        this.prisma.emailEnvoye.count({ where: { ok: true, createdAt: { gte: il7j } } }),
        this.prisma.emailEnvoye.count({ where: { ok: false, createdAt: { gte: il7j } } }),
        this.prisma.emailEnvoye.count({ where: { ok: true, createdAt: { gte: il30j } } }),
        this.prisma.emailEnvoye.count({ where: { ok: false, createdAt: { gte: il30j } } }),
        this.prisma.emailEnvoye.groupBy({
          by: ['voie', 'ok'],
          where: { createdAt: { gte: il30j } },
          _count: { _all: true },
        }),
        this.prisma.emailEnvoye.findMany({
          where: { ok: false },
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: { id: true, destinataire: true, sujet: true, voie: true, erreur: true, createdAt: true },
        }),
      ]);

    return {
      envoyes7j,
      echecs7j,
      envoyes30j,
      echecs30j,
      parVoie: parVoie.map((v) => ({ voie: v.voie, ok: v.ok, total: v._count._all })),
      derniersEchecs,
    };
  }

  /** Les campagnes Brevo et ce qu'elles ont donné. Silencieux en cas de panne. */
  private async campagnesBrevo() {
    const cle = process.env.BREVO_API_KEY;
    if (!cle) return { disponible: false, motif: 'BREVO_API_KEY absente', campagnes: [] };
    try {
      const res = await fetch(
        'https://api.brevo.com/v3/emailCampaigns?statistics=globalStats&limit=15&sort=desc',
        { headers: { 'api-key': cle, accept: 'application/json' } },
      );
      if (!res.ok) {
        return { disponible: false, motif: `Brevo a répondu ${res.status}`, campagnes: [] };
      }
      const data = (await res.json()) as {
        campaigns?: {
          id: number; name: string; subject?: string; status: string; sentDate?: string;
          statistics?: { globalStats?: Record<string, number> };
        }[];
      };
      const campagnes = (data.campaigns ?? []).map((c) => {
        const g = c.statistics?.globalStats ?? {};
        const livres = g.delivered ?? 0;
        return {
          id: c.id,
          nom: c.name,
          sujet: c.subject ?? null,
          statut: c.status,
          envoyeLe: c.sentDate ?? null,
          envoyes: g.sent ?? 0,
          livres,
          // ⚠ LE TAUX SE CALCULE SUR LES MESSAGES LIVRÉS, pas sur les envoyés.
          // Rapporté aux envoyés, il compte les rebonds comme des non-ouvertures
          // et fait paraître mauvaise une campagne qui a bien marché auprès de
          // ceux qui l'ont reçue.
          ouvertures: g.uniqueViews ?? 0,
          tauxOuverture: livres > 0 ? Math.round(((g.uniqueViews ?? 0) / livres) * 1000) / 10 : null,
          clics: g.uniqueClicks ?? 0,
          tauxClic: livres > 0 ? Math.round(((g.uniqueClicks ?? 0) / livres) * 1000) / 10 : null,
          rebondsDurs: g.hardBounces ?? 0,
          rebondsMous: g.softBounces ?? 0,
          desabonnements: g.unsubscriptions ?? 0,
          plaintes: g.complaints ?? 0,
        };
      });
      return { disponible: true, motif: null, campagnes };
    } catch (e) {
      return { disponible: false, motif: (e as Error).message, campagnes: [] };
    }
  }

  /**
   * SUR QUEL MOTEUR TOURNE LEX ?
   *
   * ⚠ RIEN NE LE DISAIT NULLE PART, et ça a coûté cher : la clé Anthropic était
   * posée en production sous un autre nom de variable (`lexv3`). Le code
   * cherchait `ANTHROPIC_API_KEY`, ne trouvait rien, basculait sur Mistral en
   * silence. On pouvait payer Anthropic pendant des semaines en faisant tourner
   * autre chose, sans qu'aucun écran ne le montre.
   */
  private moteurLex() {
    const anthropic = Boolean(process.env.ANTHROPIC_API_KEY);
    const mistral = Boolean(process.env.MISTRAL_API_KEY);
    return {
      moteur: anthropic ? 'Claude (Anthropic)' : mistral ? 'Mistral (repli)' : 'aucun',
      modele: anthropic
        ? (process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-5')
        : (process.env.MISTRAL_MODEL ?? 'mistral-large-latest'),
      surRepli: !anthropic && mistral,
      indisponible: !anthropic && !mistral,
    };
  }


  /**
   * LEX, VU DEPUIS LE PILOTAGE.
   *
   * ⚠ LE POUCE HAUT/BAS S'ÉCRIVAIT DEPUIS DES MOIS ET PERSONNE NE LE LISAIT.
   * `AssistantFeedback` était rempli à chaque avis, et aucune requête ne
   * l'interrogeait nulle part. C'est le même défaut que les quatre e-mails qui
   * n'écrivaient qu'une ligne en base : la donnée entre, rien ne la regarde,
   * et on pilote à l'intuition sur un produit qui coûte un crédit par appel.
   *
   * Ce que cet écran répond, et dans cet ordre :
   *  1. Est-ce que LEX sert ? (générations, écrits gardés, adoption)
   *  2. Est-ce que ce qu'il rend est bon ? (satisfaction, par trame)
   *  3. Quelle trame réparer en premier ? (la moins bien notée, pas la moins
   *     utilisée : une trame peu utilisée mais juste ne coûte rien, une trame
   *     très utilisée et ratée abîme la confiance à chaque appel.)
   */
  async suiviLex() {
    const jour = 86_400_000;
    const il30j = new Date(Date.now() - 30 * jour);

    const [
      avisParTrame,
      documentsParTrame,
      documents30j,
      tramesMaison,
      pseudonymes,
      avecMemoire,
      commentaires,
    ] = await Promise.all([
      this.prisma.assistantFeedback.groupBy({
        by: ['trame', 'utile'],
        _count: { _all: true },
      }),
      this.prisma.assistantDocument.groupBy({
        by: ['trame'],
        _count: { _all: true },
      }),
      this.prisma.assistantDocument.count({ where: { createdAt: { gte: il30j } } }),
      this.prisma.trameMaison.count(),
      this.prisma.lexPseudonyme.count(),
      // Les écrits qui portent au moins une personne identifiée : ce sont eux
      // qui alimentent la mémoire des situations.
      this.prisma.assistantDocument.count({ where: { NOT: { sujets: { isEmpty: true } } } }),
      this.prisma.assistantFeedback.findMany({
        where: { comment: { not: null } },
        orderBy: { createdAt: 'desc' },
        take: 15,
        select: { id: true, trame: true, utile: true, comment: true, createdAt: true },
      }),
    ]);

    const parTrame = new Map<
      string,
      { trame: string; utiles: number; inutiles: number; documents: number }
    >();
    const ligne = (t: string) => {
      if (!parTrame.has(t)) {
        parTrame.set(t, { trame: t, utiles: 0, inutiles: 0, documents: 0 });
      }
      return parTrame.get(t)!;
    };
    for (const a of avisParTrame) {
      const l = ligne(a.trame);
      if (a.utile) l.utiles += a._count._all;
      else l.inutiles += a._count._all;
    }
    for (const d of documentsParTrame) ligne(d.trame).documents += d._count._all;

    const trames = [...parTrame.values()]
      .map((l) => {
        const total = l.utiles + l.inutiles;
        return {
          ...l,
          avis: total,
          // `null` et non `0` quand personne n'a voté : une trame sans avis
          // n'est pas une trame mal notée, et l'écran ne doit pas la ranger
          // parmi les problèmes.
          satisfaction: total > 0 ? Math.round((l.utiles / total) * 100) : null,
        };
      })
      .sort((a, z) => {
        if (a.satisfaction === null && z.satisfaction === null) return z.documents - a.documents;
        if (a.satisfaction === null) return 1;
        if (z.satisfaction === null) return -1;
        return a.satisfaction - z.satisfaction;
      });

    const totalAvis = trames.reduce((t, l) => t + l.avis, 0);
    const totalUtiles = trames.reduce((t, l) => t + l.utiles, 0);
    const totalDocuments = trames.reduce((t, l) => t + l.documents, 0);

    return {
      moteur: this.moteurLex(),
      usage: {
        documents: totalDocuments,
        documents30j,
        tramesMaison,
        pseudonymes,
        avecMemoire,
      },
      satisfaction: {
        avis: totalAvis,
        utiles: totalUtiles,
        taux: totalAvis > 0 ? Math.round((totalUtiles / totalAvis) * 100) : null,
      },
      trames,
      commentaires,
    };
  }

  async suiviEmails() {
    const jour = 86_400_000;
    const il7j = new Date(Date.now() - 7 * jour);
    const il30j = new Date(Date.now() - 30 * jour);

    const [parEtape, envoyes7j, aVenir, optOut, nonConfirmes, recents] =
      await Promise.all([
        this.prisma.user.groupBy({
          by: ['tunnelEtape'],
          _count: { _all: true },
          orderBy: { tunnelEtape: 'asc' },
        }),
        this.prisma.user.count({ where: { tunnelDernierAt: { gte: il7j } } }),
        // Ceux qui sont réellement dans la séquence : inscrits depuis moins de
        // 30 jours (le plancher du planificateur), adresse confirmée, opt-in,
        // et pas encore au bout des six messages.
        this.prisma.user.count({
          where: {
            emailVerified: true,
            hebdoOptIn: true,
            tunnelEtape: { lt: 6 },
            createdAt: { gte: il30j },
          },
        }),
        this.prisma.user.count({ where: { hebdoOptIn: false } }),
        this.prisma.user.count({
          where: { emailVerified: false, createdAt: { gte: il30j } },
        }),
        this.prisma.user.findMany({
          where: { createdAt: { gte: il30j } },
          orderBy: { createdAt: 'desc' },
          take: 25,
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            createdAt: true,
            emailVerified: true,
            hebdoOptIn: true,
            activationMailAt: true,
            tunnelEtape: true,
            tunnelDernierAt: true,
          },
        }),
      ]);

    // Les trois lectures sont demandées en parallèle : Brevo répond en
    // quelques centaines de millisecondes, et l'écran ne doit pas attendre.
    const [transactionnel, campagnes] = await Promise.all([
      this.courrielsTransactionnels(),
      this.campagnesBrevo(),
    ]);

    return {
      envois: this.mail.etatEnvois(),
      transactionnel,
      campagnes,
      moteurLex: this.moteurLex(),
      tunnel: {
        // Six étapes + l'étape 0 : on renvoie le tableau complet, y compris
        // les étapes à zéro, sinon l'écran affiche des trous.
        parEtape: Array.from({ length: 7 }, (_, i) => ({
          etape: i,
          comptes: parEtape.find((p) => p.tunnelEtape === i)?._count._all ?? 0,
        })),
        envoyes7j,
        aVenir,
        optOut,
        nonConfirmes,
      },
      recents,
    };
  }

  // --- Coffre-fort de conformité (agrégat plateforme) ---------------------

  /** Complétude conformité agrégée de tous les comptes établissements. */
  conformiteOverview() {
    return this.conformite.summaryForAllEstablishments();
  }

  // --- Utilisateurs -------------------------------------------------------

  async listUsers(query: QueryUsersDto) {
    const where: Prisma.UserWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.role) where.role = query.role;
    if (query.search) {
      where.OR = [
        { email: { contains: query.search, mode: 'insensitive' } },
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    return this.prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        emailVerified: true,
        createdAt: true,
        lastLoginAt: true,
        // Comptes auxquels la personne a accès, avec son rôle.
        memberships: {
          select: {
            role: true,
            status: true,
            account: { select: { id: true, name: true, type: true } },
          },
        },
        // Comptes possédés (freelance = son propre compte, ou direction d'établissement).
        ownedAccounts: { select: { id: true, name: true, type: true } },
      },
    });
  }

  async banUser(id: string, dto: BanUserDto, actorId?: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Utilisateur introuvable.');
    if (user.status === UserStatus.ANONYMIZED) {
      throw new BadRequestException(
        'Ce compte a été effacé à la demande de son titulaire : son statut ne peut plus être modifié.',
      );
    }
    const updated = await this.prisma.user.update({
      where: { id },
      data: { status: UserStatus.BANNED },
      select: { id: true, email: true, status: true },
    });
    await this.notifications.create(id, {
      type: 'ACCOUNT_BANNED',
      title: 'Compte suspendu',
      body: dto.reason ?? 'Votre compte a été suspendu par un administrateur.',
    });
    await this.audit.log({
      actorId,
      action: 'utilisateur.suspendu',
      entityType: 'User',
      entityId: id,
      summary: `Compte de ${user.email} suspendu.${dto.reason ? ` Motif : ${dto.reason}` : ''}`,
      metadata: { email: user.email, motif: dto.reason ?? null },
    });
    return updated;
  }

  async unbanUser(id: string, actorId?: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Utilisateur introuvable.');
    if (user.status === UserStatus.ANONYMIZED) {
      throw new BadRequestException(
        'Ce compte a été effacé à la demande de son titulaire : son statut ne peut plus être modifié.',
      );
    }
    const updated = await this.prisma.user.update({
      where: { id },
      data: { status: UserStatus.VERIFIED },
      select: { id: true, email: true, status: true },
    });
    await this.audit.log({
      actorId,
      action: 'utilisateur.reactive',
      entityType: 'User',
      entityId: id,
      summary: `Compte de ${user.email} réactivé.`,
      metadata: { email: user.email },
    });
    return updated;
  }

  async createUser(dto: CreateUserDto) {
    const email = dto.email.toLowerCase().trim();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException('Un utilisateur avec cet e-mail existe déjà.');
    const password = await bcrypt.hash(dto.password, 12);
    const status = dto.status ?? UserStatus.VERIFIED;
    this.refuseStatutAnonymise(status);
    return this.prisma.user.create({
      data: {
        email,
        password,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        role: dto.role ?? 'USER',
        status,
        emailVerified: status === UserStatus.VERIFIED,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });
  }

  /**
   * ANONYMIZED n'est pas un statut qu'on attribue : il n'est posé que par la
   * procédure d'effacement RGPD, qui neutralise réellement les données. Le
   * poser à la main afficherait « effacé » sur un dossier resté intact.
   */
  private refuseStatutAnonymise(status?: UserStatus | null) {
    if (status === UserStatus.ANONYMIZED) {
      throw new BadRequestException(
        'Le statut « supprimé (RGPD) » ne peut pas être attribué manuellement : il résulte de la procédure d’effacement demandée par la personne.',
      );
    }
  }

  async updateUser(id: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Utilisateur introuvable.');
    this.refuseStatutAnonymise(dto.status);
    if (user.status === UserStatus.ANONYMIZED) {
      throw new BadRequestException(
        'Ce compte a été effacé à la demande de son titulaire : il ne peut plus être modifié.',
      );
    }
    return this.prisma.user.update({
      where: { id },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        role: dto.role,
        status: dto.status,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
      },
    });
  }

  async deleteUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { _count: { select: { ownedAccounts: true } } },
    });
    if (!user) throw new NotFoundException('Utilisateur introuvable.');
    if (user._count.ownedAccounts > 0) {
      throw new BadRequestException(
        'Cet utilisateur possède un ou plusieurs comptes. Transférez ou supprimez ses comptes avant de le supprimer.',
      );
    }
    await this.prisma.user.delete({ where: { id } });
    return { deleted: true };
  }


  /**
   * LES RETOURS D'EXPÉRIENCE — moyennes, tendance, et surtout les problèmes.
   *
   * ⚠ LES PROBLÈMES SORTENT EN PREMIER ET SÉPARÉMENT. Un ennui vécu se traite
   * dans la journée ; un avis se lit quand on a le temps. Noyés dans la même
   * liste chronologique, les premiers se perdent dans les seconds — c'est
   * exactement ce que cet écran doit empêcher.
   */
  async retoursExperience() {
    const retours = await this.prisma.retourExperience.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: {
        id: true,
        createdAt: true,
        source: true,
        noteGlobale: true,
        noteSite: true,
        noteDepot: true,
        probleme: true,
        commentaire: true,
        account: { select: { id: true, name: true, type: true } },
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    const moyenne = (champ: 'noteGlobale' | 'noteSite' | 'noteDepot') => {
      const valeurs = retours
        .map((r) => r[champ])
        .filter((v): v is number => typeof v === 'number');
      if (valeurs.length === 0) return null;
      return {
        note: Math.round((valeurs.reduce((a, b) => a + b, 0) / valeurs.length) * 10) / 10,
        reponses: valeurs.length,
      };
    };

    const [invitees, repondu] = await Promise.all([
      this.prisma.account.count({ where: { enqueteAtelierAt: { not: null } } }),
      this.prisma.retourExperience
        .findMany({ distinct: ['accountId'], select: { accountId: true } })
        .then((l) => l.filter((x) => x.accountId).length),
    ]);

    return {
      total: retours.length,
      moyennes: {
        globale: moyenne('noteGlobale'),
        site: moyenne('noteSite'),
        depot: moyenne('noteDepot'),
      },
      enquete: {
        invitees,
        repondu,
        // Un taux calculé sur zéro invitation vaut null, pas 0 % : « 0 % de
        // réponses » sur une enquête qui n'est jamais partie se lit comme un
        // échec, alors qu'il n'y a rien eu à répondre.
        taux: invitees > 0 ? Math.round((repondu / invitees) * 100) : null,
      },
      problemes: retours.filter((r) => r.probleme && r.probleme.trim()),
      recents: retours.slice(0, 50),
    };
  }

  // --- Modération missions ------------------------------------------------

  async listMissions() {
    return this.prisma.reliefMission.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: { account: { select: { id: true, name: true } } },
    });
  }

  /** Détail complet d'une mission pour l'aperçu de modération (tout statut). */
  async getMission(id: string) {
    const mission = await this.prisma.reliefMission.findUnique({
      where: { id },
      include: {
        account: { select: { id: true, name: true, city: true, type: true } },
        categoryRef: { select: { id: true, title: true } },
        _count: { select: { bookings: true } },
      },
    });
    if (!mission) throw new NotFoundException('Mission introuvable.');
    return mission;
  }

  async moderateMission(id: string, dto: ModerateMissionDto, actorId?: string) {
    const mission = await this.prisma.reliefMission.findUnique({ where: { id } });
    if (!mission) throw new NotFoundException('Mission introuvable.');
    const updated = await this.prisma.reliefMission.update({
      where: { id },
      data: { status: dto.status },
    });
    await this.audit.log({
      actorId,
      action: 'mission.moderee',
      entityType: 'ReliefMission',
      entityId: id,
      accountId: mission.accountId,
      summary: `Mission « ${mission.title} » : statut ${mission.status} → ${dto.status}.`,
      metadata: { avant: mission.status, apres: dto.status },
    });
    return updated;
  }

  async deleteMission(id: string) {
    const mission = await this.prisma.reliefMission.findUnique({ where: { id } });
    if (!mission) throw new NotFoundException('Mission introuvable.');
    await this.prisma.reliefMission.delete({ where: { id } });
    return { deleted: true };
  }

  // --- Modération services ------------------------------------------------

  async listServices() {
    return this.prisma.service.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: { account: { select: { id: true, name: true } } },
    });
  }

  /** Détail complet d'un atelier pour l'aperçu de modération (tout statut). */
  async getService(id: string) {
    const service = await this.prisma.service.findUnique({
      where: { id },
      include: {
        account: { select: { id: true, name: true, city: true, type: true } },
        categoryRef: { select: { id: true, title: true } },
        _count: { select: { bookings: true } },
      },
    });
    if (!service) throw new NotFoundException('Atelier introuvable.');
    return service;
  }

  /**
   * Correction éditoriale d'une fiche, quel que soit son propriétaire.
   * Sans cela, la seule façon de compléter une ville manquante après import
   * était d'écrire directement en base.
   */
  async updateService(id: string, dto: Record<string, unknown>, acteurId: string) {
    const fiche = await this.prisma.service.findUnique({ where: { id }, select: { id: true } });
    if (!fiche) throw new NotFoundException('Atelier introuvable.');
    const donnees = Object.fromEntries(Object.entries(dto).filter(([, v]) => v !== undefined));
    // Les départements passent par le même tamis que côté intervenant : un code
    // hors référentiel écrit en base rendrait la fiche invisible de tous les
    // filtres, sans erreur ni trace. Voir `common/territoires.ts`.
    if (Array.isArray(donnees.departements)) {
      const connus = new Set(DEPARTEMENTS.map((d) => d.code));
      donnees.departements = [
        ...new Set((donnees.departements as unknown[]).filter((c): c is string =>
          typeof c === 'string' && connus.has(c),
        )),
      ].sort();
    }
    const maj = await this.prisma.service.update({ where: { id }, data: donnees });
    await this.audit.log({
      actorId: acteurId,
      action: 'admin.service.updated',
      entityType: 'Service',
      entityId: id,
      summary: `Fiche corrigée par un administrateur (${Object.keys(donnees).join(', ')})`,
      metadata: { champs: Object.keys(donnees) },
    }).catch(() => undefined);
    return maj;
  }

  async moderateService(id: string, dto: ModerateServiceDto, actorId?: string) {
    const service = await this.prisma.service.findUnique({ where: { id } });
    if (!service) throw new NotFoundException('Service introuvable.');
    if (dto.status === 'PUBLISHED') refuserPublicationTest(service.title);
    const updated = await this.prisma.service.update({
      where: { id },
      data: { status: dto.status },
    });
    await this.audit.log({
      actorId,
      action: 'atelier.modere',
      entityType: 'Service',
      entityId: id,
      accountId: service.accountId,
      summary: `Atelier « ${service.title} » : statut ${service.status} → ${dto.status}.`,
      metadata: { avant: service.status, apres: dto.status },
    });
    return updated;
  }

  async deleteService(id: string) {
    const service = await this.prisma.service.findUnique({ where: { id } });
    if (!service) throw new NotFoundException('Atelier introuvable.');
    await this.prisma.service.delete({ where: { id } });
    return { deleted: true };
  }

  // --- Comptes / Organisations -------------------------------------------

  async listAccounts(query: { type?: string; search?: string }) {
    const where: Prisma.AccountWhereInput = {};
    if (query.type === 'ESTABLISHMENT' || query.type === 'FREELANCE') {
      where.type = query.type;
    }
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { city: { contains: query.search, mode: 'insensitive' } },
        { siret: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    return this.prisma.account.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
      // Cette liste renvoie les colonnes du compte en bloc. Les coordonnées
      // bancaires n'y ont rien à faire : deux cents IBAN d'un coup, pour un
      // écran qui n'affiche que le nom, la ville et le SIRET. Elles restent
      // lisibles là où elles servent — la fiche d'un compte, et la facture
      // qui les imprime.
      omit: { iban: true, bic: true },
      include: {
        owner: { select: { id: true, email: true, firstName: true, lastName: true } },
        memberships: {
          select: {
            id: true,
            role: true,
            status: true,
            user: { select: { id: true, email: true, firstName: true, lastName: true } },
          },
          orderBy: { role: 'asc' },
        },
        _count: { select: { memberships: true, reliefMissions: true, services: true, bookings: true } },
      },
    });
  }

  async getAccount(id: string) {
    const account = await this.prisma.account.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, email: true, firstName: true, lastName: true } },
        memberships: {
          include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
        },
        _count: { select: { reliefMissions: true, services: true, bookings: true, invoices: true } },
      },
    });
    if (!account) throw new NotFoundException('Compte introuvable.');
    return account;
  }

  async updateAccount(id: string, data: Prisma.AccountUpdateInput) {
    const account = await this.prisma.account.findUnique({ where: { id } });
    if (!account) throw new NotFoundException('Compte introuvable.');
    return this.prisma.account.update({ where: { id }, data });
  }

  /**
   * Archive ou rétablit un compte. `archivedAt` porte la DATE, pas un booléen :
   * savoir QUAND un compte a disparu des listes est la première question qu'on
   * se pose quand quelqu'un signale qu'il ne se trouve plus.
   */
  /**
   * ARCHIVER / RÉTABLIR.
   *
   * ⚠⚠ RÉTABLIR ANNULE AUSSI LA SUPPRESSION PROGRAMMÉE, et ce n'est pas un
   * effet de bord : c'est la seule porte de sortie. Si « Rétablir » se
   * contentait d'effacer `archivedAt`, le compte redeviendrait visible puis
   * serait détruit à l'échéance — quelqu'un croirait l'avoir sauvé et le
   * perdrait quand même, trois mois plus tard, sans que rien ne le prévienne.
   */
  async archiverCompte(id: string, archive: boolean) {
    const compte = await this.prisma.account.findUnique({
      where: { id },
      select: { id: true, name: true },
    });
    if (!compte) throw new NotFoundException('Compte introuvable.');
    const maj = await this.prisma.account.update({
      where: { id },
      data: archive
        ? { archivedAt: new Date() }
        : { archivedAt: null, suppressionPrevueLe: null, suppressionMotifBlocage: null },
      select: {
        id: true,
        name: true,
        archivedAt: true,
        suppressionPrevueLe: true,
      },
    });
    return maj;
  }

  /**
   * SUPPRIMER UN COMPTE, C'EST L'ARCHIVER TROIS MOIS — décision de Siham,
   * 16/09/2026.
   *
   * ⚠⚠ CETTE MÉTHODE NE DÉTRUIT PLUS RIEN. Elle archivait autrefois d'un côté
   * et détruisait de l'autre ; elle fait maintenant les deux gestes d'un coup :
   * le compte sort de toutes les vues, et la date de sa suppression réelle est
   * posée à trois mois. La destruction elle-même est le travail de
   * `ComptesScheduler`, une fois le délai écoulé.
   *
   * Ce que ça répare : la suppression était immédiate, en cascade, et
   * irréversible — sur un bouton qu'on clique en croyant ranger. Trois mois,
   * c'est le temps qu'il faut pour que quelqu'un s'aperçoive qu'un compte
   * manque.
   *
   * ⚠ LA DATE D'ARCHIVAGE D'ORIGINE EST CONSERVÉE si le compte était déjà
   * archivé. « Depuis quand ce compte a-t-il disparu » est la première question
   * qu'on pose quand on ne le retrouve plus ; la réécrire au moment de
   * programmer la suppression effacerait la réponse.
   *
   * ⚠⚠ LE BLOCAGE EST CALCULÉ TOUT DE SUITE, PAS DANS TROIS MOIS (21/09/2026).
   * Le planificateur le faisait déjà, mais à l'échéance : un compte qui a émis
   * une facture affichait donc pendant trois mois une date de suppression qui
   * n'arriverait jamais, et le motif n'apparaissait qu'une fois le délai passé,
   * c'est-à-dire longtemps après que la personne qui a cliqué a cessé de
   * regarder. On le lui dit au moment où elle décide. Le comptage est le même
   * que celui du planificateur, et il appelle la MÊME fonction
   * (`motifDeBlocage`) : deux règles écrites séparément finiraient par ne plus
   * dire la même chose, et c'est l'écran qui mentirait.
   *
   * ⚠ ON PROGRAMME QUAND MÊME L'ÉCHÉANCE, et le compte est archivé dans tous
   * les cas. Refuser le geste laisserait le compte VISIBLE — c'est-à-dire
   * l'inverse de ce que la personne demandait. Archiver est le seul rangement
   * qui existe ici, et il suffit : le compte quitte les recherches, l'annuaire,
   * la vitrine et la place de marché.
   */
  async deleteAccount(id: string) {
    const account = await this.prisma.account.findUnique({
      where: { id },
      select: { id: true, name: true, archivedAt: true },
    });
    if (!account) throw new NotFoundException('Compte introuvable.');

    const [factures, facturesAPayer, contrats] = await Promise.all([
      this.prisma.invoice.count({ where: { accountId: id } }),
      this.prisma.invoice.count({ where: { payerAccountId: id } }),
      this.prisma.contratCDD.count({ where: { accountId: id } }),
    ]);
    const blocage = motifDeBlocage({ factures, facturesAPayer, contrats });

    const maj = await this.prisma.account.update({
      where: { id },
      data: {
        archivedAt: account.archivedAt ?? new Date(),
        suppressionPrevueLe: dansNMois(new Date(), MOIS_AVANT_SUPPRESSION),
        // Le motif relevé à l'instant, ou une page blanche s'il n'y en a pas :
        // un blocage inscrit il y a trois mois ne dit rien d'aujourd'hui.
        suppressionMotifBlocage: blocage,
      },
      select: {
        id: true,
        name: true,
        archivedAt: true,
        suppressionPrevueLe: true,
        suppressionMotifBlocage: true,
      },
    });

    // `deleted: false` est important pour l'écran : il ne doit pas annoncer une
    // destruction qui n'a pas eu lieu.
    return { deleted: false, programme: true, ...maj };
  }

  // --- Catégories (taxonomie éditable) -----------------------------------

  private slugify(input: string) {
    // ⚠ Les accents sont RETIRÉS après la décomposition NFD (24/09/2026).
    // Sans la seconde ligne, « numérique » devenait « nume-rique » : le
    // e et son accent décomposé étaient coupés par un tiret. Les adresses
    // déjà publiées ne changent pas (le slug n'est calculé qu'à la création).
    return input
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 80);
  }

  async listCategories() {
    return this.prisma.category.findMany({
      orderBy: [{ type: 'asc' }, { title: 'asc' }],
      include: {
        parent: { select: { id: true, title: true } },
        _count: { select: { children: true, articles: true } },
      },
    });
  }

  async createCategory(dto: {
    title: string;
    description?: string;
    type?: string;
    parentId?: string;
    archived?: boolean;
  }) {
    let slug = this.slugify(dto.title);
    const exists = await this.prisma.category.findUnique({ where: { slug } });
    if (exists) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
    return this.prisma.category.create({
      data: {
        title: dto.title,
        slug,
        description: dto.description,
        type: dto.type,
        parentId: dto.parentId || null,
        archived: dto.archived ?? false,
      },
    });
  }

  async updateCategory(id: string, dto: UpdateCategoryDto) {
    const cat = await this.prisma.category.findUnique({ where: { id } });
    if (!cat) throw new NotFoundException('Catégorie introuvable.');
    const data: Prisma.CategoryUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title as string;
    if (dto.description !== undefined) data.description = dto.description as string;
    if (dto.type !== undefined) data.type = dto.type as string;
    if (dto.archived !== undefined) data.archived = dto.archived as boolean;
    if (dto.parentId !== undefined) {
      data.parent = dto.parentId ? { connect: { id: dto.parentId as string } } : { disconnect: true };
    }
    return this.prisma.category.update({ where: { id }, data });
  }

  async removeCategory(id: string) {
    const cat = await this.prisma.category.findUnique({ where: { id } });
    if (!cat) throw new NotFoundException('Catégorie introuvable.');
    await this.prisma.category.delete({ where: { id } });
    return { deleted: true };
  }

  // --- Articles (contenu) -------------------------------------------------

  async listArticles() {
    return this.prisma.article.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        category: { select: { id: true, title: true } },
        author: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
  }

  async createArticle(dto: {
    title: string;
    excerpt?: string;
    content?: string;
    coverUrl?: string;
    categoryId?: string;
    kind?: 'ACTUALITE' | 'ARTICLE';
    status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
    authorId?: string;
    publishedAt?: string;
  }) {
    let slug = this.slugify(dto.title);
    const exists = await this.prisma.article.findUnique({ where: { slug } });
    if (exists) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
    return this.prisma.article.create({
      data: {
        title: dto.title,
        slug,
        excerpt: dto.excerpt,
        content: dto.content,
        coverUrl: dto.coverUrl,
        kind: dto.kind ?? 'ARTICLE',
        status: dto.status ?? 'DRAFT',
        publishedAt: dto.publishedAt
          ? new Date(dto.publishedAt)
          : dto.status === 'PUBLISHED'
            ? new Date()
            : null,
        categoryId: dto.categoryId || null,
        authorId: dto.authorId || null,
      },
    });
  }

  async updateArticle(id: string, dto: UpdateArticleDto) {
    const article = await this.prisma.article.findUnique({ where: { id } });
    if (!article) throw new NotFoundException('Article introuvable.');
    const data: Prisma.ArticleUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title as string;
    if (dto.excerpt !== undefined) data.excerpt = dto.excerpt as string;
    if (dto.content !== undefined) data.content = dto.content as string;
    if (dto.coverUrl !== undefined) data.coverUrl = dto.coverUrl as string;
    if (dto.kind !== undefined) data.kind = dto.kind as 'ACTUALITE' | 'ARTICLE';
    if (dto.status !== undefined) {
      data.status = dto.status as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
      if (dto.status === 'PUBLISHED' && !article.publishedAt) data.publishedAt = new Date();
    }
    if (dto.categoryId !== undefined) {
      data.category = dto.categoryId ? { connect: { id: dto.categoryId as string } } : { disconnect: true };
    }
    // Date explicite (import d'un article existant) : elle prime sur le
    // « maintenant » posé automatiquement à la première publication.
    if (dto.publishedAt !== undefined) data.publishedAt = new Date(dto.publishedAt);
    return this.prisma.article.update({ where: { id }, data });
  }

  async removeArticle(id: string) {
    const article = await this.prisma.article.findUnique({ where: { id } });
    if (!article) throw new NotFoundException('Article introuvable.');
    await this.prisma.article.delete({ where: { id } });
    return { deleted: true };
  }

  // --- Réservations (supervision) ----------------------------------------

  async listBookings(query: { status?: string }) {
    const where: Prisma.BookingWhereInput = {};
    if (query.status) where.status = query.status as never;
    return this.prisma.booking.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        account: { select: { id: true, name: true, type: true } },
        mission: { select: { id: true, title: true } },
        service: { select: { id: true, title: true } },
        // Certaines réservations naissent d'un devis sans mission ni atelier
        // rattaché : sans cette référence, la colonne « Objet » affichait « — ».
        quote: { select: { id: true, reference: true } },
      },
    });
  }

  /** Met à jour le statut d'une réservation (back-office). */
  async updateBookingStatus(id: string, status: BookingStatus) {
    const booking = await this.prisma.booking.findUnique({ where: { id } });
    if (!booking) throw new NotFoundException('Réservation introuvable.');
    return this.prisma.booking.update({
      where: { id },
      data: { status },
      include: {
        account: { select: { id: true, name: true, type: true } },
        mission: { select: { id: true, title: true } },
        service: { select: { id: true, title: true } },
      },
    });
  }

  // --- Factures (supervision) --------------------------------------------

  async listInvoices(query: { status?: string }) {
    const where: Prisma.InvoiceWhereInput = {};
    if (query.status) where.status = query.status as never;
    return this.prisma.invoice.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: { account: { select: { id: true, name: true, type: true } } },
    });
  }

  /** Facture complète pour l'admin plateforme (hors périmètre de compte actif). */
  async getInvoice(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        booking: {
          include: {
            service: { select: { title: true } },
            mission: { select: { title: true } },
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
            // Coordonnées bancaires de l'émetteur : l'admin plateforme ouvre
            // la même facture imprimable que les parties, et sans elles le
            // document qu'il consulte ne dirait pas la même chose. Réservé au
            // détail d'UNE facture (`getInvoice`) ; la liste de supervision
            // au-dessus ne les demande pas.
            iban: true,
            bic: true,
            owner: { select: { email: true } },
          },
        },
      },
    });
    if (!invoice) throw new NotFoundException('Facture introuvable.');
    return invoice;
  }

  async updateInvoiceStatus(id: string, status: string) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id } });
    if (!invoice) throw new NotFoundException('Facture introuvable.');
    const data: Prisma.InvoiceUpdateInput = { status: status as never };
    if (status === 'ISSUED' && !invoice.issuedAt) data.issuedAt = new Date();
    return this.prisma.invoice.update({ where: { id }, data });
  }

  // --- Centre de formation ------------------------------------------------

  async listFormations(params: { type?: string; status?: string }) {
    const where: Prisma.FormationWhereInput = {};
    if (params.type) where.type = params.type as FormationType;
    if (params.status) where.status = params.status as FormationStatus;
    return this.prisma.formation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        ownerAccount: { select: { id: true, name: true } },
        categoryRef: { select: { id: true, title: true } },
        _count: { select: { sessions: true } },
      },
    });
  }

  async listSessions(params: { status?: string }) {
    const where: Prisma.FormationSessionWhereInput = {};
    if (params.status) where.status = params.status as SessionStatus;
    return this.prisma.formationSession.findMany({
      where,
      orderBy: { startDate: 'desc' },
      include: {
        formation: { select: { id: true, title: true, type: true } },
        trainer: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { inscriptions: true } },
      },
    });
  }

  /**
   * Détermine le compte OF (Organisme de Formation) propriétaire d'un programme.
   * Choix (documenté) :
   *  1. `explicit` fourni dans le DTO → on l'utilise (après vérification d'existence) ;
   *  2. sinon, le 1er compte ESTABLISHMENT dont le nom contient « ADéPA / ADEPA » ;
   *  3. sinon, le compte ESTABLISHMENT le plus ancien (fallback catalogue) ;
   *  4. sinon → erreur explicite (aucun OF disponible).
   */
  private async resolveOwnerAccountId(explicit?: string): Promise<string> {
    if (explicit) {
      const acc = await this.prisma.account.findUnique({ where: { id: explicit } });
      if (!acc) throw new BadRequestException('Compte propriétaire introuvable.');
      return acc.id;
    }
    const adepa = await this.prisma.account.findFirst({
      where: {
        type: 'ESTABLISHMENT',
        OR: [
          { name: { contains: 'adépa', mode: 'insensitive' } },
          { name: { contains: 'adepa', mode: 'insensitive' } },
        ],
      },
      orderBy: { createdAt: 'asc' },
    });
    if (adepa) return adepa.id;
    const anyEstablishment = await this.prisma.account.findFirst({
      where: { type: 'ESTABLISHMENT' },
      orderBy: { createdAt: 'asc' },
    });
    if (anyEstablishment) return anyEstablishment.id;
    throw new BadRequestException(
      "Aucun compte établissement (OF) disponible pour rattacher la formation. Créez d'abord un compte ADéPA.",
    );
  }

  async getFormation(id: string) {
    const formation = await this.prisma.formation.findUnique({
      where: { id },
      include: {
        ownerAccount: { select: { id: true, name: true } },
        categoryRef: { select: { id: true, title: true } },
        _count: { select: { sessions: true } },
        sessions: {
          orderBy: { startDate: 'desc' },
          include: {
            trainer: { select: { id: true, firstName: true, lastName: true } },
            _count: { select: { inscriptions: true } },
          },
        },
      },
    });
    if (!formation) throw new NotFoundException('Formation introuvable.');
    return formation;
  }

  /**
   * Mode « mini-formation gratuite en ligne » : le drapeau et l'adresse vont
   * ensemble. Une fiche `freeOnline` sans `enrollUrl` n'a aucun appel a
   * l'action — son unique bouton n'a nulle part ou aller — et le defaut ne se
   * voit qu'en ouvrant la page publique. On le refuse a la saisie.
   */
  private assertModeGratuitCoherent(freeOnline?: boolean, enrollUrl?: string | null) {
    if (freeOnline && !enrollUrl) {
      throw new BadRequestException(
        "Une formation gratuite en ligne doit indiquer l'adresse ou elle se suit (enrollUrl).",
      );
    }
  }

  async createFormation(dto: CreateFormationAdminDto) {
    this.assertModeGratuitCoherent(dto.freeOnline, dto.enrollUrl);
    const ownerAccountId = await this.resolveOwnerAccountId(dto.ownerAccountId);
    const type = dto.type ?? FormationType.CERTIFIANTE;
    const isInterne = type === FormationType.INTERNE;
    const cpfEligible = isInterne ? false : dto.cpfEligible ?? false;
    const certifying = isInterne ? false : dto.certifying ?? false;

    let slug = this.slugify(dto.title);
    const exists = await this.prisma.formation.findUnique({ where: { slug } });
    if (exists) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;

    return this.prisma.formation.create({
      data: {
        type,
        title: dto.title,
        slug,
        summary: dto.summary,
        objectives: dto.objectives,
        prerequisites: dto.prerequisites,
        program: dto.program,
        targetAudience: dto.targetAudience,
        durationHours: dto.durationHours,
        cpfEligible,
        certifying,
        certificationName: isInterne ? null : dto.certificationName,
        edofRef: isInterne ? null : dto.edofRef,
        status: dto.status ?? FormationStatus.DRAFT,
        freeOnline: dto.freeOnline ?? false,
        enrollUrl: dto.enrollUrl ?? null,
        // ⚠ LA VITRINE (16/09/2026). Ces sept champs existaient en base et
        // n'étaient écrits que par un script de seed : une formation créée
        // depuis l'administration arrivait au catalogue sans photo, sans
        // ville et sans public filtrable, à côté de cartes d'atelier qui
        // portent les trois. Voir l'en-tête du DTO.
        images: dto.images ?? [],
        city: dto.city ?? null,
        publicTargets: dto.publicTargets ?? [],
        durationMinutes: dto.durationMinutes ?? null,
        methodology: dto.methodology ?? null,
        evaluation: dto.evaluation ?? null,
        // `as unknown as object` : le même passage que `services.service.ts` — un
        // tableau de DTO ne satisfait pas `InputJsonValue`, qui exige une
        // signature d'index.
        faq: dto.faq === undefined ? Prisma.DbNull : (dto.faq as unknown as object),
        ownerAccount: { connect: { id: ownerAccountId } },
        categoryRef: dto.categoryId ? { connect: { id: dto.categoryId } } : undefined,
      },
      include: {
        ownerAccount: { select: { id: true, name: true } },
        categoryRef: { select: { id: true, title: true } },
        _count: { select: { sessions: true } },
      },
    });
  }

  async updateFormation(id: string, dto: UpdateFormationAdminDto) {
    const formation = await this.prisma.formation.findUnique({ where: { id } });
    if (!formation) throw new NotFoundException('Formation introuvable.');

    // La coherence se verifie sur l'ETAT RESULTANT, pas sur le seul DTO : cocher
    // « gratuite » sur une fiche qui porte deja son adresse est valide, et
    // effacer l'adresse d'une fiche deja gratuite ne l'est pas.
    this.assertModeGratuitCoherent(
      dto.freeOnline ?? formation.freeOnline,
      dto.enrollUrl !== undefined ? dto.enrollUrl : formation.enrollUrl,
    );

    const data: Prisma.FormationUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.summary !== undefined) data.summary = dto.summary;
    if (dto.objectives !== undefined) data.objectives = dto.objectives;
    if (dto.prerequisites !== undefined) data.prerequisites = dto.prerequisites;
    if (dto.program !== undefined) data.program = dto.program;
    if (dto.targetAudience !== undefined) data.targetAudience = dto.targetAudience;
    if (dto.durationHours !== undefined) data.durationHours = dto.durationHours;
    if (dto.edofRef !== undefined) data.edofRef = dto.edofRef;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.freeOnline !== undefined) data.freeOnline = dto.freeOnline;
    if (dto.enrollUrl !== undefined) data.enrollUrl = dto.enrollUrl;
    // ⚠ La vitrine, même liste qu'à la création. `undefined` = champ non
    // envoyé, donc non touché ; c'est ce qui permet à l'écran de n'envoyer que
    // ce qui a changé sans effacer le reste au passage.
    if (dto.images !== undefined) data.images = dto.images;
    if (dto.city !== undefined) data.city = dto.city;
    if (dto.publicTargets !== undefined) data.publicTargets = dto.publicTargets;
    if (dto.durationMinutes !== undefined) data.durationMinutes = dto.durationMinutes;
    if (dto.methodology !== undefined) data.methodology = dto.methodology;
    if (dto.evaluation !== undefined) data.evaluation = dto.evaluation;
    // ⚠ `DbNull`, pas `null` : sur une colonne Json, Prisma distingue le JSON
    // `null` (une valeur) du NULL de la base (l'absence). Envoyer `null` tout
    // court est refusé à la compilation, et écrirait la valeur JSON `null` —
    // que la fiche publique afficherait comme une FAQ vide plutôt que comme
    // une fiche sans FAQ.
    if (dto.faq !== undefined) {
      data.faq = dto.faq === null ? Prisma.DbNull : (dto.faq as unknown as object);
    }
    /**
     * ⚠⚠ L'INTERRUPTEUR DE LA VENTE DE L'ATTESTATION.
     *
     * Zéro et nul ferment la vente ; on écrit `null` dans les deux cas, pour
     * qu'il n'existe qu'une seule façon de dire « fermé » en base. Sans ça,
     * une fiche à 0 et une fiche à null se liraient différemment selon la
     * requête qui les relit, alors qu'elles disent la même chose.
     */
    if (dto.attestationPrixCents !== undefined) {
      data.attestationPrixCents =
        dto.attestationPrixCents && dto.attestationPrixCents > 0
          ? dto.attestationPrixCents
          : null;
    }

    // Cohérence type : une formation INTERNE ne peut être ni CPF ni certifiante.
    const nextType = dto.type ?? formation.type;
    const isInterne = nextType === FormationType.INTERNE;
    if (isInterne) {
      data.cpfEligible = false;
      data.certifying = false;
      data.certificationName = null;
    } else {
      if (dto.cpfEligible !== undefined) data.cpfEligible = dto.cpfEligible;
      if (dto.certifying !== undefined) data.certifying = dto.certifying;
      if (dto.certificationName !== undefined) data.certificationName = dto.certificationName;
    }

    if (dto.categoryId !== undefined) {
      data.categoryRef = dto.categoryId
        ? { connect: { id: dto.categoryId } }
        : { disconnect: true };
    }

    return this.prisma.formation.update({
      where: { id },
      data,
      include: {
        ownerAccount: { select: { id: true, name: true } },
        categoryRef: { select: { id: true, title: true } },
        _count: { select: { sessions: true } },
      },
    });
  }

  async deleteFormation(id: string) {
    const formation = await this.prisma.formation.findUnique({ where: { id } });
    if (!formation) throw new NotFoundException('Formation introuvable.');
    await this.prisma.formation.delete({ where: { id } });
    return { deleted: true };
  }

  async createFormationSession(formationId: string, dto: CreateSessionAdminDto) {
    const formation = await this.prisma.formation.findUnique({ where: { id: formationId } });
    if (!formation) throw new NotFoundException('Formation introuvable.');
    return this.prisma.formationSession.create({
      data: {
        formation: { connect: { id: formationId } },
        title: dto.title,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        location: dto.location,
        maxSeats: dto.maxSeats,
        priceHt: dto.priceHt !== undefined ? new Prisma.Decimal(dto.priceHt) : undefined,
        trainerFeeHt:
          dto.trainerFeeHt !== undefined ? new Prisma.Decimal(dto.trainerFeeHt) : undefined,
        trainer: dto.trainerId ? { connect: { id: dto.trainerId } } : undefined,
        status: dto.status,
      },
      include: {
        trainer: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { inscriptions: true } },
      },
    });
  }

  /**
   * Correction d'une session existante par l'administration plateforme.
   * Symétrique de createFormationSession : l'admin pouvait créer une session
   * mais jamais la corriger — une erreur de prix ou de date publiée restait
   * figée, sauf à être membre du compte organisme propriétaire.
   */
  async updateFormationSession(sessionId: string, dto: UpdateSessionAdminDto) {
    const session = await this.prisma.formationSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Session introuvable.');
    return this.prisma.formationSession.update({
      where: { id: sessionId },
      data: {
        title: dto.title,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        location: dto.location,
        maxSeats: dto.maxSeats,
        priceHt: dto.priceHt !== undefined ? new Prisma.Decimal(dto.priceHt) : undefined,
        trainerFeeHt:
          dto.trainerFeeHt !== undefined ? new Prisma.Decimal(dto.trainerFeeHt) : undefined,
        trainer: dto.trainerId ? { connect: { id: dto.trainerId } } : undefined,
        status: dto.status,
      },
      include: {
        trainer: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { inscriptions: true } },
      },
    });
  }

  // --- Registre & BPF (Bilan Pédagogique et Financier) --------------------

  /**
   * Registre des formations : une ligne par session avec effectifs & assiduité.
   *
   * UNE INSCRIPTION ANNULÉE N'EST PAS UN STAGIAIRE. Le registre les comptait :
   * un effectif annoncé au-dessus du réel, sur le document même qui sert à
   * répondre à un contrôle. On les écarte partout où l'on compte quelqu'un.
   */
  private static readonly INSCRIPTION_RETENUE = {
    status: { not: 'CANCELLED' as const },
  };

  async registre() {
    const retenue = AdminService.INSCRIPTION_RETENUE;
    const sessions = await this.prisma.formationSession.findMany({
      orderBy: { startDate: 'desc' },
      include: {
        formation: { select: { title: true, type: true, durationHours: true, certifying: true } },
        _count: { select: { inscriptions: { where: retenue }, emargements: true } },
        inscriptions: { where: retenue, select: { financing: true } },
      },
    });
    return sessions.map((s) => {
      const financements: Record<string, number> = {};
      for (const i of s.inscriptions) {
        financements[i.financing] = (financements[i.financing] ?? 0) + 1;
      }
      return {
        id: s.id,
        // ⚠ `?? ', '` : scorie du nettoyage des tirets du 4/09/2026. Une
        // session dont la formation a été supprimée s'affichait « , » dans la
        // liste d'administration, ce qui se lit comme un défaut d'affichage
        // plutôt que comme la donnée manquante qu'il faut aller réparer.
        formation: s.formation?.title ?? 'Formation supprimée',
        type: s.formation?.type ?? null,
        certifying: s.formation?.certifying ?? false,
        startDate: s.startDate,
        durationHours: s.formation?.durationHours ?? null,
        inscrits: s._count.inscriptions,
        emargements: s._count.emargements,
        financements,
      };
    });
  }

  /** Agrégation BPF annuelle (effectifs, heures-stagiaires, produits par financement). */
  async bpf(year?: number) {
    const y = year ?? new Date().getFullYear();
    const start = new Date(`${y}-01-01T00:00:00.000Z`);
    const end = new Date(`${y + 1}-01-01T00:00:00.000Z`);
    const sessions = await this.prisma.formationSession.findMany({
      where: { startDate: { gte: start, lt: end } },
      include: {
        formation: { select: { durationHours: true } },
        // Le BPF part à la DREETS : un effectif ou un produit surévalué s'y
        // retrouve tel quel. On exclut les inscriptions annulées, et on ne
        // compte en produit que les factures réellement émises — un brouillon
        // ou une facture annulée n'est pas un encaissement.
        inscriptions: {
          where: AdminService.INSCRIPTION_RETENUE,
          select: {
            financing: true,
            invoice: { select: { amount: true, status: true } },
          },
        },
      },
    });
    let stagiaires = 0;
    let heuresStagiaires = 0;
    const parFinancement: Record<string, number> = {};
    const produits: Record<string, number> = {};
    for (const s of sessions) {
      const h = s.formation?.durationHours ?? 0;
      for (const i of s.inscriptions) {
        stagiaires += 1;
        heuresStagiaires += h;
        parFinancement[i.financing] = (parFinancement[i.financing] ?? 0) + 1;
        const factureCompte =
          i.invoice && i.invoice.status !== 'DRAFT' && i.invoice.status !== 'CANCELLED';
        const amt = factureCompte ? Number(i.invoice!.amount) : 0;
        produits[i.financing] = (produits[i.financing] ?? 0) + amt;
      }
    }
    const produitTotal = Object.values(produits).reduce((a, b) => a + b, 0);
    return { year: y, nbSessions: sessions.length, stagiaires, heuresStagiaires, parFinancement, produits, produitTotal };
  }

  /** Export CSV du BPF (une ligne par type de financement + total). */
  async bpfCsv(year?: number): Promise<string> {
    const b = await this.bpf(year);
    const rows: string[] = [];
    rows.push('BPF;Annee;' + b.year);
    rows.push('Sessions;' + b.nbSessions);
    rows.push('Stagiaires;' + b.stagiaires);
    rows.push('Heures-stagiaires;' + b.heuresStagiaires);
    rows.push('');
    rows.push('Financement;Stagiaires;Produits (EUR)');
    const keys = new Set([...Object.keys(b.parFinancement), ...Object.keys(b.produits)]);
    for (const k of keys) {
      rows.push(`${k};${b.parFinancement[k] ?? 0};${(b.produits[k] ?? 0).toFixed(2)}`);
    }
    rows.push(`TOTAL;${b.stagiaires};${b.produitTotal.toFixed(2)}`);
    return rows.join('\n');
  }

  // --- Invitations --------------------------------------------------------

  async listInvitations(status?: string) {
    const where: Prisma.InvitationWhereInput = {};
    if (status) where.status = status as InvitationStatus;
    return this.prisma.invitation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        account: { select: { id: true, name: true, type: true } },
        invitedBy: { select: { email: true, firstName: true, lastName: true } },
      },
    });
  }

  async revokeInvitation(id: string) {
    const inv = await this.prisma.invitation.findUnique({ where: { id } });
    if (!inv) throw new NotFoundException('Invitation introuvable.');
    return this.prisma.invitation.update({
      where: { id },
      data: { status: InvitationStatus.REVOKED },
    });
  }

  async resendInvitation(id: string) {
    const inv = await this.prisma.invitation.findUnique({ where: { id } });
    if (!inv) throw new NotFoundException('Invitation introuvable.');
    return this.prisma.invitation.update({
      where: { id },
      data: {
        status: InvitationStatus.PENDING,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
  }

  // --- Stats rapides ------------------------------------------------------

  async stats() {
    const [users, accounts, missions, services, bookings, invoices, categories, articles, formations] =
      await this.prisma.$transaction([
        // ⚠ 24/09/2026 : les comptes archivés (décor d'audit) et les données
        // marquées « test » ne comptent plus. Un indicateur qui compte la
        // recette ment à la personne qui décide.
        this.prisma.user.count(),
        this.prisma.account.count({ where: { archivedAt: null } }),
        this.prisma.reliefMission.count({ where: { account: { archivedAt: null }, ...sansTitreTest() } }),
        this.prisma.service.count({ where: { account: { archivedAt: null }, ...sansTitreTest() } }),
        this.prisma.booking.count({ where: { account: { archivedAt: null } } }),
        this.prisma.invoice.count(),
        this.prisma.category.count(),
        this.prisma.article.count(),
        this.prisma.formation.count(),
      ]);
    return { users, accounts, missions, services, bookings, invoices, categories, articles, formations };
  }

  /**
   * Le Desk — cockpit d'exploitation piloté par alertes.
   * Remonte uniquement ce qui demande une action humaine maintenant :
   * missions urgentes non pourvues, comptes à valider, documents de
   * conformité expirés ou proches de l'échéance, heures à valider,
   * contenus en attente de modération.
   */
  async desk() {
    const now = new Date();
    const in48h = new Date(now.getTime() + 48 * 3600 * 1000);
    const in30d = new Date(now.getTime() + 30 * 24 * 3600 * 1000);

    const [
      urgentMissions,
      pendingUsers,
      expiringDocs,
      pendingTimeEntries,
      draftMissions,
      draftServices,
      pendingContacts,
    ] = await this.prisma.$transaction([
        // Missions publiées qui démarrent dans moins de 48 h et ne sont pas pourvues.
        //
        // ⚠ LA BORNE BASSE MANQUAIT, ET LE COMPTEUR NE POUVAIT QUE GROSSIR.
        // Sans `gte: now`, « démarre dans moins de 48 h » attrapait aussi tout
        // ce qui avait démarré la semaine dernière, le mois dernier, en juillet.
        // Une alerte qui ne redescend jamais cesse d'être une alerte : on
        // apprend à ne plus la regarder, et la vraie urgence s'y noie.
        this.prisma.reliefMission.findMany({
          where: { status: 'PUBLISHED', startDate: { gte: now, lte: in48h } },
          orderBy: { startDate: 'asc' },
          take: 10,
          select: {
            id: true, title: true, startDate: true, city: true, emergency: true,
            account: { select: { name: true } },
          },
        }),
        // Comptes en attente de vérification (les plus anciens d'abord).
        this.prisma.user.findMany({
          where: { status: 'PENDING' },
          orderBy: { createdAt: 'asc' },
          take: 10,
          select: {
            id: true, email: true, role: true, createdAt: true,
            firstName: true, lastName: true,
          },
        }),
        // Documents de conformité expirés ou qui expirent sous 30 jours.
        this.prisma.complianceDocument.findMany({
          where: { expiresAt: { not: null, lte: in30d } },
          orderBy: { expiresAt: 'asc' },
          take: 10,
          select: {
            id: true, type: true, label: true, expiresAt: true, accountId: true,
            user: { select: { email: true, firstName: true, lastName: true } },
          },
        }),
        // Heures déclarées en attente de validation.
        this.prisma.timeEntry.count({ where: { status: 'PENDING' } }),
        this.prisma.reliefMission.count({ where: { status: 'DRAFT' } }),
        this.prisma.service.count({ where: { status: 'DRAFT' } }),
        // ⚠ UNE FILE D'ATTENTE QUI N'APPARAISSAIT NULLE PART.
        //
        // Un message envoyé depuis le formulaire de contact demande une
        // réponse humaine : c'est la définition même de ce cockpit. Mesuré le
        // 3/09/2026, quatre messages dormaient sans que rien ne le dise. (Les
        // demandes de rattachement, comptées ici aussi, sont retirées depuis
        // le 24/09/2026 : « 1 compte = 1 personne ».)
        this.prisma.contactRequest.count({ where: { status: 'NEW' } }),
      ]);

    const expired = expiringDocs.filter((d) => d.expiresAt && d.expiresAt < now).length;

    return {
      generatedAt: now.toISOString(),
      urgentMissions,
      pendingUsers,
      expiringDocuments: expiringDocs,
      counts: {
        urgentMissions: urgentMissions.length,
        pendingUsers: pendingUsers.length,
        expiredDocuments: expired,
        expiringDocuments: expiringDocs.length - expired,
        pendingTimeEntries,
        pendingModeration: draftMissions + draftServices,
        pendingContacts,
      },
    };
  }

  /**
   * Statistiques ROI & performance de la marketplace de renfort.
   * Toutes les valeurs sont calculées à partir des données réelles (missions +
   * bookings). Voir AVG_INTERIM_SAVINGS_EUR pour l'hypothèse d'économie.
   */
  /**
   * L'AUDIENCE PAR CANAL, ET CE QUE CHAQUE CANAL A PRODUIT — 4/09/2026.
   *
   * Demandé par Siham : « il faut qu'on puisse voir les statistiques du site
   * pour mesurer si ça marche et par quel canal ». Trois tables portent la même
   * clé `source` (première origine de la visite, posée par `lib/source.ts`) :
   * `VuePage` pour l'audience, `Account` pour les inscriptions, `CaptureFiche`
   * pour les adresses captées, `ContactRequest` pour les demandes. On les
   * aligne ici canal par canal : c'est la seule lecture qui dise si un canal
   * amène des VISITES ou des GENS.
   *
   * ⚠ L'audience commence le jour du déploiement du compteur ; les comptes,
   * captures et demandes portent leur source depuis bien avant. Sur les
   * premières semaines, un canal peut donc afficher des inscriptions sans
   * visite : ce n'est pas un bogue, c'est l'historique.
   */
  async audience(jours = 30) {
    const fenetre = [7, 30, 90].includes(jours) ? jours : 30;
    const depuis = new Date(Date.now() - fenetre * 86_400_000);
    depuis.setUTCHours(0, 0, 0, 0);

    const [parJour, parCanal, pages, comptes, captures, demandes, capturesTotal, capturesOptin] =
      await Promise.all([
        this.prisma.vuePage.groupBy({
          by: ['jour'],
          where: { jour: { gte: depuis } },
          _sum: { vues: true, visites: true },
          orderBy: { jour: 'asc' },
        }),
        this.prisma.vuePage.groupBy({
          by: ['source', 'medium'],
          where: { jour: { gte: depuis } },
          _sum: { vues: true, visites: true },
          orderBy: { _sum: { visites: 'desc' } },
          take: 30,
        }),
        this.prisma.vuePage.groupBy({
          by: ['chemin'],
          where: { jour: { gte: depuis } },
          _sum: { vues: true, visites: true },
          orderBy: { _sum: { vues: 'desc' } },
          take: 40,
        }),
        this.prisma.account.groupBy({
          by: ['source'],
          where: { createdAt: { gte: depuis } },
          _count: { _all: true },
        }),
        this.prisma.captureFiche.groupBy({
          by: ['source'],
          where: { createdAt: { gte: depuis } },
          _count: { _all: true },
        }),
        this.prisma.contactRequest.groupBy({
          by: ['source'],
          where: { createdAt: { gte: depuis } },
          _count: { _all: true },
        }),
        this.prisma.captureFiche.count(),
        this.prisma.captureFiche.count({ where: { consentTunnel: true, desabonneAt: null } }),
      ]);

    // Une ligne par source, quel que soit le côté d'où elle vient : un canal
    // qui a produit une inscription sans une seule vue doit apparaître.
    const canaux = new Map<
      string,
      { source: string; vues: number; visites: number; inscriptions: number; captures: number; demandes: number }
    >();
    const ligne = (source: string | null) => {
      const cle = (source || 'direct').toLowerCase();
      let l = canaux.get(cle);
      if (!l) {
        l = { source: cle, vues: 0, visites: 0, inscriptions: 0, captures: 0, demandes: 0 };
        canaux.set(cle, l);
      }
      return l;
    };
    for (const c of parCanal) {
      const l = ligne(c.source);
      l.vues += c._sum.vues ?? 0;
      l.visites += c._sum.visites ?? 0;
    }
    for (const c of comptes) ligne(c.source).inscriptions += c._count._all;
    for (const c of captures) ligne(c.source).captures += c._count._all;
    for (const c of demandes) ligne(c.source).demandes += c._count._all;

    const totalVues = parJour.reduce((t, j) => t + (j._sum.vues ?? 0), 0);
    const totalVisites = parJour.reduce((t, j) => t + (j._sum.visites ?? 0), 0);
    const totalInscriptions = comptes.reduce((t, c) => t + c._count._all, 0);
    const totalCaptures = captures.reduce((t, c) => t + c._count._all, 0);
    const totalDemandes = demandes.reduce((t, c) => t + c._count._all, 0);

    // Part organique : ce qui n'est ni payé ni envoyé par nous. C'est le
    // chiffre que les marketplaces regardent pour savoir si elles tiennent
    // debout sans acheter leur trafic.
    const PAYE = new Set(['cpc', 'paid_social', 'display', 'paid']);
    const ENVOYE = new Set(['email', 'brevo', 'newsletter']);
    let visitesPayees = 0;
    let visitesEnvoyees = 0;
    for (const c of parCanal) {
      const m = (c.medium || '').toLowerCase();
      if (PAYE.has(m)) visitesPayees += c._sum.visites ?? 0;
      else if (ENVOYE.has(m) || ENVOYE.has((c.source || '').toLowerCase()))
        visitesEnvoyees += c._sum.visites ?? 0;
    }

    return {
      fenetre,
      depuis,
      global: {
        vues: totalVues,
        visites: totalVisites,
        inscriptions: totalInscriptions,
        captures: totalCaptures,
        demandes: totalDemandes,
        partOrganique:
          totalVisites > 0
            ? Math.round(((totalVisites - visitesPayees - visitesEnvoyees) / totalVisites) * 100)
            : null,
        capturesTotal,
        capturesOptin,
      },
      parJour: parJour.map((j) => ({
        jour: j.jour,
        vues: j._sum.vues ?? 0,
        visites: j._sum.visites ?? 0,
      })),
      canaux: [...canaux.values()].sort(
        (a, b) => b.visites - a.visites || b.inscriptions - a.inscriptions || b.captures - a.captures,
      ),
      pages: pages.map((p) => ({
        chemin: p.chemin,
        vues: p._sum.vues ?? 0,
        visites: p._sum.visites ?? 0,
      })),
    };
  }

  /**
   * Tunnel d'acquisition, fiche par fiche.
   *
   * Les compteurs `views` et `requestsCount` existaient en base mais ne
   * remontaient nulle part : impossible de savoir quelle fiche travaille.
   * On les croise ici avec les devis et les réservations réellement obtenus,
   * pour lire la conversion à chaque étage : vue → demande → devis → réservation.
   */
  async funnel() {
    const [services, formations, devis, reservations, reservationsTotales, demandesPubliques] =
      await this.prisma.$transaction([
        this.prisma.service.findMany({
          where: { status: 'PUBLISHED' },
          orderBy: { views: 'desc' },
          take: 100,
          select: {
            id: true,
            title: true,
            views: true,
            requestsCount: true,
            price: true,
            _count: { select: { bookings: true, quotes: true } },
          },
        }),
        this.prisma.formation.findMany({
          where: { status: 'PUBLISHED' },
          orderBy: { views: 'desc' },
          take: 100,
          select: { id: true, slug: true, title: true, views: true, requestsCount: true },
        }),
        this.prisma.quote.count(),
        // Seules les réservations réellement issues d'un devis appartiennent au
        // tunnel : compter toutes les réservations (dont celles créées à la main
        // ou par RenforTeam) produisait des taux absurdes, supérieurs à 100 %.
        this.prisma.quote.count({ where: { bookingId: { not: null } } }),
        this.prisma.booking.count(),
        this.prisma.contactRequest.count(),
      ]);

    const vues = services.reduce((t, s) => t + (s.views ?? 0), 0);
    const demandes = services.reduce((t, s) => t + (s.requestsCount ?? 0), 0);

    // Objectif de campagne : CA encaissé (réservations confirmées + factures
    // payées) — DONNÉES DE DÉMONSTRATION EXCLUES.
    //
    // Le cockpit agrégeait jusqu'ici les comptes de démonstration et la
    // facture du jeu d'essai : on pilotait l'objectif de l'association sur un
    // chiffre partiellement fictif, ce qui est la pire base de décision. Les
    // comptes de démo se reconnaissent à leur nom ou à l'adresse de leur
    // propriétaire ; ce filtre disparaîtra de lui-même quand ces comptes
    // auront été supprimés.
    const comptesDemo = await this.prisma.account.findMany({
      where: {
        OR: [
          { name: { contains: '(démo)', mode: 'insensitive' } },
          { name: { contains: '(demo)', mode: 'insensitive' } },
          { name: { startsWith: 'QA ' } },
          { name: { startsWith: 'Verif ' } },
          { name: { startsWith: 'Audit ' } },
          { owner: { email: { endsWith: '@example.com' } } },
          { owner: { email: { endsWith: '@mailinator.com' } } },
        ],
      },
      select: { id: true },
    });
    const idsDemo = comptesDemo.map((c) => c.id);
    const horsDemo = idsDemo.length ? { accountId: { notIn: idsDemo } } : {};

    const [reservationsPayees, facturesPayees] = await Promise.all([
      this.prisma.booking.findMany({
        where: { status: { in: ['CONFIRMED', 'COMPLETED'] }, ...horsDemo },
        select: { totalAmount: true, createdAt: true },
      }),
      this.prisma.invoice.findMany({
        // La série FAC- est celle du jeu de démonstration ; les factures
        // réelles sont numérotées INV- (séquence légale continue).
        where: { status: 'PAID', number: { startsWith: 'INV-' }, ...horsDemo },
        select: { amount: true, issuedAt: true, createdAt: true },
      }),
    ]);
    const nombre = (v: unknown) => (v == null ? 0 : Number(v));
    const caReservations = reservationsPayees.reduce((t, b) => t + nombre(b.totalAmount), 0);
    const caFactures = facturesPayees.reduce((t, f) => t + nombre(f.amount), 0);
    const caEncaisse = Math.round(caReservations + caFactures);

    // La cible et l'échéance étaient écrites en dur. Passé la date, le cockpit
    // affichait « 0 jour restant » pour toujours, et il fallait un déploiement
    // pour lancer la campagne suivante. Elles se règlent désormais par variable
    // d'environnement — sans rien poser, les valeurs d'origine s'appliquent.
    const OBJECTIF = Number(process.env.OBJECTIF_CAMPAGNE) || 4000;
    const echeanceBrute = process.env.OBJECTIF_ECHEANCE ?? '2026-09-30T23:59:59Z';
    const echeanceLue = new Date(echeanceBrute);
    const echeance = Number.isNaN(echeanceLue.getTime())
      ? new Date('2026-09-30T23:59:59Z')
      : echeanceLue;
    const maintenant = new Date();
    const joursRestants = Math.max(
      0,
      Math.ceil((echeance.getTime() - maintenant.getTime()) / 86_400_000),
    );
    // Une campagne échue ne doit pas afficher un rythme hebdomadaire absurde.
    const echue = joursRestants === 0;
    const semainesRestantes = Math.max(1, Math.ceil(joursRestants / 7));
    const objectif = {
      cible: OBJECTIF,
      encaisse: caEncaisse,
      reste: Math.max(0, OBJECTIF - caEncaisse),
      pourcentage: Math.min(100, Math.round((caEncaisse / OBJECTIF) * 100)),
      joursRestants,
      echue,
      rythmeHebdo: echue
        ? 0
        : Math.ceil(Math.max(0, OBJECTIF - caEncaisse) / semainesRestantes),
      echeance: echeance.toISOString(),
      detail: { reservations: Math.round(caReservations), factures: Math.round(caFactures) },
      /// Nombre de comptes de démonstration exclus du calcul (0 = base saine).
      comptesDemoExclus: idsDemo.length,
    };

    // Attribution : d'où viennent les demandes (mécanisme Vesk).
    const parSource = await this.prisma.contactRequest.groupBy({
      by: ['source'],
      _count: { _all: true },
      orderBy: { _count: { source: 'desc' } },
      take: 8,
    }).catch(() => [] as { source: string | null; _count: { _all: number } }[]);
    const sources = parSource.map((r) => ({
      source: r.source || 'direct',
      demandes: r._count._all,
    }));

    // Attribution des INSCRIPTIONS. C'est la métrique qui compte pendant une
    // campagne payante : une demande de contact se voit, un compte créé se
    // monétise. Les deux tableaux sont volontairement distincts — une source
    // peut très bien générer des clics et aucune inscription.
    const comptesParSource = await this.prisma.account
      .groupBy({
        by: ['source', 'sourceMedium', 'sourceCampaign'],
        _count: { _all: true },
        orderBy: { _count: { source: 'desc' } },
        take: 12,
      })
      .catch(
        () =>
          [] as {
            source: string | null;
            sourceMedium: string | null;
            sourceCampaign: string | null;
            _count: { _all: number };
          }[],
      );
    const inscriptionsParSource = comptesParSource.map((r) => ({
      source: r.source || 'direct',
      medium: r.sourceMedium,
      campagne: r.sourceCampaign,
      comptes: r._count._all,
    }));

    // Fil d'activité : les 8 derniers signaux, tous types confondus.
    const [dernieresDemandes, derniersComptes, dernieresResas] = await Promise.all([
      this.prisma.contactRequest.findMany({
        orderBy: { createdAt: 'desc' }, take: 5,
        select: { id: true, name: true, type: true, source: true, createdAt: true },
      }),
      this.prisma.account.findMany({
        orderBy: { createdAt: 'desc' }, take: 5,
        select: { id: true, name: true, type: true, createdAt: true },
      }),
      this.prisma.booking.findMany({
        orderBy: { createdAt: 'desc' }, take: 5,
        select: { id: true, totalAmount: true, status: true, createdAt: true },
      }),
    ]);
    const activite = [
      ...dernieresDemandes.map((d) => ({
        type: 'demande' as const,
        libelle: `${d.name}, ${d.type ?? 'demande'}`,
        detail: d.source || 'direct',
        date: d.createdAt.toISOString(),
      })),
      ...derniersComptes.map((a) => ({
        type: 'compte' as const,
        libelle: a.name,
        detail: a.type === 'ESTABLISHMENT' ? 'établissement' : 'intervenant',
        date: a.createdAt.toISOString(),
      })),
      ...dernieresResas.map((b) => ({
        type: 'reservation' as const,
        libelle: b.totalAmount ? `Réservation ${Math.round(Number(b.totalAmount))} €` : 'Réservation',
        detail: String(b.status).toLowerCase(),
        date: b.createdAt.toISOString(),
      })),
    ]
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .slice(0, 8);

    const taux = (haut: number, bas: number) =>
      bas > 0 ? Math.round((haut / bas) * 1000) / 10 : null;

    return {
      objectif,
      sources,
      inscriptionsParSource,
      activite,
      global: {
        vues,
        demandes,
        devis,
        reservations,
        /** Réservations toutes origines confondues (RenforTeam inclus). */
        reservationsTotales,
        demandesPubliques,
        tauxVueVersDemande: taux(demandes, vues),
        tauxDemandeVersDevis: taux(devis, demandes),
        tauxDevisVersReservation: taux(reservations, devis),
      },
      ateliers: services.map((s) => ({
        id: s.id,
        titre: s.title,
        vues: s.views ?? 0,
        demandes: s.requestsCount ?? 0,
        devis: s._count.quotes,
        reservations: s._count.bookings,
        prix: s.price,
        conversion: taux(s.requestsCount ?? 0, s.views ?? 0),
      })),
      formations: formations.map((f) => ({
        id: f.id,
        slug: f.slug,
        titre: f.title,
        vues: f.views ?? 0,
        demandes: f.requestsCount ?? 0,
        conversion: taux(f.requestsCount ?? 0, f.views ?? 0),
      })),
    };
  }

  async roiStats() {
    // On ne charge que le nécessaire : statut + date de publication de chaque
    // mission, et les bookings associés (date + statut) triés chronologiquement.
    const missions = await this.prisma.reliefMission.findMany({
      select: {
        id: true,
        status: true,
        publishedAt: true,
        bookings: {
          select: { createdAt: true, status: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    // Prépare les 6 derniers mois glissants (mois courant inclus).
    const now = new Date();
    const monthsIndex: Record<string, number> = {};
    const missionsPerMonth: { mois: string; count: number }[] = [];
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthsIndex[key] = missionsPerMonth.length;
      missionsPerMonth.push({ mois: key, count: 0 });
    }

    // Une réservation « qui pourvoit » = statut CONFIRMED, IN_PROGRESS ou COMPLETED.
    const COVERING: BookingStatus[] = [
      BookingStatus.CONFIRMED,
      BookingStatus.IN_PROGRESS,
      BookingStatus.COMPLETED,
    ];

    let publishedMissions = 0;
    let filledMissions = 0;
    let delaySumHours = 0;
    let delayCount = 0;

    for (const m of missions) {
      // Null-safety : sans publishedAt, la mission n'est pas considérée publiée.
      if (!m.publishedAt) continue;
      publishedMissions += 1;

      // Répartition mensuelle (uniquement dans la fenêtre des 6 mois).
      const key = `${m.publishedAt.getFullYear()}-${String(m.publishedAt.getMonth() + 1).padStart(2, '0')}`;
      if (key in monthsIndex) missionsPerMonth[monthsIndex[key]].count += 1;

      // Mission pourvue : statut FILLED OU au moins un booking « couvrant ».
      const hasCovering = m.bookings.some((b) => COVERING.includes(b.status));
      if (m.status === MissionStatus.FILLED || hasCovering) filledMissions += 1;

      // Délai jusqu'à la 1ère candidature (bookings triés asc → [0] = 1er).
      if (m.bookings.length > 0) {
        const diffH = (m.bookings[0].createdAt.getTime() - m.publishedAt.getTime()) / 3_600_000;
        if (diffH >= 0) {
          delaySumHours += diffH;
          delayCount += 1;
        }
      }
    }

    const coverageRate =
      publishedMissions > 0 ? Math.round((filledMissions / publishedMissions) * 1000) / 10 : 0;
    const avgFirstApplicationHours =
      delayCount > 0 ? Math.round((delaySumHours / delayCount) * 10) / 10 : null;

    // Répartition des bookings par statut (tous statuts, sur toute la base).
    const grouped = await this.prisma.booking.groupBy({
      by: ['status'],
      _count: { _all: true },
    });
    const bookingsByStatus: Record<string, number> = {};
    for (const g of grouped) bookingsByStatus[g.status] = g._count._all;

    return {
      coverageRate, // %
      publishedMissions,
      filledMissions,
      avgFirstApplicationHours, // heures (null si aucune candidature)
      estimatedSavingsEur: filledMissions * AVG_INTERIM_SAVINGS_EUR,
      savingsPerMissionEur: AVG_INTERIM_SAVINGS_EUR,
      missionsPerMonth,
      bookingsByStatus,
    };
  }

  // ── Demandes de contact (formulaire public) ────────────────────────────────
  /** Liste des demandes de contact, optionnellement filtrées par statut. */
  async listContacts(status?: string) {
    const where =
      status === 'NEW' || status === 'HANDLED'
        ? { status: status as 'NEW' | 'HANDLED' }
        : {};
    const items = await this.prisma.contactRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    const newCount = await this.prisma.contactRequest.count({ where: { status: 'NEW' } });
    return { items, newCount };
  }

  /** Marque une demande de contact comme traitée / à traiter. */
  /**
   * Suppression d'une demande de contact.
   * Nécessaire pour deux raisons : purger le spam qui passerait les filtres,
   * et honorer une demande d'effacement RGPD sans passer par la base.
   */
  async deleteContact(id: string) {
    const found = await this.prisma.contactRequest.findUnique({ where: { id } });
    if (!found) throw new NotFoundException('Demande introuvable.');
    await this.prisma.contactRequest.delete({ where: { id } });
    return { ok: true, id };
  }

  async setContactStatus(id: string, status?: string) {
    const next = status === 'HANDLED' ? 'HANDLED' : 'NEW';
    const found = await this.prisma.contactRequest.findUnique({ where: { id } });
    if (!found) throw new NotFoundException('Demande introuvable.');
    return this.prisma.contactRequest.update({
      where: { id },
      data: { status: next as 'NEW' | 'HANDLED' },
    });
  }

  // --- Journal d'audit (traçabilité) --------------------------------------

  /**
   * Journal d'audit paginé pour le back-office, du plus récent au plus ancien.
   * Lecture directe via Prisma (le journal est append-only : aucune écriture ici).
   */
  async listAudit(filters: {
    action?: string;
    entityType?: string;
    entityId?: string;
    actorId?: string;
    from?: string;
    to?: string;
    page?: number;
    perPage?: number;
  }) {
    const page = Math.max(1, Math.trunc(Number(filters.page) || 1));
    const perPage = Math.min(
      AUDIT_MAX_PER_PAGE,
      Math.max(1, Math.trunc(Number(filters.perPage) || AUDIT_DEFAULT_PER_PAGE)),
    );

    const where: Prisma.AuditLogWhereInput = {};
    if (filters.action) where.action = filters.action;
    if (filters.entityType) where.entityType = filters.entityType;
    if (filters.entityId) where.entityId = filters.entityId;
    if (filters.actorId) where.actorId = filters.actorId;

    const from = parseAuditDate(filters.from);
    const to = parseAuditDate(filters.to);
    if (from || to) {
      where.createdAt = {
        ...(from ? { gte: from } : {}),
        ...(to ? { lte: to } : {}),
      };
    }

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
        include: {
          actor: { select: { id: true, email: true, firstName: true, lastName: true } },
          account: { select: { id: true, name: true, type: true } },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      perPage,
      pages: Math.max(1, Math.ceil(total / perPage)),
    };
  }
  /**
   * Import du catalogue historique (fiches les-extras.fr).
   * Idempotent : la clé `sourceId` évite les doublons — réimporter met à jour.
   * Crée au besoin le compte intervenant et la catégorie.
   */
  async importCatalog(listings: ImportListingDto[]) {
    const bilan = { crees: 0, misAJour: 0, intervenants: 0, erreurs: [] as string[] };

    for (const l of listings) {
      try {
        // ── Intervenant : compte FREELANCE réutilisé ou créé ──────────────
        let vendorAccountId: string | null = null;
        const nomIntervenant = (l.vendorName || '').trim();
        if (nomIntervenant) {
          const existant = await this.prisma.account.findFirst({
            where: { name: nomIntervenant, type: 'FREELANCE' },
            select: { id: true },
          });
          if (existant) {
            vendorAccountId = existant.id;
          } else {
            const base = nomIntervenant
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-|-$/g, '') || 'intervenant';
            const email = `${base}@intervenants.les-extras.fr`;
            const user = await this.prisma.user.upsert({
              where: { email },
              update: {},
              create: {
                email,
                password: randomBytes(24).toString('hex'),
                firstName: nomIntervenant,
                role: 'USER',
                status: 'PENDING',
              },
              select: { id: true },
            });
            const compte = await this.prisma.account.create({
              data: {
                name: nomIntervenant,
                slug: `${base}-${randomBytes(3).toString('hex')}`,
                type: 'FREELANCE',
                ownerId: user.id,
                memberships: { create: { userId: user.id, role: 'OWNER', status: 'ACTIVE' } },
              },
              select: { id: true },
            });
            vendorAccountId = compte.id;
            bilan.intervenants += 1;
          }
        }
        if (!vendorAccountId) {
          bilan.erreurs.push(`${l.title} : intervenant manquant`);
          continue;
        }

        // ── Catégorie (créée si absente) ──────────────────────────────────
        let categoryId: string | undefined;
        if (l.categoryTitle) {
          const existante = await this.prisma.category.findFirst({
            where: { title: l.categoryTitle },
            select: { id: true },
          });
          categoryId =
            existante?.id ??
            (
              await this.prisma.category.create({
                data: { title: l.categoryTitle, type: 'service' },
                select: { id: true },
              })
            ).id;
        }

        const donnees = {
          accountId: vendorAccountId,
          title: l.title,
          description: l.description,
          categoryId,
          price: l.price,
          durationMinutes: l.durationMinutes,
          duration: l.durationMinutes ? `${Math.round(l.durationMinutes / 60)}h` : undefined,
          maxParticipants: l.maxParticipants,
          publicTargets: l.publicTargets ?? [],
          material: l.material,
          city: l.city,
          images: l.images ?? [],
          objectives: l.objectives,
          methodology: l.methodology,
          evaluation: l.evaluation,
          timeSlots: l.timeSlots ?? [],
          qualiopi: l.qualiopi ?? false,
          status: (l.publish ? 'PUBLISHED' : 'DRAFT') as 'PUBLISHED' | 'DRAFT',
          verified: true,
          sourceId: l.sourceId,
        };

        const deja = await this.prisma.service.findFirst({
          where: { sourceId: l.sourceId },
          select: { id: true },
        });
        if (deja) {
          await this.prisma.service.update({ where: { id: deja.id }, data: donnees });
          bilan.misAJour += 1;
        } else {
          await this.prisma.service.create({ data: donnees });
          bilan.crees += 1;
        }
      } catch (e) {
        bilan.erreurs.push(`${l.title} : ${(e as Error).message.slice(0, 120)}`);
      }
    }
    return bilan;
  }


  /**
   * Tableau de bord LEX : ce qui se vend, ce qui se consomme, qui est
   * abonné. Les chiffres viennent des écritures (CreditPurchase, ledger),
   * jamais d'un compteur parallèle — pas de double vérité.
   */
  async lexStats() {
    const maintenant = new Date();
    const il30Jours = new Date(maintenant.getTime() - 30 * 86_400_000);
    const [
      ventes,
      ventes30j,
      conso,
      conso30j,
      abonnements,
      essaisActifs,
      soldes,
      illimites,
      derniersAchats,
    ] = await this.prisma.$transaction([
      this.prisma.creditPurchase.aggregate({
        where: { status: 'PAID' },
        _sum: { credits: true, amountCents: true },
        _count: true,
      }),
      this.prisma.creditPurchase.aggregate({
        where: { status: 'PAID', updatedAt: { gte: il30Jours } },
        _sum: { credits: true, amountCents: true },
        _count: true,
      }),
      this.prisma.creditLedger.aggregate({
        where: { delta: { lt: 0 } },
        _sum: { delta: true },
        _count: true,
      }),
      this.prisma.creditLedger.aggregate({
        where: { delta: { lt: 0 }, createdAt: { gte: il30Jours } },
        _sum: { delta: true },
        _count: true,
      }),
      this.prisma.subscription.groupBy({
        by: ['planId'],
        where: { status: 'active' },
        orderBy: { planId: 'asc' },
        _count: true,
      }),
      this.prisma.account.count({ where: { lexTrialEndsAt: { gt: maintenant } } }),
      this.prisma.account.aggregate({ _sum: { credits: true } }),
      this.prisma.account.count({ where: { isMember: true } }),
      this.prisma.creditPurchase.findMany({
        orderBy: { createdAt: 'desc' },
        take: 15,
        select: {
          id: true,
          packId: true,
          credits: true,
          amountCents: true,
          status: true,
          createdAt: true,
          account: { select: { id: true, name: true, type: true } },
        },
      }),
    ]);
    return {
      ventes: {
        total: {
          achats: ventes._count,
          credits: ventes._sum.credits ?? 0,
          montantCents: ventes._sum.amountCents ?? 0,
        },
        trenteJours: {
          achats: ventes30j._count,
          credits: ventes30j._sum.credits ?? 0,
          montantCents: ventes30j._sum.amountCents ?? 0,
        },
      },
      consommation: {
        total: { generations: conso._count, credits: Math.abs(conso._sum.delta ?? 0) },
        trenteJours: { generations: conso30j._count, credits: Math.abs(conso30j._sum.delta ?? 0) },
      },
      abonnements: abonnements.map((a) => ({ planId: a.planId, actifs: a._count })),
      essaisActifs,
      creditsEnCirculation: soldes._sum.credits ?? 0,
      comptesIllimites: illimites,
      derniersAchats,
    };
  }

  /**
   * Accès LEX illimité accordé (ou retiré) à la main — compte partenaire,
   * test, geste commercial. Le drapeau `isMember` exonère le compte de la
   * consommation de crédits ; l'accès normal, lui, passe par les crédits.
   */
  async setMembership(accountId: string, isMember: boolean) {
    const account = await this.prisma.account.update({
      where: { id: accountId },
      data: { isMember },
      select: { id: true, name: true, isMember: true },
    });
    await this.audit.log({
      action: 'admin.account.membership',
      entityType: 'Account',
      entityId: accountId,
      summary: `Accès LEX illimité ${isMember ? 'accordé' : 'retiré'} pour ${account.name}`,
    });
    return account;
  }
}
