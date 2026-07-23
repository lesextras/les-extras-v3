import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { GlobalRole } from '@prisma/client';

/**
 * Réserve les routes au rôle GLOBAL ADMIN (back-office plateforme).
 * S'appuie sur req.user posé par JwtAuthGuard.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const user = req.user;
    if (!user || user.role !== GlobalRole.ADMIN) {
      throw new ForbiddenException('Accès réservé aux administrateurs.');
    }
    return true;
  }
}
