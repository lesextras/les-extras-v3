import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AccountRole, AccountType, AttachmentRequestStatus, MembershipStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../common/mail/mail.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RequestAccount, RequestUser } from '../common/types/request-context';
import { CreateAttachmentRequestDto } from './dto/create-attachment-request.dto';

/**
 * AttachmentRequestsService — le sens inverse d'InvitationsService.
 *
 * Une invitation part de l'établissement vers une adresse email. Une demande
 * de rattachement part d'un compte « salarié » (créé en solo, droits
 * freelance en attendant) vers un établissement choisi par la personne : elle
 * demande à être rattachée, l'établissement approuve ou refuse. Tant que
 * personne n'a tranché, le compte reste pleinement autonome — rien ne change
 * pour lui pendant l'attente.
 */
@Injectable()
export class AttachmentRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly notifications: NotificationsService,
  ) {}

  /**
   * ⚠ CE SERVICE N'AVERTISSAIT PERSONNE, DANS AUCUN DES DEUX SENS.
   *
   * Une demande de rattachement s'écrivait en base et attendait qu'un
   * directeur ouvre par hasard l'écran « Équipe ». Une décision se prenait
   * sans que le salarié en sache jamais rien — alors que son espace reste
   * bridé tant qu'aucune réponse n'arrive. Mesuré le 3/09/2026 : deux
   * personnes attendaient depuis des semaines, des deux côtés du silence.
   *
   * Chaque envoi est en `catch(() => undefined)` : un SMTP en panne ne doit
   * jamais faire échouer l'action métier qui vient de réussir.
   */
  private async prevenirResponsables(
    establishmentId: string,
    salarie: string,
    etablissement: string,
    message?: string | null,
  ) {
    const responsables = await this.prisma.membership
      .findMany({
        where: {
          accountId: establishmentId,
          status: MembershipStatus.ACTIVE,
          role: { in: [AccountRole.OWNER, AccountRole.ADMIN] },
        },
        select: { userId: true, user: { select: { email: true } } },
      })
      .catch(() => []);

    for (const r of responsables) {
      await this.notifications
        .create(r.userId, {
          type: 'ATTACHMENT_REQUESTED',
          title: 'Demande de rattachement',
          body: `${salarie} demande à rejoindre ${etablissement}.`,
          link: '/dashboard/equipe',
        })
        .catch(() => undefined);
      if (r.user?.email) {
        await this.mail
          .sendRattachement(r.user.email, {
            moment: 'demande',
            salarie,
            etablissement,
            motif: message ?? null,
          })
          .catch(() => undefined);
      }
    }
  }

  /** Le compte « salarié » demande son rattachement à un établissement. */
  async create(requesterAccount: RequestAccount, requesterUser: RequestUser, dto: CreateAttachmentRequestDto) {
    if (requesterAccount.type !== AccountType.FREELANCE) {
      throw new BadRequestException(
        'Seul un compte individuel peut demander un rattachement à un établissement.',
      );
    }

    const establishment = await this.prisma.account.findUnique({
      where: { id: dto.establishmentAccountId },
      select: { id: true, name: true, type: true },
    });
    if (!establishment || establishment.type !== AccountType.ESTABLISHMENT) {
      throw new NotFoundException('Établissement introuvable.');
    }

    const alreadyMember = await this.prisma.membership.findUnique({
      where: {
        userId_accountId: { userId: requesterUser.id, accountId: establishment.id },
      },
    });
    if (alreadyMember) {
      throw new ConflictException('Vous êtes déjà membre de cet établissement.');
    }

    const existing = await this.prisma.attachmentRequest.findUnique({
      where: {
        requesterAccountId_establishmentAccountId: {
          requesterAccountId: requesterAccount.id,
          establishmentAccountId: establishment.id,
        },
      },
    });
    if (existing && existing.status === AttachmentRequestStatus.PENDING) {
      throw new ConflictException('Une demande est déjà en attente pour cet établissement.');
    }

    // Une ligne existante (refusée) est réutilisée grâce à la contrainte unique,
    // plutôt que d'empiler des doublons au fil des tentatives.
    const request = existing
      ? await this.prisma.attachmentRequest.update({
          where: { id: existing.id },
          data: {
            message: dto.message?.trim() || null,
            status: AttachmentRequestStatus.PENDING,
            decidedById: null,
            decidedAt: null,
          },
        })
      : await this.prisma.attachmentRequest.create({
          data: {
            requesterUserId: requesterUser.id,
            requesterAccountId: requesterAccount.id,
            establishmentAccountId: establishment.id,
            message: dto.message?.trim() || null,
          },
        });

    // Le nom du compte demandeur ne voyage pas dans le jeton — seul son id le
    // fait. On le lit ici pour que le courriel dise « Sarah Dupont demande à
    // rejoindre » plutôt qu'une adresse technique.
    const demandeur = await this.prisma.account
      .findUnique({ where: { id: requesterAccount.id }, select: { name: true } })
      .catch(() => null);

    await this.prevenirResponsables(
      establishment.id,
      demandeur?.name ?? requesterUser.email,
      establishment.name,
      request.message,
    );

    return request;
  }

  /** Les demandes envoyées par le compte « salarié » actif (suivi de son côté). */
  async listMine(requesterAccount: RequestAccount) {
    return this.prisma.attachmentRequest.findMany({
      where: { requesterAccountId: requesterAccount.id },
      include: { establishmentAccount: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Le salarié retire une demande encore en attente. */
  async cancel(requesterAccount: RequestAccount, requestId: string) {
    const request = await this.prisma.attachmentRequest.findUnique({ where: { id: requestId } });
    if (!request || request.requesterAccountId !== requesterAccount.id) {
      throw new NotFoundException('Demande introuvable.');
    }
    if (request.status !== AttachmentRequestStatus.PENDING) {
      throw new BadRequestException('Seule une demande en attente peut être retirée.');
    }
    return this.prisma.attachmentRequest.delete({ where: { id: requestId } });
  }

  /** Les demandes en attente pour l'établissement actif (OWNER/ADMIN). */
  async listForEstablishment(account: RequestAccount) {
    return this.prisma.attachmentRequest.findMany({
      where: { establishmentAccountId: account.id },
      include: {
        requesterUser: { select: { id: true, email: true } },
        requesterAccount: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async loadForEstablishment(account: RequestAccount, requestId: string) {
    const request = await this.prisma.attachmentRequest.findUnique({ where: { id: requestId } });
    if (!request || request.establishmentAccountId !== account.id) {
      throw new NotFoundException('Demande introuvable pour cet établissement.');
    }
    return request;
  }

  /** Approuve : crée (ou réactive) le Membership et referme la demande. */
  async approve(account: RequestAccount, decider: RequestUser, requestId: string) {
    const request = await this.loadForEstablishment(account, requestId);
    if (request.status !== AttachmentRequestStatus.PENDING) {
      throw new BadRequestException('Seule une demande en attente peut être approuvée.');
    }

    const membership = await this.prisma.$transaction(async (tx) => {
      const created = await tx.membership.upsert({
        where: {
          userId_accountId: { userId: request.requesterUserId, accountId: account.id },
        },
        create: {
          userId: request.requesterUserId,
          accountId: account.id,
          role: AccountRole.MEMBER,
          status: MembershipStatus.ACTIVE,
        },
        update: {
          status: MembershipStatus.ACTIVE,
        },
      });

      await tx.attachmentRequest.update({
        where: { id: request.id },
        data: {
          status: AttachmentRequestStatus.APPROVED,
          decidedById: decider.id,
          decidedAt: new Date(),
        },
      });

      return created;
    });

    await this.prevenirLeSalarie(request.requesterUserId, account.id, 'acceptee');

    return {
      approved: true,
      membership: { id: membership.id, accountId: membership.accountId, role: membership.role },
    };
  }

  /** Refuse la demande — le compte salarié garde ses droits freelance en l'état. */
  async reject(account: RequestAccount, decider: RequestUser, requestId: string) {
    const request = await this.loadForEstablishment(account, requestId);
    if (request.status !== AttachmentRequestStatus.PENDING) {
      throw new BadRequestException('Seule une demande en attente peut être refusée.');
    }
    const refusee = await this.prisma.attachmentRequest.update({
      where: { id: requestId },
      data: {
        status: AttachmentRequestStatus.REJECTED,
        decidedById: decider.id,
        decidedAt: new Date(),
      },
    });

    await this.prevenirLeSalarie(request.requesterUserId, account.id, 'refusee');

    return refusee;
  }

  /**
   * L'autre sens du silence : la personne qui attend.
   *
   * Un refus est prévenu comme une acceptation — sans motif, parce que la
   * décision n'en porte pas en base : mieux vaut une réponse nette qu'une
   * attente indéfinie. L'acceptation, elle, dit explicitement de se
   * reconnecter : la liste des comptes voyage dans le jeton, le sélecteur ne
   * montre l'établissement qu'à la connexion suivante.
   */
  private async prevenirLeSalarie(
    userId: string,
    establishmentId: string,
    moment: 'acceptee' | 'refusee',
  ) {
    const [user, etablissement] = await Promise.all([
      this.prisma.user
        .findUnique({ where: { id: userId }, select: { email: true } })
        .catch(() => null),
      this.prisma.account
        .findUnique({ where: { id: establishmentId }, select: { name: true } })
        .catch(() => null),
    ]);
    const nom = etablissement?.name ?? 'un établissement';

    await this.notifications
      .create(userId, {
        type: moment === 'acceptee' ? 'ATTACHMENT_APPROVED' : 'ATTACHMENT_REJECTED',
        title:
          moment === 'acceptee'
            ? 'Votre rattachement est accepté'
            : 'Votre demande de rattachement a été refusée',
        body:
          moment === 'acceptee'
            ? `${nom} a accepté votre rattachement. Déconnectez-vous puis reconnectez-vous pour voir l'établissement dans votre sélecteur de compte.`
            : `${nom} n'a pas donné suite. Votre espace individuel reste inchangé.`,
        link: '/dashboard',
      })
      .catch(() => undefined);

    if (user?.email) {
      await this.mail
        .sendRattachement(user.email, { moment, etablissement: nom })
        .catch(() => undefined);
    }
  }
}
