import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AccountRole, MembershipStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/audit/audit.service';
import { RequestAccount } from '../common/types/request-context';
import { rolesActifs } from '../common/roles';
import { ConformiteService } from '../conformite/conformite.service';

/** Message du refus de gestion sur un compte Les Extras. */
export const MESSAGE_GESTION_PILOTER =
  "La gestion des accès ne concerne que les espaces Piloter (association, académie). " +
  'Sur Les Extras, un compte correspond à une seule personne.';

@Injectable()
export class MembershipsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly conformite: ConformiteService,
  ) {}

  /**
   * L'ÉQUIPE, telle qu'on la cherche vraiment.
   *
   * Cette liste était renvoyée en entier, sans limite ni recherche. Sur une
   * association de plusieurs centaines de personnes réparties en services,
   * l'écran devenait un mur : on ne peut pas retrouver quelqu'un dans une
   * liste qu'on doit faire défiler. Trois choses ont changé :
   *
   *  - on pagine et on cherche côté serveur (nom, prénom, courriel), donc la
   *    taille de la structure n'influe plus sur le temps d'affichage ;
   *  - on dit qui est interne et qui est externe. Une même personne peut être
   *    salariée ici et intervenante indépendante ailleurs : ne pas le montrer,
   *    c'est laisser un responsable croire qu'il a affaire à son salarié quand
   *    il traite avec un prestataire, ou l'inverse.
   *
   * La complétude du dossier de conformité est jointe pour la page affichée
   * seulement — c'est ce qui permet d'avoir une colonne « pièces » sans
   * ouvrir le coffre-fort de tout le monde.
   */
  async list(
    account: RequestAccount,
    filtres: {
      q?: string;
      role?: AccountRole;
      status?: MembershipStatus;
      page?: number;
      perPage?: number;
      /** Restreint à une adhésion précise — sert à la fiche individuelle. */
      membershipId?: string;
    } = {},
  ) {
    const page = Math.max(1, Math.trunc(Number(filtres.page) || 1));
    const perPage = Math.min(100, Math.max(1, Math.trunc(Number(filtres.perPage) || 25)));

    const where: Prisma.MembershipWhereInput = { accountId: account.id };
    if (filtres.membershipId) where.id = filtres.membershipId;
    if (filtres.role) where.role = filtres.role;
    if (filtres.status) where.status = filtres.status;

    const q = filtres.q?.trim();
    if (q) {
      where.user = {
        OR: [
          { firstName: { contains: q, mode: 'insensitive' } },
          { lastName: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
        ],
      };
    }

    const [memberships, total] = await Promise.all([
      this.prisma.membership.findMany({
        where,
        // Les responsables d'abord : c'est l'ordre dans lequel on lit une
        // équipe quand on cherche à qui s'adresser.
        orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
        skip: (page - 1) * perPage,
        take: perPage,
        select: {
          id: true,
          role: true,
          status: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
              profile: { select: { job: true } },
              // Un compte intervenant à son nom = la personne travaille aussi
              // en indépendante. C'est ce qui distingue le salarié du renfort.
              ownedAccounts: {
                where: { type: 'FREELANCE' },
                select: { id: true, slug: true },
                take: 1,
              },
            },
          },
        },
      }),
      this.prisma.membership.count({ where }),
    ]);

    const completudes = await this.conformite.completenessForUsers(
      account.id,
      memberships.map((m) => m.user.id),
    );

    return {
      items: memberships.map((m) => {
        const { ownedAccounts, profile, ...user } = m.user;
        const compteIntervenant = ownedAccounts[0] ?? null;
        return {
          ...m,
          user: { ...user, job: profile?.job ?? null },
          /** Interne = salarié de la structure. Externe = intervenant indépendant. */
          externe: compteIntervenant !== null,
          compteIntervenantId: compteIntervenant?.id ?? null,
          conformite: completudes.get(m.user.id) ?? null,
        };
      }),
      total,
      page,
      perPage,
      pages: Math.max(1, Math.ceil(total / perPage)),
    };
  }

  /**
   * UNE personne, dans exactement la même forme que la liste.
   *
   * La fiche individuelle allait chercher son monde dans la première page de
   * cent membres : au-delà, elle rendait « introuvable » pour quelqu'un qui
   * existait pourtant. On interroge donc directement la personne demandée,
   * en réutilisant la recherche paginée restreinte à elle — une seule
   * projection à maintenir, et plus de plafond caché.
   */
  async parUtilisateur(account: RequestAccount, userId: string) {
    const existe = await this.prisma.membership.findUnique({
      where: { userId_accountId: { userId, accountId: account.id } },
      select: { id: true },
    });
    if (!existe) {
      throw new NotFoundException('Cette personne ne fait pas partie de votre établissement.');
    }
    const page = await this.list(account, { perPage: 1, page: 1, membershipId: existe.id });
    return page.items[0];
  }

  /**
   * Gestion des accès : espaces Piloter seulement (24/09/2026). Le rôle
   * OWNER/ADMIN est déjà exigé par `AccountRolesGuard`, qui le lit sur ces
   * types de compte.
   */
  private assertGestionPiloter(account: RequestAccount) {
    if (!rolesActifs(account.type)) {
      throw new ForbiddenException(MESSAGE_GESTION_PILOTER);
    }
  }

  /**
   * Charge une adhésion en garantissant qu'elle appartient BIEN au compte actif
   * (isolation multi-tenant : on ne touche jamais un membership d'un autre compte).
   */
  private async loadInAccount(account: RequestAccount, membershipId: string) {
    const membership = await this.prisma.membership.findUnique({
      where: { id: membershipId },
      include: { account: { select: { ownerId: true } } },
    });

    if (!membership || membership.accountId !== account.id) {
      throw new NotFoundException('Membre introuvable pour ce compte.');
    }
    return membership;
  }

  async changeRole(
    account: RequestAccount,
    membershipId: string,
    role: AccountRole,
    actorId?: string,
  ) {
    this.assertGestionPiloter(account);
    const membership = await this.loadInAccount(account, membershipId);

    if (membership.userId === membership.account.ownerId) {
      throw new BadRequestException("Le rôle du propriétaire ne peut être modifié.");
    }
    if (role === AccountRole.OWNER) {
      throw new BadRequestException(
        "Impossible d'attribuer le rôle OWNER (transfert de propriété non supporté ici).",
      );
    }
    // Un ADMIN ne peut pas modifier un autre ADMIN ; seul un OWNER le peut.
    if (
      account.role === AccountRole.ADMIN &&
      membership.role === AccountRole.ADMIN
    ) {
      throw new ForbiddenException("Un ADMIN ne peut pas modifier un autre ADMIN.");
    }

    const updated = await this.prisma.membership.update({
      where: { id: membershipId },
      data: { role },
      select: { id: true, role: true, status: true },
    });
    await this.audit.log({
      actorId,
      action: 'membre.role_modifie',
      entityType: 'Membership',
      entityId: membershipId,
      accountId: account.id,
      summary: `Rôle du membre : ${membership.role} → ${role}.`,
      metadata: { avant: membership.role, apres: role, userId: membership.userId },
    });
    return updated;
  }

  async setStatus(
    account: RequestAccount,
    membershipId: string,
    status: MembershipStatus,
  ) {
    this.assertGestionPiloter(account);
    const membership = await this.loadInAccount(account, membershipId);

    if (membership.userId === membership.account.ownerId) {
      throw new BadRequestException("Le propriétaire ne peut être suspendu.");
    }
    if (
      account.role === AccountRole.ADMIN &&
      membership.role === AccountRole.ADMIN
    ) {
      throw new ForbiddenException("Un ADMIN ne peut pas suspendre un autre ADMIN.");
    }

    return this.prisma.membership.update({
      where: { id: membershipId },
      data: { status },
      select: { id: true, status: true },
    });
  }

  async remove(account: RequestAccount, membershipId: string) {
    this.assertGestionPiloter(account);
    const membership = await this.loadInAccount(account, membershipId);

    if (membership.userId === membership.account.ownerId) {
      throw new BadRequestException("Le propriétaire ne peut être retiré du compte.");
    }
    if (
      account.role === AccountRole.ADMIN &&
      membership.role === AccountRole.ADMIN
    ) {
      throw new ForbiddenException("Un ADMIN ne peut pas retirer un autre ADMIN.");
    }

    await this.prisma.membership.delete({ where: { id: membershipId } });
    return { removed: true, id: membershipId };
  }
}
