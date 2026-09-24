import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AccountRole } from '@prisma/client';
import { AccountRolesGuard } from './account-roles.guard';
import { ACCOUNT_ROLES_KEY } from '../decorators/account-roles.decorator';
import type { PrismaService } from '../../prisma/prisma.service';

/**
 * ⚠ 24/09/2026 : sur Les Extras les rôles n'existent plus (`common/roles.ts`) ;
 * seuls les espaces Piloter (association, académie) les lisent encore.
 */
function mockContext(account: unknown): ExecutionContext {
  const request = { account };
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => undefined,
    getClass: () => undefined,
  } as unknown as ExecutionContext;
}

function reflecteur(roles: AccountRole[] | undefined): Reflector {
  return {
    getAllAndOverride: jest.fn((cle: string) => (cle === ACCOUNT_ROLES_KEY ? roles : undefined)),
  } as unknown as Reflector;
}

// Le garde ne lit plus la base : droits déclarés et niveaux ont disparu.
function prismaAvec(_rien: null): PrismaService {
  return {} as unknown as PrismaService;
}

describe('AccountRolesGuard', () => {
  it('Piloter : autorise quand le rôle est dans les rôles requis', async () => {
    const garde = new AccountRolesGuard(reflecteur([AccountRole.OWNER, AccountRole.ADMIN]), prismaAvec(null));
    await expect(garde.canActivate(mockContext({ role: AccountRole.ADMIN, type: 'ASSOCIATION' }))).resolves.toBe(true);
  });

  it('Piloter : refuse quand le rôle ne suffit pas (droits d’accès de l’équipe)', async () => {
    const garde = new AccountRolesGuard(reflecteur([AccountRole.OWNER, AccountRole.ADMIN]), prismaAvec(null));
    await expect(garde.canActivate(mockContext({ role: AccountRole.MEMBER, type: 'ACADEMIE' }))).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('refuse quand aucun compte actif n’est présent', async () => {
    const garde = new AccountRolesGuard(reflecteur([AccountRole.OWNER]), prismaAvec(null));
    await expect(garde.canActivate(mockContext(undefined))).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('laisse passer quand aucun rôle n’est requis', async () => {
    const garde = new AccountRolesGuard(reflecteur(undefined), prismaAvec(null));
    await expect(garde.canActivate(mockContext({ role: AccountRole.MEMBER, type: 'ASSOCIATION' }))).resolves.toBe(true);
  });

  it.each(['ESTABLISHMENT', 'FREELANCE', 'PARTICULIER'])(
    'Les Extras (%s) : plus de rôles, la personne du compte passe partout (24/09/2026)',
    async (type) => {
      const garde = new AccountRolesGuard(reflecteur([AccountRole.OWNER]), prismaAvec(null));
      await expect(garde.canActivate(mockContext({ role: AccountRole.MEMBER, type }))).resolves.toBe(true);
    },
  );
});
