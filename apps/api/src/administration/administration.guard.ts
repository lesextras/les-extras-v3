import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { GlobalRole } from '@prisma/client';
import type { AuthenticatedRequest } from '../common/types/request-context';

/**
 * LA PORTE DE L'ADMINISTRATION.
 *
 * Un seul critère : le rôle global du compte connecté vaut ADMIN. Pas de liste
 * d'adresses en dur, pas de variable d'environnement — le rôle est en base, il
 * se donne et se retire, et on peut le lire pour savoir qui l'a.
 */
@Injectable()
export class AdministrationGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const requete = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (requete.user?.role !== GlobalRole.ADMIN) {
      throw new ForbiddenException("Cette page est réservée à l'administration.");
    }
    return true;
  }
}
