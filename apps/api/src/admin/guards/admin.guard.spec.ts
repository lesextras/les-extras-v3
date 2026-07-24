import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { GlobalRole } from '@prisma/client';
import { AdminGuard } from './admin.guard';

/**
 * Construit un ExecutionContext minimal exposant req.user via
 * switchToHttp().getRequest(). Seul le champ `user` est utile ici.
 */
function mockContext(user: unknown): ExecutionContext {
  const request = { user };
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;
}

describe('AdminGuard', () => {
  let guard: AdminGuard;

  beforeEach(() => {
    guard = new AdminGuard();
  });

  it('autorise un utilisateur au rôle global ADMIN', () => {
    const ctx = mockContext({ id: 'u1', role: GlobalRole.ADMIN });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('refuse (ForbiddenException) un utilisateur au rôle USER', () => {
    const ctx = mockContext({ id: 'u1', role: GlobalRole.USER });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('refuse (ForbiddenException) quand req.user est absent', () => {
    const ctx = mockContext(undefined);
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });
});
