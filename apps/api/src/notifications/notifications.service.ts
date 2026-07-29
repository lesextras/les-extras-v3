import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PushService } from '../push/push.service';

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

    return notification;
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
