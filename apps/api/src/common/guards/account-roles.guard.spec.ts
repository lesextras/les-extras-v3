import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AccountRole, Capacite } from '@prisma/client';
import { AccountRolesGuard } from './account-roles.guard';
import { ACCOUNT_ROLES_KEY } from '../decorators/account-roles.decorator';
import { CAPACITE_KEY } from '../decorators/capacite.decorator';
import type { PrismaService } from '../../prisma/prisma.service';

/**
 * ⚠ MIS À JOUR LE 24/09/2026. La garde lit désormais, en plus du rôle, le
 * droit déclaré sur le rattachement (`@OuCapacite`) : elle prend donc
 * Prisma en second paramètre et devient asynchrone. Le test d'avant ne
 * compilait plus.
 */
function mockContext(account: unknown): ExecutionContext {
  const request = { account };
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => undefined,
    getClass: () => undefined,
  } as unknown as ExecutionContext;
}

function reflecteur(roles: AccountRole[] | undefined, capacite?: Capacite): Reflector {
  return {
    getAllAndOverride: jest.fn((cle: string) => (cle === ACCOUNT_ROLES_KEY ? roles : cle === CAPACITE_KEY ? capacite : undefined)),
  } as unknown as Reflector;
}

function prismaAvec(capacites: Capacite[] | null): PrismaService {
  return {
    membership: {
      findUnique: jest.fn().mockResolvedValue(
        capacites === null
          ? null
          : { id: 'm1', accountId: 'a1', userId: 'u1', niveau: 'SALARIE', niveauValide: false, capacites, services: [] },
      ),
    },
  } as unknown as PrismaService;
}

describe('AccountRolesGuard', () => {
  it('autorise quand le rôle du compte est dans les rôles requis', async () => {
    const garde = new AccountRolesGuard(reflecteur([AccountRole.OWNER, AccountRole.ADMIN]), prismaAvec(null));
    await expect(garde.canActivate(mockContext({ role: AccountRole.ADMIN }))).resolves.toBe(true);
  });

  it('refuse quand le rôle ne suffit pas et qu’aucun droit ne prend le relais', async () => {
    const garde = new AccountRolesGuard(reflecteur([AccountRole.OWNER, AccountRole.ADMIN]), prismaAvec(null));
    await expect(garde.canActivate(mockContext({ role: AccountRole.MEMBER }))).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('refuse quand aucun compte actif n’est présent', async () => {
    const garde = new AccountRolesGuard(reflecteur([AccountRole.OWNER]), prismaAvec(null));
    await expect(garde.canActivate(mockContext(undefined))).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('laisse passer quand aucun rôle n’est requis', async () => {
    const garde = new AccountRolesGuard(reflecteur(undefined), prismaAvec(null));
    await expect(garde.canActivate(mockContext({ role: AccountRole.MEMBER }))).resolves.toBe(true);
  });

  it('le droit déclaré ouvre la route à un salarié (OU avec le rôle)', async () => {
    const garde = new AccountRolesGuard(
      reflecteur([AccountRole.OWNER, AccountRole.ADMIN, AccountRole.MANAGER], Capacite.RESERVER_DIRECT),
      prismaAvec([Capacite.RESERVER_DIRECT]),
    );
    await expect(garde.canActivate(mockContext({ role: AccountRole.MEMBER, membershipId: 'm1' }))).resolves.toBe(true);
  });

  it('sans le droit, le salarié reste refusé', async () => {
    const garde = new AccountRolesGuard(
      reflecteur([AccountRole.OWNER, AccountRole.ADMIN, AccountRole.MANAGER], Capacite.RESERVER_DIRECT),
      prismaAvec([]),
    );
    await expect(garde.canActivate(mockContext({ role: AccountRole.MEMBER, membershipId: 'm1' }))).rejects.toBeInstanceOf(ForbiddenException);
  });
});
