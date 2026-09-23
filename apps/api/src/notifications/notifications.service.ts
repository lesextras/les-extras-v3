import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PushService } from '../push/push.service';
import { MailService } from '../common/mail/mail.service';

/**
 * LES NOTIFICATIONS QUI MÉRITENT UN COURRIEL — 9/09/2026.
 *
 * Toutes les notifications ne se valent pas. Celles qui sont ici appellent une
 * réponse de la personne, ou la rassurent sur quelque chose qu'elle attend :
 * une demande reçue, un devis à décider, une pièce réclamée, une date qui
 * change, une fiche qui passe en ligne. Les autres — points gagnés, rappels
 * internes, écrans d'administration — restent dans la cloche : un courriel de
 * trop fait fermer tous les suivants.
 *
 * NE SONT PAS ICI, ET C'EST VOLONTAIRE :
 *  - SERVICE_BOOKING, QUOTE_ACCEPTED, MISSION_FILLED, MISSION_ACCEPTED : la
 *    fiche de réservation détaillée part déjà pour ces événements, avec les
 *    coordonnées des deux parties. Deux messages pour un même fait valent
 *    moins qu'un seul ;
 *  - ACCOUNT_BANNED : une décision de modération s'annonce autrement qu'en
 *    reprenant le texte d'une cloche ;
 *  - CODE_ENVOYE, PREMIERS_POINTS, *_A_RELIRE, *_APPROVAL : rien à décider
 *    pour la personne, ou destiné à l'administration.
 */
const TYPES_PAR_COURRIEL = new Set([
  // Le rappel hebdomadaire du dossier de conformité : la cloche seule ne
  // suffit pas à quelqu'un qui n'ouvre son espace qu'une fois par mois.
  'DOSSIER_RAPPEL',
  'MISSION_CANDIDATE',
  'MISSION_CLOSED',
  'MISSION_RECURRENTE',
  'MISSION_INTERNE',
  'QUOTE_REQUESTED',
  'QUOTE_SENT',
  'QUOTE_REFUSED',
  'BOOKING_STATUS',
  'CONTRAT_TRANSMIS',
  'CONTRAT_SIGNE',
  'SIGNEE',
  'ATTACHMENT_REQUESTED',
  'ENGAGEMENT_A_VALIDER',
  'ENGAGEMENT_ENREGISTRE',
  'ENGAGEMENT_ECARTE',
  'CONGE_DEMANDE',
  'CONGE_DECISION',
  'FORMATION_PUBLIEE',
  'VIVIER_AJOUT',
  'ATELIER',
  'DEMANDE',
]);

interface NotificationPayload {
  type: string;
  title: string;
  body?: string;
  link?: string;
}

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly push: PushService,
    private readonly mail: MailService,
  ) {}

  /** Création interne d'une notification in-app pour un utilisateur. */
  async create(userId: string, payload: NotificationPayload) {
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        type: payload.type,
        title: payload.title,
        body: payload.body,
        link: payload.link,
      },
    });

    // Le téléphone est prévenu en même temps que la cloche de l'application.
    // Sans attendre : un envoi push lent ou en échec ne doit jamais retarder
    // ni faire échouer l'action métier qui vient de se produire.
    void this.push.notifier(userId, {
      titre: payload.title,
      corps: payload.body,
      lien: payload.link,
      tag: payload.type,
    });

    // Et la boîte mail, pour les seuls types qui l'exigent. Même principe que
    // le push : jamais attendu, jamais bloquant. Une adresse sur un domaine
    // sans MX ne doit pas faire échouer la réservation de quelqu'un d'autre.
    if (TYPES_PAR_COURRIEL.has(payload.type)) {
      void this.courriel(userId, payload);
    }

    return notification;
  }

  /**
   * L'envoi du courriel, hors du chemin critique.
   *
   * Trois raisons de ne rien envoyer : la personne s'est retirée, son adresse
   * n'est pas confirmée (écrire à une adresse jamais validée abîme la
   * réputation du domaine), ou le compte n'existe plus.
   */
  private async courriel(userId: string, payload: NotificationPayload) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, firstName: true, emailVerified: true, notifMailOptIn: true },
      });
      if (!user?.email || !user.emailVerified || user.notifMailOptIn === false) return;
      await this.mail.sendNotification({
        to: user.email,
        prenom: user.firstName,
        titre: payload.title,
        corps: payload.body,
        lien: payload.link,
      });
    } catch {
      // Silence volontaire : la notification existe, c'est l'essentiel.
    }
  }

  /** Liste des notifications de l'utilisateur (plus récentes d'abord). */
  async findAll(userId: string, unreadOnly = false) {
    return this.prisma.notification.findMany({
      where: { userId, ...(unreadOnly ? { readAt: null } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  /** Nombre de notifications non lues. */
  async unreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, readAt: null },
    });
    return { count };
  }

  async markRead(id: string, userId: string) {
    const notif = await this.prisma.notification.findUnique({ where: { id } });
    if (!notif) throw new NotFoundException('Notification introuvable.');
    if (notif.userId !== userId) throw new ForbiddenException('Accès refusé.');
    return this.prisma.notification.update({
      where: { id },
      data: { readAt: notif.readAt ?? new Date() },
    });
  }

  async markAllRead(userId: string) {
    const res = await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { updated: res.count };
  }
}
