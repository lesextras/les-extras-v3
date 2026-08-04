import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AccountRole, AccountType, AttachmentRequestStatus, MembershipStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
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
  constructor(private readonly prisma: PrismaService) {}

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
    return this.prisma.attachmentRequest.update({
      where: { id: requestId },
      data: {
        status: AttachmentRequestStatus.REJECTED,
        decidedById: decider.id,
        decidedAt: new Date(),
      },
    });
  }
}
