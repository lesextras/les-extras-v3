import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AccountRole } from '@prisma/client';
import { ACCOUNT_ROLES_KEY } from '../decorators/account-roles.decorator';

/**
 * AccountRolesGuard — RBAC basé sur le rôle DANS le compte actif (req.account.role),
 * jamais sur le rôle global. À utiliser après AccountGuard :
 *   `@UseGuards(JwtAuthGuard, AccountGuard, AccountRolesGuard)`
 *   `@AccountRoles('OWNER', 'ADMIN')`
 */
@Injectable()
export class AccountRolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
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

    if (!required.includes(account.role)) {
      // Le message part vers un écran, pas vers un journal : il doit être lisible
      // par la personne qui vient de cliquer. Les codes internes ne lui disent rien.
      const LIBELLE: Record<string, string> = {
        OWNER: 'la direction',
        ADMIN: "l'administration",
        MANAGER: 'un chef de service',
        MEMBER: "l'équipe",
      };
      const qui = required.map((r) => LIBELLE[r] ?? r);
      const liste =
        qui.length === 1 ? qui[0] : `${qui.slice(0, -1).join(', ')} ou ${qui[qui.length - 1]}`;
      throw new ForbiddenException(
        `Cette action est réservée à ${liste}. Demandez à un responsable de votre établissement de la faire pour vous.`,
      );
    }

    return true;
  }
}
