import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AccountRole, Capacite } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ACCOUNT_ROLES_KEY } from '../decorators/account-roles.decorator';
import { CAPACITE_KEY } from '../decorators/capacite.decorator';
import { SELECT_MEMBRE, a as detient, versMembreCourant } from '../perimetre';

/**
 * AccountRolesGuard — RBAC basé sur le rôle DANS le compte actif (req.account.role),
 * jamais sur le rôle global. À utiliser après AccountGuard :
 *   `@UseGuards(JwtAuthGuard, AccountGuard, AccountRolesGuard)`
 *   `@AccountRoles('OWNER', 'ADMIN')`
 */
@Injectable()
export class AccountRolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<AccountRole[]>(ACCOUNT_ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required || required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const account = request.account;

    if (!account?.role) {
      throw new ForbiddenException('Compte actif requis (header x-account-id).');
    }

    if (required.includes(account.role)) {
      return true;
    }

    // LE DROIT DÉCLARÉ PREND LE RELAIS DU RÔLE.
    //
    // Une route peut porter `@OuCapacite(...)` : le rôle ne décide alors plus
    // seul, la capacité accordée au rattachement ouvre le même accès. C'est un
    // OU, pas un ET — personne qui passait hier ne se voit fermer la porte
    // aujourd'hui, on n'ajoute qu'un second chemin. Sans ce décorateur, la
    // garde se comporte exactement comme avant.
    const capacite = this.reflector.getAllAndOverride<Capacite | undefined>(CAPACITE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (capacite && account.membershipId) {
      const membre = await this.prisma.membership.findUnique({
        where: { id: account.membershipId },
        select: SELECT_MEMBRE,
      });
      if (membre && detient(versMembreCourant(membre), capacite)) {
        return true;
      }
      throw new ForbiddenException(messageDroitManquant(capacite));
    }

    throw new ForbiddenException(messageRoleInsuffisant(required));
  }
}

/**
 * Ce qu'on dit à quelqu'un dont le rôle ne suffit pas.
 *
 * Le message part vers un écran, pas vers un journal : il doit être lisible
 * par la personne qui vient de cliquer. « Rôle insuffisant (requis : OWNER |
 * ADMIN) » ne veut rien dire pour une directrice de MECS. Exporté pour que
 * les contrôles écrits à la main dans les services disent exactement la même
 * chose — c'était le cas d'AccountsService, qui affichait encore les codes.
 */
export function messageRoleInsuffisant(required: readonly string[]): string {
  const LIBELLE: Record<string, string> = {
    OWNER: 'la direction',
    ADMIN: "l'administration",
    MANAGER: 'un chef de service',
    MEMBER: "l'équipe",
  };
  const qui = required.map((r) => LIBELLE[r] ?? r);
  const liste =
    qui.length === 1 ? qui[0] : `${qui.slice(0, -1).join(', ')} ou ${qui[qui.length - 1]}`;
  return `Cette action est réservée à ${liste}. Demandez à un responsable de votre établissement de la faire pour vous.`;
}

/**
 * Ce qu'on dit à quelqu'un dont le rôle ne suffit pas ET qui n'a pas déclaré
 * le droit correspondant.
 *
 * Le message nomme le droit tel qu'il est écrit dans « Mon poste » — c'est
 * là, et nulle part ailleurs, que la personne peut se l'accorder. Lui
 * répondre « rôle insuffisant » l'enverrait demander à quelqu'un d'autre ce
 * qu'elle peut faire elle-même en deux clics.
 */
const LIBELLE_DROIT: Partial<Record<Capacite, string>> = {
  VOIR_FACTURES: 'Voir les factures',
  VOIR_CONFORMITE: 'Consulter le coffre-fort de conformité',
  RESERVER_DIRECT: 'Réserver un intervenant directement',
  UTILISER_CREDITS_LEX: 'Utiliser les générations LEX de l’établissement',
};

export function messageDroitManquant(capacite: Capacite): string {
  const droit = LIBELLE_DROIT[capacite] ?? capacite;
  return `Cette action demande le droit « ${droit} ». Ouvrez « Mon poste » pour le déclarer, ou demandez à un responsable de votre établissement de le faire pour vous.`;
}
