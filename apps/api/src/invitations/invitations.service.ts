import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ConfigService } from '@nestjs/config';
import {
  InvitationStatus,
  MembershipStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../common/mail/mail.service';
import { RequestAccount, RequestUser } from '../common/types/request-context';
import { CreateInvitationDto } from './dto/create-invitation.dto';

@Injectable()
export class InvitationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

  private ttlMs(): number {
    const days = this.config.get<number>('INVITATION_TTL_DAYS') ?? 7;
    return days * 24 * 60 * 60 * 1000;
  }

  /** Crée une invitation pour le compte actif (OWNER/ADMIN via guards). */
  async create(account: RequestAccount, inviter: RequestUser, dto: CreateInvitationDto) {
    const email = dto.email.trim().toLowerCase();

    // Déjà membre ? (via User -> Membership sur ce compte)
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existingUser) {
      const alreadyMember = await this.prisma.membership.findUnique({
        where: { userId_accountId: { userId: existingUser.id, accountId: account.id } },
      });
      if (alreadyMember) {
        throw new ConflictException('Cette personne est déjà membre du compte.');
      }
    }

    // Invitation en attente déjà existante ? (contrainte unique [email, accountId])
    const existingInvite = await this.prisma.invitation.findUnique({
      where: { email_accountId: { email, accountId: account.id } },
    });
    if (existingInvite && existingInvite.status === InvitationStatus.PENDING) {
      throw new ConflictException('Une invitation est déjà en attente pour cet email.');
    }

    const token = randomUUID();
    const expiresAt = new Date(Date.now() + this.ttlMs());

    // Réutilise la ligne (contrainte unique) si une invite terminée existe.
    const invitation = existingInvite
      ? await this.prisma.invitation.update({
          where: { id: existingInvite.id },
          data: {
            role: dto.role,
            token,
            status: InvitationStatus.PENDING,
            invitedById: inviter.id,
            expiresAt,
            acceptedAt: null,
          },
        })
      : await this.prisma.invitation.create({
          data: {
            email,
            accountId: account.id,
            role: dto.role,
            token,
            invitedById: inviter.id,
            expiresAt,
          },
        });

    const acc = await this.prisma.account.findUniqueOrThrow({
      where: { id: account.id },
      select: { name: true },
    });
    await this.mail.sendInvitation(email, token, acc.name);

    return this.sanitize(invitation);
  }

  /** Liste les invitations du compte actif. */
  async list(account: RequestAccount) {
    const invites = await this.prisma.invitation.findMany({
      where: { accountId: account.id },
      orderBy: { createdAt: 'desc' },
    });
    return invites.map((i) => this.sanitize(i));
  }

  private async loadInAccount(account: RequestAccount, invitationId: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { id: invitationId },
    });
    if (!invitation || invitation.accountId !== account.id) {
      throw new NotFoundException('Invitation introuvable pour ce compte.');
    }
    return invitation;
  }

  async revoke(account: RequestAccount, invitationId: string) {
    const invitation = await this.loadInAccount(account, invitationId);
    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('Seule une invitation en attente peut être révoquée.');
    }
    const updated = await this.prisma.invitation.update({
      where: { id: invitationId },
      data: { status: InvitationStatus.REVOKED },
    });
    return this.sanitize(updated);
  }

  /** Régénère token + expiry et renvoie le mail (stub). */
  async resend(account: RequestAccount, invitationId: string) {
    const invitation = await this.loadInAccount(account, invitationId);
    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('Seule une invitation en attente peut être renvoyée.');
    }
    const token = randomUUID();
    const updated = await this.prisma.invitation.update({
      where: { id: invitationId },
      data: { token, expiresAt: new Date(Date.now() + this.ttlMs()) },
    });
    const acc = await this.prisma.account.findUniqueOrThrow({
      where: { id: account.id },
      select: { name: true },
    });
    await this.mail.sendInvitation(invitation.email, token, acc.name);
    return this.sanitize(updated);
  }

  /**
   * Accepte une invitation : crée le Membership. L'utilisateur DOIT être
   * authentifié et son email doit correspondre à celui invité (anti-hijack).
   */
  async accept(user: RequestUser, token: string) {
    const invitation = await this.prisma.invitation.findUnique({ where: { token } });
    if (!invitation) {
      throw new NotFoundException('Invitation introuvable.');
    }
    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('Cette invitation n\'est plus valide.');
    }
    if (invitation.expiresAt.getTime() < Date.now()) {
      await this.prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: InvitationStatus.EXPIRED },
      });
      throw new BadRequestException('Cette invitation a expiré.');
    }
    if (user.email.trim().toLowerCase() !== invitation.email.trim().toLowerCase()) {
      throw new ForbiddenException(
        'Cette invitation est destinée à une autre adresse email.',
      );
    }

    const membership = await this.prisma.$transaction(async (tx) => {
      const created = await tx.membership.upsert({
        where: {
          userId_accountId: { userId: user.id, accountId: invitation.accountId },
        },
        create: {
          userId: user.id,
          accountId: invitation.accountId,
          role: invitation.role,
          status: MembershipStatus.ACTIVE,
        },
        update: {
          // Réactive un accès précédemment suspendu et applique le rôle invité.
          role: invitation.role,
          status: MembershipStatus.ACTIVE,
        },
      });

      await tx.invitation.update({
        where: { id: invitation.id },
        data: { status: InvitationStatus.ACCEPTED, acceptedAt: new Date() },
      });

      return created;
    });

    return {
      accepted: true,
      membership: {
        id: membership.id,
        accountId: membership.accountId,
        role: membership.role,
      },
    };
  }

  /** Ne jamais exposer le token dans les listes/retours d'administration. */
  private sanitize<T extends { token: string }>(invitation: T): Omit<T, 'token'> {
    const { token: _token, ...rest } = invitation;
    return rest;
  }
}
