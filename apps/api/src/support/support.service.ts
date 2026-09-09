import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupportStatut } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../common/mail/mail.service';
import { NotificationsService } from '../notifications/notifications.service';
import { OuvrirTicketDto, RepondreTicketDto, SuivreTicketDto } from './dto/support.dto';

const MESSAGE_SELECT = {
  id: true,
  corps: true,
  parEquipe: true,
  createdAt: true,
  auteur: { select: { id: true, firstName: true, lastName: true } },
} as const;

/**
 * LA MESSAGERIE INTERNE — 9/09/2026.
 *
 * Une personne inscrite qui rencontre un problème n'avait, jusqu'ici, que le
 * formulaire de contact public : elle re-saisissait son nom et son adresse, le
 * message arrivait sans qu'on sache de quel compte il venait, et la réponse
 * partait par courriel, hors de la plateforme. Résultat : aucune trace, aucun
 * historique, et une demande d'aide qui coûtait plus cher à écrire qu'à
 * abandonner.
 *
 * Le fil est rattaché au compte. Les deux côtés le voient, l'historique reste,
 * et chaque message est doublé d'un courriel — vers la personne quand l'équipe
 * répond, vers la boîte de l'association quand la personne écrit. Personne
 * n'a à surveiller un écran pour ne pas rater une demande.
 *
 * L'équipe répond au nom de LES EXTRAS, jamais au nom d'un salarié : `auteurId`
 * reste nul sur un message d'équipe. C'est délibéré — un usager n'a pas à
 * savoir qui, dans l'association, a traité sa demande.
 */
@Injectable()
export class SupportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly notifications: NotificationsService,
    private readonly config: ConfigService,
  ) {}

  private get boiteEquipe(): string {
    return this.config.get<string>('CONTACT_INBOX_EMAIL') ?? 'contact@adepa77.fr';
  }

  // ── Côté personne ────────────────────────────────────────────────────────

  /** Les fils de la personne, le plus récemment actif d'abord. */
  async mesTickets(userId: string) {
    const tickets = await this.prisma.supportTicket.findMany({
      where: { userId },
      orderBy: { dernierAt: 'desc' },
      take: 50,
      select: {
        id: true,
        sujet: true,
        categorie: true,
        statut: true,
        dernierAt: true,
        createdAt: true,
        luParPersonneAt: true,
        messages: { orderBy: { createdAt: 'desc' }, take: 1, select: MESSAGE_SELECT },
      },
    });
    return tickets.map((t) => ({
      ...t,
      // « Non lu » = il existe un message d'équipe postérieur à ma dernière
      // lecture. Calculé ici plutôt qu'affiché brut : le client n'a pas à
      // refaire cette comparaison.
      nonLu: Boolean(
        t.luParPersonneAt === null
          ? t.messages.some((m) => m.parEquipe)
          : t.messages.some((m) => m.parEquipe && m.createdAt > t.luParPersonneAt!),
      ),
    }));
  }

  /** Un fil, avec tous ses messages. Marque le fil comme lu par la personne. */
  async monTicket(userId: string, id: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id },
      select: {
        id: true,
        sujet: true,
        categorie: true,
        statut: true,
        createdAt: true,
        dernierAt: true,
        userId: true,
        messages: { orderBy: { createdAt: 'asc' }, select: MESSAGE_SELECT },
      },
    });
    if (!ticket) throw new NotFoundException('Conversation introuvable.');
    if (ticket.userId !== userId) throw new ForbiddenException('Cette conversation ne vous concerne pas.');
    await this.prisma.supportTicket
      .update({ where: { id }, data: { luParPersonneAt: new Date() } })
      .catch(() => undefined);
    const { userId: _ignore, ...reste } = ticket;
    return reste;
  }

  /** Ouverture d'un fil : sujet, catégorie, premier message. */
  async ouvrir(userId: string, accountId: string | null, dto: OuvrirTicketDto) {
    const maintenant = new Date();
    // Le compte n'est enregistré que s'il est bien à cette personne : un
    // en-tête se falsifie, et le contexte affiché à l'équipe doit être vrai.
    const compte = accountId
      ? await this.prisma.membership.findFirst({
          where: { userId, accountId },
          select: { accountId: true },
        })
      : null;
    const ticket = await this.prisma.supportTicket.create({
      data: {
        userId,
        accountId: compte?.accountId ?? undefined,
        sujet: dto.sujet.trim(),
        categorie: dto.categorie ?? undefined,
        dernierAt: maintenant,
        luParPersonneAt: maintenant,
        messages: { create: { auteurId: userId, parEquipe: false, corps: dto.message.trim() } },
      },
      select: { id: true, sujet: true, categorie: true, statut: true, createdAt: true },
    });
    await this.prevenirEquipe(userId, ticket.id, ticket.sujet, dto.message.trim());
    return ticket;
  }

  /** Réponse de la personne dans son propre fil. */
  async repondre(userId: string, id: string, dto: RepondreTicketDto) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id },
      select: { id: true, userId: true, sujet: true, statut: true },
    });
    if (!ticket) throw new NotFoundException('Conversation introuvable.');
    if (ticket.userId !== userId) throw new ForbiddenException('Cette conversation ne vous concerne pas.');

    const maintenant = new Date();
    const message = await this.prisma.supportMessage.create({
      data: { ticketId: id, auteurId: userId, parEquipe: false, corps: dto.message.trim() },
      select: MESSAGE_SELECT,
    });
    await this.prisma.supportTicket.update({
      where: { id },
      data: {
        dernierAt: maintenant,
        luParPersonneAt: maintenant,
        // Une réponse rouvre le fil : une demande qu'on croyait réglée et qui
        // revient n'a pas à être ré-ouverte à la main.
        statut: ticket.statut === SupportStatut.RESOLU ? SupportStatut.OUVERT : ticket.statut,
      },
    });
    await this.prevenirEquipe(userId, id, ticket.sujet, dto.message.trim());
    return message;
  }

  // ── Côté équipe ──────────────────────────────────────────────────────────

  /** La boîte de réception de l'association. */
  async listerPourEquipe(statut?: SupportStatut) {
    const tickets = await this.prisma.supportTicket.findMany({
      where: statut ? { statut } : {},
      orderBy: { dernierAt: 'desc' },
      take: 200,
      select: {
        id: true,
        sujet: true,
        categorie: true,
        statut: true,
        dernierAt: true,
        createdAt: true,
        luParEquipeAt: true,
        account: { select: { id: true, name: true, type: true } },
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1, select: MESSAGE_SELECT },
      },
    });
    return tickets.map((t) => ({
      ...t,
      nonLu: Boolean(
        t.luParEquipeAt === null
          ? t.messages.some((m) => !m.parEquipe)
          : t.messages.some((m) => !m.parEquipe && m.createdAt > t.luParEquipeAt!),
      ),
    }));
  }

  /** Un fil vu par l'équipe. Marque le fil comme lu de son côté. */
  async lirePourEquipe(id: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id },
      select: {
        id: true,
        sujet: true,
        categorie: true,
        statut: true,
        createdAt: true,
        dernierAt: true,
        account: { select: { id: true, name: true, type: true } },
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        messages: { orderBy: { createdAt: 'asc' }, select: MESSAGE_SELECT },
      },
    });
    if (!ticket) throw new NotFoundException('Conversation introuvable.');
    await this.prisma.supportTicket
      .update({ where: { id }, data: { luParEquipeAt: new Date() } })
      .catch(() => undefined);
    return ticket;
  }

  /** Réponse de l'équipe, au nom de LES EXTRAS et de personne d'autre. */
  async repondreEquipe(id: string, dto: RepondreTicketDto) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id },
      select: {
        id: true,
        sujet: true,
        statut: true,
        user: { select: { id: true, firstName: true, email: true } },
      },
    });
    if (!ticket) throw new NotFoundException('Conversation introuvable.');

    const maintenant = new Date();
    const message = await this.prisma.supportMessage.create({
      data: { ticketId: id, parEquipe: true, corps: dto.message.trim() },
      select: MESSAGE_SELECT,
    });
    await this.prisma.supportTicket.update({
      where: { id },
      data: {
        dernierAt: maintenant,
        luParEquipeAt: maintenant,
        statut: ticket.statut === SupportStatut.OUVERT ? SupportStatut.EN_COURS : ticket.statut,
      },
    });

    // La personne est prévenue dans l'application ET par courriel : une réponse
    // qu'on ne voit pas vaut une réponse qu'on n'a pas écrite.
    await this.notifications
      .create(ticket.user.id, {
        type: 'SUPPORT_REPONSE',
        title: 'Réponse à votre message',
        body: `Nous avons répondu à « ${ticket.sujet} ».`,
        link: `/dashboard/aide/${id}`,
      })
      .catch(() => undefined);
    if (ticket.user.email) {
      await this.mail
        .sendReponseAssistance({
          to: ticket.user.email,
          prenom: ticket.user.firstName,
          sujet: ticket.sujet,
          message: dto.message.trim(),
          lien: `/dashboard/aide/${id}`,
        })
        .catch(() => undefined);
    }
    return message;
  }

  /** Changement d'état par l'équipe (en cours, résolu). */
  async suivre(id: string, dto: SuivreTicketDto) {
    if (!dto.statut) return this.lirePourEquipe(id);
    const existe = await this.prisma.supportTicket.findUnique({ where: { id }, select: { id: true } });
    if (!existe) throw new NotFoundException('Conversation introuvable.');
    await this.prisma.supportTicket.update({ where: { id }, data: { statut: dto.statut } });
    return this.lirePourEquipe(id);
  }

  /** Compte des fils qui attendent une réponse — pour la pastille de l'admin. */
  async aTraiter() {
    const count = await this.prisma.supportTicket.count({
      where: { statut: { in: [SupportStatut.OUVERT, SupportStatut.EN_COURS] } },
    });
    return { count };
  }

  // ── Interne ──────────────────────────────────────────────────────────────

  /**
   * Le courriel vers l'association. Jamais bloquant : un SMTP indisponible ne
   * doit pas empêcher quelqu'un de signaler un problème — c'est précisément le
   * moment où il en a le plus besoin.
   */
  private async prevenirEquipe(userId: string, ticketId: string, sujet: string, message: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { firstName: true, lastName: true, email: true },
      });
      const nom = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Une personne inscrite';
      await this.mail.sendMessageAssistance({
        to: this.boiteEquipe,
        de: nom,
        email: user?.email ?? null,
        sujet,
        message,
        lien: `/admin/assistance/${ticketId}`,
      });
    } catch {
      // Silence volontaire : le message est enregistré, il sera vu dans l'admin.
    }
  }
}
