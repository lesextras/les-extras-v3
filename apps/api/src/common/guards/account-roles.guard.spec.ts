import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AccountRole } from '@prisma/client';
import { AccountRolesGuard } from './account-roles.guard';

/**
 * Construit un ExecutionContext minimal exposant req.account.
 * getHandler/getClass sont requis par reflector.getAllAndOverride.
 */
function mockContext(account: unknown): ExecutionContext {
  const request = { account };
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
    getHandler: () => undefined,
    getClass: () => undefined,
  } as unknown as ExecutionContext;
}

/** Reflector dont getAllAndOverride renvoie les rôles requis fournis. */
function reflectorWith(required: AccountRole[] | undefined): Reflector {
  return {
    getAllAndOverride: jest.fn().mockReturnValue(required),
  } as unknown as Reflector;
}

describe('AccountRolesGuard', () => {
  it('autorise quand le rôle du compte est dans les rôles requis', () => {
    const guard = new AccountRolesGuard(
      reflectorWith([AccountRole.OWNER, AccountRole.ADMIN]),
    );
    const ctx = mockContext({ role: AccountRole.ADMIN });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('refuse (ForbiddenException) quand le rôle du compte n’est pas requis', () => {
    const guard = new AccountRolesGuard(
      reflectorWith([AccountRole.OWNER, AccountRole.ADMIN]),
    );
    const ctx = mockContext({ role: AccountRole.MEMBER });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('refuse (ForbiddenException) quand aucun compte actif n’est présent', () => {
    const guard = new AccountRolesGuard(reflectorWith([AccountRole.OWNER]));
    const ctx = mockContext(undefined);
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('autorise (passe) quand aucun rôle n’est requis', () => {
    const guard = new AccountRolesGuard(reflectorWith(undefined));
    const ctx = mockContext({ role: AccountRole.MEMBER });
    expect(guard.canActivate(ctx)).toBe(true);
  });
});
