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
  AccountRole,
  InvitationStatus,
  MembershipStatus,
  OrigineVerification,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../common/mail/mail.service';
import { RequestAccount, RequestUser } from '../common/types/request-context';
import { rolesActifs } from '../common/roles';
import { CreateInvitationDto } from './dto/create-invitation.dto';

/**
 * LES INVITATIONS NE SERVENT PLUS QUE LES ESPACES PILOTER (24/09/2026).
 *
 * Sur Les Extras, « 1 compte = 1 personne » (décision de Siham) : plus de
 * sous-comptes, plus d'équipe interne, plus de niveaux, de droits déclarés ni
 * de services. Un établissement, un intervenant ou un particulier n'invite
 * donc personne dans son compte.
 *
 * Les espaces Piloter (ASSOCIATION, ACADEMIE) gardent leur écran « Droits
 * d'accès » : la direction (OWNER) et l'administration (ADMIN) y invitent leur
 * équipe et choisissent son rôle. C'est la seule règle appliquée ici.
 *
 * ⚠ Les colonnes `niveau`, `capacites`, `orgUnitId` et la table
 * `InvitationService` restent en base (aucune migration destructive) : plus
 * rien ne les écrit ni ne les lit.
 */

/** Rôles qui gèrent les droits d'accès d'un espace Piloter. */
const ROLES_GESTION: readonly AccountRole[] = [AccountRole.OWNER, AccountRole.ADMIN];

export const MESSAGE_INVITATIONS_PILOTER =
  "Les invitations ne concernent que les espaces Piloter (association, académie). " +
  'Sur Les Extras, un compte correspond à une seule personne : chaque collègue ouvre son propre compte.';

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

  /**
   * Qui a le droit de gérer les invitations : un espace Piloter, et la
   * direction ou l'administration de cet espace. Le rôle est celui que
   * `AccountGuard` a lu sur le rattachement du compte actif.
   */
  private assertPeutInviter(account: RequestAccount) {
    if (!rolesActifs(account.type)) {
      throw new ForbiddenException(MESSAGE_INVITATIONS_PILOTER);
    }
    if (!ROLES_GESTION.includes(account.role)) {
      throw new ForbiddenException(
        "Seules la direction et l'administration de l'espace gèrent les droits d'accès. " +
          'Demandez-leur d’inviter cette personne.',
      );
    }
  }

  /** Crée une invitation pour le compte actif (espace Piloter). */
  async create(account: RequestAccount, inviter: RequestUser, dto: CreateInvitationDto) {
    this.assertPeutInviter(account);
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
    const role = dto.role ?? AccountRole.MEMBER;

    const invitation = existingInvite
      ? await this.prisma.invitation.update({
          where: { id: existingInvite.id },
          data: {
            role,
            message: dto.message ?? null,
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
            role,
            message: dto.message ?? null,
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

  /** Liste les invitations de l'espace actif. */
  async list(account: RequestAccount, _user: RequestUser) {
    this.assertPeutInviter(account);
    const invites = await this.prisma.invitation.findMany({
      where: { accountId: account.id },
      orderBy: { createdAt: 'desc' },
      include: {
        invitedBy: { select: { id: true, firstName: true, lastName: true } },
      },
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

  /** Révoquer ou renvoyer : mêmes droits que pour inviter. */
  private async assertPeutAgirSur(
    account: RequestAccount,
    _user: RequestUser,
    invitationId: string,
  ) {
    this.assertPeutInviter(account);
    return this.loadInAccount(account, invitationId);
  }

  async revoke(account: RequestAccount, user: RequestUser, invitationId: string) {
    const invitation = await this.assertPeutAgirSur(account, user, invitationId);
    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('Seule une invitation en attente peut être révoquée.');
    }
    const updated = await this.prisma.invitation.update({
      where: { id: invitationId },
      data: { status: InvitationStatus.REVOKED },
    });
    return this.sanitize(updated);
  }

  /**
   * Renvoie une invitation restée en attente : nouveau jeton, nouvelle
   * échéance, et le mail repart. L'ancien jeton cesse aussitôt de fonctionner,
   * pour qu'un lien qui aurait traîné dans une boîte mail ne serve plus.
   */
  async resend(account: RequestAccount, user: RequestUser, invitationId: string) {
    const invitation = await this.assertPeutAgirSur(account, user, invitationId);
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
   * L'INVITATION, VUE PAR LA PERSONNE INVITÉE, AVANT D'ACCEPTER.
   *
   * Route publique (jeton en main) : elle n'expose que l'espace, l'invitant et
   * son mot d'accompagnement. Jamais la liste des membres, jamais autre chose.
   */
  async apercu(token: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { token },
      include: {
        account: { select: { id: true, name: true, city: true, structure: { select: { nom: true } } } },
        invitedBy: { select: { firstName: true, lastName: true } },
      },
    });
    if (!invitation) throw new NotFoundException('Invitation introuvable.');

    const expiree =
      invitation.status !== InvitationStatus.PENDING ||
      invitation.expiresAt.getTime() < Date.now();

    const invitantNom = [invitation.invitedBy?.firstName, invitation.invitedBy?.lastName]
      .filter(Boolean)
      .join(' ')
      .trim();

    return {
      email: invitation.email,
      etablissement: invitation.account.name,
      ville: invitation.account.city,
      structure: invitation.account.structure?.nom ?? null,
      role: invitation.role,
      message: invitation.message,
      invitant: invitantNom || null,
      expiree,
    };
  }

  /**
   * Accepte une invitation : crée le Membership. L'utilisateur DOIT être
   * authentifié et son email doit correspondre à celui invité (anti-hijack).
   *
   * Plus de niveau, de droits déclarés ni de services (24/09/2026) : la
   * personne reçoit le rôle choisi par l'invitant, et c'est tout.
   */
  async accept(user: RequestUser, token: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { token },
      include: { account: { select: { type: true } } },
    });
    if (!invitation) {
      throw new NotFoundException('Invitation introuvable.');
    }
    // Une invitation restée en attente sur un compte Les Extras (d'avant le
    // 24/09/2026) ne crée plus de sous-compte.
    if (!rolesActifs(invitation.account.type)) {
      throw new ForbiddenException(MESSAGE_INVITATIONS_PILOTER);
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
          verifie: true,
          origineVerification: OrigineVerification.INVITATION,
          verifieParId: invitation.invitedById,
          verifieLe: new Date(),
        },
        update: {
          // Réactive un accès précédemment suspendu et applique le rôle invité.
          role: invitation.role,
          status: MembershipStatus.ACTIVE,
          verifie: true,
          origineVerification: OrigineVerification.INVITATION,
          verifieParId: invitation.invitedById,
          verifieLe: new Date(),
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
